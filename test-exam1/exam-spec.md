# 📝 ใบงานข้อสอบจำลอง 1: Cafe Menu API
## ระดับความยาก: ⭐ Beginner (เทียบเท่าตัวอย่างข้อสอบ)

---

### 👤 ข้อมูลผู้เข้าสอบ (Student Profile)
* **รหัสนักศึกษา (Student ID):** `67130500001`
* **ชื่อ:** `Practice Student`
* **Secret Key:** `EX1-KEY`
* **เวลาทำข้อสอบ:** 60 นาที
* **ฐานข้อมูล:** `cafe_menu`

---

## 🎯 1. การตั้งค่าโครงงาน

1. นำเข้าฐานข้อมูล (รันซ้ำได้ทุกเมื่อเพื่อรีเซ็ตข้อมูล):
   ```bash
   mysql -u root -p < database/init-database.sql
   ```
2. ตรวจสอบ `src/configs/db-config.js` ให้ตรงกับเครื่องของคุณ (database: `cafe_menu`)
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
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "EX1-KEY" }, "timestamp": "..." }
```

## 🌐 2. Endpoints (รวม 100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 10 |
| Categories (list, by id) | 10 |
| Menu items list (pagination + Summary DTO) | 35 |
| Menu item detail + 404 | 10 |
| POST (201 + 409) | 15 |
| PUT | 10 |
| DELETE | 10 |

### 2.1 Categories — 10 คะแนน
* `GET /categories` → `200` รายการทั้งหมดดิบจากตาราง (`id, name, description, is_active`)
* `GET /categories/:id` → `200` หรือ `404`

### 2.2 Menu items
ตาราง `menu_items` (snake_case) แต่ **response ต้องเป็น camelCase**

#### 1) `GET /menu-items?page=1&limit=10` — Summary DTO (35 คะแนน)
* `page` default 1, `limit` เช่น 10, เรียงตาม `id`
* `data[]` มีเฉพาะฟิลด์: `id, sku, name, categoryId, price (number), isAvailable (boolean)`
```json
{ "id": 1, "sku": "CAF-001", "name": "Espresso", "categoryId": 1, "price": 47, "isAvailable": true }
```
* ต้องมี `pagination` (total = 30)

#### 2) `GET /menu-items/:id` — Detail DTO (10 คะแนน)
`200` หรือ `404` — ฟิลด์: `id, sku, name, categoryId, categoryName, price, calories, size, isAvailable, createdAt` (`categoryName` ต้อง JOIN จาก `categories`)

#### 3) `POST /menu-items` (15 คะแนน)
* Body (snake_case): `{ "sku": "TEST-001", "name": "Test Drink", "category_id": 1, "price": 99.5, "calories": 120, "size": "L", "is_available": 1 }`
* `201` + Detail DTO ของรายการที่สร้าง, `409` ถ้า `sku` ซ้ำ

#### 4) `PUT /menu-items/:id` (10 คะแนน)
* Body อาจส่งมาแค่บางฟิลด์ (เช่น `{ "price": 120 }`) → อัปเดตเฉพาะฟิลด์นั้น, `200` + Detail DTO, `404` ถ้าไม่พบ

#### 5) `DELETE /menu-items/:id` (10 คะแนน)
* `204` ไม่มี body, `404` ถ้าไม่พบ

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
