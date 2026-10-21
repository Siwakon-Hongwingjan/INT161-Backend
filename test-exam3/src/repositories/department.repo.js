import db from "../configs/db-config.js";

export async function findAll() {
  const [datas] = await db.query(`SELECT id, name FROM departments ORDER BY id`);
  return datas;
}
