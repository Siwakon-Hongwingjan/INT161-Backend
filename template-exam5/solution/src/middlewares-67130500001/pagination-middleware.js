//67130500001 - Practice Student
import {AppError} from "./error-handler.js"
import httpStatus from "http-status"

// ไม่ส่ง page/limit ก็แบ่งหน้า (default 1 / 20) · ค่าผิดหรือ limit > 100 → 400 (ไม่ปัดค่าให้)
const isPositiveInt = v => /^\d+$/.test(v) && Number(v) >= 1

export const queryParser = () => {
    return (req, res, next) => {
        const {page = "1", limit = "20"} = req.query
        if (!isPositiveInt(page)) {
            return next(new AppError("page must be an integer >= 1", httpStatus.BAD_REQUEST))
        }
        if (!isPositiveInt(limit) || Number(limit) > 100) {
            return next(new AppError("limit must be an integer between 1 and 100", httpStatus.BAD_REQUEST))
        }
        req.pagination = {page: Number(page), limit: Number(limit), offset: (page - 1) * limit}
        next()
    }
}
