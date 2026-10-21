# 📝 ใบงานข้อสอบจำลอง 4: Shop Orders API
## ระดับความยาก: ⭐⭐⭐⭐ Medium-Hard → Query validation, Date/Range filter, State machine

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX4-KEY`
* **เวลาทำข้อสอบ:** 100 นาที
* **ฐานข้อมูล:** `shop_orders`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `shop_orders`)
3. `npm install` แล้ว `npm start` (พอร์ต 3000)
4. ใน `src/app.js` มี `const ID = "67130500001"` อยู่แล้ว ทุก Endpoint ต้องอยู่ใต้ Base Path `/api/67130500001/...`
5. โครงที่ให้มา: `error-handler.js` (AppError + แปลง MySQL error), `pagination-middleware.js` (`req.pagination`), `api-response.js` ส่วน **routes / services / repositories / DTO mapper ต้องเขียนเอง**

### รูปแบบ Response มาตรฐาน (ใช้ทุก Endpoint)
```json
{ "success": true, "data": ..., "timestamp": "2026-10-08T15:00:00.000Z" }
```
แบบแบ่งหน้า เพิ่มฟิลด์ `pagination` ต่อจาก `data`:
```json
"pagination": { "total": 30, "page": 1, "limit": 10, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
```
แบบ Error:
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." }, "timestamp": "..." }
```
> ⚠️ `DECIMAL` จาก `mysql2` ถูกส่งมาเป็น **string** และ `BOOLEAN` เป็น 0/1 ต้องแปลงเป็น number / boolean ใน DTO ตามที่โจทย์กำหนด

---

### 🧾 Endpoint: ระบบระบุตัวตน
* `GET /api/67130500001/student-info` → `200`
```json
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX4-KEY" }, "timestamp": "..." }
```

## 🌐 2. Endpoints (รวม 100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 10 |
| Orders list: DTO (10) + default pagination (5) | 15 |
| Filter: status (5) + ช่วงราคา/วันที่/ลูกค้า (15) | 20 |
| Sort | 10 |
| Query validation → 400 | 15 |
| Detail | 5 |
| POST | 10 |
| PATCH status (state machine) | 10 |
| DELETE | 5 |

> ⚠️ `placed_at` เป็น `DATE` — `mysql2` แปลงเป็น JS `Date` ตาม timezone ของเครื่อง ถ้าใช้ `toISOString()` วันที่อาจเลื่อนไป 1 วัน ให้ response เป็น string `"YYYY-MM-DD"` ที่ถูกต้องเสมอ (เช่น `DATE_FORMAT` ใน SQL หรือ option `dateStrings`)

### 2.1 `GET /orders`
| Query | กฎ |
|---|---|
| `page` | integer ≥ 1 (default **1**) |
| `limit` | integer 1–100 (default **20**) — เกิน 100 ให้ `400` ไม่ใช่ตัดเหลือ 100 |
| `status` | รายการคั่น `,` ได้ เช่น `PAID,SHIPPED` (ค่าต้องเป็น `PENDING/PAID/SHIPPED/CANCELLED` ตัวพิมพ์ใหญ่ตรงเป๊ะ) |
| `customerId` | integer |
| `minTotal`, `maxTotal` | ช่วง `total_amount` **รวมขอบ** · ต้องเป็นตัวเลข · `minTotal > maxTotal` → `400` |
| `from`, `to` | ช่วง `placed_at` **รวมขอบ** รูปแบบ `YYYY-MM-DD` ต้องเป็นวันที่ที่มีจริง (`2026-02-31` ไม่ผ่าน) · `from > to` → `400` |
| `sort` | เหมือน test-exam3 (`-` = desc, คั่น `,`) ใช้ได้: `totalAmount, placedAt, orderNo` (default `orderNo`) · ค่าอื่น → `400` |

* **ไม่ส่ง `page/limit` ก็ต้องแบ่งหน้า** (page 1, limit 20, total 60) — ต่างจาก template ที่คืนทั้งหมดเมื่อไม่มี query
* Query ที่ผิดทุกกรณีต้องตอบ `400` พร้อม error envelope (ไม่ใช่ `500`, ไม่ใช่ list ว่าง)
* ทุก filter ใช้ร่วมกันได้ และ `pagination.total` นับหลัง filter
* **Summary DTO:**
```json
{ "id": 1, "orderNo": "ORD-0001", "customerName": "Boon Customer", "status": "CANCELLED",
  "totalAmount": 237, "vat": 16.59, "grandTotal": 253.59, "placedAt": "2026-02-06" }
```
  `vat` = `totalAmount × 0.07`, `grandTotal` = `totalAmount × 1.07` (ปัด 2 ตำแหน่ง, เป็น number)

### 2.2 `GET /orders/:id`
Summary DTO + `customer: { id, email, fullName, tier }` · `404`

### 2.3 `POST /orders`
Body (camelCase): `{ "orderNo", "customerId", "totalAmount", "placedAt" }`
* `orderNo` ตรงรูปแบบ `ORD-` ตามด้วยเลข ≥ 4 หลัก · `customerId` integer · `totalAmount` number > 0 · `placedAt` วันที่ `YYYY-MM-DD` ที่มีจริง
* ผิด → `400` + `error.details[] = { field, message }` ของ **ทุกฟิลด์ที่ผิด**
* `201` + Detail DTO, `status` เริ่มที่ `PENDING` · `409` ถ้า `orderNo` ซ้ำ · `400` ถ้า `customerId` ไม่มีจริง

### 2.4 `PATCH /orders/:id/status`
Body: `{ "status": "PAID" }`
| จาก | เปลี่ยนเป็นได้ |
|---|---|
| `PENDING` | `PAID`, `CANCELLED` |
| `PAID` | `SHIPPED`, `CANCELLED` |
| `SHIPPED`, `CANCELLED` | — (สถานะสุดท้าย) |
* สำเร็จ → `200` + Detail DTO
* ค่า `status` ไม่อยู่ใน 4 ค่า → `400`
* เปลี่ยนผิดกฎ → `409` และ `error.code` ต้องเป็น **`INVALID_STATUS_TRANSITION`**
* ไม่พบ order → `404`

### 2.5 `DELETE /orders/:id`
ลบได้เฉพาะ order สถานะ `CANCELLED` → `204` · สถานะอื่น → `409` · ไม่พบ → `404`

---

## 🧪 ทดสอบด้วยตนเอง (Self-Testing)
1. เปิด Server: `npm start`
2. อีก Terminal: `node tests/test-runner.mjs` (ระบุพอร์ตอื่นได้: `node tests/test-runner.mjs 67130500001 3001`)
3. Test รันซ้ำได้ (ข้อมูลที่เทสต์สร้างจะถูกลบเองตอนจบ) แต่ถ้าข้อมูลเพี้ยนให้รัน `init-database.sql` ใหม่
4. คะแนนเต็ม 100 — แต่ละ test แสดง `↳ Reason` ว่าพลาดตรงไหน

## 📦 Checklist ก่อนส่ง
* [ ] `/student-info` ถูกต้อง
* [ ] `node tests/test-runner.mjs` ได้ 100/100
* [ ] ไม่ใส่ `node_modules` ตอนบีบอัด
