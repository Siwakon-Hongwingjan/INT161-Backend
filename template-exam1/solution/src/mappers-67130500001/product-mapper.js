// 67130500001 - Practice Student
export default class ProductMapper {
    // แปลงเป็น Less Data DTO (Summary)
    static toSummaryDTO(entity) {
        return {
            id: entity.productCode,
            name: entity.productName,
            scale: entity.productScale,
            retailPrice: Number(entity.MSRP), // DECIMAL จาก mysql2 เป็น string ต้องแปลงเป็น number
        }
    }

    // แปลงเป็น Full Data DTO: เอาทุกคอลัมน์ แต่เปลี่ยนชื่อ buyPrice → price, MSRP → retailPrice
    static toDetailDTO(entity) {
        const {MSRP, buyPrice, ...data} = entity
        data.price = Number(buyPrice)
        data.retailPrice = Number(MSRP)
        return data
    }

    static maps(entities) {
        const list = entities.map(item => this.toSummaryDTO(item))
        // โครงเดิมเช็ค if(totalItems) ซึ่งถ้า total = 0 จะไม่ใส่ → ใช้ !== undefined แทน
        if (entities.totalItems !== undefined) {
            list.totalItems = entities.totalItems
        }
        return list
    }
}
