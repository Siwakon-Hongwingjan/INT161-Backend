//67130500001 - Practice Student
import {AppError} from "./error-handler.js"
import httpStatus from "http-status"

// ต่างจากโครง: ไม่ส่ง page/limit ก็แบ่งหน้า (default 1 / 10)
// และค่าผิด (0, ติดลบ, ไม่ใช่ตัวเลข, limit > 50) ต้องตอบ 400 แทนการปัดค่าให้
const isPositiveInt = v => /^\d+$/.test(v) && Number(v) >= 1

export const queryParser = () => {
    return (req, res, next) => {
        const {page = "1", limit = "10"} = req.query
        if (!isPositiveInt(page)) {
            return next(new AppError("page must be an integer >= 1", httpStatus.BAD_REQUEST))
        }
        if (!isPositiveInt(limit) || Number(limit) > 50) {
            return next(new AppError("limit must be an integer between 1 and 50", httpStatus.BAD_REQUEST))
        }
        // โครงเดิมคำนวณ offset จาก pageSize (string ก่อนตัด) → ใช้ limit ที่ตรวจแล้ว
        req.pagination = {page: Number(page), limit: Number(limit), offset: (page - 1) * limit}
        next()
    }
}
