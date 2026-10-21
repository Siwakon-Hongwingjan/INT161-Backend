// TODO: express error-handling middleware — (err, req, res, next)
// - status = err.status || 500
// - res.status(status).json({ error: err.message || "internal server error" })
// - mounted last in app.js, after all routers

const prismaErrors = {
  P2002: [409, "unique constraint violated"], // เช่น email ซ้ำ
  P2003: [409, "record is still referenced"], // เช่น ลบหนังสือที่ยังมี loan อยู่
  P2025: [404, "record not found"], // update/delete ตัวที่ไม่มี
};

function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invaild JSON body" });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  if (prismaErrors[err.code]) {
    const [status, message] = prismaErrors[err.code];
    return res.status(status).json({ error: message });
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}

module.exports = errorHandler;
