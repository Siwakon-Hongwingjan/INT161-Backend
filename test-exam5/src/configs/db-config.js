import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  // DATE ให้คืนเป็น string "YYYY-MM-DD" ตรงๆ ไม่แปลงเป็น JS Date
  // (ถ้าเป็น Date แล้ว toISOString() จะแปลงเป็น UTC ทำให้วันที่เลื่อนไป 1 วันในโซนเวลาไทย)
  dateStrings: true,
  database: "event_platform",
});
export default db;
