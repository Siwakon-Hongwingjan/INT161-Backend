// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/ticket-repository.js"
import * as technicianRepo from "../repositories-67130500001/technician-repository.js"
import mapper from "../mappers-67130500001/ticket-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"]
// state machine: สถานะปัจจุบัน → สถานะที่ไปต่อได้
const TRANSITIONS = {
    OPEN: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["RESOLVED", "OPEN"],
    RESOLVED: ["CLOSED", "IN_PROGRESS"],
    CLOSED: [],
    CANCELLED: [],
}
const ASSIGNABLE = ["OPEN", "IN_PROGRESS"]
const DELETABLE = ["CANCELLED", "CLOSED"]
// priority ต้องเรียงตามความรุนแรง ไม่ใช่ตัวอักษร (ตัวอักษร: HIGH < LOW < MEDIUM < URGENT)
// FIELD(x, a, b, c, d) คืนลำดับของ x ในรายการ (LOW=1 ... URGENT=4) แล้วเรียงตามตัวเลขนั้น
const SORT_COLUMNS = {
    ticketNo: "t.ticket_no",
    openedOn: "t.opened_on",
    priority: "FIELD(t.priority, 'LOW', 'MEDIUM', 'HIGH', 'URGENT')",
}

function badRequest(message) {
    return new AppError(message, httpStatus.BAD_REQUEST)
}

function validationError(details) {
    return new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details)
}

// YYYY-MM-DD ที่มีอยู่จริง: new Date("2026-02-30") ไม่ error แต่เลื่อนเป็น 2 มี.ค. → แปลงกลับต้องได้ค่าเดิม
function isValidDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const date = new Date(`${s}T00:00:00Z`)
    return !isNaN(date) && date.toISOString().slice(0, 10) === s
}

// "OPEN,IN_PROGRESS" → ["OPEN", "IN_PROGRESS"] ทุกค่าต้องอยู่ใน allowed (ตัวพิมพ์ตรงตัว)
function parseList(value, allowed, name) {
    const list = value.split(",")
    if (!list.every(v => allowed.includes(v))) throw badRequest(`Invalid ${name} '${value}'`)
    return list
}

function parseFilters({status, priority, technicianId, q, from, to}) {
    const filters = {q}
    if (status !== undefined) filters.statuses = parseList(status, STATUSES, "status")
    if (priority !== undefined) filters.priorities = parseList(priority, PRIORITIES, "priority")
    if (technicianId === "none") filters.technicianId = null
    else if (technicianId !== undefined) {
        if (!/^\d+$/.test(technicianId)) throw badRequest("technicianId must be an integer or 'none'")
        filters.technicianId = Number(technicianId)
    }
    for (const [key, value] of [["from", from], ["to", to]]) {
        if (value === undefined) continue
        if (!isValidDate(value)) throw badRequest(`${key} must be a valid date YYYY-MM-DD`)
        filters[key] = value
    }
    if (filters.from && filters.to && filters.from > filters.to) throw badRequest("from must be <= to") // YYYY-MM-DD เทียบ string ได้
    return filters
}

function parseSort(sort = "ticketNo") {
    const parts = sort.split(",").map(token => {
        const desc = token.startsWith("-")
        const column = SORT_COLUMNS[desc ? token.slice(1) : token]
        if (!column) throw badRequest(`Invalid sort field '${token}'`)
        return `${column} ${desc ? "DESC" : "ASC"}`
    })
    return [...parts, "t.id ASC"].join(", ")
}

const RULES = {
    ticketNo: [v => typeof v === "string" && /^TCK-\d{4}$/.test(v), "must match TCK- followed by 4 digits"],
    title: [v => typeof v === "string" && v.trim().length >= 3 && v.length <= 120, "must be a string of 3-120 characters"],
    priority: [v => PRIORITIES.includes(v), `must be one of ${PRIORITIES.join(", ")}`],
    openedOn: [isValidDate, "must be a valid date YYYY-MM-DD"],
}

function validateTicket(body) {
    const details = Object.entries(RULES)
        .filter(([field, [check]]) => !check(body?.[field]))
        .map(([field, [, message]]) => ({field, message}))
    if (details.length > 0) throw validationError(details)
}

async function findOrFail(id) {
    const ticket = await repo.findOne(id)
    if (!ticket) throw new AppError(`Ticket with id '${id}' was not found`, httpStatus.NOT_FOUND)
    return ticket
}

export async function getAllObjects(pagination, query) {
    const filters = parseFilters(query)
    const orderBy = parseSort(query.sort)
    return mapper.maps(await repo.findAll(pagination, filters, orderBy))
}

export async function getObject(id) {
    return mapper.toDetailDTO(await findOrFail(id))
}

// status ไม่ต้องใส่ → DB default 'OPEN', technician_id ไม่ใส่ → NULL
export async function createObject(body) {
    validateTicket(body)
    const {ticketNo, title, priority, openedOn} = body
    return mapper.toDetailDTO(await repo.create({ticket_no: ticketNo, title, priority, opened_on: openedOn}))
}

// ลำดับตามโจทย์: 404 → 400 → 409 TICKET_CLOSED → 400 TECHNICIAN_NOT_FOUND → 422 TECHNICIAN_INACTIVE
export async function assign(id, body) {
    const ticket = await findOrFail(id)
    const technicianId = body?.technicianId
    if (!Number.isInteger(technicianId)) {
        throw validationError([{field: "technicianId", message: "must be an integer"}])
    }
    if (!ASSIGNABLE.includes(ticket.status)) {
        throw new AppError(`Ticket is ${ticket.status}`, httpStatus.CONFLICT, "TICKET_CLOSED")
    }
    const technician = await technicianRepo.findOne(technicianId)
    if (!technician) {
        throw new AppError(`Technician '${technicianId}' does not exist`, httpStatus.BAD_REQUEST, "TECHNICIAN_NOT_FOUND")
    }
    if (!technician.is_active) {
        throw new AppError(`Technician '${technician.name}' is inactive`, httpStatus.UNPROCESSABLE_ENTITY, "TECHNICIAN_INACTIVE")
    }
    return mapper.toDetailDTO(await repo.assign(id, technicianId))
}

export async function changeStatus(id, body) {
    const ticket = await findOrFail(id)
    const newStatus = body?.status
    if (!STATUSES.includes(newStatus)) throw badRequest(`status must be one of ${STATUSES.join(", ")}`)
    const invalidTransition = new AppError(
        `Cannot change status from ${ticket.status} to ${newStatus}`, httpStatus.CONFLICT, "INVALID_STATUS_TRANSITION")
    if (!TRANSITIONS[ticket.status].includes(newStatus)) throw invalidTransition
    // กฎเพิ่มเติม: เริ่มงานได้เมื่อมีช่างแล้วเท่านั้น
    if (newStatus === "IN_PROGRESS" && ticket.technician_id === null) {
        throw new AppError("Assign a technician before starting work", httpStatus.UNPROCESSABLE_ENTITY, "TECHNICIAN_REQUIRED")
    }
    if (!await repo.updateStatus(id, ticket.status, newStatus)) throw invalidTransition // มีคนเปลี่ยนตัดหน้า
    return mapper.toDetailDTO(await repo.findOne(id))
}

export async function removeObject(id) {
    const ticket = await findOrFail(id)
    if (!DELETABLE.includes(ticket.status)) {
        throw new AppError(`Cannot delete a ${ticket.status} ticket`, httpStatus.CONFLICT, "TICKET_NOT_DELETABLE")
    }
    await repo.remove(id)
}
