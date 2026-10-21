// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

export async function findOne(productCode) {
    const [rows] = await db.query(`SELECT * FROM products WHERE productCode = ?`, [productCode])
    return rows.length === 0 ? null : rows[0]
}
