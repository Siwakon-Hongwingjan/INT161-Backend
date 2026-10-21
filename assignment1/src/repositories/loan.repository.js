// TODO: data access layer for Loan — raw prisma calls only, no business rules
// - findAll()          -> prisma.loan.findMany({ include: { book: true, member: true } })
// - findById(id)       -> prisma.loan.findUnique({ where: { id }, include: { book: true, member: true } })
// - create(data)       -> prisma.loan.create({ data }) — data = { bookId, memberId }
// - markReturned(id)   -> prisma.loan.update({ where: { id }, data: { returnedAt: new Date() } })
