// room type มี DTO แบบเดียว ใช้ทั้ง list และ by id
export function toRoomTypeDTO(entity) {
  return {
    id: entity.id,
    name: entity.name,
    bedType: entity.bed_type,
    maxGuests: entity.max_guests,
    basePrice: Number(entity.base_price), // DECIMAL → string ต้องแปลงเป็น number
  };
}
