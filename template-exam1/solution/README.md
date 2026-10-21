# เฉลยโจทย์จำลอง 1 — Classic Models Products (Beginner)

ทดสอบ: `node src/app.js` แล้ว `node ../tests/test-runner.mjs` → **100/100**

## โจทย์ข้อนี้วัดอะไร
ข้อแรกตั้งใจให้ "อ่านโครงอาจารย์ให้ออก" เพราะโครงมีส่วนที่ยังไม่เสร็จหรือผิดอยู่หลายจุด ถ้าแค่เติม route จะได้คะแนนไม่ครบ

## จุดในโครงที่ต้องแก้ (สำคัญที่สุดของข้อนี้)
| จุด | โครงเดิม | ปัญหา | แก้เป็น |
|---|---|---|---|
| `app.js` | `app.use((err,req,res,next) => {})` | ไม่ส่ง response → request ค้างจน timeout | เขียน `errorHandler` ตอบ error envelope |
| `app.js` | ไม่ได้ `app.use(queryParser())` | `req.pagination` เป็น `undefined` | ใส่ middleware ก่อน router |
| `repository.findOne` | คืน `null` | ถ้าไม่เช็ค → mapper พังที่ `null.productCode` ได้ 500 | service เช็ค null แล้ว `throw new AppError(..., 404)` |
| `repository.findAll` | ไม่นับ `total` | `pagination.total` เป็น `undefined` | `COUNT(*)` แล้วใส่ `rows.totalItems` |
| `repository.create` | เช็คซ้ำด้วย `data.productLine` | ผิดฟิลด์ ต้องใช้ primary key | เช็ค `productCode` → 409 |
| `route PUT` | `service.updateObject()` | ไม่ส่ง id/body | `updateObject(req.params.code, req.body)` |
| `route DELETE` | `res.end()` | ได้ 200 | `res.status(204).end()` |
| `mapper.maps` | `if(totalItems)` | total = 0 จะหายไป | `!== undefined` |

## Error handler ข้อนี้ (ระดับพื้นฐาน)
- `AppError extends Error` เก็บ `statusCode`
- handler มี 4 พารามิเตอร์ `(err, req, res, next)` และต้อง `app.use` **หลัง** router ทุกตัว
- `httpStatus[\`${statusCode}_NAME\`]` ให้ชื่อแบบ `NOT_FOUND`, `CONFLICT` โดยไม่ต้องเขียน map เอง
- Express 5 ส่ง error จาก `async` handler มาที่ error handler ให้เอง (Express 4 ต้อง `try/catch` + `next(err)`)

## จุดอื่นที่ควรรู้
- classicmodels ใช้ชื่อคอลัมน์ camelCase อยู่แล้ว → body ของ POST/PUT ส่งเข้า `INSERT ... SET ?` ได้ตรงๆ
- Primary key เป็น string (`productCode`) ไม่ใช่ `id` ตัวเลข
- `DECIMAL` (`MSRP`, `buyPrice`) ได้มาเป็น string → `Number()` ใน mapper
- `/product-lines/Classic%20Cars/products` — Express decode `%20` ใน `req.params` ให้แล้ว
- ต้องเช็คว่า product line มีจริงก่อน ไม่งั้นกลุ่มที่ไม่มีจะได้ `[]` แทน 404
- `toDetailDTO` ใช้ destructuring `const {MSRP, buyPrice, ...data} = entity` เอาคอลัมน์ที่เหลือทั้งหมดโดยไม่ต้องพิมพ์ทีละตัว (แบบในโครง)

## หมายเหตุฐานข้อมูล
`database/classicmodels.sql` เพิ่ม `DROP DATABASE IF EXISTS classicmodels;` ไว้หัวไฟล์ เพราะไฟล์ต้นฉบับ DROP ตารางผิดลำดับ (ลบ `productlines` ก่อน `products`) ทำให้รันซ้ำบน MySQL 8 ไม่ได้
