# 📝 ใบงานข้อสอบจำลอง 5: Event Platform API
## ระดับความยาก: ⭐⭐⭐⭐⭐ Hard → Nested resource, business rules, soft delete, GROUP BY

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX5-KEY`
* **เวลาทำข้อสอบ:** 120 นาที
* **ฐานข้อมูล:** `event_platform`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `event_platform`)
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
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX5-KEY" }, "timestamp": "..." }
```

# 📝 ใบงานข้อสอบจำลอง 5: Event Platform API
## ระดับความยาก: ⭐⭐⭐⭐⭐ Hard → Nested resource, business rules, soft delete, GROUP BY

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX5-KEY`
* **เวลาทำข้อสอบ:** 120 นาที
* **ฐานข้อมูล:** `event_platform`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `event_platform`)
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
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX5-KEY" }, "timestamp": "..." }
```

## 🌐 2. Endpoints (รวม 100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 5 |
| Events list (DTO + seats) | 10 |
| Filter: text/enum (10) + price/date/combined (8) | 18 |
| Sort | 7 |
| List query validation | 5 |
| Event detail | 5 |
| POST event | 12 |
| PATCH event | 5 |
| Registrations: POST (15) + GET (5) | 20 |
| Soft delete | 5 |
| Stats (GROUP BY) | 8 |

ข้อนี้ Request Body เป็น camelCase และ error ที่เกี่ยวกับกฎธุรกิจต้องมี `error.code` เฉพาะตามที่ระบุ (ต้องปรับ `AppError` / `error-handler` ให้กำหนด `code` เองได้)

### 2.1 `GET /events`
* **ซ่อน event ที่ถูก soft delete** (`deleted_at IS NOT NULL`) ทุกที่
* Query: `page` (default 1), `limit` (1–100, default 20), `q` (ค้นใน `title` บางส่วน ไม่สนตัวพิมพ์), `city` (เมืองของ venue), `category` (`MUSIC/TECH/SPORT/FOOD`), `status` (`DRAFT/PUBLISHED/CANCELLED`), `minPrice`, `maxPrice`, `from`, `to` (ช่วง `start_date` รวมขอบ, `YYYY-MM-DD`), `sort` (`startDate, ticketPrice, title`, คั่น `,`, `-` = desc, default `startDate`)
* ค่าไม่ถูกต้อง (page/limit, category, status, ตัวเลข, วันที่ที่ไม่มีจริง, `min>max`, `from>to`, sort ฟิลด์แปลก) → `400`
* ทุก filter ใช้ร่วมกันได้ · `pagination.total` นับหลัง filter · ถ้าเรียงเท่ากัน ให้ตัดสินด้วย `id` น้อยไปมาก
* **Summary DTO:**
```json
{ "id": 8, "title": "Event 08 Live", "venueName": "Bangkok Hall", "city": "Bangkok", "category": "MUSIC",
  "startDate": "2026-09-09", "ticketPrice": 720, "status": "PUBLISHED",
  "registeredCount": 5, "seatsLeft": 0, "isFull": true }
```
  `registeredCount` = จำนวนแถวใน `registrations`, `seatsLeft = max_attendees − registeredCount`, `isFull = seatsLeft <= 0`

### 2.2 `GET /events/:id`
```json
{ "id": 3, "title": "...", "venue": { "id": 4, "name": "Khon Kaen Center", "city": "Khon Kaen", "capacity": 100 },
  "category": "FOOD", "startDate": "2026-10-04", "ticketPrice": 270, "maxAttendees": 50, "status": "PUBLISHED",
  "registeredCount": 0, "seatsLeft": 50, "isFull": false }
```
`404` เมื่อไม่พบ **หรือถูก soft delete แล้ว**

### 2.3 `POST /events`
Body: `{ "title", "venueId", "category", "startDate", "ticketPrice", "maxAttendees", "status"? }`
* `title` 1–150 ตัวอักษร · `venueId` integer · `category` ใน 4 ค่า · `startDate` วันที่จริง · `ticketPrice` number ≥ 0 · `maxAttendees` integer ≥ 1 · `status` (ไม่ส่ง = `DRAFT`)
* ผิด → `400` + `error.details[] = { field, message }` ทุกฟิลด์ที่ผิด
* `venueId` ไม่มีจริง → `400`
* `maxAttendees` มากกว่า `capacity` ของ venue → **`422`**, `error.code = EXCEEDS_VENUE_CAPACITY`
* `201` + Detail DTO

### 2.4 `PATCH /events/:id`
ส่งบางฟิลด์ได้ (`venueId` ห้ามเปลี่ยน — ถ้าส่งมาให้ข้าม) · validation เหมือน POST
* event สถานะ `CANCELLED` แก้ไม่ได้ → `409`, `code = EVENT_CANCELLED`
* `maxAttendees` มากกว่า capacity → `422` `EXCEEDS_VENUE_CAPACITY`
* `maxAttendees` น้อยกว่า `registeredCount` → `409`, `code = BELOW_REGISTERED_COUNT`
* `200` + Detail DTO · `404`

### 2.5 Registrations
#### `POST /events/:id/registrations`
Body: `{ "attendeeName", "attendeeEmail" }` (ชื่อไม่ว่าง, email รูปแบบถูกต้อง → ผิดแจ้ง `400` + `details[]`)

ลำดับการตรวจ: event ไม่พบ/ถูกลบ → `404` · body ผิด → `400` · ไม่ใช่ `PUBLISHED` → `409` `EVENT_NOT_OPEN` · email นี้ลงทะเบียน event นี้แล้ว → `409` `DUPLICATE_REGISTRATION` · เต็มแล้ว → `409` `EVENT_FULL`

สำเร็จ → `201`: `{ id, eventId, attendeeName, attendeeEmail, seatsLeft }` (`seatsLeft` หลังลงทะเบียน)
> 💡 การนับที่นั่งว่างกับ INSERT ควรอยู่ใน transaction เดียว (`SELECT ... FOR UPDATE`) เพื่อกันการจองเกินเมื่อมีหลาย request พร้อมกัน

#### `GET /events/:id/registrations?page=&limit=`
`data[]` = `{ id, eventId, attendeeName, attendeeEmail }` เรียงตาม `id` น้อยไปมาก พร้อม `pagination` · `404` ถ้า event ไม่พบ/ถูกลบ

### 2.6 `DELETE /events/:id` — Soft delete
ตั้ง `deleted_at = NOW()` (ห้ามลบแถวจริง) → `204` · หลังจากนั้นทั้ง list/detail/registrations/stats ต้องมองไม่เห็น event นั้น · ลบซ้ำ → `404`

### 2.7 `GET /stats/cities`
สรุปแยกตามเมืองของ venue (เฉพาะ event ที่ยังไม่ถูกลบ) ด้วย `GROUP BY`:
```json
[ { "city": "Phuket", "eventCount": 8, "totalRegistrations": 10, "avgTicketPrice": 690 } ]
```
* `avgTicketPrice` ปัด 2 ตำแหน่ง เป็น number · เมืองที่ไม่มีใครลงทะเบียนต้องยังอยู่ในผลลัพธ์ด้วย `totalRegistrations: 0`
* เรียง `eventCount` มากไปน้อย แล้ว `city` A→Z

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
