# 📝 ใบงานข้อสอบจำลอง 2: Hotel Rooms API
## ระดับความยาก: ⭐⭐ Easy → ค้นหา/เรียงลำดับพื้นฐาน

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX2-KEY`
* **เวลาทำข้อสอบ:** 75 นาที
* **ฐานข้อมูล:** `hotel_booking`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `hotel_booking`)
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
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX2-KEY" }, "timestamp": "..." }
```

## 🌐 2. Endpoints (รวม 100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 10 |
| Room types | 10 |
| Rooms list (pagination + DTO) | 15 |
| Filter | 20 |
| Sort | 10 |
| Detail | 10 |
| POST (201/409 + validation) | 15 |
| PUT / DELETE | 10 |

### 2.1 Room types — 10 คะแนน
* `GET /room-types` → DTO `{ id, name, bedType, maxGuests, basePrice (number) }`
* `GET /room-types/:id` → `200` / `404`

### 2.2 Rooms
#### `GET /rooms` — Summary DTO + Filter + Sort (45 คะแนน)
| Query | ความหมาย |
|---|---|
| `page`, `limit` | แบ่งหน้า |
| `status` | `AVAILABLE` / `OCCUPIED` / `MAINTENANCE` |
| `floor` | ชั้น (ตัวเลข) |
| `roomTypeId` | รหัสประเภทห้อง |
| `sortBy` | `roomNumber` (default) หรือ `pricePerNight` |
| `order` | `asc` (default) หรือ `desc` |

* ทุก filter ใช้ร่วมกันได้ (AND) และ `pagination.total` ต้องนับ **หลัง filter**
* `sortBy` / `order` ที่ไม่รู้จัก → `400` (ห้ามเอาค่า query ไปต่อ SQL ตรงๆ — ใช้ whitelist)
* Summary DTO: `id, roomNumber, floor, typeName, pricePerNight (number), status`
```json
{ "id": 1, "roomNumber": "101", "floor": 1, "typeName": "Standard", "pricePerNight": 1300, "status": "AVAILABLE" }
```

#### `GET /rooms/:id` — Detail DTO (10 คะแนน)
Summary DTO + `roomType: { id, name, bedType, maxGuests }`, `hasView (boolean)`, `priceWithVat` = `pricePerNight × 1.07` ปัดทศนิยม 2 ตำแหน่ง · `404` ถ้าไม่พบ

#### `POST /rooms` (15 คะแนน)
* Body (snake_case): `room_number, floor, room_type_id, price_per_night, status, has_view`
* `201` + Detail DTO · `409` ถ้า `room_number` ซ้ำ
* Validation → `400`: ไม่มี `room_number` หรือ `price_per_night <= 0`

#### `PUT /rooms/:id` (5) และ `DELETE /rooms/:id` (5)
* PUT ส่งบางฟิลด์ได้ → `200` + Detail DTO / `404`
* DELETE → `204` / `404`

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
