// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/customer-repository.js"
import mapper from "../mappers-67130500001/customer-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

const SORT_COLUMNS = {
    customerNumber: "customerNumber",
    customerName: "customerName",
    creditLimit: "creditLimit",
    country: "country",
}

const isText = v => typeof v === "string" && v.trim() !== ""
const TEXT = [isText, "must be a non-empty string"]
// [ตัวตรวจ, ข้อความ, ไม่บังคับ?]
const RULES = {
    customerName: TEXT,
    contactFirstName: TEXT,
    contactLastName: TEXT,
    phone: TEXT,
    addressLine1: TEXT,
    city: TEXT,
    country: TEXT,
    creditLimit: [v => typeof v === "number" && v >= 0, "must be a number >= 0", true],
    salesRepEmployeeNumber: [v => v === null || Number.isInteger(v), "must be an integer", true],
}

function badRequest(message) {
    return new AppError(message, httpStatus.BAD_REQUEST)
}

// ตรวจ "ทุกฟิลด์" เก็บ error ไว้ใน details แล้วโยนทีเดียว (ไม่หยุดที่ฟิลด์แรก)
// คืน object ที่มีเฉพาะฟิลด์ที่รู้จัก → customerNumber ใน body ถูกตัดทิ้งไปด้วย
function validate(body, isCreate) {
    const data = {}
    const details = []
    for (const [field, [check, message, optional]] of Object.entries(RULES)) {
        const value = body?.[field]
        if (value === undefined && (!isCreate || optional)) continue
        if (check(value)) data[field] = value
        else details.push({field, message})
    }
    if (details.length > 0) {
        throw new AppError("Validation failed", httpStatus.BAD_REQUEST, "VALIDATION_ERROR", details)
    }
    return data
}

const isNumeric = s => s.trim() !== "" && !isNaN(s)

function parseFilters({q, country, salesRepId, minCredit, maxCredit}) {
    const filters = {q, country}
    if (salesRepId === "none") filters.salesRepId = null
    else if (salesRepId !== undefined) {
        if (!/^\d+$/.test(salesRepId)) throw badRequest("salesRepId must be an integer or 'none'")
        filters.salesRepId = Number(salesRepId)
    }
    if (minCredit !== undefined) {
        if (!isNumeric(minCredit)) throw badRequest("minCredit must be a number")
        filters.minCredit = Number(minCredit)
    }
    if (maxCredit !== undefined) {
        if (!isNumeric(maxCredit)) throw badRequest("maxCredit must be a number")
        filters.maxCredit = Number(maxCredit)
    }
    if (filters.minCredit > filters.maxCredit) throw badRequest("minCredit must be <= maxCredit")
    return filters
}

// "-creditLimit,customerName" → "creditLimit DESC, customerName ASC, customerNumber ASC"
function parseSort(sort = "customerNumber") {
    const parts = sort.split(",").map(token => {
        const desc = token.startsWith("-")
        const column = SORT_COLUMNS[desc ? token.slice(1) : token]
        if (!column) throw badRequest(`Invalid sort field '${token}'`)
        return `${column} ${desc ? "DESC" : "ASC"}`
    })
    return [...parts, "customerNumber ASC"].join(", ")
}

async function findOrFail(customerNumber) {
    const customer = await repo.findOne(customerNumber)
    if (!customer) throw new AppError(`Customer '${customerNumber}' was not found`, httpStatus.NOT_FOUND)
    return customer
}

export async function getAllObjects(pagination, query) {
    const filters = parseFilters(query)
    const orderBy = parseSort(query.sort)
    return mapper.maps(await repo.findAll(pagination, filters, orderBy))
}

export async function getObject(customerNumber) {
    return mapper.toDetailDTO(await findOrFail(customerNumber))
}

export async function createObject(body) {
    const data = validate(body, true)
    data.creditLimit ??= 0 // ไม่ส่งมา → 0
    return mapper.toDetailDTO(await repo.create(data))
}

export async function updateObject(customerNumber, body) {
    await findOrFail(customerNumber)
    return mapper.toDetailDTO(await repo.update(customerNumber, validate(body, false)))
}

export async function removeObject(customerNumber) {
    await findOrFail(customerNumber)
    await repo.remove(customerNumber)
}
