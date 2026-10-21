// ปัด 2 ตำแหน่งแล้วยังเป็น number (toFixed จะได้ string)
const round2 = (n) => Math.round(n * 100) / 100;

export function toSummaryDTO(entity) {
  const total = Number(entity.total_amount);
  return {
    id: entity.id,
    orderNo: entity.order_no,
    customerName: entity.customer_name,
    status: entity.status,
    totalAmount: total,
    vat: round2(total * 0.07),
    grandTotal: round2(total * 1.07),
    placedAt: entity.placed_at, // เป็น "YYYY-MM-DD" อยู่แล้วเพราะ dateStrings ใน db-config
  };
}

export function toDetailDTO(entity) {
  return {
    ...toSummaryDTO(entity),
    customer: {
      id: entity.customer_id,
      email: entity.customer_email,
      fullName: entity.customer_name,
      tier: entity.customer_tier,
    },
  };
}

export function toSummaryList(entities) {
  const list = entities.map(toSummaryDTO);
  if (entities.totalItems !== undefined) list.totalItems = entities.totalItems;
  return list;
}
