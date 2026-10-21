import * as service from "../services/event.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";
import httpStatus from "http-status";

const router = express.Router();

router.get("/", async (req, res) => {
  const pagination = req.pagination;
  const events = await service.getAllObjects(pagination, req.query);
  apiResponse(res, events, pagination);
});

router.get("/:id", async (req, res) => {
  apiResponse(res, await service.getObject(req.params.id));
});

router.post("/", async (req, res) => {
  const event = await service.createObject(req.body);
  apiResponse(res, event, null, httpStatus.CREATED);
});

router.patch("/:id", async (req, res) => {
  apiResponse(res, await service.updateObject(req.params.id, req.body));
});

// soft delete
router.delete("/:id", async (req, res) => {
  await service.removeObject(req.params.id);
  res.status(httpStatus.NO_CONTENT).end();
});

// registrations เป็น sub-resource ของ event: /events/:id/registrations
router.post("/:id/registrations", async (req, res) => {
  const registration = await service.register(req.params.id, req.body);
  apiResponse(res, registration, null, httpStatus.CREATED);
});

router.get("/:id/registrations", async (req, res) => {
  const pagination = req.pagination;
  const registrations = await service.getRegistrations(req.params.id, pagination);
  apiResponse(res, registrations, pagination);
});

export default router;
