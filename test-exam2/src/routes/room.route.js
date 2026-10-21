import * as service from "../services/room.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";
import httpStatus from "http-status";

const router = express.Router();

router.get("/", async (req, res) => {
  const pagination = req.pagination;
  const rooms = await service.getAllObjects(pagination, req.query);
  apiResponse(res, rooms, pagination);
});

router.get("/:id", async (req, res) => {
  apiResponse(res, await service.getObject(req.params.id));
});

router.post("/", async (req, res) => {
  const room = await service.createObject(req.body);
  apiResponse(res, room, null, httpStatus.CREATED);
});

router.put("/:id", async (req, res) => {
  apiResponse(res, await service.updateObject(req.params.id, req.body));
});

// 204 ต้องไม่มี body จึงใช้ end() แทน apiResponse
router.delete("/:id", async (req, res) => {
  await service.removeObject(req.params.id);
  res.status(httpStatus.NO_CONTENT).end();
});

export default router;
