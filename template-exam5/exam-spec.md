# 📝 โจทย์จำลอง (โครงอาจารย์) 5: Classic Models — Orders API
## ระดับความยาก: ⭐⭐⭐⭐⭐ Hard · เวลา 150 นาที

### 👤 ข้อมูลผู้เข้าสอบ
* **Student ID:** `67130500001` · **ชื่อ:** `Practice Student` · **Secret Key:** `TP5-KEY`
* **ฐานข้อมูล:** `classicmodels` (`database/classicmodels.sql` รันซ้ำเพื่อรีเซ็ตได้)

---

## 🎯 1. การตั้งค่า (ใช้โครงใน `starter/`)
1. `mysql -u root -p < database/classicmodels.sql`
2. เปลี่ยนชื่อโฟลเดอร์ `-$id` → `-67130500001`, แทน `{student-id} - {student-name}` ทุกไฟล์
3. แก้ `db-config.js` · `npm install` · `node src/app.js` (พอร์ต 3000) · Base Path **`/api/67130500001`**
4. ตาราง `orders` **ไม่มี AUTO_INCREMENT** · ยอดเงินของ order ไม่มีในตาราง ต้องคำนวณจาก `orderdetails` (`quantityOrdered × priceEach`)
5. วันที่ทุกตัวตอบเป็น `"YYYY-MM-DD"` (หรือ `null`)

### ❗ Error handler (ต้องเขียนเอง)
ทุกอย่างของโจทย์ 4 (`NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR` + `details[]`, MySQL error, `INVALID_JSON`, route ที่ไม่มี → 404 JSON) และ:
* error ที่ไม่ได้คาดไว้ (500) ต้องตอบ `INTERNAL_SERVER_ERROR` **โดยไม่ส่งข้อความ SQL / stack ออกไป**

| สถานการณ์ | status | `error.code` |
|---|---|---|
| ลูกค้าใน body ไม่มีอยู่จริง | 400 | `CUSTOMER_NOT_FOUND` |
| สินค้าใน items ไม่มีอยู่จริง | 400 | `PRODUCT_NOT_FOUND` |
| สต็อกไม่พอ (+ `details[]` ระบุ `items[i].quantity`) | 409 | `INSUFFICIENT_STOCK` |
| เปลี่ยนสถานะผิดกฎ | 409 | `INVALID_STATUS_TRANSITION` |
| ลบ order ที่ไม่ใช่ `Cancelled` | 409 | `ORDER_NOT_CANCELLED` |

---

## 🌐 2. Endpoints (100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 5 |
| Orders list (DTO + default pagination) | 10 |
| Filters | 15 |
| Sort | 5 |
| Query validation | 5 |
| Order detail (+ lines) | 10 |
| Stats (GROUP BY) | 10 |
| POST order (transaction) + product stock | 20 |
| PATCH status (+ คืนสต็อก) | 10 |
| DELETE | 5 |
| Error handler (route ที่ไม่มี / JSON พัง) | 5 |

### `GET /student-info` → `{ studentId, name, secretKey: "TP5-KEY" }`

### 2.1 `GET /orders`
| Query | กฎ |
|---|---|
| `page`, `limit` | default 1 / 20 · `page` ≥ 1 · `limit` 1–100 · ผิด → `400` |
| `status` | คั่น `,` · ค่า: `In Process, Shipped, Cancelled, On Hold, Disputed, Resolved` (ตรงตัว, มีช่องว่าง → ส่งเป็น `In%20Process`) |
| `customerNumber` | จำนวนเต็ม |
| `from`, `to` | ช่วง `orderDate` รวมขอบ · วันที่จริง · `from > to` → `400` |
| `minTotal`, `maxTotal` | ช่วงยอดรวมของ order (คำนวณ) รวมขอบ · ตัวเลข · `min > max` → `400` |
| `sort` | คั่น `,` · `-` = มากไปน้อย · ใช้ได้: `orderNumber` (default), `orderDate`, `total` · อื่นๆ → `400` · ค่าเท่ากัน → `orderNumber` น้อยไปมาก |

* **Summary DTO:**
```json
{ "orderNumber": 10100, "orderDate": "2003-01-06", "status": "Shipped",
  "customerName": "Online Diecast Creations Co.", "itemCount": 4, "total": 10223.83 }
```
  `itemCount` = จำนวนบรรทัดใน orderdetails · `total` = Σ `quantityOrdered × priceEach` (number 2 ตำแหน่ง)

### 2.2 `GET /orders/:orderNumber` (10)
Summary DTO + `requiredDate`, `shippedDate` (null ได้), `comments` (null ได้), `customer: { customerNumber, customerName, country }`,
`lines: [{ "lineNumber": 1, "productCode": "S24_3969", "productName": "...", "quantity": 49, "priceEach": 35.29, "lineTotal": 1729.21 }]` เรียงตาม `orderLineNumber` · `404`

### 2.3 `GET /products/:productCode`
`{ productCode, productName, quantityInStock, retailPrice }` · `404` (ใช้ดูสต็อกหลังสั่งซื้อ/ยกเลิก)

### 2.4 `POST /orders` (20)
```json
{ "customerNumber": 141, "requiredDate": "2026-12-01", "comments": "optional",
  "items": [ { "productCode": "S18_3232", "quantity": 3 }, { "productCode": "S10_1678", "quantity": 2 } ] }
```
1. **Validation** → `400 VALIDATION_ERROR` + `details[]` ทุกจุดที่ผิด:
   `customerNumber` integer · `requiredDate` วันที่จริง · `comments` string (ไม่บังคับ) · `items` array ไม่ว่าง ·
   แต่ละ item: `productCode` string, `quantity` integer ≥ 1 · `productCode` ซ้ำกันใน items ไม่ได้
   (ชื่อ field ของ item ใช้รูปแบบ `items[0].quantity`, `items[1].productCode`)
2. ลูกค้าไม่มี → `400 CUSTOMER_NOT_FOUND` · สินค้าไม่มี → `400 PRODUCT_NOT_FOUND`
3. สต็อกไม่พอ → `409 INSUFFICIENT_STOCK` + `details: [{ "field": "items[1].quantity", "message": "only 15 in stock" }]`
4. สำเร็จ → **ทำใน transaction เดียว**: `orderNumber` = MAX + 1 · `orderDate` = วันนี้ · `status` = `In Process` ·
   `priceEach` = `MSRP` ของสินค้า · `orderLineNumber` = 1, 2, ... ตามลำดับ items · **ลด `quantityInStock`**
   ถ้าผิดตรงไหน **ต้องไม่มีอะไรถูกบันทึกเลย** (สต็อกต้องไม่ลด)
5. `201` + Detail DTO

### 2.5 `PATCH /orders/:orderNumber/status` (10)
Body: `{ "status": "Shipped" }`

| จาก | ไปได้ |
|---|---|
| `In Process` | `Shipped`, `On Hold`, `Cancelled` |
| `On Hold` | `In Process`, `Cancelled` |
| `Shipped` | `Disputed` |
| `Disputed` | `Resolved`, `Cancelled` |
| `Resolved`, `Cancelled` | — |

* ไป `Shipped` → ตั้ง `shippedDate` = วันนี้
* ไป `Cancelled` → **คืนสต็อก**ทุกบรรทัด (transaction เดียวกับการเปลี่ยนสถานะ)
* ค่าไม่อยู่ใน 6 สถานะ → `400` · ผิดกฎ → `409 INVALID_STATUS_TRANSITION` · `404` · สำเร็จ → `200` + Detail DTO

### 2.6 `DELETE /orders/:orderNumber` (5)
ลบได้เฉพาะ `Cancelled` (ลบ orderdetails ก่อน แล้วค่อยลบ order — FK) → `204` · อื่นๆ → `409 ORDER_NOT_CANCELLED` · `404`

### 2.7 `GET /stats/product-lines?year=2004` (10)
สรุปยอดขายแยกตาม `productLine` (ไม่นับ order ที่ `Cancelled`) · `year` ไม่บังคับ (4 หลัก ไม่งั้น `400`)
```json
[ { "productLine": "Classic Cars", "orderCount": 94, "unitsSold": 15470, "revenue": 1689307.07 } ]
```
`orderCount` = จำนวน order ที่ไม่ซ้ำ · `unitsSold` = Σ quantity · `revenue` = Σ quantity × priceEach (2 ตำแหน่ง) · เรียง `revenue` มากไปน้อย

---

## 🧪 ทดสอบ
`node src/app.js` แล้วอีก terminal `node ../tests/test-runner.mjs`
