import * as service from "../services/order.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";
import httpStatus from "http-status";

const router = express.Router();

router.get("/", async (req, res) => {
  const pagination = req.pagination;
  const orders = await service.getAllObjects(pagination, req.query);
  apiResponse(res, orders, pagination);
});

router.get("/:id", async (req, res) => {
  apiResponse(res, await service.getObject(req.params.id));
});

router.post("/", async (req, res) => {
  const order = await service.createObject(req.body);
  apiResponse(res, order, null, httpStatus.CREATED);
});

// เปลี่ยนสถานะแยกเป็น endpoint ของตัวเอง ไม่ให้ PUT แก้ status ตรงๆ (ต้องผ่าน state machine)
router.patch("/:id/status", async (req, res) => {
  apiResponse(res, await service.changeStatus(req.params.id, req.body?.status));
});

router.delete("/:id", async (req, res) => {
  await service.removeObject(req.params.id);
  res.status(httpStatus.NO_CONTENT).end();
});

export default router;
