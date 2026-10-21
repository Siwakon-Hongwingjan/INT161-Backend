// TODO: data access layer for Book — raw prisma calls only, no business rules
// - findAll()          -> prisma.book.findMany()
// - findById(id)        -> prisma.book.findUnique({ where: { id } })
// - create(data)        -> prisma.book.create({ data })
// - update(id, data)    -> prisma.book.update({ where: { id }, data })
// - remove(id)          -> prisma.book.delete({ where: { id } })

const prisma = require("../db/prisma");

async function findAll(db = prisma) {
  return db.book.findMany({
    orderBy: {
      id: "asc",
    },
  });
}

async function findById(id, db = prisma) {
  return db.book.findUnique({ where: { id } });
}

async function findByAuthor(name, db = prisma) {
  return db.book.findMany({
    where: { author: { contains: name, mode: "insensitive" } },
  });
}
async function create(data, db = prisma) {
  return db.book.create({ data });
}

async function update(id, data, db = prisma) {
  return db.book.update({ where: { id }, data });
}

async function remove(id, db = prisma) {
  return db.book.delete({ where: { id } });
}

async function decrementCopies(id, db = prisma) {
  return db.book.updateMany({
    where: { id, copies: { gt: 0 } },
    data: { copies: { decrement: 1 } },
  });
}

async function incrementCopies(id, db = prisma) {
  return db.book.update({
    where: { id },
    data: { copies: { increment: 1 } },
  });
}

module.exports = {
  findAll,
  findById,
  findByAuthor,
  create,
  update,
  remove,
  decrementCopies,
  incrementCopies,
};
