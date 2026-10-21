# เฉลยโจทย์จำลอง 4 — Helpdesk Tickets (Medium-Hard)

ทดสอบ: `node src/app.js` แล้ว `node ../tests/test-runner.mjs` → **100/100**

## โจทย์ข้อนี้วัดอะไร
1. **State machine** + กฎธุรกิจที่ต้องตอบ error code เฉพาะ (409 / 422)
2. แก้ pagination middleware ของโครงให้ใส่ default และตอบ 400 แทนการปัดค่า
3. วันที่: ตอบเป็น `YYYY-MM-DD`, ตรวจวันที่ที่มีจริง, บวกวัน (`dueOn`)
4. เรียง enum ตามความหมาย (priority) ไม่ใช่ตามตัวอักษร
5. Error handler: เพิ่ม **404 สำหรับ route ที่ไม่มี**

## Error handler — เพิ่มจากข้อ 3
```js
app.use(router...)        // 1. router ทั้งหมด
app.use(notFoundHandler)  // 2. ไม่มี route ไหนรับ → next(new AppError(..., 404))
app.use(errorHandler)     // 3. แปลงทุก error เป็น JSON
```
ถ้าไม่มี `notFoundHandler` Express จะตอบหน้า HTML `Cannot GET /hello` เอง ส่วน error code ธุรกิจส่งเป็นพารามิเตอร์ที่ 3 ของ `AppError` เช่น `new AppError(msg, 422, "TECHNICIAN_INACTIVE")`

## จุดสำคัญ / กับดัก
| เรื่อง | ทำอย่างไร | ทำไม |
|---|---|---|
| เรียง `priority` | `FIELD(t.priority, 'LOW','MEDIUM','HIGH','URGENT')` ใน sort whitelist | ตามตัวอักษรจะได้ HIGH < LOW < MEDIUM < URGENT ซึ่งผิด |
| `activeTickets` | ใส่ `t.status IN (...)` ไว้ใน **ON** ของ LEFT JOIN | ถ้าไว้ใน WHERE ช่างที่ไม่มีงาน (Fon) จะหายไปจากผลลัพธ์ |
| วันที่ | `dateStrings: true` ใน db-config | ไม่งั้น DATE เป็น JS Date แล้ว `toISOString()` เลื่อนวันตาม timezone |
| `dueOn` | `new Date("...T00:00:00Z")` + `setUTCDate` | ทำงานใน UTC ล้วน ข้ามเดือนถูก (22 ก.พ. + 14 = 8 มี.ค.) |
| วันที่ไม่มีจริง | แปลงเป็น Date แล้วแปลงกลับ ต้องได้ string เดิม | `new Date("2026-02-30")` ไม่ error แต่เลื่อนเป็น 2 มี.ค. |
| `resolved_on` | `CASE ? WHEN 'RESOLVED' THEN CURDATE() WHEN 'IN_PROGRESS' THEN NULL ...` | ตั้ง/ล้างวันปิดงานใน UPDATE เดียว ใช้วันที่ของ DB |
| เปลี่ยนสถานะพร้อมกัน | `UPDATE ... WHERE id = ? AND status = <สถานะเดิม>` แล้วเช็ค `affectedRows` | ถ้ามีคนเปลี่ยนตัดหน้า อันหลังจะไม่ทับ |
| ลำดับการตรวจ | ทำตามที่โจทย์เขียนเป๊ะ (404 → 400 → 409 → 400 → 422) | ข้อมูลผิดหลายอย่างพร้อมกัน ต้องตอบ error ตัวแรกตามลำดับ |
| query validation | `limit=51` → 400 ไม่ใช่ตัดเหลือ 50 · `status=open` → 400 (ตัวพิมพ์ต้องตรง) | โจทย์บอกชัดว่าห้ามปัดค่าให้ |
| offset | `(page - 1) * limit` จากค่าที่ตรวจแล้ว | โครงเดิมใช้ `pageSize` ดิบ ถ้า limit ถูกตัดเหลือ 100 offset จะผิด |

## ทำไมเปลี่ยนสถานะ/มอบงานเป็น PATCH แยก
การเปลี่ยน `status` หรือ `technician_id` ต้องผ่านกฎทุกครั้ง ถ้ามี PUT ที่แก้ทั้งก้อนได้ คนก็ข้ามกฎได้ จึงแยกเป็น `/assign` กับ `/status` ที่แต่ละอันตรวจกฎของตัวเอง
