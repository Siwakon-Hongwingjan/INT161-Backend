import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { queryParser } from "./middlewares/pagination-middleware.js";

const ID = "67130500001";
const app = express();
app.use(express.json());
app.use(queryParser());

// TODO 1: GET /api/${ID}/student-info  (ดู exam-spec.md)
// TODO 2: app.use(`/api/${ID}/...`, router)  สร้าง route / service / repository เอง

app.use(errorHandler);
app.listen(3000, () => console.log("Listening on port 3000"));
