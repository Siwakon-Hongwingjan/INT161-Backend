import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { queryParser } from "./middlewares/pagination-middleware.js";
import { apiResponse } from "./mappers/api-response.js";
import eventRouter from "./routes/event.route.js";
import statsRouter from "./routes/stats.route.js";

const ID = "67130500001";
const app = express();
app.use(express.json());
app.use(queryParser());

// TODO 1: GET /api/${ID}/student-info  (ดู exam-spec.md)
app.get(`/api/${ID}/student-info`, (req, res) => {
  apiResponse(res, { studentId: ID, name: "Practice Student", secretKey: "EX5-KEY" });
});

// TODO 2: app.use(`/api/${ID}/...`, router)  สร้าง route / service / repository เอง
app.use(`/api/${ID}/events`, eventRouter);
app.use(`/api/${ID}/stats`, statsRouter);

app.use(errorHandler);
app.listen(3000, () => console.log("Listening on port 3000"));
