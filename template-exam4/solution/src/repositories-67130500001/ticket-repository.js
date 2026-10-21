// 67130500001 - Practice Student
import db from '../configs-67130500001/db-config.js'

// LEFT JOIN เพราะ ticket ที่ยังไม่มีช่าง (technician_id NULL) ต้องยังอยู่
const SELECT_SQL = `SELECT t.*, k.name AS technician_name, k.level AS technician_level
    FROM tickets t LEFT JOIN technicians k ON k.id = t.technician_id`
const COUNT_SQL = `SELECT COUNT(*) AS total FROM tickets t`
const FIND_ONE_SQL = `${SELECT_SQL} WHERE t.id = ?`
const CREATE_SQL = `INSERT INTO tickets SET ?`
const ASSIGN_SQL = `UPDATE tickets SET technician_id = ? WHERE id = ?`
// เปลี่ยนสถานะ + จัดการ resolved_on ใน SQL เดียว:
//   ไป RESOLVED → วันนี้ (CURDATE ของ DB) · กลับไป IN_PROGRESS → ล้างเป็น NULL · อื่นๆ คงค่าเดิม
// WHERE status = <สถานะเดิม> กัน 2 request เปลี่ยนพร้อมกัน (อันหลัง affectedRows = 0)
const UPDATE_STATUS_SQL = `UPDATE tickets
    SET status = ?,
        resolved_on = CASE ? WHEN 'RESOLVED' THEN CURDATE() WHEN 'IN_PROGRESS' THEN NULL ELSE resolved_on END
    WHERE id = ? AND status = ?`
const REMOVE_SQL = `DELETE FROM tickets WHERE id = ?`

function buildWhere(filters) {
    const conds = []
    const params = []
    // IN (?) + array → mysql2 แตกเป็น IN ('OPEN', 'IN_PROGRESS') ให้เอง
    if (filters.statuses) { conds.push("t.status IN (?)"); params.push(filters.statuses) }
    if (filters.priorities) { conds.push("t.priority IN (?)"); params.push(filters.priorities) }
    if (filters.technicianId === null) conds.push("t.technician_id IS NULL")
    else if (filters.technicianId !== undefined) { conds.push("t.technician_id = ?"); params.push(filters.technicianId) }
    if (filters.q !== undefined) { conds.push("t.title LIKE ?"); params.push(`%${filters.q}%`) }
    if (filters.from !== undefined) { conds.push("t.opened_on >= ?"); params.push(filters.from) }
    if (filters.to !== undefined) { conds.push("t.opened_on <= ?"); params.push(filters.to) }
    return {where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params}
}

// ข้อนี้ pagination มีค่าเสมอ (middleware ใส่ default ให้)
export async function findAll(pagination, filters, orderBy) {
    const {where, params} = buildWhere(filters)
    const sql = `${SELECT_SQL}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    const [rows] = await db.query(sql, [...params, pagination.limit, pagination.offset])
    const [[{total}]] = await db.query(COUNT_SQL + where, params)
    rows.totalItems = total
    return rows
}

export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    return rows.length === 0 ? null : rows[0]
}

export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])
    return findOne(result.insertId)
}

export async function assign(id, technicianId) {
    await db.query(ASSIGN_SQL, [technicianId, id])
    return findOne(id)
}

// คืน true ถ้าเปลี่ยนได้จริง
export async function updateStatus(id, fromStatus, toStatus) {
    const [result] = await db.query(UPDATE_STATUS_SQL, [toStatus, toStatus, id, fromStatus])
    return result.affectedRows === 1
}

export async function remove(id) {
    await db.query(REMOVE_SQL, [id])
}
