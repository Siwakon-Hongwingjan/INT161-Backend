// TODO: express app entrypoint
// - require("dotenv").config()
// - create express app, app.use(express.json())
// - mount routers: app.use("/api/books", booksRouter) etc. for members, loans
// - app.use(errorHandler) — mounted LAST, after all routers
// - app.listen(process.env.PORT || 3000)

require("dotenv").config();
const express = require("express");

const booksRouter = require("./routes/books");
const errorHandler = require("./middleware/error-handler");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/books", booksRouter);

app.use((req, res) => res.status(404).json({ error: "route not found" }));
app.use(errorHandler);

app.listen(3000, () => {
  console.log(process.env.PORT || 3000);
});
