import express from "express";
import officeRouter from "./routes/office-route.js";
import productLineRouter from "./routes/productline-route.js";
import productRouter from "./routes/product-route.js";
import brandRouter from "./routes/brand-route.js";

import { errorHandler } from "./middlewares/error-handler.js";
import { queryParser } from "./middlewares/pagination-middleware.js";

const ID = "67130500002";
const app = express();
app.use(express.json());
app.use(queryParser());
// Test queryParser

app.get(`/api/${ID}/student-info`, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      studentId: `${ID}`,
      name: "Kritsanaphong",
      secretKey: "71KrNg",
    },
    timestamp: new Date().toISOString,
  });
});

app.use(`/api/${ID}/brands`, brandRouter);
app.use(`/api/${ID}/offices`, officeRouter);
app.use(`/api/${ID}/productlines`, productLineRouter);
app.use(`/api/${ID}/products`, productRouter);

app.listen(3000, () => {
  console.log("Example app listening on port 3000");
});

app.use(errorHandler);
