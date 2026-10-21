// 67130500001 - Practice Student
import * as service from "../services-67130500001/customer-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"
import httpStatus from "http-status"

const router = express.Router()

router.get("/", async (req, res) => {
    const pagination = req.pagination
    return apiResponse(res, await service.getAllObjects(pagination, req.query), pagination)
})

router.get("/:customerNumber", async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.customerNumber))
})

router.post("/", async (req, res) => {
    return apiResponse(res, await service.createObject(req.body), null, httpStatus.CREATED)
})

router.put("/:customerNumber", async (req, res) => {
    return apiResponse(res, await service.updateObject(req.params.customerNumber, req.body))
})

router.delete("/:customerNumber", async (req, res) => {
    await service.removeObject(req.params.customerNumber)
    res.status(httpStatus.NO_CONTENT).end()
})

export default router
