// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

const FIND_ALL_SQL = `SELECT * FROM customers`
const COUNT_SQL = `SELECT COUNT(*) AS total FROM customers`
// Detail: LEFT JOIN employees (บางคนไม่มี sales rep) + subquery นับ orders / รวม payments
// ใช้ subquery แยกแทน JOIN orders + JOIN payments พร้อมกัน — JOIN สองตาราง one-to-many จะคูณแถวกันจน SUM/COUNT เพี้ยน
const FIND_ONE_SQL = `SELECT c.*,
        e.firstName AS repFirstName, e.lastName AS repLastName, e.email AS repEmail,
        (SELECT COUNT(*) FROM orders o WHERE o.customerNumber = c.customerNumber) AS orderCount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.customerNumber = c.customerNumber) AS totalPayments
    FROM customers c LEFT JOIN employees e ON e.employeeNumber = c.salesRepEmployeeNumber
    WHERE c.customerNumber = ?`
const NEXT_NUMBER_SQL = `SELECT COALESCE(MAX(customerNumber), 0) + 1 AS next FROM customers`
const CREATE_SQL = `INSERT INTO customers SET ?`
const UPDATE_SQL = `UPDATE customers SET ? WHERE customerNumber = ?`
const REMOVE_SQL = `DELETE FROM customers WHERE customerNumber = ?`

function buildWhere(filters) {
    const conds = []
    const params = []
    if (filters.q !== undefined) { conds.push("customerName LIKE ?"); params.push(`%${filters.q}%`) }
    if (filters.country !== undefined) { conds.push("country = ?"); params.push(filters.country) }
    // salesRepId=none → หาคนที่ไม่มี rep ต้องใช้ IS NULL (= NULL ไม่เคยเป็นจริงใน SQL)
    if (filters.salesRepId === null) conds.push("salesRepEmployeeNumber IS NULL")
    else if (filters.salesRepId !== undefined) { conds.push("salesRepEmployeeNumber = ?"); params.push(filters.salesRepId) }
    if (filters.minCredit !== undefined) { conds.push("creditLimit >= ?"); params.push(filters.minCredit) }
    if (filters.maxCredit !== undefined) { conds.push("creditLimit <= ?"); params.push(filters.maxCredit) }
    return {where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params}
}

// orderBy สร้างจาก whitelist ใน service แล้ว
export async function findAll(pagination, filters, orderBy) {
    const {where, params} = buildWhere(filters)
    const sql = `${FIND_ALL_SQL}${where} ORDER BY ${orderBy}`
    if (!pagination) {
        const [rows] = await db.query(sql, params)
        return rows
    }
    const [rows] = await db.query(sql + " LIMIT ? OFFSET ?", [...params, pagination.limit, pagination.offset])
    const [[{total}]] = await db.query(COUNT_SQL + where, params)
    rows.totalItems = total
    return rows
}

export async function findOne(customerNumber) {
    const [rows] = await db.query(FIND_ONE_SQL, [customerNumber])
    return rows.length === 0 ? null : rows[0]
}

// customers ไม่มี AUTO_INCREMENT → ต้องหาเลขถัดไปเอง
// ponytail: 2 request พร้อมกันอาจได้เลขเดียวกัน คนหลังจะโดน PK ซ้ำ (409 จาก error handler)
//           ถ้าต้องกันจริงให้ทำใน transaction + SELECT ... FOR UPDATE
export async function create(data) {
    const [[{next}]] = await db.query(NEXT_NUMBER_SQL)
    await db.query(CREATE_SQL, [{...data, customerNumber: next}])
    return findOne(next)
}

export async function update(customerNumber, data) {
    if (Object.keys(data).length > 0) await db.query(UPDATE_SQL, [data, customerNumber])
    return findOne(customerNumber)
}

// มี orders/payments อ้างอิง → ER_ROW_IS_REFERENCED_2 → 409 RESOURCE_IN_USE จาก error handler
export async function remove(customerNumber) {
    await db.query(REMOVE_SQL, [customerNumber])
}
