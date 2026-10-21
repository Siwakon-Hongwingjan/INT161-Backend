// TODO: express.Router() for /api/books
// - GET    /       -> bookController.list
// - GET    /:id    -> bookController.get
// - POST   /       -> bookController.create   { title, author, copies }
// - PUT    /:id    -> bookController.update
// - DELETE /:id    -> bookController.remove

const express = require("express");
const bookController = require("../controllers/book.controller");

const router = express.Router();

router.get("/", bookController.list);
router.get("/:id", bookController.get);
router.post("/", bookController.create);
router.put("/:id", bookController.update);
router.delete("/:id", bookController.remove);

module.exports = router;
