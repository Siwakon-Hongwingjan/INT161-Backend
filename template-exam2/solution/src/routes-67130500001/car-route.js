// 67130500001 - Practice Student
import * as service from "../services-67130500001/car-service.js"
import express from "express"
import {apiResponse} from "../mappers-67130500001/api-response.js"
import httpStatus from "http-status"

const router = express.Router()

router.get("/", async (req, res) => {
    const pagination = req.pagination
    return apiResponse(res, await service.getAllObjects(pagination, req.query), pagination)
})

router.get("/:id", async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.id))
})

router.post("/", async (req, res) => {
    return apiResponse(res, await service.createObject(req.body), null, httpStatus.CREATED)
})

router.put("/:id", async (req, res) => {
    return apiResponse(res, await service.updateObject(req.params.id, req.body))
})

router.delete("/:id", async (req, res) => {
    await service.removeObject(req.params.id)
    res.status(httpStatus.NO_CONTENT).end()
})

export default router
