// 67130500001 - Practice Student
function creditTier(limit) {
    if (limit === 0) return "NONE"
    if (limit < 50000) return "LOW"
    if (limit < 100000) return "MEDIUM"
    return "HIGH"
}

export default class CustomerMapper {
    static toSummaryDTO(entity) {
        const creditLimit = Number(entity.creditLimit ?? 0) // คอลัมน์ยอมให้ NULL ได้ → ถือเป็น 0
        return {
            customerNumber: entity.customerNumber,
            customerName: entity.customerName,
            // ข้อมูลจริงบางแถวมีช่องว่างท้ายชื่อ (เช่น "Carine ") → trim ก่อนต่อ
            contactName: `${entity.contactFirstName.trim()} ${entity.contactLastName.trim()}`,
            country: entity.country,
            creditLimit,
            creditTier: creditTier(creditLimit),
        }
    }

    static toDetailDTO(entity) {
        return {
            ...this.toSummaryDTO(entity),
            phone: entity.phone,
            city: entity.city,
            // LEFT JOIN employees: ไม่มี sales rep → คอลัมน์ฝั่ง employees เป็น NULL ทั้งหมด → ส่ง null ทั้ง object
            salesRep: entity.salesRepEmployeeNumber === null ? null : {
                employeeNumber: entity.salesRepEmployeeNumber,
                fullName: `${entity.repFirstName} ${entity.repLastName}`,
                email: entity.repEmail,
            },
            orderCount: entity.orderCount,
            totalPayments: Number(entity.totalPayments), // SUM(DECIMAL) ได้ string
        }
    }

    static maps(entities) {
        const list = entities.map(item => this.toSummaryDTO(item))
        if (entities.totalItems !== undefined) {
            list.totalItems = entities.totalItems
        }
        return list
    }
}
