// src/mappers/product-mapper.js
export default class ProductMapper {
  // แปลงเป็น Less Data DTO (Summary)
  static toSummaryDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      brandId: entity.brand_id,
      category: entity.category,
      price: entity.price,
      status: entity.status,
    };
  }

  // แปลงเป็น Full Data DTO
  static toDetailDTO(entity) {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      brandId: entity.brand_id,
      brandName: entity.brand_name,
      price: Number(entity.price),
      ramGb: entity.ram_gb,
      storageGb: entity.storage_gb,
      color: entity.color,
      stockQuantity: entity.stock_quantity,
      status: entity.status,
      releaseDate: entity.release_date,
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
