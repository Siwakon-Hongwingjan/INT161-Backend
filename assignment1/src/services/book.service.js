// TODO: business logic for Book — controllers call this, never the repository directly
// - list()             -> bookRepository.findAll()
// - get(id)            -> fetch, throw new HttpError(404, "book not found") if missing
// - create(data)       -> validate copies is a positive number, then bookRepository.create(data)
// - update(id, data)   -> fetch first (404 if missing), then bookRepository.update(id, data)
// - remove(id)         -> fetch first (404 if missing), then bookRepository.remove(id)

const bookRepository = require("../repositories/book.repository");
const HttpError = require("../utils/http-error");
const { toId, requireString } = require("../utils/validate");

function parseCopies(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new HttpError(400, "copies must be a non-negative integer");
  }
  return value;
}

async function list(author) {
  return author
    ? bookRepository.findByAuthor(author)
    : bookRepository.findAll();
}

async function get(rawid) {
  const id = toId(rawid);
  const book = await bookRepository.findById(id);
  if (!book) throw new HttpError(404, "book not found");
  return book;
}

async function create(body) {
  const data = {
    title: requireString(body.title, "title"),
    author: requireString(body.author, "author"),
  };
  if (body.copies !== undefined) data.copies = parseCopies(body.copies);
  return bookRepository.create(data);
}

async function update(rawid, body) {
  const book = await get(rawid);
  const data = {};
  if (body.title !== undefined) data.title = requireString(body.title, "title");
  if (body.author !== undefined)
    data.author = requireString(body.author, "author");
  if (body.copies !== undefined) data.copies = parseCopies(body.copies);
  return bookRepository.update(book.id, data);
}

async function remove(rawid) {
  const book = await get(rawid);
  await bookRepository.remove(book.id);
}

module.exports = { list, get, create, update, remove };
