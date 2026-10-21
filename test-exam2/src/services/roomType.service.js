import * as repo from "../repositories/roomType.repo.js";
import { toRoomTypeDTO } from "../mappers/roomType.mapper.js";

export async function getObject(id) {
  return toRoomTypeDTO(await repo.findOne(id));
}

export async function getAllObjects() {
  return (await repo.findAll()).map(toRoomTypeDTO);
}
