// 67130500001 - Practice Student
import express from 'express'
import orderRouter from "./routes-67130500001/order-route.js"
import productRouter from "./routes-67130500001/product-route.js"
import statsRouter from "./routes-67130500001/stats-route.js"
import {queryParser} from "./middlewares-67130500001/pagination-middleware.js"
import {errorHandler, notFoundHandler} from "./middlewares-67130500001/error-handler.js"
import {apiResponse} from "./mappers-67130500001/api-response.js"

const ID = "67130500001"
const app = express()
app.use(express.json())
app.use(queryParser())

app.get(`/api/${ID}/student-info`, (req, res) => {
    return apiResponse(res, {studentId: ID, name: "Practice Student", secretKey: "TP5-KEY"})
})
app.use(`/api/${ID}/orders`, orderRouter)
app.use(`/api/${ID}/products`, productRouter)
app.use(`/api/${ID}/stats`, statsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(3000, () => {
    // 67130500001 - Practice Student
    console.log('Example app listening on port 3000')
})
