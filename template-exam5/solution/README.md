# เฉลยโจทย์จำลอง 5 — Classic Models Orders (Hard)

ทดสอบ: `node src/app.js` แล้ว `node ../tests/test-runner.mjs` → **100/100** (รันซ้ำได้ เทสต์คืนสต็อกและลบ order ที่สร้างเองทุกครั้ง)

## โจทย์ข้อนี้วัดอะไร
1. **Transaction** — สร้าง order + บรรทัดสินค้า + ตัดสต็อก ต้องสำเร็จทั้งหมดหรือไม่บันทึกอะไรเลย
2. ค่าที่ไม่มีในตาราง (ยอดรวม order) ต้องคำนวณ แล้วยัง filter / sort ด้วยค่านั้นได้
3. ข้อมูลแบบแม่-ลูก (orders ↔ orderdetails): detail มี `lines[]`, ลบต้องลบลูกก่อน
4. State machine ที่มีผลข้างเคียง (ยกเลิก → คืนสต็อก, ส่งของ → ตั้งวันส่ง)
5. สถิติด้วย `GROUP BY` + `COUNT(DISTINCT)`
6. Error handler ครบชุด + ไม่เปิดเผยข้อความ error ภายใน (500)

## Transaction (`withTransaction` ใน order-repository)
```
getConnection → beginTransaction → fn(conn) → commit
                                   └ error → rollback → throw ต่อ   (finally: conn.release())
```
- ต้องใช้ **`conn` ตัวเดียวกันทุกคำสั่ง** ใน transaction (ถ้าเผลอใช้ `db.query` คำสั่งนั้นจะไปอีก connection และไม่อยู่ใน transaction)
- `conn.release()` ใน `finally` เสมอ ไม่งั้น connection ใน pool หมดแล้ว server ค้าง
- `throw new AppError(...)` ข้างใน transaction ได้เลย → rollback อัตโนมัติ แล้ว error handler ตอบตามปกติ
- เทสต์ตรวจจริง: สั่ง `[S18_3232 × 1, S24_2000 × 16]` (ตัวที่สองสต็อกไม่พอ) → 409 แล้วสต็อกของ S18_3232 **ต้องไม่ลด**

## กันขายเกินสต็อก / เลข order ชนกัน
| ปัญหา | วิธี |
|---|---|
| 2 คนซื้อชิ้นสุดท้ายพร้อมกัน | `SELECT ... FROM products ... FOR UPDATE` ล็อกแถวสินค้าจน commit คนที่สองต้องรอแล้วเห็นสต็อกใหม่ |
| deadlock เมื่อ 2 order ล็อกสินค้าสลับลำดับกัน | `ORDER BY productCode` ให้ทุก request ล็อกตามลำดับเดียวกัน |
| `orders` ไม่มี AUTO_INCREMENT | `SELECT MAX(orderNumber) + 1 ... FOR UPDATE` ใน transaction เดียวกัน |

## จุดสำคัญอื่น
| เรื่อง | ทำอย่างไร | ทำไม |
|---|---|---|
| ยอดรวม / จำนวนบรรทัด | derived table `(SELECT orderNumber, COUNT(*), SUM(qty*price) FROM orderdetails GROUP BY orderNumber) t` แล้ว JOIN | ใช้ `t.total` ใน WHERE/ORDER BY ได้ตรงๆ ไม่ต้องใช้ `HAVING` และ COUNT query ใช้ FROM เดียวกัน |
| `lines[]` | query แยกอีกครั้ง ส่งเข้า mapper คู่กับ order | one-to-many ถ้า JOIN รวมจะได้ order ซ้ำหลายแถว |
| คืนสต็อกตอนยกเลิก | `UPDATE products p JOIN orderdetails d ... SET p.quantityInStock = p.quantityInStock + d.quantityOrdered` | คืนทุกบรรทัดในคำสั่งเดียว อยู่ใน transaction เดียวกับการเปลี่ยนสถานะ |
| `shippedDate` | `IF(? = 'Shipped', CURDATE(), shippedDate)` | ตั้งเฉพาะตอนไป Shipped |
| ลบ order | `DELETE orderdetails` ก่อน แล้วค่อย `DELETE orders` | FK ของลูกชี้ไปแม่ ลบแม่ก่อนไม่ได้ |
| INSERT หลายบรรทัด | `INSERT ... VALUES ?` + `[[...], [...]]` | mysql2 แปลง array ของ array เป็นหลายแถว |
| `status=In%20Process` | `req.query` decode `%20` ให้แล้ว เทียบกับรายการได้ตรงๆ | ค่า status ของ classicmodels มีช่องว่าง |
| validation ของ items | ชื่อ field `items[0].quantity`, เช็ค productCode ซ้ำด้วย `Set` | ระบุบรรทัดที่ผิดได้แม่นยำ |
| stats | เริ่มจาก `orderdetails` JOIN ขึ้นไป · `COUNT(DISTINCT o.orderNumber)` · `WHERE status <> 'Cancelled'` | 1 order มีหลายบรรทัดในกลุ่มเดียวกัน ถ้า `COUNT(*)` จะนับบรรทัด ไม่ใช่ order |
| ตัวเลขจาก SUM | `Number(...)` ทุกตัว | `SUM(int)` และ `SUM(DECIMAL)` ได้ string จาก mysql2 |

## Error handler — สิ่งที่เพิ่มในข้อนี้
- กรณี 500: `console.error(err)` ฝั่ง server แต่ตอบ client แค่ `"Internal server error"` (ห้ามส่ง `err.message` เพราะอาจมี SQL / ชื่อตาราง)
- `INSUFFICIENT_STOCK` ใช้ `details[]` รูปแบบเดียวกับ validation (`{ field, message }`) client จะได้ใช้โค้ดแสดง error ชุดเดียว
