// 67130500001 - Practice Student
import express from 'express'
import productRouter from "./routes-67130500001/product-route.js"
import productLineRouter from "./routes-67130500001/product-line-route.js"
import {queryParser} from "./middlewares-67130500001/pagination-middleware.js"
import {errorHandler} from "./middlewares-67130500001/error-handler.js"
import {apiResponse} from "./mappers-67130500001/api-response.js"

const ID = "67130500001"
const app = express()
app.use(express.json())
// โครงมี pagination middleware แต่ไม่ได้ใช้ → ต้อง app.use เอง ไม่งั้น req.pagination เป็น undefined
app.use(queryParser())

app.get(`/api/${ID}/student-info`, (req, res) => {
    return apiResponse(res, {studentId: ID, name: "Practice Student", secretKey: "TP1-KEY"})
})
app.use(`/api/${ID}/products`, productRouter)
app.use(`/api/${ID}/product-lines`, productLineRouter)

// error handler ต้องอยู่ "หลัง" router ทุกตัว (โครงเดิมเป็นฟังก์ชันว่าง ทำให้ request ค้างไม่มีคำตอบ)
app.use(errorHandler)

app.listen(3000, () => {
    // 67130500001 - Practice Student
    console.log('Example app listening on port 3000')
})
