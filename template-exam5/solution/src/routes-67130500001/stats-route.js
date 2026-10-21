// 67130500001 - Practice Student
import * as service from "../services-67130500001/stats-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"

const router = express.Router()

router.get("/product-lines", async (req, res) => {
    return apiResponse(res, await service.getProductLineStats(req.query))
})

export default router
