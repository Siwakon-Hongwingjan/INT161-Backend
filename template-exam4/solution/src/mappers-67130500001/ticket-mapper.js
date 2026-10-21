// 67130500001 - Practice Student
export const SLA_DAYS = {URGENT: 1, HIGH: 3, MEDIUM: 7, LOW: 14}

// บวกวันแบบ UTC ล้วน: "2026-02-22" + 14 → "2026-03-08"
// ใช้ T00:00:00Z ให้เป็นเที่ยงคืน UTC เสมอ จะได้ไม่เลื่อนวันตาม timezone ของเครื่อง
function addDays(dateString, days) {
    const date = new Date(`${dateString}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

export default class TicketMapper {
    static toSummaryDTO(entity) {
        return {
            id: entity.id,
            ticketNo: entity.ticket_no,
            title: entity.title,
            priority: entity.priority,
            status: entity.status,
            technicianName: entity.technician_name, // LEFT JOIN → null ถ้ายังไม่มีช่าง
            openedOn: entity.opened_on, // dateStrings ใน db-config → เป็น "YYYY-MM-DD" อยู่แล้ว
            dueOn: addDays(entity.opened_on, SLA_DAYS[entity.priority]),
        }
    }

    static toDetailDTO(entity) {
        return {
            ...this.toSummaryDTO(entity),
            slaDays: SLA_DAYS[entity.priority],
            resolvedOn: entity.resolved_on,
            technician: entity.technician_id === null ? null : {
                id: entity.technician_id,
                name: entity.technician_name,
                level: entity.technician_level,
            },
        }
    }

    static maps(entities) {
        const list = entities.map(item => this.toSummaryDTO(item))
        list.totalItems = entities.totalItems
        return list
    }
}
