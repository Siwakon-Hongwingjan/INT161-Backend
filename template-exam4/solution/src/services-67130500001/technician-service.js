// 67130500001 - Practice Student
import * as repo from "../repositories-67130500001/technician-repository.js"

const toDTO = row => ({
    id: row.id,
    name: row.name,
    level: row.level,
    isActive: Boolean(row.is_active),
    activeTickets: row.active_tickets,
})

export async function getAllObjects() {
    return (await repo.findAll()).map(toDTO)
}
