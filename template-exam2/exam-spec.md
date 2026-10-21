# 📝 โจทย์จำลอง (โครงอาจารย์) 2: Car Rental API
## ระดับความยาก: ⭐⭐ Easy · เวลา 75 นาที

### 👤 ข้อมูลผู้เข้าสอบ
* **Student ID:** `67130500001` · **ชื่อ:** `Practice Student` · **Secret Key:** `TP2-KEY`
* **ฐานข้อมูล:** `car_rental` (`database/init-database.sql` รันซ้ำเพื่อรีเซ็ตได้)

---

## 🎯 1. การตั้งค่า (ใช้โครงใน `starter/`)
1. `mysql -u root -p < database/init-database.sql`
2. เปลี่ยนชื่อโฟลเดอร์ `-$id` → `-67130500001`, แทน `{student-id} - {student-name}` ทุกไฟล์
3. แก้ `db-config.js` (database `car_rental`) · `npm install` · `node src/app.js` (พอร์ต 3000)
4. Base Path: **`/api/67130500001`**
5. ตารางเป็น **snake_case** แต่ response ต้องเป็น **camelCase** · Request body ของ POST/PUT เป็น **snake_case** (ตรงกับคอลัมน์)

### รูปแบบ Response
ใช้ `apiResponse` ของโครง (ไม่มี timestamp)

### ❗ Error handler (ต้องเขียนเอง — 4 อย่างนี้)
ทุก error ตอบ `{ "success": false, "error": { "code": "...", "message": "..." } }`

| สถานการณ์ | status | `error.code` |
|---|---|---|
| ไม่พบข้อมูล | 404 | `NOT_FOUND` |
| query / body ไม่ถูกต้อง | 400 | `BAD_REQUEST` |
| MySQL `ER_DUP_ENTRY` (UNIQUE ซ้ำ) | 409 | `DUPLICATE_KEY` |
| MySQL `ER_NO_REFERENCED_ROW_2` (FK ชี้ไปแถวที่ไม่มี) | 400 | `FOREIGN_KEY_NOT_FOUND` |
| MySQL `ER_ROW_IS_REFERENCED_2` (ลบแถวที่มีคนอ้างอิง) | 409 | `RESOURCE_IN_USE` |
| Body เป็น JSON ที่พัง (`express.json()` parse ไม่ได้) | 400 | `INVALID_JSON` |

> ⚠️ `409` ของทะเบียนซ้ำ และ `400` ของสาขาที่ไม่มีอยู่จริง **ต้องมาจากการแปลง MySQL error ใน error handler** ไม่ต้อง SELECT เช็คก่อน

---

## 🌐 2. Endpoints (100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 5 |
| Branches | 15 |
| Cars list (pagination + DTO) | 15 |
| Filter | 20 |
| Sort | 10 |
| Car detail | 10 |
| POST | 15 |
| Invalid JSON | 5 |
| PUT / DELETE | 5 |

### `GET /student-info` → `{ studentId, name, secretKey: "TP2-KEY" }`

### 2.1 Branches (15)
* `GET /branches` → `[{ "id": 1, "name": "Bangkok Central", "city": "Bangkok", "carCount": 9 }]` เรียงตาม `id`
  * `carCount` = จำนวนรถในสาขา — **สาขาที่ไม่มีรถต้องแสดงด้วย `carCount: 0`**
* `GET /branches/:id` → DTO เดียวกัน · `404`
* `DELETE /branches/:id` → `204` · `404` · มีรถอยู่ในสาขา → `409 RESOURCE_IN_USE`

### 2.2 `GET /cars` (45)
| Query | ความหมาย |
|---|---|
| `page`, `limit` | แบ่งหน้า (ไม่ส่ง = คืนทั้งหมด ไม่มี `pagination`) |
| `brand` | ยี่ห้อ (ตรงตัว) |
| `branchId` | รหัสสาขา |
| `transmission` | `AUTO` / `MANUAL` · ค่าอื่น → `400` |
| `available` | `true` / `false` · ค่าอื่น → `400` |
| `minSeats` | `seats >= n` · ไม่ใช่จำนวนเต็ม → `400` |
| `sortBy` | `plateNo` (default) / `dailyRate` / `seats` · ค่าอื่น → `400` |
| `order` | `asc` (default) / `desc` · ค่าอื่น → `400` |

* ทุก filter ใช้ร่วมกันได้ (AND) · `pagination.total` นับหลัง filter
* ค่าเท่ากัน → ตัดสินด้วย `plateNo` น้อยไปมาก
* ห้ามนำค่า `sortBy`/`order` ไปต่อ SQL ตรงๆ (ใช้ whitelist)
* **Summary DTO:**
```json
{ "id": 1, "plateNo": "BKK-1000", "name": "Toyota Yaris", "branchName": "Bangkok Central", "dailyRate": 900, "isAvailable": true }
```

### 2.3 `GET /cars/:id` (10)
Summary DTO + `brand, model, seats, transmission, branch: { id, name, city }, weeklyRate`
* `weeklyRate` = `dailyRate × 7 × 0.9` (ลด 10%) ปัด 2 ตำแหน่ง เป็น number · `404`

### 2.4 `POST /cars` (15)
* Body: `plate_no, brand, model, branch_id, daily_rate, seats, transmission, is_available?`
* ตรวจ → `400 BAD_REQUEST`: `plate_no/brand/model` ต้องเป็น string ไม่ว่าง · `daily_rate` > 0 · `seats` จำนวนเต็ม 2–9 · `transmission` AUTO/MANUAL
* `201` + Detail DTO · ทะเบียนซ้ำ → `409 DUPLICATE_KEY` · `branch_id` ไม่มี → `400 FOREIGN_KEY_NOT_FOUND`

### 2.5 Invalid JSON (5)
POST ด้วย body ที่ไม่ใช่ JSON ที่ถูกต้อง (เช่น `{"plate_no": "X",`) → `400 INVALID_JSON` (ไม่ใช่ 500 และไม่ใช่ HTML error page)

### 2.6 `PUT /cars/:id` / `DELETE /cars/:id` (5)
* PUT ส่งบางฟิลด์ (snake_case) ได้ ตรวจเฉพาะฟิลด์ที่ส่งมา → `200` + Detail DTO / `404`
* DELETE → `204` / `404`

---

## 🧪 ทดสอบ
`node src/app.js` แล้วอีก terminal `node ../tests/test-runner.mjs`
