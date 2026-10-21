// TODO: export one shared PrismaClient instance
// - require the generated client from "../generated/prisma/client"
//   (see prisma/schema.prisma -> generator client { output = "../src/generated/prisma" })
// - new PrismaClient()
// - module.exports it

const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
