// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/product-repository.js"
import mapper from "../mappers-67130500001/product-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

// repo คืน null → โยน AppError 404 ให้ error handler ตอบ
async function findOrFail(code) {
    const product = await repo.findOne(code)
    if (!product) {
        throw new AppError(`Product '${code}' was not found`, httpStatus.NOT_FOUND)
    }
    return product
}

export async function getObject(code) {
    return mapper.toDetailDTO(await findOrFail(code))
}

export async function getAllObjects(pagination) {
    return mapper.maps(await repo.findAll(pagination))
}

export async function updateObject(code, data) {
    await findOrFail(code)
    return mapper.toDetailDTO(await repo.update(code, data))
}

export async function removeObject(code) {
    await findOrFail(code)
    await repo.remove(code)
}

export async function createObject(data) {
    if (await repo.findOne(data.productCode)) {
        throw new AppError(`Product '${data.productCode}' already exists`, httpStatus.CONFLICT)
    }
    return mapper.toDetailDTO(await repo.create(data))
}
