export function toSummaryDTO(entity) {
  return {
    id: entity.id,
    roomNumber: entity.room_number,
    floor: entity.floor,
    typeName: entity.type_name, // มาจาก JOIN room_types
    pricePerNight: Number(entity.price_per_night),
    status: entity.status,
  };
}

export function toDetailDTO(entity) {
  const price = Number(entity.price_per_night);
  return {
    ...toSummaryDTO(entity),
    roomType: {
      id: entity.room_type_id,
      name: entity.type_name,
      bedType: entity.bed_type,
      maxGuests: entity.max_guests,
    },
    hasView: Boolean(entity.has_view),
    // ปัด 2 ตำแหน่งด้วย Math.round(x*100)/100 (toFixed จะได้ string) เช่น 1300*1.07 = 1391.0000000000002 → 1391
    priceWithVat: Math.round(price * 1.07 * 100) / 100,
  };
}

// คง totalItems ไว้ให้ api-response ใช้คำนวณ pagination (เช็ค !== undefined เพราะ total อาจเป็น 0)
export function toSummaryList(entities) {
  const list = entities.map(toSummaryDTO);
  if (entities.totalItems !== undefined) list.totalItems = entities.totalItems;
  return list;
}
