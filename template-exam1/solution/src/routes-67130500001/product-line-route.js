// 67130500001 - Practice Student
import * as service from "../services-67130500001/product-line-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"

const router = express.Router()

router.get("/", async (req, res) => {
    return apiResponse(res, await service.getAllObjects())
})

// Express decode %20 ใน params ให้แล้ว: "Classic%20Cars" → "Classic Cars"
router.get("/:productLine/products", async (req, res) => {
    return apiResponse(res, await service.getProducts(req.params.productLine))
})

export default router
