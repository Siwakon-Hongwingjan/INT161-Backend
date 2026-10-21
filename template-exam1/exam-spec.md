# 📝 โจทย์จำลอง (โครงอาจารย์) 1: Classic Models — Products API
## ระดับความยาก: ⭐ Beginner · เวลา 60 นาที

### 👤 ข้อมูลผู้เข้าสอบ
* **Student ID:** `67130500001` · **ชื่อ:** `Practice Student` · **Secret Key:** `TP1-KEY`
* **ฐานข้อมูล:** `classicmodels` (ฐานตัวอย่างของ mysqltutorial ที่อยู่ใน `.idea` ของโครง)

---

## 🎯 1. การตั้งค่า (ใช้โครงใน `starter/`)
1. นำเข้าฐานข้อมูล (รันซ้ำเพื่อรีเซ็ตได้): `mysql -u root -p < database/classicmodels.sql`
2. **เปลี่ยนชื่อโฟลเดอร์** ทุกตัวที่ลงท้าย `-$id` ให้เป็นรหัสนักศึกษา เช่น `routes-$id` → `routes-67130500001` (แก้ import ให้ตรงด้วย)
3. แทน `{student-id} - {student-name}` ที่หัวทุกไฟล์ด้วย `67130500001 - Practice Student`
4. แก้ `db-config.js` ให้ตรงกับเครื่อง (database `classicmodels`)
5. `npm install` แล้ว `node src/app.js` (พอร์ต 3000)
6. ทุก Endpoint อยู่ใต้ Base Path **`/api/67130500001`**

> ⚠️ โครงที่อาจารย์ให้ **มีจุดที่ยังไม่เสร็จหรือผิดอยู่** (เช่น error handler ว่าง, `findOne` คืน `null`, `create` เช็คคีย์ผิดฟิลด์, PUT ไม่ส่ง argument, DELETE ไม่ตอบ 204) ต้องหาแล้วแก้เอง

### รูปแบบ Response
ใช้ `apiResponse` ใน `api-response.js` ตามที่ให้มา (ไม่มี `timestamp`)
```json
{ "success": true, "data": ... }
{ "success": true, "data": [...], "pagination": { "total": 110, "page": 1, "limit": 10, "totalPages": 11, "hasNextPage": true, "hasPrevPage": false } }
```
**Error (ต้องเขียน error handler เอง):**
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Product 'X' was not found" } }
```
> 💡 `http-status` มี `httpStatus["404_NAME"]` = `"NOT_FOUND"`, `httpStatus["409_NAME"]` = `"CONFLICT"`

---

## 🌐 2. Endpoints (100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 10 |
| Product lines | 10 |
| Products list | 30 |
| Product detail + 404 | 15 |
| POST (201 + 409) | 15 |
| PUT | 10 |
| DELETE | 10 |

### `GET /student-info`
```json
{ "success": true, "data": { "studentId": "67130500001", "name": "Practice Student", "secretKey": "TP1-KEY" } }
```

### 2.1 Product lines (10)
* `GET /product-lines` → `[{ "productLine": "Classic Cars", "description": "..." }]` (`description` มาจาก `textDescription`) เรียงตาม `productLine`
* `GET /product-lines/:productLine/products` → Summary DTO ของสินค้าในกลุ่มนั้น (ไม่แบ่งหน้า) · กลุ่มที่ไม่มีอยู่จริง → `404`
  (ชื่อกลุ่มมีช่องว่าง เช่น `/product-lines/Classic%20Cars/products`)

### 2.2 `GET /products` (30)
* มี `page` และ `limit` → แบ่งหน้า + `pagination` (total = 110) · **ไม่ส่ง** → คืนทั้งหมด 110 รายการ ไม่มี `pagination` (เหมือนโครง)
* เรียงตาม `productCode`
* **Summary DTO** (เหมือน `toSummaryDTO` ในโครง แต่ราคาต้องเป็น number):
```json
{ "id": "S10_1678", "name": "1969 Harley Davidson Ultimate Chopper", "scale": "1:10", "retailPrice": 95.7 }
```

### 2.3 `GET /products/:code` (15)
**Detail DTO** — คอลัมน์ทั้งหมด แต่ `buyPrice` → `price`, `MSRP` → `retailPrice` (เป็น number):
```json
{ "productCode": "S18_3232", "productName": "1992 Ferrari 360 Spider red", "productLine": "Classic Cars",
  "productScale": "1:18", "productVendor": "Unimax Art Galleries", "productDescription": "...",
  "quantityInStock": 8347, "price": 77.9, "retailPrice": 169.34 }
```
ไม่พบ → `404` + error envelope (`code: "NOT_FOUND"`)

### 2.4 `POST /products` (15)
* Body = ชื่อคอลัมน์ของตาราง (classicmodels เป็น camelCase อยู่แล้ว): `productCode, productName, productLine, productScale, productVendor, productDescription, quantityInStock, buyPrice, MSRP`
* `201` + Detail DTO · `productCode` ซ้ำ → `409` (`code: "CONFLICT"`)

### 2.5 `PUT /products/:code` (10)
ส่งบางฟิลด์ได้ → `200` + Detail DTO · ไม่พบ → `404`

### 2.6 `DELETE /products/:code` (10)
`204` ไม่มี body · ไม่พบ → `404`

---

## 🧪 ทดสอบ
1. `node src/app.js`
2. อีก terminal: `node ../tests/test-runner.mjs` (เปลี่ยนพอร์ต: `node ../tests/test-runner.mjs 67130500001 3001`)
3. เทสต์ลบข้อมูลที่ตัวเองสร้างตอนจบ ถ้าข้อมูลเพี้ยนให้ import `classicmodels.sql` ใหม่
