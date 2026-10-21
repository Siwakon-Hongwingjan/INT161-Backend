import * as service from "../services/categorie.service.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";

const router = express.Router();

// categories ส่งข้อมูลดิบจากตาราง (snake_case) ได้เลย ไม่ต้องมี DTO
router.get("/", async (req, res) => {
  const pagination = req.pagination;
  const objects = await service.getAllObjects(pagination);
  apiResponse(res, objects, pagination);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const object = await service.getObject(id);
  apiResponse(res, object);
});

export default router;
