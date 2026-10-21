// registeredCount มาจาก subquery COUNT ใน repo, seatsLeft/isFull คำนวณตรงนี้
function seats(entity) {
  const registeredCount = entity.registered_count;
  const seatsLeft = entity.max_attendees - registeredCount;
  return { registeredCount, seatsLeft, isFull: seatsLeft <= 0 };
}

export function toSummaryDTO(entity) {
  return {
    id: entity.id,
    title: entity.title,
    venueName: entity.venue_name,
    city: entity.city,
    category: entity.category,
    startDate: entity.start_date, // "YYYY-MM-DD" เพราะ dateStrings ใน db-config
    ticketPrice: Number(entity.ticket_price),
    status: entity.status,
    ...seats(entity),
  };
}

// Detail ไม่มี venueName/city แต่มี venue เป็น object แทน จึงไม่ spread จาก Summary
export function toDetailDTO(entity) {
  return {
    id: entity.id,
    title: entity.title,
    venue: { id: entity.venue_id, name: entity.venue_name, city: entity.city, capacity: entity.capacity },
    category: entity.category,
    startDate: entity.start_date,
    ticketPrice: Number(entity.ticket_price),
    maxAttendees: entity.max_attendees,
    status: entity.status,
    ...seats(entity),
  };
}

export function toSummaryList(entities) {
  const list = entities.map(toSummaryDTO);
  if (entities.totalItems !== undefined) list.totalItems = entities.totalItems;
  return list;
}

export function toRegistrationDTO(entity) {
  return {
    id: entity.id,
    eventId: entity.event_id,
    attendeeName: entity.attendee_name,
    attendeeEmail: entity.attendee_email,
  };
}

export function toRegistrationList(entities) {
  const list = entities.map(toRegistrationDTO);
  list.totalItems = entities.totalItems;
  return list;
}

// SUM/ROUND(AVG) ของ DECIMAL ได้ string จาก mysql2 ต้องแปลงเป็น number
export function toCityStatDTO(entity) {
  return {
    city: entity.city,
    eventCount: entity.event_count,
    totalRegistrations: Number(entity.total_registrations),
    avgTicketPrice: Number(entity.avg_ticket_price),
  };
}
