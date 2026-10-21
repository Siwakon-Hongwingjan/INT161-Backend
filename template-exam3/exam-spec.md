# 📝 โจทย์จำลอง (โครงอาจารย์) 3: Classic Models — Customers API
## ระดับความยาก: ⭐⭐⭐ Medium · เวลา 90 นาที

### 👤 ข้อมูลผู้เข้าสอบ
* **Student ID:** `67130500001` · **ชื่อ:** `Practice Student` · **Secret Key:** `TP3-KEY`
* **ฐานข้อมูล:** `classicmodels` (`database/classicmodels.sql` รันซ้ำเพื่อรีเซ็ตได้)

---

## 🎯 1. การตั้งค่า (ใช้โครงใน `starter/`)
1. `mysql -u root -p < database/classicmodels.sql`
2. เปลี่ยนชื่อโฟลเดอร์ `-$id` → `-67130500001`, แทน `{student-id} - {student-name}` ทุกไฟล์
3. แก้ `db-config.js` · `npm install` · `node src/app.js` (พอร์ต 3000) · Base Path **`/api/67130500001`**
4. classicmodels เป็น camelCase ทั้ง DB และ body · ตาราง `customers` **ไม่มี AUTO_INCREMENT** (ต้องสร้าง `customerNumber` เอง)

### ❗ Error handler (ต้องเขียนเอง)
ทุกอย่างของโจทย์ 2 (404 `NOT_FOUND`, 400 `BAD_REQUEST`, MySQL error → `DUPLICATE_KEY` / `FOREIGN_KEY_NOT_FOUND` / `RESOURCE_IN_USE`, `INVALID_JSON`) **และเพิ่ม**:
* Validation ของ body ต้องตอบ **ทุกฟิลด์ที่ผิดพร้อมกัน**:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
  "details": [ { "field": "customerName", "message": "must be a non-empty string" } ] } }
```

---

## 🌐 2. Endpoints (100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 5 |
| Offices | 5 |
| Customers list | 15 |
| Search / filter | 20 |
| Multi-field sort | 10 |
| Customer detail | 15 |
| POST | 20 |
| PUT | 5 |
| DELETE | 5 |

### `GET /student-info` → `{ studentId, name, secretKey: "TP3-KEY" }`

### 2.1 `GET /offices` (5)
`[{ "officeCode": "1", "city": "San Francisco", "country": "USA", "employeeCount": 6 }]` เรียงตาม `officeCode`

### 2.2 `GET /customers` (45)
| Query | ความหมาย |
|---|---|
| `page`, `limit` | แบ่งหน้า (ไม่ส่ง = คืนทั้งหมด ไม่มี `pagination`) |
| `q` | ค้นบางส่วนใน `customerName` (ไม่สนตัวพิมพ์) |
| `country` | ประเทศ (ตรงตัว) |
| `salesRepId` | `salesRepEmployeeNumber` · ค่า **`none`** = ลูกค้าที่ไม่มี sales rep · ค่าอื่นที่ไม่ใช่จำนวนเต็ม → `400` |
| `minCredit`, `maxCredit` | ช่วง `creditLimit` รวมขอบ · ไม่ใช่ตัวเลข หรือ `min > max` → `400` |
| `sort` | คั่น `,` · `-` นำหน้า = มากไปน้อย · ใช้ได้: `customerNumber` (default), `customerName`, `creditLimit`, `country` · อื่นๆ → `400` |

* ทุกเงื่อนไขใช้ร่วมกันได้ · `pagination.total` นับหลัง filter · เรียงเท่ากัน → `customerNumber` น้อยไปมาก
* **Summary DTO:**
```json
{ "customerNumber": 103, "customerName": "Atelier graphique", "contactName": "Carine Schmitt",
  "country": "France", "creditLimit": 21000, "creditTier": "LOW" }
```
  * `contactName` = `contactFirstName + " " + contactLastName` (ข้อมูลบางแถวมีช่องว่างเกินท้ายชื่อ ต้อง trim)
  * `creditTier`: `0` → `NONE`, `< 50000` → `LOW`, `< 100000` → `MEDIUM`, `>= 100000` → `HIGH`

### 2.3 `GET /customers/:customerNumber` (15)
Summary DTO + `phone, city, salesRep, orderCount, totalPayments`
* `salesRep` = `{ "employeeNumber": 1370, "fullName": "Gerard Hernandez", "email": "..." }` หรือ **`null`** ถ้าไม่มี
* `orderCount` = จำนวน orders ของลูกค้า · `totalPayments` = ผลรวม `payments.amount` (number, ไม่มีเลย = `0`)
* ไม่พบ → `404`

### 2.4 `POST /customers` (20)
Body: `customerName, contactFirstName, contactLastName, phone, addressLine1, city, country` (string ไม่ว่าง **จำเป็นทุกตัว**), `creditLimit` (number ≥ 0, ไม่ส่ง = 0), `salesRepEmployeeNumber` (integer, ไม่บังคับ)
* ผิด → `400 VALIDATION_ERROR` + `details[]` ครบทุกฟิลด์
* `customerNumber` = เลขมากสุดในตาราง + 1 (ไม่รับจาก body)
* `salesRepEmployeeNumber` ไม่มีจริง → `400 FOREIGN_KEY_NOT_FOUND`
* `201` + Detail DTO

### 2.5 `PUT /customers/:customerNumber` (5)
ส่งบางฟิลด์ได้ ตรวจด้วยกฎเดียวกันเฉพาะฟิลด์ที่ส่ง (ผิด → `400 VALIDATION_ERROR`) · `customerNumber` ใน body ให้ข้าม · `200` + Detail DTO / `404`

### 2.6 `DELETE /customers/:customerNumber` (5)
`204` · `404` · ลูกค้าที่มี orders/payments → `409 RESOURCE_IN_USE`

---

## 🧪 ทดสอบ
`node src/app.js` แล้วอีก terminal `node ../tests/test-runner.mjs`
