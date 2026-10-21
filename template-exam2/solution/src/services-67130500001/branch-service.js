// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/branch-repository.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

const toDTO = row => ({id: row.id, name: row.name, city: row.city, carCount: row.car_count})

async function findOrFail(id) {
    const branch = await repo.findOne(id)
    if (!branch) throw new AppError(`Branch with id '${id}' was not found`, httpStatus.NOT_FOUND)
    return branch
}

export async function getAllObjects() {
    return (await repo.findAll()).map(toDTO)
}

export async function getObject(id) {
    return toDTO(await findOrFail(id))
}

export async function removeObject(id) {
    await findOrFail(id)
    await repo.remove(id)
}
