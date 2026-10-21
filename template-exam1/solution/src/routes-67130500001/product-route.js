// 67130500001 - Practice Student
import * as service from "../services-67130500001/product-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"
import httpStatus from "http-status"

const router = express.Router()

router.get("/", async (req, res) => {
    const pagination = req.pagination
    const products = await service.getAllObjects(pagination)
    // pagination เป็น null (ไม่ส่ง page/limit) → apiResponse ตอบแบบไม่มี pagination
    return apiResponse(res, products, pagination)
})

router.get("/:code", async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.code))
})

router.post("/", async (req, res) => {
    const product = await service.createObject(req.body)
    return apiResponse(res, product, null, httpStatus.CREATED)
})

// โครงเดิมเรียก service.updateObject() โดยไม่ส่ง id กับ body
router.put("/:code", async (req, res) => {
    return apiResponse(res, await service.updateObject(req.params.code, req.body))
})

// โครงเดิมใช้ res.end() ซึ่งได้ 200 → ต้องเป็น 204 No Content
router.delete("/:code", async (req, res) => {
    await service.removeObject(req.params.code)
    res.status(httpStatus.NO_CONTENT).end()
})

export default router
