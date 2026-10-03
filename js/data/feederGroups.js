/**
 * การจับคู่กลุ่มลักษณะการติดตั้งสำหรับสายป้อน (Feeder)
 * ใช้สาย IEC01 เท่านั้น จึงเลือกได้เฉพาะกลุ่มที่ 1 (เดินในฝ้าเพดาน) และกลุ่มที่ 2 (เกาะผนัง/ฝังผนัง)
 * ใช้ตารางที่ 5-20 เหมือนวงจรย่อย
 */
const FEEDER_ELIGIBLE_GROUPS = [1, 2];

/**
 * คืนค่า { tableId, cols } สำหรับสายป้อน หรือ null ถ้าไม่มีข้อมูลรองรับ
 * ใช้ตรรกะเดียวกับ getWireColumnSpec ของวงจรย่อยสำหรับกลุ่มที่ 1-2 (ตารางที่ 5-20)
 */
function getFeederWireColumnSpec(group, count, coreType) {
  const isSingle = coreType === 'single';

  switch (group) {
    case 1: {
      const base = count === 3 ? 2 : 0;
      return { tableId: 'table-5-20', cols: [base + (isSingle ? 0 : 1)] };
    }
    case 2: {
      const base = count === 3 ? 6 : 4;
      return { tableId: 'table-5-20', cols: [base + (isSingle ? 0 : 1)] };
    }
    default:
      return null;
  }
}
