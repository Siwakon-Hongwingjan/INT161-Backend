import db from "../configs/db-config.js";
import { AppError } from "../middlewares/error-handler.js";
import httpStatus from "http-status";

const LOCK_EVENT_SQL = `SELECT status, max_attendees FROM events WHERE id = ? AND deleted_at IS NULL FOR UPDATE`;
const COUNT_SQL = `SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?`;
const FIND_EMAIL_SQL = `SELECT id FROM registrations WHERE event_id = ? AND attendee_email = ?`;
const CREATE_SQL = `INSERT INTO registrations SET ?`;
const FIND_BY_EVENT_SQL = `SELECT id, event_id, attendee_name, attendee_email FROM registrations
  WHERE event_id = ? ORDER BY id LIMIT ? OFFSET ?`;

function conflict(message, code) {
  return new AppError(message, httpStatus.CONFLICT, code);
}

// ตรวจสถานะ/ซ้ำ/เต็ม แล้ว INSERT ใน transaction เดียว
// SELECT ... FOR UPDATE ล็อกแถว event ไว้ request อื่นที่จะจอง event เดียวกันต้องรอจน commit
// → นับที่นั่งแล้ว INSERT ได้โดยไม่มีใครแทรก กันจองเกินจำนวนเมื่อมีหลาย request พร้อมกัน
export async function register(eventId, attendeeName, attendeeEmail) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[event]] = await conn.query(LOCK_EVENT_SQL, [eventId]);
    if (!event) throw new AppError(`Event with id '${eventId}' was not found`, httpStatus.NOT_FOUND);
    if (event.status !== "PUBLISHED") throw conflict("Event is not open for registration", "EVENT_NOT_OPEN");
    const [dup] = await conn.query(FIND_EMAIL_SQL, [eventId, attendeeEmail]);
    if (dup.length > 0) throw conflict("This email is already registered for this event", "DUPLICATE_REGISTRATION");
    const [[{ total }]] = await conn.query(COUNT_SQL, [eventId]);
    if (total >= event.max_attendees) throw conflict("Event is full", "EVENT_FULL");
    const [result] = await conn.query(CREATE_SQL, [
      { event_id: eventId, attendee_name: attendeeName, attendee_email: attendeeEmail },
    ]);
    await conn.commit();
    return { id: result.insertId, seatsLeft: event.max_attendees - (total + 1) };
  } catch (err) {
    await conn.rollback(); // error ใดๆ (รวม AppError ด้านบน) ต้อง rollback
    throw err;
  } finally {
    conn.release(); // คืน connection ให้ pool เสมอ ไม่งั้น pool จะหมด
  }
}

export async function findByEvent(eventId, pagination) {
  const [datas] = await db.query(FIND_BY_EVENT_SQL, [eventId, pagination.limit, pagination.offset]);
  const [[{ total }]] = await db.query(COUNT_SQL, [eventId]);
  datas.totalItems = total;
  return datas;
}
