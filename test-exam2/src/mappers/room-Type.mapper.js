// src/mappers/product-mapper.js
export default class ProductMapper {
  // แปลงเป็น Less Data DTO (Summary)
  static toSummaryDTO(entity) {
    return {
      id: entity.id,
      name: entity.name,
      bedType: entity.bed_type,
      maxGuests: entity.max_guests,
      basePrice: Number(entity.base_price),
    };
  }

  // แปลงเป็น Full Data DTO
  static toDetailDTO(entity) {
    return {
      id: entity.id,
      name: entity.name,
      bed_type: entity.bed_type,
      maxGuests: entity.max_guests,
      basePrice: Number(entity.base_price),
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
