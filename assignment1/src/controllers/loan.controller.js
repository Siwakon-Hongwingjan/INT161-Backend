// TODO: HTTP layer for Loan — read req, call loanService, send res, next(err) on failure
// - list(req, res, next)
// - get(req, res, next)         -> Number(req.params.id)
// - borrow(req, res, next)      -> req.body ({ bookId, memberId }), res.status(201)
// - returnLoan(req, res, next)  -> Number(req.params.id)
