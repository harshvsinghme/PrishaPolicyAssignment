import express, { Express, Request, Response } from "express";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
dotenv.config();

import routes from "./routes";

const app: Express = express();

import cors from "cors";
import logger from "morgan";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(fileUpload());

import DBConnection from "./database";
const dbc = new DBConnection();
dbc.connect();

app.use(logger("dev"));
app.use("/v1", routes);
app.use("/test", (_: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Backend is working fine." });
});

app.use(function (_: Request, res: Response) {
  res
    .status(500)
    .json({ success: false, message: "No such matching route was found" });
});

const port = process.env.PORT || 3001;
app.listen(port, function () {
  console.log("Express app running on port " + port);
});
