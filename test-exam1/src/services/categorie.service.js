import * as repo from "../repositories/categorie.repo.js";

export async function getObject(id) {
  const object = await repo.findOne(id);
  return object;
}

export async function getAllObjects(pagination) {
  const objects = await repo.findAll(pagination);
  return objects;
}

export async function updateObject(id, data) {
  return await repo.update(id, data);
}

export async function removeObject(id) {
  return await repo.remove(id);
}

export async function createObject(data) {
  return await repo.create(data);
}
