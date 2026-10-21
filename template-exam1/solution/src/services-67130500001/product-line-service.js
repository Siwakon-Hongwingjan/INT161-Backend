// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/product-line-repository.js"
import * as productRepo from "../repositories-67130500001/product-repository.js"
import mapper from "../mappers-67130500001/product-mapper.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

export async function getAllObjects() {
    const lines = await repo.findAll()
    return lines.map(line => ({productLine: line.productLine, description: line.textDescription}))
}

// เช็คว่ากลุ่มมีอยู่จริงก่อน ไม่งั้นกลุ่มที่ไม่มีจะได้ [] แทน 404
export async function getProducts(productLine) {
    if (!await repo.findOne(productLine)) {
        throw new AppError(`Product line '${productLine}' was not found`, httpStatus.NOT_FOUND)
    }
    return mapper.maps(await productRepo.findByLine(productLine))
}
