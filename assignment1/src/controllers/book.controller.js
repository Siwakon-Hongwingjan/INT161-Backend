// TODO: HTTP layer for Book — read req, call bookService, send res, next(err) on failure
// - list(req, res, next)
// - get(req, res, next)      -> Number(req.params.id)
// - create(req, res, next)   -> req.body, res.status(201)
// - update(req, res, next)   -> Number(req.params.id), req.body
// - remove(req, res, next)   -> Number(req.params.id), res.status(204).end()

const bookService = require("../services/book.service");

async function list(req, res, next) {
  try {
    res.json(await bookService.list(req.query.author));
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    res.json(await bookService.get(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await bookService.create(req.body));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await bookService.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}
async function remove(req, res, next) {
  try {
    await bookService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
