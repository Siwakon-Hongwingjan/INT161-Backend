import * as repo from "../repositories/room.repo.js";
import { toDetailDTO, toSummaryList } from "../mappers/room.mapper.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

// whitelist: ชื่อใน query → คอลัมน์จริง (ห้ามเอา sortBy ไปต่อ SQL ตรงๆ)
const SORT_COLUMNS = { roomNumber: "r.room_number", pricePerNight: "r.price_per_night" };
const ORDERS = { asc: "ASC", desc: "DESC" };
// ฟิลด์ที่อนุญาตให้ POST/PUT ส่งมา กัน key แปลกๆ เข้า INSERT/UPDATE ... SET ? (จะได้ 500 Unknown column)
const FIELDS = ["room_number", "floor", "room_type_id", "price_per_night", "status", "has_view"];

function pick(body) {
  return Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
}

function validate(data, isCreate) {
  if (isCreate && !data.room_number) {
    throw new AppError("room_number is required", httpStatus.BAD_REQUEST);
  }
  if ((isCreate || data.price_per_night !== undefined) && !(Number(data.price_per_night) > 0)) {
    throw new AppError("price_per_night must be greater than 0", httpStatus.BAD_REQUEST);
  }
}

export async function getAllObjects(pagination, query) {
  const { status, floor, roomTypeId, sortBy = "roomNumber", order = "asc" } = query;
  const column = SORT_COLUMNS[sortBy];
  const direction = ORDERS[order];
  if (!column || !direction) {
    throw new AppError(`Invalid sortBy '${sortBy}' or order '${order}'`, httpStatus.BAD_REQUEST);
  }
  // ใส่ room_number ต่อท้ายเป็นตัวตัดสินเมื่อราคาเท่ากัน ให้ลำดับคงที่ทุกครั้ง
  const orderBy = `${column} ${direction}, r.room_number ASC`;
  const rooms = await repo.findAll(pagination, { status, floor, roomTypeId }, orderBy);
  return toSummaryList(rooms);
}

export async function getObject(id) {
  return toDetailDTO(await repo.findOne(id));
}

export async function createObject(body) {
  const data = pick(body);
  validate(data, true);
  return toDetailDTO(await repo.create(data));
}

export async function updateObject(id, body) {
  const data = pick(body);
  validate(data, false);
  return toDetailDTO(await repo.update(id, data));
}

export async function removeObject(id) {
  await repo.remove(id);
}
