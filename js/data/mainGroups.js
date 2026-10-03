/**
 * การจับคู่ชนิดสาย + กลุ่มลักษณะการติดตั้งสำหรับสายเมน (สายประธาน / Main)
 * รองรับ 3 รูปแบบการติดตั้งตามที่ใช้งานจริง:
 * - กลุ่มที่ 3 (เดินเกาะผนังในอากาศ): ตารางที่ 5-21 คอลัมน์ 70°C (สาย NYY) หรือ 90°C (สาย CV, IEC 60502-1)
 * - กลุ่มที่ 5/6 (ร้อยท่อฝังดิน / ฝังดินโดยตรง): สาย NYY ใช้ตารางที่ 5-23, สาย CV ใช้ตารางที่ 5-29
 * - กลุ่มที่ 7 (วางบนรางเคเบิล): เลือกรูปแบบราง (ระบายอากาศ/บันได หรือด้านล่างทึบ) แล้วเลือกรูปแบบการวางสาย
 *   สาย NYY ใช้ตารางที่ 5-30 (ระบายอากาศ) / 5-31 (ด้านล่างทึบ), สาย CV ใช้ตารางที่ 5-32 (ระบายอากาศ) / 5-33 (ด้านล่างทึบ)
 */
const MAIN_CABLE_ELIGIBILITY = {
  NYY: [3, 5, 6, 7],
  CV: [3, 5, 6, 7],
};

const MAIN_GROUP_TABLE_IDS = {
  NYY: 'table-5-23',
  CV: 'table-5-29',
};

const MAIN_TRAY_SHAPES = [
  { id: 'ventilated', label: 'รางเคเบิลแบบระบายอากาศ / บันได' },
  { id: 'solid', label: 'รางเคเบิลชนิดด้านล่างทึบ' },
];

const MAIN_TRAY_TABLE_IDS = {
  NYY: { ventilated: 'table-5-30', solid: 'table-5-31' },
  CV: { ventilated: 'table-5-32', solid: 'table-5-33' },
};

// รูปแบบการวางสายบนรางเคเบิล แยกตามรูปแบบราง (ใช้ร่วมกันได้ทั้งสาย NYY/CV เพราะโครงสร้างคอลัมน์ของ
// ตารางที่ 5-30/5-32 (ระบายอากาศ) และตารางที่ 5-31/5-33 (ด้านล่างทึบ) เหมือนกัน ต่างกันแค่พิกัดกระแส)
const MAIN_TRAY_ARRANGEMENTS = {
  ventilated: [
    { col: 0, coreType: 'single', label: 'วางสายเรียงชิดติดกันในแนวระนาบ (วางบนรางแนวนอนหรือแนวดิ่ง)' },
    { col: 1, coreType: 'single', label: 'วางสายจัดกลุ่มชิดติดกันแบบสามเหลี่ยม (วางบนรางแนวนอนหรือแนวดิ่ง)' },
    { col: 2, coreType: 'single', label: 'วางสายเรียงแนวนอนบนราง เว้นระยะห่างระหว่างสาย 1 เท่าของเส้นผ่านศูนย์กลางสาย' },
    { col: 3, coreType: 'single', label: 'วางสายเรียงแนวดิ่งบนราง เว้นระยะห่างระหว่างสาย 1 เท่าของเส้นผ่านศูนย์กลางสาย' },
    { col: 4, coreType: 'multi', label: 'วางสายเคเบิลเดี่ยวบนรางเคเบิล (วางบนรางแนวนอนหรือแนวดิ่ง)' },
  ],
  solid: [
    { col: 0, coreType: 'single', label: 'วางสายเรียงแนวนอนบนราง เว้นระยะห่างระหว่างสาย' },
    { col: 1, coreType: 'single', label: 'วางสายเรียงชิดติดกันในแนวระนาบบนราง' },
    { col: 2, coreType: 'single', label: 'วางสายจัดกลุ่มชิดติดกันแบบสามเหลี่ยม (Trefoil)' },
    { col: 3, coreType: 'multi', label: 'วางสายเคเบิลเดี่ยวบนราง (มีหรือไม่มีฝาปิด)' },
  ],
};

// รายการขนาดหม้อแปลงมาตรฐานที่มีจำหน่ายทั่วไป (kVA) ใช้ปัดขึ้นจากโหลดที่เผื่อขยายแล้ว
// (เป็นค่าอ้างอิงทั่วไป ถ้าหน่วยงาน/ผู้ผลิตมีรุ่นที่ต่างจากนี้ แก้ไขรายการนี้ได้โดยตรง)
const STANDARD_TRANSFORMER_SIZES_KVA = [30, 50, 75, 100, 160, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150];

/**
 * คืนค่า { tableId, cols } สำหรับสายเมน หรือ null ถ้าไม่มีข้อมูลรองรับ
 *
 * กลุ่มที่ 3 (ตารางที่ 5-21): ไม่มีตัวเลือกจำนวนตัวนำกระแส ใช้ coreType เท่านั้น สาย NYY รับรองเฉพาะ
 * คอลัมน์พีวีซี 70°C เท่านั้น (คอลัมน์รหัส "NYY, IEC 60502-1" / "NYY, NYY-G, ...") เพราะคอลัมน์ XLPE
 * 90°C ระบุรหัสแค่ "IEC 60502-1" ไม่มี NYY กำกับ ส่วนสาย CV (รหัสสายคือ IEC 60502-1 ซึ่งปรากฏอยู่ใน
 * ทั้งคอลัมน์ 70°C และ 90°C ของตาราง) จึงเลือกได้ทั้ง 2 ประเภทฉนวนผ่าน insulationType ('pvc' คอลัมน์
 * พีวีซี 70°C หรือ 'xlpe' คอลัมน์ครอสลิงค์พอลิเอทิลีน 90°C ค่าเริ่มต้น เพราะเป็นสเปกทั่วไปของสาย CV)
 *
 * กลุ่มที่ 5/6 (ตารางที่ 5-23/5-29): เหมือนวงจรย่อย/สายป้อน คอลัมน์ไม่แยกตาม coreType (ค่าพิกัดกระแส
 * เท่ากันทั้งแกนเดี่ยวและหลายแกน) กลุ่มที่ 5 แยกคอลัมน์ตามจำนวนตัวนำ (2/3) กลุ่มที่ 6 คอลัมน์เดียวคงที่
 *
 * กลุ่มที่ 7 (ตารางที่ 5-30 ถึง 5-33): เลือกตารางจาก cableType + trayShape ('ventilated'|'solid')
 * แล้วกรองรูปแบบการวางสายจาก MAIN_TRAY_ARRANGEMENTS ตาม coreType, trayArrangementCol ระบุคอลัมน์ที่
 * เลือกเจาะจง ถ้าไม่ระบุจะ fallback ไปใช้ค่าพิกัดกระแส "ต่ำสุด" ของทุกรูปแบบที่ตรงกับ coreType (conservative)
 */
function getMainWireColumnSpec(cableType, group, count, coreType, trayShape, trayArrangementCol, insulationType) {
  const isSingle = coreType === 'single';

  if (group === 3) {
    if (cableType === 'CV') {
      const isPvc = insulationType === 'pvc';
      return { tableId: 'table-5-21', cols: [isSingle ? (isPvc ? 1 : 2) : isPvc ? 3 : 4] };
    }
    return { tableId: 'table-5-21', cols: [isSingle ? 1 : 3] };
  }

  if (group === 5 || group === 6) {
    const tableId = MAIN_GROUP_TABLE_IDS[cableType];
    if (!tableId) return null;
    if (group === 5) return { tableId, cols: [count === 3 ? 1 : 0] };
    return { tableId, cols: [2] };
  }

  if (group === 7) {
    const shapeMap = MAIN_TRAY_TABLE_IDS[cableType];
    if (!shapeMap) return null;
    const shapeKey = trayShape === 'solid' ? 'solid' : 'ventilated';
    const tableId = shapeMap[shapeKey];
    const options = (MAIN_TRAY_ARRANGEMENTS[shapeKey] || []).filter((a) => a.coreType === coreType);
    if (!options.length) return null;
    const selected = options.find((a) => a.col === trayArrangementCol);
    return { tableId, cols: selected ? [selected.col] : options.map((a) => a.col) };
  }

  return null;
}

// ปัดโหลด (kVA) ขึ้นเป็นขนาดหม้อแปลงมาตรฐานที่เล็กที่สุดที่ไม่น้อยกว่าที่ต้องการ
function pickStandardTransformerSize(requiredKva) {
  return STANDARD_TRANSFORMER_SIZES_KVA.find((kva) => kva >= requiredKva) || null;
}
