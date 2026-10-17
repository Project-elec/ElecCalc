/**
 * เก็บสถานะ "ตารางโหลดแผงย่อย" (Panel Board Load Schedule) ไว้ใน localStorage ทั้งชนิดแผง
 * (1 เฟส/3 เฟส), ขนาดช่อง (จำนวนวงจร) และข้อมูลแต่ละแถว เพื่อให้ปุ่ม "+ เพิ่มลงตารางโหลดแผงย่อย"
 * ในแต่ละหน้าวงจรย่อยส่งผลคำนวณมาเติมลงช่องว่างที่เหลือของตารางได้ แม้กดจากคนละหน้า หรือปิด
 * เบราว์เซอร์แล้วเปิดใหม่
 *
 * โครงสร้างที่เก็บ: { phaseType: '1phase'|'3phase', size: number, rows: Row[] }
 * แถว 1 เฟส: { id, description, loadVa, cbPole, cbAt, cableSize, cableType, conduit }
 * แถว 3 เฟส: { id, description, loadL1, loadL2, loadL3, cbPole, cbAt, cableSize, cableType, conduit }
 *
 * แผง 1 เฟส (CU04/CU06/CU08) มีขนาดช่องให้เลือก 4, 6, 8 วงจร ส่วนแผง 3 เฟส (LP12/LP18/LP24/LP30)
 * มีขนาดช่องให้เลือก 12, 18, 24, 30 วงจร ตามแบบฟอร์ม Panel Board Load Schedule มาตรฐาน
 */
const PANEL_SCHEDULE_STORAGE_KEY = 'eleccalc_panel_schedule_v2';

const PANEL_SCHEDULE_SIZES = {
  '1phase': [4, 6, 8],
  '3phase': [12, 18, 24, 30],
};

function emptyPanelScheduleRow(phaseType) {
  const base = {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    cbPole: phaseType === '3phase' ? '3P' : '1P',
    cbAt: 0,
    cableSize: '',
    cableType: '',
    conduit: '',
  };
  return phaseType === '3phase' ? { ...base, loadL1: 0, loadL2: 0, loadL3: 0 } : { ...base, loadVa: 0 };
}

function defaultPanelSchedule() {
  const phaseType = '1phase';
  const size = PANEL_SCHEDULE_SIZES[phaseType][0];
  return { phaseType, size, rows: Array.from({ length: size }, () => emptyPanelScheduleRow(phaseType)) };
}

function loadPanelSchedule() {
  try {
    const raw = localStorage.getItem(PANEL_SCHEDULE_STORAGE_KEY);
    if (!raw) return defaultPanelSchedule();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || !parsed.phaseType || !parsed.size) return defaultPanelSchedule();
    return parsed;
  } catch (e) {
    return defaultPanelSchedule();
  }
}

function savePanelSchedule(schedule) {
  try {
    localStorage.setItem(PANEL_SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch (e) {
    // localStorage อาจใช้งานไม่ได้ (เช่น เปิดแบบ private mode) ข้ามการบันทึกแบบเงียบๆ ไม่กระทบการใช้งานหลัก
  }
}

// แถวที่ถือว่า "ว่าง" คือยังไม่มีรายละเอียดและยังไม่มีค่าโหลดกรอกไว้เลยไม่ว่าเฟสไหน
function isEmptyPanelScheduleRow(row) {
  return !row.description && !(row.loadVa > 0) && !(row.loadL1 > 0) && !(row.loadL2 > 0) && !(row.loadL3 > 0);
}

/**
 * หาแถวว่างแถวแรกในตารางปัจจุบัน แล้วเติมข้อมูลวงจรที่คำนวณไว้ (จากปุ่ม "+ เพิ่มลงตารางโหลดแผงย่อย"
 * ในหน้าวงจรย่อยต่างๆ) ลงไป ถ้าเป็นแผง 3 เฟส จะใส่ค่าโหลดลงคอลัมน์ L1/L2/L3 สลับกันไปตามตำแหน่งแถว
 * (แถวที่ 1,4,7,...ลง L1 / แถวที่ 2,5,8,...ลง L2 / แถวที่ 3,6,9,...ลง L3) เพื่อกระจายโหลดให้สมดุล
 * คืนค่า true ถ้าเติมสำเร็จ, false ถ้าตารางเต็มแล้ว (ไม่มีแถวว่างเหลือ ให้ไปขยายขนาดช่องหรือเคลียร์ก่อน)
 */
function addPanelScheduleRow(row) {
  const schedule = loadPanelSchedule();
  const emptyIndex = schedule.rows.findIndex(isEmptyPanelScheduleRow);
  if (emptyIndex === -1) return false;

  const target = schedule.rows[emptyIndex];
  target.description = row.description;
  target.cbPole = row.cbPole;
  target.cbAt = row.cbAt;
  target.cableSize = row.cableSize;
  target.cableType = row.cableType;
  target.conduit = row.conduit;

  if (schedule.phaseType === '3phase') {
    const phaseKey = ['loadL1', 'loadL2', 'loadL3'][emptyIndex % 3];
    target[phaseKey] = row.loadVa;
  } else {
    target.loadVa = row.loadVa;
  }

  savePanelSchedule(schedule);
  return true;
}
