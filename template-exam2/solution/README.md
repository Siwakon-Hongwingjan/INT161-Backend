# เฉลยโจทย์จำลอง 2 — Car Rental (Easy)

ทดสอบ: `node src/app.js` แล้ว `node ../tests/test-runner.mjs` → **100/100**

## โจทย์ข้อนี้วัดอะไร
1. **Error handler ที่แปลง error ของ MySQL และ express.json()** เป็น status/code ที่ถูกต้อง (ตัวหลักของข้อ)
2. filter + sort แบบ whitelist + `total` ที่นับหลัง filter
3. snake_case (DB/body) ↔ camelCase (response)

## Error handler — ลำดับการตรวจ (`middlewares-67130500001/error-handler.js`)
```
err.type === "entity.parse.failed"  → 400 INVALID_JSON      (express.json() parse body ไม่ได้)
MYSQL_ERRORS[err.code]              → 409/400/409            (ER_DUP_ENTRY / ER_NO_REFERENCED_ROW_2 / ER_ROW_IS_REFERENCED_2)
err instanceof AppError             → statusCode + errorCode ที่เราโยนเอง
อื่นๆ                                → 500 + ข้อความกลางๆ (ไม่ส่ง err.message ของ SQL ออกไป)
```
- `AppError` ใช้ property `errorCode` **ไม่ใช่ `code`** เพราะ mysql2 ใช้ `err.code` เป็น `"ER_DUP_ENTRY"` อยู่แล้ว ถ้าใช้ชื่อเดียวกันจะปนกัน
- ข้อดีของการให้ DB ตรวจ UNIQUE/FK: ไม่ต้อง `SELECT` ก่อน INSERT และไม่มี race condition (2 request พร้อมกันก็โดน UNIQUE จับ)
- ถ้าไม่จัดการ `entity.parse.failed` Express จะตอบเป็น **HTML** 400 ซึ่ง client ที่รอ JSON จะพัง

## จุดสำคัญอื่น
- **`COUNT(c.id)` ไม่ใช่ `COUNT(*)`** ใน `GET /branches` — LEFT JOIN สาขาที่ไม่มีรถจะได้ 1 แถวที่ฝั่ง cars เป็น NULL, `COUNT(*)` นับแถวนั้นเป็น 1 แต่ `COUNT(c.id)` ไม่นับ NULL → 0
- **ค่าใน `req.query` เป็น string เสมอ** — `available=yes`, `minSeats=2.5` ต้องตรวจเอง ใช้ regex `/^\d+$/` สำหรับจำนวนเต็ม
- **sort whitelist** `{plateNo: "c.plate_no", ...}` แล้วต่อ `, c.plate_no ASC` ท้ายสุด ราคาเท่ากัน (900 สองคัน) ลำดับจึงแน่นอน
- **validate คืน object ใหม่ที่มีเฉพาะฟิลด์ที่รู้จัก** → กัน key แปลกๆ เข้า `INSERT ... SET ?` (จะได้ 500 Unknown column)
- `typeof v === "number"` สำหรับ body (JSON มี type จริง) แต่สำหรับ query ต้องแปลงจาก string
- PUT เปลี่ยนทะเบียนเป็นของคันอื่น → UPDATE โดน UNIQUE → 409 จาก error handler เหมือน POST โดยไม่ต้องเขียนเพิ่ม
- `weeklyRate` ปัดด้วย `Math.round(x * 100) / 100` (2999.99 × 6.3 = 18899.937 → 18899.94)
