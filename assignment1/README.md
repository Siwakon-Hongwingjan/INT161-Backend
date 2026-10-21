# Library Assignment — Express + Prisma (layered, PostgreSQL)

ระบบยืมหนังสือ (book lending system). Layout แบบ layered จริง: **routes → controllers → services → repositories → db**

- **routes** = map HTTP method/path ไป controller
- **controllers** = อ่าน req/res, เรียก service, ส่ง response
- **services** = business logic ทั้งหมด (เช่น เช็ค copies > 0 ก่อนให้ยืม)
- **repositories** = raw Prisma calls เท่านั้น ไม่มี logic
- **db** = PrismaClient singleton

ทุกไฟล์ใน `src/` ว่างเปล่า มีแค่ TODO comment บอกว่าต้อง export อะไร เรียกอะไร — implement เองทั้งหมด
มีแค่ `prisma/schema.prisma` ที่พร้อมแล้ว (models: Book, Member, Loan)

> Prisma generator ที่ใช้คือ `prisma-client` (ตัวใหม่ ไม่ใช่ `prisma-client-js` ตัวเก่าที่ deprecated แล้ว) —
> generate ออกมาเป็นไฟล์ `.ts` ที่ `src/generated/prisma/` (gitignored, ต้อง `prisma generate` เองหลัง clone)
> เพราะงั้นรันแอปด้วย `tsx` แทน `node` ตรงๆ (ดู `package.json` scripts) ถึงจะ `require()` ไฟล์ `.ts` นั้นได้

## Layout

```
Assignment/
├── prisma/
│   └── schema.prisma           # models: Book, Member, Loan (พร้อมแล้ว, datasource = postgresql)
├── src/
│   ├── app.js                   # TODO: express entrypoint
│   ├── generated/prisma/        # output ของ `prisma generate` (.ts, gitignored, ห้ามแก้เอง)
│   ├── db/
│   │   └── prisma.js            # TODO: PrismaClient singleton
│   ├── utils/
│   │   └── http-error.js        # TODO: HttpError(status, message)
│   ├── middleware/
│   │   └── error-handler.js     # TODO: centralized error → JSON response
│   ├── routes/
│   │   ├── books.js             # TODO: map → book.controller
│   │   ├── members.js           # TODO: map → member.controller
│   │   └── loans.js             # TODO: map → loan.controller
│   ├── controllers/
│   │   ├── book.controller.js   # TODO: req/res, เรียก book.service
│   │   ├── member.controller.js # TODO: req/res, เรียก member.service
│   │   └── loan.controller.js   # TODO: req/res, เรียก loan.service
│   ├── services/
│   │   ├── book.service.js      # TODO: business logic
│   │   ├── member.service.js    # TODO: business logic (unique email)
│   │   └── loan.service.js      # TODO: business logic (copies check, double-return check)
│   └── repositories/
│       ├── book.repository.js   # TODO: prisma.book.* calls
│       ├── member.repository.js # TODO: prisma.member.* calls
│       └── loan.repository.js   # TODO: prisma.loan.* calls
├── .env.example
├── package.json
└── README.md
```

## สิ่งที่ต้องทำเอง

1. มี PostgreSQL รันอยู่ (local, docker, หรือ cloud ก็ได้) แล้ว `cp .env.example .env` ใส่ `DATABASE_URL` ให้ตรง
2. `npm install` (ดึง `tsx` มาด้วย — ใช้รัน `.ts` ที่ Prisma generate ออกมา)
3. `npx prisma migrate dev --name init` (สร้าง table จริงจาก schema + generate client ไปที่ `src/generated/prisma/` อัตโนมัติ)
4. Implement ทุกไฟล์ใน `src/` ตาม TODO comment — เริ่มจาก `db/prisma.js` → `repositories/*` → `services/*` → `controllers/*` → `routes/*` → `app.js` (ไล่จากในสุดออกมานอกสุด)

## Routes (12 ทั้งหมด)

### Books (`/api/books`)
| Method | Path | ทำอะไร |
|---|---|---|
| GET | `/` | list หนังสือทั้งหมด |
| GET | `/:id` | ดูหนังสือเล่มเดียว |
| POST | `/` | เพิ่มหนังสือ `{ title, author, copies }` |
| PUT | `/:id` | แก้ไขหนังสือ |
| DELETE | `/:id` | ลบหนังสือ |

### Members (`/api/members`)
| Method | Path | ทำอะไร |
|---|---|---|
| GET | `/` | list สมาชิกทั้งหมด |
| GET | `/:id` | ดูสมาชิกคนเดียว |
| POST | `/` | สมัครสมาชิก `{ name, email }` |

### Loans (`/api/loans`)
| Method | Path | ทำอะไร |
|---|---|---|
| GET | `/` | list การยืมทั้งหมด |
| GET | `/:id` | ดูรายการยืมเดียว |
| POST | `/` | ยืมหนังสือ `{ bookId, memberId }` — เช็ค `book.copies > 0` ก่อน |
| PATCH | `/:id/return` | คืนหนังสือ — set `returnedAt` |

## จุดที่ต้องคิดเอง (ยากขึ้นทีละนิด)

- `loan.service.js` → `borrow()`: ถ้า `copies` เหลือ 0 ต้อง `throw new HttpError(400, ...)` ไม่ให้ยืม, แล้วลด `copies` ของ book ลง 1
- `loan.service.js` → `returnLoan()`: ถ้ายืมไปแล้วคืนซ้ำ (`returnedAt` ไม่ใช่ null) ต้อง reject, แล้วเพิ่ม `copies` ของ book กลับ 1
- `member.service.js` → `register()`: เช็ค email ซ้ำก่อนสมัคร (409 ถ้าซ้ำ)
- error ทุกจุดที่ throw `HttpError` ควรไหลไป `middleware/error-handler.js` แปลงเป็น JSON `{ error: message }` พร้อม status code ที่ถูกต้อง
