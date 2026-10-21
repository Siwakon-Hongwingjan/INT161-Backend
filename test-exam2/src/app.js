import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { queryParser } from "./middlewares/pagination-middleware.js";
import roomTypeRouter from "./routes/roomType.route.js";
const ID = "67130500001";
const app = express();
app.use(express.json());
app.use(queryParser());

// TODO 1: GET /api/${ID}/student-info  (ดู exam-spec.md)
app.get(`/api/${ID}/student-info`, (req, res) => {
  res.json({
    success: true,
    data: {
      studentId: `${ID}`,
      name: "Practice Student",
      secretKey: "EX2-KEY",
    },
    timestamp: Date.now(),
  });
});
// TODO 2: app.use(`/api/${ID}/...`, router)  สร้าง route / service / repository เอง
app.use(`/api/${ID}/room-types`, roomTypeRouter);
app.use(errorHandler);
app.listen(3000, () => console.log("Listening on port 3000"));
