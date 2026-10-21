import * as service from "../services/roomType.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";

const router = express.Router();

router.get("/", async (req, res) => {
  apiResponse(res, await service.getAllObjects());
});

router.get("/:id", async (req, res) => {
  apiResponse(res, await service.getObject(req.params.id));
});

export default router;
