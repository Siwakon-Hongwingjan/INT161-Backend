// 67130500001 - Practice Student
import express from 'express'
import customerRouter from "./routes-67130500001/customer-route.js"
import officeRouter from "./routes-67130500001/office-route.js"
import {queryParser} from "./middlewares-67130500001/pagination-middleware.js"
import {errorHandler} from "./middlewares-67130500001/error-handler.js"
import {apiResponse} from "./mappers-67130500001/api-response.js"

const ID = "67130500001"
const app = express()
app.use(express.json())
app.use(queryParser())

app.get(`/api/${ID}/student-info`, (req, res) => {
    return apiResponse(res, {studentId: ID, name: "Practice Student", secretKey: "TP3-KEY"})
})
app.use(`/api/${ID}/customers`, customerRouter)
app.use(`/api/${ID}/offices`, officeRouter)

app.use(errorHandler)

app.listen(3000, () => {
    // 67130500001 - Practice Student
    console.log('Example app listening on port 3000')
})
