// src/mappers/product-mapper.js
export default class ProductMapper {
  // แปลงเป็น Less Data DTO (Summary)
  static toSummaryDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      categoryId: entity.category_id,
      price: Number(entity.price),
      isAvailable: Boolean(entity.is_available),
    };
  }

  // แปลงเป็น Full Data DTO
  static toDetailDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      categoryId: entity.category_id,
      categoryName: entity.category_name,
      price: Number(entity.price),
      calories: entity.calories,
      size: entity.size,
      isAvailable: Boolean(entity.is_available),
      color: entity.color,
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
    if (totalItems) {
      entitiesMap.totalItems = totalItems;
    }
    return entitiesMap;
  }
}
