import * as service from "../services/event.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";

const router = express.Router();

router.get("/cities", async (req, res) => {
  apiResponse(res, await service.getCityStats());
});

export default router;
