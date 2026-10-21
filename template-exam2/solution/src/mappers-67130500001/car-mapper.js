// 67130500001 - Practice Student
export default class CarMapper {
    // แปลงเป็น Less Data DTO (Summary)
    static toSummaryDTO(entity) {
        return {
            id: entity.id,
            plateNo: entity.plate_no,
            name: `${entity.brand} ${entity.model}`,
            branchName: entity.branch_name, // มาจาก JOIN branches
            dailyRate: Number(entity.daily_rate),
            isAvailable: Boolean(entity.is_available), // BOOLEAN ใน MySQL คือ 0/1
        }
    }

    // แปลงเป็น Full Data DTO
    static toDetailDTO(entity) {
        const dailyRate = Number(entity.daily_rate)
        return {
            ...this.toSummaryDTO(entity),
            brand: entity.brand,
            model: entity.model,
            seats: entity.seats,
            transmission: entity.transmission,
            branch: {id: entity.branch_id, name: entity.branch_name, city: entity.branch_city},
            // ปัด 2 ตำแหน่งแบบยังเป็น number (toFixed ได้ string)
            weeklyRate: Math.round(dailyRate * 7 * 0.9 * 100) / 100,
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
