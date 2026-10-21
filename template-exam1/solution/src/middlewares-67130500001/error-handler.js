// 67130500001 - Practice Student
import httpStatus from "http-status"

// error ที่เราตั้งใจโยนเอง (404, 409, ...) แนบ status code ไปด้วย
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

// error handler ต้องมี 4 พารามิเตอร์ (err, req, res, next) Express ถึงจะรู้ว่าเป็นตัวจับ error
// Express 5 ส่ง error จาก async route (promise reject) มาที่นี่ให้เอง ไม่ต้อง try/catch ในทุก route
export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR
    res.status(statusCode).json({
        success: false,
        error: {
            code: httpStatus[`${statusCode}_NAME`], // 404 → "NOT_FOUND", 409 → "CONFLICT"
            message: err.message,
        },
    })
}
