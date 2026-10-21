# 📝 ใบงานข้อสอบจำลอง 3: Clinic Doctors API
## ระดับความยาก: ⭐⭐⭐ Medium → Search, Multi-sort, Validation, camelCase body

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX3-KEY`
* **เวลาทำข้อสอบ:** 90 นาที
* **ฐานข้อมูล:** `clinic_appointments`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `clinic_appointments`)
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
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX3-KEY" }, "timestamp": "..." }
```

## 🌐 2. Endpoints (รวม 100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 10 |
| Departments | 5 |
| Doctors list (pagination, DTO, level) | 15 |
| Search & filter | 20 |
| Multi-field sort | 10 |
| Detail | 10 |
| POST (201 + validation + 409/400) | 20 |
| PUT | 5 |
| DELETE | 5 |

> 📌 ข้อนี้ **Request Body เป็น camelCase** (ต่างจากข้อ 1–2) ต้อง map เป็น snake_case เอง

### 2.1 `GET /departments` (5)
`data[]` = `{ id, name }`

### 2.2 `GET /doctors` (45)
| Query | ความหมาย |
|---|---|
| `page`, `limit` | แบ่งหน้า |
| `q` | ค้นหาบางส่วน ไม่สนตัวพิมพ์ ใน `first_name` **หรือ** `last_name` |
| `departmentId` | กรองแผนก |
| `isActive` | `true` / `false` (อย่างอื่น → `400`) |
| `minExperience` | `years_experience >= n` (ไม่ใช่ตัวเลข → `400`) |
| `sort` | คั่นด้วย `,` ขึ้นต้น `-` = มากไปน้อย เช่น `-consultationFee,licenseNo` · ใช้ได้เฉพาะ `consultationFee, yearsExperience, licenseNo, lastName` (default `licenseNo`) ฟิลด์อื่น → `400` |

* ทุกเงื่อนไขใช้ร่วมกันได้ และ `pagination.total` ต้องนับหลัง filter/search
* **Summary DTO:**
```json
{ "id": 1, "licenseNo": "LIC-0001", "fullName": "Dr. Somsri Rakthai", "departmentName": "Dermatology",
  "yearsExperience": 3, "experienceLevel": "JUNIOR", "consultationFee": 350, "isActive": true }
```
* `experienceLevel`: `< 5` → `JUNIOR`, `5–14` → `SENIOR`, `>= 15` → `EXPERT`

### 2.3 `GET /doctors/:id` (10)
Summary DTO + `department: { id, name }`, `bookedAppointments` (จำนวน appointments ที่ `status = 'BOOKED'` ของหมอคนนั้น), `createdAt` · `404` ถ้าไม่พบ

### 2.4 `POST /doctors` (20)
Body: `{ "licenseNo", "firstName", "lastName", "departmentId", "yearsExperience", "consultationFee" }`
* ทุกฟิลด์จำเป็น · `licenseNo/firstName/lastName` เป็น string ไม่ว่าง · `departmentId` integer · `yearsExperience` integer ≥ 0 · `consultationFee` number > 0
* ผิด → `400` และต้องบอก **ทุกฟิลด์ที่ผิด** ใน `error.details`:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
  "details": [ { "field": "licenseNo", "message": "must be a non-empty string" } ] }, "timestamp": "..." }
```
* `201` + Detail DTO · `409` ถ้า `licenseNo` ซ้ำ · `400` ถ้า `departmentId` ไม่มีอยู่จริง

### 2.5 `PUT /doctors/:id` (5)
ส่งบางฟิลด์ได้ (camelCase เช่น `{ "consultationFee": 1200, "isActive": false }`) · ฟิลด์ที่ส่งมาต้องผ่านกฎเดียวกัน (ผิด → `400`) · `200` + Detail DTO / `404`

### 2.6 `DELETE /doctors/:id` (5)
`204` · `404` ถ้าไม่พบ · **`409`** ถ้าหมอมี appointments อยู่ (FK)

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
