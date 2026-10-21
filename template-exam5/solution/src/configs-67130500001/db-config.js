//67130500001 - Practice Student
import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    // DATE ตอบเป็น "YYYY-MM-DD" ตรงๆ (ไม่แปลงเป็น JS Date ที่ toISOString แล้ววันเลื่อนตาม timezone)
    dateStrings: true,
    database: 'classicmodels',
})
export default db