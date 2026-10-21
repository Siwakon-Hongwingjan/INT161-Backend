// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

// ยอดรวมไม่มีในตาราง orders → คำนวณจาก orderdetails ใน derived table (GROUP BY ก่อนแล้วค่อย JOIN)
// ทำให้ WHERE / ORDER BY ใช้ t.total ได้ตรงๆ เหมือนเป็นคอลัมน์ปกติ (ไม่ต้องใช้ HAVING)
const FROM_SQL = `FROM orders o
    JOIN customers c ON c.customerNumber = o.customerNumber
    LEFT JOIN (
        SELECT orderNumber, COUNT(*) AS itemCount, SUM(quantityOrdered * priceEach) AS total
        FROM orderdetails GROUP BY orderNumber
    ) t ON t.orderNumber = o.orderNumber`
const SELECT_SQL = `SELECT o.*, c.customerName, c.country,
        COALESCE(t.itemCount, 0) AS itemCount, COALESCE(t.total, 0) AS total ${FROM_SQL}`
const COUNT_SQL = `SELECT COUNT(*) AS total ${FROM_SQL}`
const FIND_ONE_SQL = `${SELECT_SQL} WHERE o.orderNumber = ?`
const FIND_LINES_SQL = `SELECT d.*, p.productName FROM orderdetails d
    JOIN products p ON p.productCode = d.productCode
    WHERE d.orderNumber = ? ORDER BY d.orderLineNumber`

function buildWhere(filters) {
    const conds = []
    const params = []
    if (filters.statuses) { conds.push("o.status IN (?)"); params.push(filters.statuses) }
    if (filters.customerNumber !== undefined) { conds.push("o.customerNumber = ?"); params.push(filters.customerNumber) }
    if (filters.from !== undefined) { conds.push("o.orderDate >= ?"); params.push(filters.from) }
    if (filters.to !== undefined) { conds.push("o.orderDate <= ?"); params.push(filters.to) }
    if (filters.minTotal !== undefined) { conds.push("COALESCE(t.total, 0) >= ?"); params.push(filters.minTotal) }
    if (filters.maxTotal !== undefined) { conds.push("COALESCE(t.total, 0) <= ?"); params.push(filters.maxTotal) }
    return {where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params}
}

// เปิด transaction → เรียก fn(conn) → commit · error ใดๆ → rollback แล้วโยนต่อ · คืน connection ให้ pool เสมอ
// ใช้ 3 ที่ (สร้าง, เปลี่ยนสถานะ, ลบ) เลยแยกเป็นฟังก์ชัน
async function withTransaction(fn) {
    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()
        const result = await fn(conn)
        await conn.commit()
        return result
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function findAll(pagination, filters, orderBy) {
    const {where, params} = buildWhere(filters)
    const sql = `${SELECT_SQL}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    const [rows] = await db.query(sql, [...params, pagination.limit, pagination.offset])
    const [[{total}]] = await db.query(COUNT_SQL + where, params)
    rows.totalItems = total
    return rows
}

export async function findOne(orderNumber) {
    const [rows] = await db.query(FIND_ONE_SQL, [orderNumber])
    return rows.length === 0 ? null : rows[0]
}

export async function findLines(orderNumber) {
    const [rows] = await db.query(FIND_LINES_SQL, [orderNumber])
    return rows
}

// ทั้งหมดอยู่ใน transaction เดียว: ผิดตรงไหน (ลูกค้า/สินค้า/สต็อก) → rollback ไม่มีอะไรถูกบันทึก
export async function create({customerNumber, requiredDate, comments = null, items}) {
    return withTransaction(async conn => {
        const [[customer]] = await conn.query(`SELECT customerNumber FROM customers WHERE customerNumber = ?`, [customerNumber])
        if (!customer) {
            throw new AppError(`Customer '${customerNumber}' does not exist`, httpStatus.BAD_REQUEST, "CUSTOMER_NOT_FOUND")
        }

        // FOR UPDATE ล็อกแถวสินค้าไว้จน commit: request อื่นที่จะตัดสต็อกตัวเดียวกันต้องรอ → ไม่ขายเกินสต็อก
        // ORDER BY productCode ให้ทุก request ล็อกตามลำดับเดียวกัน ลดโอกาส deadlock
        const codes = items.map(item => item.productCode)
        const [products] = await conn.query(
            `SELECT productCode, quantityInStock, MSRP FROM products WHERE productCode IN (?) ORDER BY productCode FOR UPDATE`,
            [codes])
        const byCode = new Map(products.map(p => [p.productCode, p]))
        const missing = codes.filter(code => !byCode.has(code))
        if (missing.length > 0) {
            throw new AppError(`Products not found: ${missing.join(", ")}`, httpStatus.BAD_REQUEST, "PRODUCT_NOT_FOUND")
        }
        const shortages = items
            .map((item, i) => ({item, i, stock: byCode.get(item.productCode).quantityInStock}))
            .filter(({item, stock}) => item.quantity > stock)
            .map(({i, stock}) => ({field: `items[${i}].quantity`, message: `only ${stock} in stock`}))
        if (shortages.length > 0) {
            throw new AppError("Insufficient stock", httpStatus.CONFLICT, "INSUFFICIENT_STOCK", shortages)
        }

        // orders ไม่มี AUTO_INCREMENT · FOR UPDATE ทำให้ 2 request ที่สร้างพร้อมกันไม่ได้เลขเดียวกัน
        const [[{next}]] = await conn.query(`SELECT COALESCE(MAX(orderNumber), 0) + 1 AS next FROM orders FOR UPDATE`)
        await conn.query(
            `INSERT INTO orders (orderNumber, orderDate, requiredDate, status, comments, customerNumber)
             VALUES (?, CURDATE(), ?, 'In Process', ?, ?)`,
            [next, requiredDate, comments, customerNumber])
        // VALUES ? + array ของ array → mysql2 สร้าง INSERT หลายแถวในคำสั่งเดียว
        const lines = items.map((item, i) => [next, item.productCode, item.quantity, byCode.get(item.productCode).MSRP, i + 1])
        await conn.query(
            `INSERT INTO orderdetails (orderNumber, productCode, quantityOrdered, priceEach, orderLineNumber) VALUES ?`,
            [lines])
        for (const item of items) {
            await conn.query(`UPDATE products SET quantityInStock = quantityInStock - ? WHERE productCode = ?`,
                [item.quantity, item.productCode])
        }
        return next
    })
}

// คืน false ถ้าสถานะถูกเปลี่ยนไปก่อน (WHERE status = <เดิม> ไม่ตรง)
export async function changeStatus(orderNumber, fromStatus, toStatus) {
    return withTransaction(async conn => {
        const [result] = await conn.query(
            `UPDATE orders SET status = ?, shippedDate = IF(? = 'Shipped', CURDATE(), shippedDate)
             WHERE orderNumber = ? AND status = ?`,
            [toStatus, toStatus, orderNumber, fromStatus])
        if (result.affectedRows === 0) return false
        if (toStatus === "Cancelled") {
            // UPDATE แบบ JOIN: คืนสต็อกทุกบรรทัดของ order ในคำสั่งเดียว
            await conn.query(
                `UPDATE products p JOIN orderdetails d ON d.productCode = p.productCode
                 SET p.quantityInStock = p.quantityInStock + d.quantityOrdered
                 WHERE d.orderNumber = ?`,
                [orderNumber])
        }
        return true
    })
}

// ต้องลบลูก (orderdetails) ก่อนแม่ (orders) ไม่งั้น FK ไม่ยอม
export async function remove(orderNumber) {
    return withTransaction(async conn => {
        await conn.query(`DELETE FROM orderdetails WHERE orderNumber = ?`, [orderNumber])
        await conn.query(`DELETE FROM orders WHERE orderNumber = ?`, [orderNumber])
    })
}
