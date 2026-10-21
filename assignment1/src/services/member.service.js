// TODO: business logic for Member — controllers call this, never the repository directly
// - list()         -> memberRepository.findAll()
// - get(id)        -> fetch, throw new HttpError(404, "member not found") if missing
// - register(data) -> check memberRepository.findByEmail(data.email) is free,
//                     throw new HttpError(409, "email already registered") if taken,
//                     otherwise memberRepository.create(data)
