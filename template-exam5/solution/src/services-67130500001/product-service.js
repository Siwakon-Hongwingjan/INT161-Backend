// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/product-repository.js"
import {AppError} from "../middlewares-67130500001/error-handler.js"
import httpStatus from "http-status"

export async function getObject(productCode) {
    const product = await repo.findOne(productCode)
    if (!product) throw new AppError(`Product '${productCode}' was not found`, httpStatus.NOT_FOUND)
    return {
        productCode: product.productCode,
        productName: product.productName,
        quantityInStock: product.quantityInStock,
        retailPrice: Number(product.MSRP),
    }
}
