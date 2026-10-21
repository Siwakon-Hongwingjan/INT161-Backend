// 67130500001 - Practice Student
import express from 'express'
import carRouter from "./routes-67130500001/car-route.js"
import branchRouter from "./routes-67130500001/branch-route.js"
import {queryParser} from "./middlewares-67130500001/pagination-middleware.js"
import {errorHandler} from "./middlewares-67130500001/error-handler.js"
import {apiResponse} from "./mappers-67130500001/api-response.js"

const ID = "67130500001"
const app = express()
app.use(express.json()) // JSON พังจะโยน error ไปที่ errorHandler (type = entity.parse.failed)
app.use(queryParser())

app.get(`/api/${ID}/student-info`, (req, res) => {
    return apiResponse(res, {studentId: ID, name: "Practice Student", secretKey: "TP2-KEY"})
})
app.use(`/api/${ID}/cars`, carRouter)
app.use(`/api/${ID}/branches`, branchRouter)

app.use(errorHandler) // ต้องอยู่หลัง router ทุกตัว

app.listen(3000, () => {
    // 67130500001 - Practice Student
    console.log('Example app listening on port 3000')
})
