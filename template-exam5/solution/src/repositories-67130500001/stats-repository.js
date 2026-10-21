// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// เริ่มจาก orderdetails (1 แถว = 1 สินค้าใน 1 order) แล้ว JOIN ขึ้นไปหา orders / products
// orderCount ต้อง COUNT(DISTINCT ...) เพราะ 1 order มีหลายบรรทัดในกลุ่มเดียวกันได้
const BASE_SQL = `SELECT p.productLine,
        COUNT(DISTINCT o.orderNumber) AS orderCount,
        SUM(d.quantityOrdered) AS unitsSold,
        ROUND(SUM(d.quantityOrdered * d.priceEach), 2) AS revenue
    FROM orderdetails d
    JOIN orders o ON o.orderNumber = d.orderNumber
    JOIN products p ON p.productCode = d.productCode
    WHERE o.status <> 'Cancelled'`

export async function productLineStats(year) {
    const yearFilter = year === undefined ? "" : " AND YEAR(o.orderDate) = ?"
    const [rows] = await db.query(`${BASE_SQL}${yearFilter} GROUP BY p.productLine ORDER BY revenue DESC`,
        year === undefined ? [] : [year])
    return rows
}
