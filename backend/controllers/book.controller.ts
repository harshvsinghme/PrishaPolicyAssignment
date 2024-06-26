import { Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Bookmodel from "../models/book.model";
import Favouritemodel from "../models/favourite.model";
import Ratingmodel from "../models/rating.model";
import { getFavouritesQuery, getSpecificBookQuery } from "../utils/functions";
import {
  ResponseJSON,
  IBook,
  ExtendedRequest,
  IRatingBody,
} from "../utils/interfaces";

export const add = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  try {
    let body: IBook = req.body;

    if (!body.title)
      throw { implicit: true, code: 400, message: "Title is missing" };

    if (!body.author)
      throw { implicit: true, code: 400, message: "Author is missing" };

    if (!body.description)
      throw { implicit: true, code: 400, message: "Description is missing" };

    body.pdfFile = req.files?.pdfFile?.at(0)?.path;
    body.coverFile = req.files?.coverFile?.at(0)?.path;

    body.addedBy = new Types.ObjectId(req.user?._id);

    const Book = await Bookmodel.create(body);

    response.data = Book;
    response.message = "Added Successfully";
    res.status(201).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};

export const getAll = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  try {
    const Books = await Bookmodel.find().populate({
      path: "addedBy",
      select: "_id name email",
    });
    response.data = Books;
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};

export const getSpecific = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  try {
    let bookId: string | Types.ObjectId = req.params._id;
    if (!isValidObjectId(bookId))
      throw { code: 400, message: "Invalid Book ID", implicit: true };
    bookId = new Types.ObjectId(bookId);
    let userId: string | undefined | Types.ObjectId = req.user?._id;
    userId = new Types.ObjectId(userId);
    const Book = await Bookmodel.findById(bookId)
      .populate({
        path: "addedBy",
        select: "_id name email",
      })
      .lean();
    if (!Book)
      throw { code: 500, message: "No such Book was found", implicit: true };
    response.data = Book;
    const Favourite = await Favouritemodel.findOne({
      user: userId,
      book: bookId,
    });
    if (!Favourite) response.data.inFavourite = false;
    else response.data.inFavourite = true;
    let Rating = await Ratingmodel.aggregate(getSpecificBookQuery(bookId));
    let ratingLiteral = {
      avgRating: 0,
      reviewCount: 0,
      recommendation: 0,
      individualPerc: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
    response.data.rating = JSON.parse(JSON.stringify(ratingLiteral));
    try {
      if (Rating.at(0).count.length > 0) {
        let data = Rating.at(0);
        response.data.rating.avgRating = (
          data.count.at(0).sumOfRating / data.count.at(0)?.count
        ).toFixed(2);
        response.data.rating.reviewCount = data.count.at(0)?.count;
      }
      if (Rating.at(0).recommended.length > 0) {
        let data = Rating.at(0);
        response.data.rating.recommendation = (
          (data.recommended.at(0)?.count / data.count.at(0).count) *
          100
        ).toFixed(2);
      }
      if (Rating.at(0).individualCount.length > 0) {
        let data = Rating.at(0);
        data.individualCount.map((each: { _id: number; count: number }) => {
          response.data.rating.individualPerc[each._id.toString()] = parseInt(
            ((each.count / data.count.at(0).count) * 100).toString()
          );
        });
      }
    } catch (error: any) {
      console.log("Calc Error", error);
      response.data.rating = ratingLiteral;
    }
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};

export const toggleFavourite = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  try {
    let bookId: string | Types.ObjectId = req.params._id;
    if (!isValidObjectId(bookId))
      throw { code: 400, message: "Invalid Book ID", implicit: true };
    bookId = new Types.ObjectId(bookId);
    let userId: string | undefined | Types.ObjectId = req.user?._id;
    userId = new Types.ObjectId(userId);
    const document = await Favouritemodel.findOne({
      user: userId,
      book: bookId,
    });
    if (document) {
      response.message = "Removed from favourites";
      document.remove();
    } else {
      response.message = "Added to favourites";
      Favouritemodel.create({
        user: userId,
        book: bookId,
      });
    }
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};

export const addRating = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  const validNumber = new RegExp(/^[1-5]$/);
  try {
    let body: IRatingBody = req.body;
    if (!body.book || !isValidObjectId(body.book))
      throw { code: 400, message: "Invalid Book ID", implicit: true };
    if (!validNumber.test(body.rating.toString()))
      throw {
        code: 400,
        message: "Invalid Rating",
        implicit: true,
      };

    body.book = new Types.ObjectId(body.book);
    body.user = new Types.ObjectId(req.user?._id);
    const document = await Ratingmodel.findOneAndUpdate(
      {
        user: body.user,
        book: body.book,
      },
      {
        user: body.user,
        book: body.book,
        rating: body.rating,
      },
      { upsert: true }
    );
    if (document) response.message = "Updated Rating";
    else response.message = "Added Rating";
    res.status(201).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};

export const getFavourites = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  let response: ResponseJSON = { success: true };
  try {
    let user: Types.ObjectId = new Types.ObjectId(req.user?._id);
    const Books = await Favouritemodel.aggregate(getFavouritesQuery(user));

    response.data = Books;
    res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    response = { success: false };
    error.code = error.implicit ? error.code : 500;
    response.message =
      error.implicit || error.message ? error.message : "Something went wrong";
    if (error.detail) response.detail = error.detail;
    res.status(error.code).json(response);
  }
};
