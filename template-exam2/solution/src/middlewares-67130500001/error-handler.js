// 67130500001 - Practice Student
import httpStatus from "http-status"

// errorCode ใช้ชื่อมาตรฐานจาก http-status (400 → BAD_REQUEST, 404 → NOT_FOUND)
// ใช้ชื่อ property "errorCode" ไม่ใช่ "code" เพราะ error ของ mysql2 ใช้ err.code (เช่น ER_DUP_ENTRY) อยู่แล้ว
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.errorCode = httpStatus[`${statusCode}_NAME`]
    }
}

// MySQL error code → [status, error.code, message]
// ให้ DB เป็นคนตรวจ UNIQUE / FK แล้วแปลงที่นี่ที่เดียว ไม่ต้อง SELECT เช็คก่อนทุกครั้ง
const MYSQL_ERRORS = {
    ER_DUP_ENTRY: [409, "DUPLICATE_KEY", "Resource already exists (unique constraint)"],
    ER_NO_REFERENCED_ROW_2: [400, "FOREIGN_KEY_NOT_FOUND", "Referenced record does not exist"],
    ER_ROW_IS_REFERENCED_2: [409, "RESOURCE_IN_USE", "Resource is referenced by other records"],
}

export function errorHandler(err, req, res, next) {
    let statusCode = 500
    let code = "INTERNAL_SERVER_ERROR"
    let message = "Internal server error" // ไม่ส่งข้อความ error จริง (อาจมี SQL) ออกไปให้ client

    if (err.type === "entity.parse.failed") {
        // express.json() parse body ไม่ได้ → โยน SyntaxError ที่มี type นี้ (ปกติจะตอบเป็น HTML 400)
        [statusCode, code, message] = [400, "INVALID_JSON", "Request body is not valid JSON"]
    } else if (MYSQL_ERRORS[err.code]) {
        [statusCode, code, message] = MYSQL_ERRORS[err.code]
    } else if (err instanceof AppError) {
        [statusCode, code, message] = [err.statusCode, err.errorCode, err.message]
    } else {
        console.error(err) // error ที่ไม่ได้คาดไว้ log ไว้ดูฝั่ง server
    }

    res.status(statusCode).json({success: false, error: {code, message}})
}
