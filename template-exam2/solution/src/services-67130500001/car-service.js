// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/car-repository.js"
import mapper from "../mappers-67130500001/car-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

const TRANSMISSIONS = ["AUTO", "MANUAL"]
// whitelist: ชื่อใน query → คอลัมน์จริง
const SORT_COLUMNS = {plateNo: "c.plate_no", dailyRate: "c.daily_rate", seats: "c.seats"}
const ORDERS = {asc: "ASC", desc: "DESC"}

const isText = v => typeof v === "string" && v.trim() !== ""
// กฎของแต่ละฟิลด์ใน body (snake_case) — ฟิลด์ที่ไม่อยู่ในนี้จะถูกตัดทิ้ง ไม่ส่งเข้า SQL
const RULES = {
    plate_no: [isText, "plate_no must be a non-empty string"],
    brand: [isText, "brand must be a non-empty string"],
    model: [isText, "model must be a non-empty string"],
    branch_id: [Number.isInteger, "branch_id must be an integer"],
    daily_rate: [v => typeof v === "number" && v > 0, "daily_rate must be a number > 0"],
    seats: [v => Number.isInteger(v) && v >= 2 && v <= 9, "seats must be an integer 2-9"],
    transmission: [v => TRANSMISSIONS.includes(v), "transmission must be AUTO or MANUAL"],
    is_available: [v => [true, false, 0, 1].includes(v), "is_available must be a boolean"],
}
const OPTIONAL = ["is_available"]

function badRequest(message) {
    return new AppError(message, httpStatus.BAD_REQUEST)
}

// isCreate = POST ต้องมีครบ, PUT ตรวจเฉพาะที่ส่งมา · คืน object ที่มีเฉพาะฟิลด์ที่รู้จัก
function validate(body, isCreate) {
    const data = {}
    for (const [field, [check, message]] of Object.entries(RULES)) {
        const value = body?.[field]
        if (value === undefined && (!isCreate || OPTIONAL.includes(field))) continue
        if (!check(value)) throw badRequest(message)
        data[field] = value
    }
    return data
}

// ค่าใน req.query เป็น string เสมอ ต้องตรวจ/แปลงเอง ผิด → 400
function parseFilters({brand, branchId, transmission, available, minSeats}) {
    const filters = {brand}
    if (branchId !== undefined) {
        if (!/^\d+$/.test(branchId)) throw badRequest("branchId must be an integer")
        filters.branchId = Number(branchId)
    }
    if (transmission !== undefined) {
        if (!TRANSMISSIONS.includes(transmission)) throw badRequest("transmission must be AUTO or MANUAL")
        filters.transmission = transmission
    }
    if (available !== undefined) {
        if (available !== "true" && available !== "false") throw badRequest("available must be true or false")
        filters.available = available === "true"
    }
    if (minSeats !== undefined) {
        if (!/^\d+$/.test(minSeats)) throw badRequest("minSeats must be an integer")
        filters.minSeats = Number(minSeats)
    }
    return filters
}

function parseSort({sortBy = "plateNo", order = "asc"}) {
    const column = SORT_COLUMNS[sortBy]
    const direction = ORDERS[order]
    if (!column) throw badRequest(`Invalid sortBy '${sortBy}'`)
    if (!direction) throw badRequest(`Invalid order '${order}'`)
    return `${column} ${direction}, c.plate_no ASC` // ค่าเท่ากัน → เรียงด้วยทะเบียน
}

async function findOrFail(id) {
    const car = await repo.findOne(id)
    if (!car) throw new AppError(`Car with id '${id}' was not found`, httpStatus.NOT_FOUND)
    return car
}

export async function getAllObjects(pagination, query) {
    const filters = parseFilters(query)
    const orderBy = parseSort(query)
    return mapper.maps(await repo.findAll(pagination, filters, orderBy))
}

export async function getObject(id) {
    return mapper.toDetailDTO(await findOrFail(id))
}

export async function createObject(body) {
    return mapper.toDetailDTO(await repo.create(validate(body, true)))
}

export async function updateObject(id, body) {
    await findOrFail(id)
    return mapper.toDetailDTO(await repo.update(id, validate(body, false)))
}

export async function removeObject(id) {
    await findOrFail(id)
    await repo.remove(id)
}
