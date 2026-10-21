import * as repo from "../repositories/categorie.repo.js";

export async function getObject(id) {
  return await repo.findOne(id);
}

export async function getAllObjects(pagination) {
  return await repo.findAll(pagination);
}
