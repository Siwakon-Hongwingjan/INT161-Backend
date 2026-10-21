// 67130500001 - Practice Student
import httpStatus from "http-status"

// errorCode กำหนดเองได้ (เช่น INVALID_STATUS_TRANSITION) ไม่ส่ง → ชื่อจาก http-status
export class AppError extends Error {
    constructor(message, statusCode, errorCode = httpStatus[`${statusCode}_NAME`], details = undefined) {
        super(message)
        this.statusCode = statusCode
        this.errorCode = errorCode
        this.details = details
    }
}

const MYSQL_ERRORS = {
    ER_DUP_ENTRY: [409, "DUPLICATE_KEY", "Resource already exists (unique constraint)"],
    ER_NO_REFERENCED_ROW_2: [400, "FOREIGN_KEY_NOT_FOUND", "Referenced record does not exist"],
    ER_ROW_IS_REFERENCED_2: [409, "RESOURCE_IN_USE", "Resource is referenced by other records"],
}

// เพิ่มจากข้อ 3: request ที่ไม่ตรง route ไหนเลยจะมาถึงตัวนี้ (ต้อง app.use หลัง router ทุกตัว)
// ถ้าไม่มี Express จะตอบหน้า HTML "Cannot GET /..." เอง
export function notFoundHandler(req, res, next) {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, httpStatus.NOT_FOUND))
}

export function errorHandler(err, req, res, next) {
    let statusCode = 500
    let error = {code: "INTERNAL_SERVER_ERROR", message: "Internal server error"}

    if (err.type === "entity.parse.failed") {
        statusCode = 400
        error = {code: "INVALID_JSON", message: "Request body is not valid JSON"}
    } else if (MYSQL_ERRORS[err.code]) {
        const [status, code, message] = MYSQL_ERRORS[err.code]
        statusCode = status
        error = {code, message}
    } else if (err instanceof AppError) {
        statusCode = err.statusCode
        error = {code: err.errorCode, message: err.message, details: err.details}
    } else {
        console.error(err)
    }

    res.status(statusCode).json({success: false, error})
}
