import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const FIND_ALL_SQL = `SELECT * FROM room_types ORDER BY id`;
const FIND_ONE_SQL = `SELECT * FROM room_types WHERE id = ?`;

export async function findAll() {
  const [datas] = await db.query(FIND_ALL_SQL);
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(`roomType with id '${id}' was not found`, httpStatus.NOT_FOUND);
  }
  return data[0];
}
