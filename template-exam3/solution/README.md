# เฉลยโจทย์จำลอง 3 — Classic Models Customers (Medium)

ทดสอบ: `node src/app.js` แล้ว `node ../tests/test-runner.mjs` → **100/100**

## โจทย์ข้อนี้วัดอะไร
1. Validation ที่รายงาน **ทุกฟิลด์ที่ผิดพร้อมกัน** ใน `error.details[]` (error handler ต้องรองรับ `details`)
2. Search + filter หลายแบบ (`LIKE`, `IS NULL`, ช่วงตัวเลข) + multi-field sort
3. Detail ที่ต้องรวมข้อมูลจาก 3 ตาราง (employees, orders, payments) โดยไม่ให้ตัวเลขเพี้ยน
4. ตารางที่ไม่มี AUTO_INCREMENT

## Error handler — เพิ่มจากข้อ 2
- `AppError(message, statusCode, errorCode?, details?)` กำหนด code เองได้ และแนบ details ได้
- `details: err.details` ใส่ได้เลย ถ้าเป็น `undefined` จะหายไปตอน `JSON.stringify`
- validate วนตรวจทุกฟิลด์ เก็บ error ลง array แล้วค่อย throw ตอนจบ (ไม่ throw ตั้งแต่ฟิลด์แรก)

## จุดสำคัญ / กับดักในข้อนี้
| เรื่อง | ทำอย่างไร | ทำไม |
|---|---|---|
| `contactName` | `.trim()` ทั้งชื่อและนามสกุล | ข้อมูลจริงมี `"Carine "` (ช่องว่างท้าย) ไม่ trim จะได้ `"Carine  Schmitt"` |
| `salesRepId=none` | `IS NULL` | `col = NULL` ใน SQL ไม่เคยเป็นจริง |
| `salesRep` ใน detail | LEFT JOIN employees แล้วถ้า `salesRepEmployeeNumber === null` ส่ง `null` | 22 คนไม่มี rep ถ้าใช้ JOIN ธรรมดาลูกค้าพวกนี้จะ 404 |
| `orderCount` / `totalPayments` | subquery แยกกัน 2 อัน | ถ้า JOIN orders กับ payments พร้อมกัน แถวจะคูณกัน (26 orders × 13 payments) แล้ว COUNT/SUM ผิด |
| `totalPayments` | `COALESCE(SUM(...), 0)` + `Number()` | SUM ของแถวว่างได้ NULL, SUM(DECIMAL) ได้ string |
| `customerNumber` ใหม่ | `MAX(customerNumber) + 1` | ตารางไม่มี AUTO_INCREMENT (มี comment `ponytail:` เรื่อง race condition ในโค้ด) |
| `customerNumber` ใน body ของ PUT | validate คืนเฉพาะฟิลด์ใน `RULES` | กันแก้ primary key โดยไม่ตั้งใจ |
| creditTier | เช็ค `=== 0` ก่อน แล้ว `< 50000`, `< 100000` | ลำดับ if สำคัญ ขอบ 50000 เป็น MEDIUM |
| `q` ไม่สนตัวพิมพ์ | ใช้ `LIKE` ได้เลย | collation ของ classicmodels (`utf8mb4_0900_ai_ci`) case-insensitive อยู่แล้ว |
| ลบลูกค้าที่มี orders | ปล่อยให้ FK โยน error → 409 `RESOURCE_IN_USE` | error handler จากข้อ 2 ใช้ได้เลย |

## Office list
`LEFT JOIN employees ... GROUP BY o.officeCode` + `COUNT(e.employeeNumber)` (ไม่ใช่ `COUNT(*)`) — เหมือนเรื่อง `carCount` ในข้อ 2
