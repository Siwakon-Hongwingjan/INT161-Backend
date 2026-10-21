import * as repo from "../repositories/department.repo.js";
import express from "express";
import { apiResponse } from "../mappers/api-response.js";

const router = express.Router();

// departments มีแค่ list และ SELECT id, name ตรงกับ DTO อยู่แล้ว จึงเรียก repo ตรงๆ ไม่ต้องมี service/mapper
router.get("/", async (req, res) => {
  apiResponse(res, await repo.findAll());
});

export default router;
