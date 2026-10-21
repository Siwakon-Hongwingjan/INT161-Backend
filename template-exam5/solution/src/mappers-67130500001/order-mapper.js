// 67130500001 - Practice Student
const round2 = n => Math.round(n * 100) / 100

export default class OrderMapper {
    static toSummaryDTO(entity) {
        return {
            orderNumber: entity.orderNumber,
            orderDate: entity.orderDate, // dateStrings → "YYYY-MM-DD"
            status: entity.status,
            customerName: entity.customerName,
            itemCount: entity.itemCount,
            total: Number(entity.total), // SUM(DECIMAL) ได้ string
        }
    }

    // lines มาจาก query แยก (one-to-many) แล้วส่งเข้ามาพร้อม entity
    static toDetailDTO(entity, lines) {
        return {
            ...this.toSummaryDTO(entity),
            requiredDate: entity.requiredDate,
            shippedDate: entity.shippedDate,
            comments: entity.comments,
            customer: {
                customerNumber: entity.customerNumber,
                customerName: entity.customerName,
                country: entity.country,
            },
            lines: lines.map(line => ({
                lineNumber: line.orderLineNumber,
                productCode: line.productCode,
                productName: line.productName,
                quantity: line.quantityOrdered,
                priceEach: Number(line.priceEach),
                lineTotal: round2(line.quantityOrdered * Number(line.priceEach)),
            })),
        }
    }

    static maps(entities) {
        const list = entities.map(item => this.toSummaryDTO(item))
        list.totalItems = entities.totalItems
        return list
    }
}
