import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import DBConnection from "./database";
import path from "path";

dotenv.config();

import routes from "./routes";

const app: Express = express();

import cors from "cors";
import logger from "morgan";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "5mb" }));


const dbc = new DBConnection();
dbc.connect();

app.use(logger("dev"));
app.use("/v1", routes);
app.use("/uploads", express.static(path.resolve("uploads")));
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
