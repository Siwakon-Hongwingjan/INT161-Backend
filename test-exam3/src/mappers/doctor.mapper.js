// < 5 → JUNIOR, 5–14 → SENIOR, >= 15 → EXPERT
function experienceLevel(years) {
  if (years < 5) return "JUNIOR";
  if (years < 15) return "SENIOR";
  return "EXPERT";
}

export function toSummaryDTO(entity) {
  return {
    id: entity.id,
    licenseNo: entity.license_no,
    fullName: `Dr. ${entity.first_name} ${entity.last_name}`,
    departmentName: entity.department_name,
    yearsExperience: entity.years_experience,
    experienceLevel: experienceLevel(entity.years_experience), // คำนวณใน DTO ไม่ได้เก็บใน DB
    consultationFee: Number(entity.consultation_fee),
    isActive: Boolean(entity.is_active),
  };
}

export function toDetailDTO(entity) {
  return {
    ...toSummaryDTO(entity),
    department: { id: entity.department_id, name: entity.department_name },
    bookedAppointments: entity.booked_appointments, // มาจาก subquery COUNT ใน repo
    createdAt: entity.created_at,
  };
}

export function toSummaryList(entities) {
  const list = entities.map(toSummaryDTO);
  if (entities.totalItems !== undefined) list.totalItems = entities.totalItems;
  return list;
}
