import * as repo from "../repositories/menuItem.repo.js";
import mapper from "../mappers/menuItem.mapper.js";

export async function getObject(id) {
  return mapper.map(await repo.findOne(id));
}

export async function getAllObjects(pagination, viewType) {
  const objects = await repo.findAll(pagination);
  const objectDto = mapper.maps(objects, viewType);
  return objectDto;
}

export async function updateObject(id, data) {
  return mapper.map(await repo.update(id, data));
}

export async function removeObject(id) {
  return await repo.remove(id);
}

export async function createObject(data) {
  return mapper.map(await repo.create(data));
}
