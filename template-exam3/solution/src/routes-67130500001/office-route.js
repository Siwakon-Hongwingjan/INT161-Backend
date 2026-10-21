// 67130500001 - Practice Student
import * as service from "../services-67130500001/office-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"

const router = express.Router()

router.get("/", async (req, res) => {
    return apiResponse(res, await service.getAllObjects())
})

export default router
