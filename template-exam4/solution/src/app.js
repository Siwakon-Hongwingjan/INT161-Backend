// 67130500001 - Practice Student
import express from 'express'
import ticketRouter from "./routes-67130500001/ticket-route.js"
import technicianRouter from "./routes-67130500001/technician-route.js"
import {queryParser} from "./middlewares-67130500001/pagination-middleware.js"
import {errorHandler, notFoundHandler} from "./middlewares-67130500001/error-handler.js"
import {apiResponse} from "./mappers-67130500001/api-response.js"

const ID = "67130500001"
const app = express()
app.use(express.json())
app.use(queryParser())

app.get(`/api/${ID}/student-info`, (req, res) => {
    return apiResponse(res, {studentId: ID, name: "Practice Student", secretKey: "TP4-KEY"})
})
app.use(`/api/${ID}/tickets`, ticketRouter)
app.use(`/api/${ID}/technicians`, technicianRouter)

// ลำดับสำคัญ: router ทั้งหมด → notFoundHandler (ไม่มี route ไหนรับ) → errorHandler
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(3000, () => {
    // 67130500001 - Practice Student
    console.log('Example app listening on port 3000')
})
