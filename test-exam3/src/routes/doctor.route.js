import * as service from "../services/doctor.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";
import httpStatus from "http-status";

const router = express.Router();

router.get("/", async (req, res) => {
  const pagination = req.pagination;
  const doctors = await service.getAllObjects(pagination, req.query);
  apiResponse(res, doctors, pagination);
});

router.get("/:id", async (req, res) => {
  apiResponse(res, await service.getObject(req.params.id));
});

router.post("/", async (req, res) => {
  const doctor = await service.createObject(req.body);
  apiResponse(res, doctor, null, httpStatus.CREATED);
});

router.put("/:id", async (req, res) => {
  apiResponse(res, await service.updateObject(req.params.id, req.body));
});

router.delete("/:id", async (req, res) => {
  await service.removeObject(req.params.id);
  res.status(httpStatus.NO_CONTENT).end();
});

export default router;
