// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/office-repository.js"

// SELECT เลือกคอลัมน์ตรงกับ DTO แล้ว (classicmodels เป็น camelCase) จึงไม่ต้องมี mapper
export async function getAllObjects() {
    return await repo.findAll()
}
