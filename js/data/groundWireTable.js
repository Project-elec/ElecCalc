/**
 * ตารางที่ 6.2 — ขนาดต่ำสุดของสายดินของบริภัณฑ์ไฟฟ้า (Equipment Grounding Conductor)
 * อ้างอิงตามพิกัดหรือขนาดปรับตั้งของเครื่องป้องกันกระแสเกินที่อยู่ด้านหน้าบริภัณฑ์ไฟฟ้านั้น
 * note: true หมายถึงขนาดที่มีเครื่องหมาย * กำกับในตารางต้นฉบับ (มีเงื่อนไขเพิ่มเติมตามมาตรฐาน)
 */
const GROUND_WIRE_TABLE = [
  { maxBreaker: 20, size: 2.5, note: true },
  { maxBreaker: 40, size: 4, note: true },
  { maxBreaker: 70, size: 6, note: false },
  { maxBreaker: 100, size: 10, note: false },
  { maxBreaker: 200, size: 16, note: false },
  { maxBreaker: 400, size: 25, note: false },
  { maxBreaker: 500, size: 35, note: false },
  { maxBreaker: 800, size: 50, note: false },
  { maxBreaker: 1000, size: 70, note: false },
  { maxBreaker: 1250, size: 95, note: false },
  { maxBreaker: 2000, size: 120, note: false },
  { maxBreaker: 2500, size: 185, note: false },
  { maxBreaker: 4000, size: 240, note: false },
  { maxBreaker: 6000, size: 400, note: false },
];
