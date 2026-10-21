// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/order-repository.js"
import mapper from "../mappers-67130500001/order-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

const STATUSES = ["In Process", "Shipped", "Cancelled", "On Hold", "Disputed", "Resolved"]
const TRANSITIONS = {
    "In Process": ["Shipped", "On Hold", "Cancelled"],
    "On Hold": ["In Process", "Cancelled"],
    "Shipped": ["Disputed"],
    "Disputed": ["Resolved", "Cancelled"],
    "Resolved": [],
    "Cancelled": [],
}
const SORT_COLUMNS = {orderNumber: "o.orderNumber", orderDate: "o.orderDate", total: "total"}

function badRequest(message) {
    return new AppError(message, httpStatus.BAD_REQUEST)
}

function isValidDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const date = new Date(`${s}T00:00:00Z`)
    return !isNaN(date) && date.toISOString().slice(0, 10) === s
}

const isNumeric = s => s.trim() !== "" && !isNaN(s)

function parseFilters({status, customerNumber, from, to, minTotal, maxTotal}) {
    const filters = {}
    if (status !== undefined) {
        // req.query decode %20 ให้แล้ว: "On%20Hold,Disputed" → "On Hold,Disputed"
        const statuses = status.split(",")
        if (!statuses.every(s => STATUSES.includes(s))) throw badRequest(`Invalid status '${status}'`)
        filters.statuses = statuses
    }
    if (customerNumber !== undefined) {
        if (!/^\d+$/.test(customerNumber)) throw badRequest("customerNumber must be an integer")
        filters.customerNumber = Number(customerNumber)
    }
    for (const [key, value] of [["from", from], ["to", to]]) {
        if (value === undefined) continue
        if (!isValidDate(value)) throw badRequest(`${key} must be a valid date YYYY-MM-DD`)
        filters[key] = value
    }
    if (filters.from && filters.to && filters.from > filters.to) throw badRequest("from must be <= to")
    for (const [key, value] of [["minTotal", minTotal], ["maxTotal", maxTotal]]) {
        if (value === undefined) continue
        if (!isNumeric(value)) throw badRequest(`${key} must be a number`)
        filters[key] = Number(value)
    }
    if (filters.minTotal > filters.maxTotal) throw badRequest("minTotal must be <= maxTotal")
    return filters
}

function parseSort(sort = "orderNumber") {
    const parts = sort.split(",").map(token => {
        const desc = token.startsWith("-")
        const column = SORT_COLUMNS[desc ? token.slice(1) : token]
        if (!column) throw badRequest(`Invalid sort field '${token}'`)
        return `${column} ${desc ? "DESC" : "ASC"}`
    })
    return [...parts, "o.orderNumber ASC"].join(", ")
}

// ตรวจทั้ง body และทุก item แล้วรายงานรวมทีเดียว · ชื่อ field ของ item = "items[i].quantity"
function validateOrder(body) {
    const details = []
    const fail = (field, message) => details.push({field, message})
    if (!Number.isInteger(body?.customerNumber)) fail("customerNumber", "must be an integer")
    if (!isValidDate(body?.requiredDate)) fail("requiredDate", "must be a valid date YYYY-MM-DD")
    if (body?.comments !== undefined && typeof body.comments !== "string") fail("comments", "must be a string")
    const items = body?.items
    if (!Array.isArray(items) || items.length === 0) {
        fail("items", "must be a non-empty array")
    } else {
        const seen = new Set()
        items.forEach((item, i) => {
            const code = item?.productCode
            if (typeof code !== "string" || code.trim() === "") fail(`items[${i}].productCode`, "must be a non-empty string")
            else if (seen.has(code)) fail(`items[${i}].productCode`, "duplicate product in items")
            else seen.add(code)
            if (!Number.isInteger(item?.quantity) || item.quantity < 1) fail(`items[${i}].quantity`, "must be an integer >= 1")
        })
    }
    if (details.length > 0) {
        throw new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details)
    }
}

async function findOrFail(orderNumber) {
    const order = await repo.findOne(orderNumber)
    if (!order) throw new AppError(`Order '${orderNumber}' was not found`, httpStatus.NOT_FOUND)
    return order
}

async function toDetail(orderNumber) {
    const order = await findOrFail(orderNumber)
    return mapper.toDetailDTO(order, await repo.findLines(orderNumber))
}

export async function getAllObjects(pagination, query) {
    const filters = parseFilters(query)
    const orderBy = parseSort(query.sort)
    return mapper.maps(await repo.findAll(pagination, filters, orderBy))
}

export async function getObject(orderNumber) {
    return toDetail(orderNumber)
}

// ลำดับ: body (400 VALIDATION_ERROR) → ลูกค้า (400) → สินค้า (400) → สต็อก (409) — 3 ตัวหลังตรวจใน transaction
export async function createObject(body) {
    validateOrder(body)
    return toDetail(await repo.create(body))
}

export async function changeStatus(orderNumber, body) {
    const order = await findOrFail(orderNumber)
    const newStatus = body?.status
    if (!STATUSES.includes(newStatus)) throw badRequest(`status must be one of ${STATUSES.join(", ")}`)
    const allowed = TRANSITIONS[order.status].includes(newStatus)
    if (!allowed || !await repo.changeStatus(orderNumber, order.status, newStatus)) {
        throw new AppError(`Cannot change status from ${order.status} to ${newStatus}`,
            httpStatus.CONFLICT, "INVALID_STATUS_TRANSITION")
    }
    return toDetail(orderNumber)
}

export async function removeObject(orderNumber) {
    const order = await findOrFail(orderNumber)
    if (order.status !== "Cancelled") {
        throw new AppError("Only Cancelled orders can be deleted", httpStatus.CONFLICT, "ORDER_NOT_CANCELLED")
    }
    await repo.remove(orderNumber)
}
