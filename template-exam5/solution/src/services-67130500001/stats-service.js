// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/stats-repository.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

export async function getProductLineStats({year}) {
    if (year !== undefined && !/^\d{4}$/.test(year)) {
        throw new AppError("year must be a 4-digit year", httpStatus.BAD_REQUEST)
    }
    const rows = await repo.productLineStats(year === undefined ? undefined : Number(year))
    // SUM(int) และ ROUND(SUM(DECIMAL)) ได้ string จาก mysql2 → Number
    return rows.map(row => ({
        productLine: row.productLine,
        orderCount: row.orderCount,
        unitsSold: Number(row.unitsSold),
        revenue: Number(row.revenue),
    }))
}
