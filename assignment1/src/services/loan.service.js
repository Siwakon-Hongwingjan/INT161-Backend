// TODO: business logic for Loan — controllers call this, never the repository directly
// - list()          -> loanRepository.findAll()
// - get(id)         -> fetch, throw new HttpError(404, "loan not found") if missing
// - borrow({ bookId, memberId }):
//     1. bookRepository.findById(bookId) — 404 if missing
//     2. throw new HttpError(400, "no copies available") if book.copies <= 0
//     3. bookRepository.update(bookId, { copies: book.copies - 1 })
//     4. return loanRepository.create({ bookId, memberId })
// - returnLoan(id):
//     1. loanRepository.findById(id) — 404 if missing
//     2. throw new HttpError(400, "loan already returned") if loan.returnedAt is set
//     3. bump the related book's copies back up by 1 (bookRepository.update)
//     4. return loanRepository.markReturned(id)
