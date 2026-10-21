// src/mappers/product-mapper.js
export default class ProductMapper {
  // แปลงเป็น Less Data DTO (Summary)
  static toSummaryDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      categoryId: entity.category_id,
      price: Number(entity.price), // DECIMAL จาก mysql2 เป็น string ต้องแปลงเป็น number
      isAvailable: Boolean(entity.is_available), // BOOLEAN ใน MySQL คือ 0/1
    };
  }

  // แปลงเป็น Full Data DTO
  static toDetailDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      categoryId: entity.category_id,
      categoryName: entity.category_name, // มาจาก JOIN categories ใน repo
      price: Number(entity.price),
      calories: entity.calories,
      size: entity.size,
      isAvailable: Boolean(entity.is_available),
      createdAt: entity.created_at,
    };
  }
  static map(entity, viewType) {
    if (viewType == "summary") {
      return this.toSummaryDTO(entity);
    } else {
      return this.toDetailDTO(entity);
    }
  }
  static maps(entities, viewType) {
    const { totalItems } = entities;
    let entitiesMap = {};
    if (viewType == "full") {
      entitiesMap = entities.map((item) => this.toDetailDTO(item));
    } else {
      entitiesMap = entities.map((item) => this.toSummaryDTO(item));
    }
    // เช็ค !== undefined แทน truthy เพราะถ้า filter แล้วได้ 0 รายการ total ต้องเป็น 0 ไม่ใช่หายไป
    if (totalItems !== undefined) {
      entitiesMap.totalItems = totalItems;
    }
    return entitiesMap;
  }
}
