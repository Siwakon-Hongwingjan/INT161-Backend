# 📝 โจทย์จำลอง (โครงอาจารย์) 4: Helpdesk Tickets API
## ระดับความยาก: ⭐⭐⭐⭐ Medium-Hard · เวลา 120 นาที

### 👤 ข้อมูลผู้เข้าสอบ
* **Student ID:** `67130500001` · **ชื่อ:** `Practice Student` · **Secret Key:** `TP4-KEY`
* **ฐานข้อมูล:** `helpdesk` (`database/init-database.sql` รันซ้ำเพื่อรีเซ็ตได้)

---

## 🎯 1. การตั้งค่า (ใช้โครงใน `starter/`)
1. `mysql -u root -p < database/init-database.sql`
2. เปลี่ยนชื่อโฟลเดอร์ `-$id` → `-67130500001`, แทน `{student-id} - {student-name}` ทุกไฟล์
3. แก้ `db-config.js` · `npm install` · `node src/app.js` (พอร์ต 3000) · Base Path **`/api/67130500001`**
4. ตาราง snake_case → response camelCase · Request body เป็น **camelCase**
5. ⚠️ คอลัมน์ `DATE` (`opened_on`, `resolved_on`) ต้องตอบเป็น string `"YYYY-MM-DD"` เสมอ (mysql2 แปลงเป็น JS `Date` ตาม timezone → `toISOString()` อาจเลื่อน 1 วัน)

### ❗ Error handler (ต้องเขียนเอง)
ทุกอย่างของโจทย์ 3 (`NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_ERROR` + `details[]`, MySQL error, `INVALID_JSON`) **และเพิ่ม**:
* **Route ที่ไม่มีอยู่** (เช่น `GET /api/67130500001/no-such-thing` หรือ `/hello`) → `404` + error envelope `NOT_FOUND` (ไม่ใช่หน้า HTML ของ Express)
* **Error code ของกฎธุรกิจ** ตามตารางด้านล่าง

| สถานการณ์ | status | `error.code` |
|---|---|---|
| เปลี่ยนสถานะผิดกฎ | 409 | `INVALID_STATUS_TRANSITION` |
| เริ่มงาน (`IN_PROGRESS`) แต่ยังไม่มีช่าง | 422 | `TECHNICIAN_REQUIRED` |
| มอบงานให้ช่างที่ไม่มีอยู่จริง | 400 | `TECHNICIAN_NOT_FOUND` |
| มอบงานให้ช่างที่ `is_active = false` | 422 | `TECHNICIAN_INACTIVE` |
| มอบงานให้ ticket ที่ไม่ใช่ `OPEN`/`IN_PROGRESS` | 409 | `TICKET_CLOSED` |
| ลบ ticket ที่ไม่ใช่ `CANCELLED`/`CLOSED` | 409 | `TICKET_NOT_DELETABLE` |

---

## 🌐 2. Endpoints (100 คะแนน)

| หมวด | คะแนน |
|---|---|
| Identity | 5 |
| Technicians | 5 |
| Tickets list (DTO + default pagination) | 10 |
| Filters | 15 |
| Sort (priority ตามความรุนแรง) | 10 |
| Query validation | 10 |
| Detail | 5 |
| POST | 10 |
| PATCH assign | 10 |
| PATCH status (state machine) | 10 |
| DELETE | 5 |
| Unknown route → 404 JSON | 5 |

### `GET /student-info` → `{ studentId, name, secretKey: "TP4-KEY" }`

### 2.1 `GET /technicians` (5)
`[{ "id": 1, "name": "Anan Support", "level": "L1", "isActive": true, "activeTickets": 3 }]` เรียงตาม `id`
* `activeTickets` = จำนวน ticket ของช่างที่สถานะ `OPEN` หรือ `IN_PROGRESS` (ช่างที่ไม่มีงานต้องได้ `0`)

### 2.2 `GET /tickets`
| Query | กฎ |
|---|---|
| `page` | จำนวนเต็ม ≥ 1 (default **1**) |
| `limit` | จำนวนเต็ม 1–50 (default **10**) · เกิน 50 → `400` (ไม่ใช่ตัดเหลือ 50) |
| `status` | คั่น `,` ได้ · ค่า: `OPEN, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED` (ตัวพิมพ์ใหญ่ตรงตัว) |
| `priority` | คั่น `,` ได้ · ค่า: `LOW, MEDIUM, HIGH, URGENT` |
| `technicianId` | จำนวนเต็ม หรือ **`none`** = ยังไม่มีช่าง |
| `q` | ค้นใน `title` บางส่วน ไม่สนตัวพิมพ์ |
| `from`, `to` | ช่วง `opened_on` รวมขอบ · `YYYY-MM-DD` ที่มีอยู่จริง (`2026-02-30` ไม่ผ่าน) · `from > to` → `400` |
| `sort` | คั่น `,` · `-` = มากไปน้อย · ใช้ได้: `ticketNo` (default), `openedOn`, `priority` · อื่นๆ → `400` |

* **ไม่ส่ง page/limit ก็ต้องแบ่งหน้า** (ต่างจากโครงที่คืนทั้งหมด)
* **`priority` เรียงตามความรุนแรง** `LOW < MEDIUM < HIGH < URGENT` (ไม่ใช่ตามตัวอักษร) · ค่าเท่ากัน → `id` น้อยไปมาก
* Query ผิดทุกกรณี → `400 BAD_REQUEST`
* **Summary DTO:**
```json
{ "id": 1, "ticketNo": "TCK-0001", "title": "VPN cannot connect on floor 2", "priority": "URGENT",
  "status": "IN_PROGRESS", "technicianName": "Dara Desk", "openedOn": "2026-01-12", "dueOn": "2026-01-13" }
```
  * `technicianName` = `null` ถ้ายังไม่มีช่าง
  * `dueOn` = `openedOn` + SLA (`URGENT` 1 วัน, `HIGH` 3, `MEDIUM` 7, `LOW` 14) เป็น `"YYYY-MM-DD"`

### 2.3 `GET /tickets/:id` (5)
Summary DTO + `slaDays`, `resolvedOn` (`null` ถ้ายังไม่ปิด), `technician: { id, name, level }` หรือ `null` · `404`

### 2.4 `POST /tickets` (10)
Body: `{ "ticketNo", "title", "priority", "openedOn" }`
* `ticketNo` รูปแบบ `TCK-` + เลข 4 หลัก · `title` string 3–120 ตัวอักษร · `priority` 1 ใน 4 ค่า · `openedOn` วันที่จริง `YYYY-MM-DD`
* ผิด → `400 VALIDATION_ERROR` + `details[]` ทุกฟิลด์ · ซ้ำ → `409 DUPLICATE_KEY`
* `201` + Detail DTO (`status` = `OPEN`, ยังไม่มีช่าง)

### 2.5 `PATCH /tickets/:id/assign` (10)
Body: `{ "technicianId": 2 }` (ต้องเป็นจำนวนเต็ม ไม่งั้น `400 VALIDATION_ERROR`)
* ลำดับ: ticket ไม่พบ → `404` · body ผิด → `400` · ticket ไม่ใช่ OPEN/IN_PROGRESS → `409 TICKET_CLOSED` · ช่างไม่มี → `400 TECHNICIAN_NOT_FOUND` · ช่างไม่ active → `422 TECHNICIAN_INACTIVE`
* สำเร็จ → `200` + Detail DTO

### 2.6 `PATCH /tickets/:id/status` (10)
Body: `{ "status": "IN_PROGRESS" }`

| จาก | ไปได้ | หมายเหตุ |
|---|---|---|
| `OPEN` | `IN_PROGRESS`, `CANCELLED` | ไป `IN_PROGRESS` ต้องมีช่างแล้ว ไม่งั้น `422 TECHNICIAN_REQUIRED` |
| `IN_PROGRESS` | `RESOLVED`, `OPEN` | ไป `RESOLVED` → ตั้ง `resolved_on` = วันนี้ |
| `RESOLVED` | `CLOSED`, `IN_PROGRESS` | กลับไป `IN_PROGRESS` (reopen) → ล้าง `resolved_on` เป็น `NULL` |
| `CLOSED`, `CANCELLED` | — | สถานะสุดท้าย |

* ค่าไม่อยู่ใน 5 สถานะ → `400` · ผิดกฎ → `409 INVALID_STATUS_TRANSITION` · ไม่พบ → `404` · สำเร็จ → `200` + Detail DTO

### 2.7 `DELETE /tickets/:id` (5)
ลบได้เฉพาะ `CANCELLED` หรือ `CLOSED` → `204` · อื่นๆ → `409 TICKET_NOT_DELETABLE` · ไม่พบ → `404`

### 2.8 Route ที่ไม่มี (5)
ทุก path/method ที่ไม่ได้กำหนด → `404 NOT_FOUND` แบบ JSON

---

## 🧪 ทดสอบ
`node src/app.js` แล้วอีก terminal `node ../tests/test-runner.mjs`
