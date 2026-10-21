// middleware/errorHandler.js

import httpStatus from "http-status";
Error.stackTraceLimit = 1 // ตัด stack trace เหลือ บรรทัดเดียว
// เพิ่ม errorCode (กำหนด code เองได้ เช่น VALIDATION_ERROR) และ details (รายการฟิลด์ที่ผิด)
// ถ้าไม่ส่ง errorCode จะใช้ชื่อจาก http-status เหมือนเดิม
export class AppError extends Error {
    constructor(message, statusCode, errorCode = httpStatus[statusCode], details) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err, req, res, next) => {
    console.log(err);
    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'An unexpected error occurred';

    // ตรวจจับและแปลง MySQL Error Codes เป็น Client Error
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        errorCode = 'DUPLICATE_KEY';
        message = 'Resource already exists (Primary key or unique constraint violation)';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_NOT_FOUND';
        message = 'Referenced foreign key record does not exist';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 409;
        errorCode = 'RESOURCE_IN_USE';
        message = 'Cannot delete or modify resource because it is referenced by related records';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: message,
            details: err.details // undefined จะถูกตัดออกตอน JSON.stringify
        },
        timestamp: new Date().toISOString()
    });
};