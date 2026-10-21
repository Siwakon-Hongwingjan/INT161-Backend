import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const TABLE_NAME = "categories";
const ENTITY_NAME = "Categorie";

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`;
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY id`;
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;

async function count() {
  const [[{ total }]] = await db.query(COUNT_ALL);
  return total;
}

export async function findAll(pagination) {
  if (!pagination) {
    const [datas] = await db.query(FIND_ALL_SQL);
    return datas;
  }
  const SQL = FIND_ALL_SQL + " LIMIT ? OFFSET ?";
  const { limit, offset } = pagination;
  const [datas] = await db.query(SQL, [limit, offset]);
  datas.totalItems = await count();
  return datas;
}

export async function findOne(id) {
  const [data] = await db.query(FIND_ONE_SQL, [id]);
  if (data.length === 0) {
    throw new AppError(
      `${ENTITY_NAME} with code '${id}' was not found`,
      httpStatus.NOT_FOUND,
    );
  }
  return data[0];
}
