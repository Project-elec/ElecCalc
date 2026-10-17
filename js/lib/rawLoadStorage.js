/**
 * บันทึก/ดึงค่า "กำลังไฟฟ้ารวม" ของวงจรย่อยแบบดิบ (ไม่ผ่านดีมานด์แฟกเตอร์) จากแต่ละหน้าวงจรย่อย
 * (แสงสว่าง/เต้ารับ/เครื่องทำน้ำอุ่น/เครื่องปรับอากาศ) ผ่าน localStorage เหมือน js/lib/demandFactorStorage.js
 * ทุกประการ แต่แยกชุด key และช่องกรอกปลายทางออกจากกัน เพื่อให้เลือกได้อิสระว่าจะส่งค่าดีมานด์โหลด
 * (ผ่าน DF) หรือค่ากำลังไฟฟ้ารวมดิบ (ไม่ผ่าน DF) หรือทั้งสองอย่างไปรวมในหน้าสายป้อน/สายเมน
 *
 * key ของแต่ละหมวดตรงกับ id ของช่องกรอกในการ์ด "สรุปโหลดรวม (ไม่ผ่าน Demand Factor)" เช่น หมวด
 * 'lighting' -> localStorage key 'eleccalc_raw_lighting' -> ช่อง feederRawLighting / mainRawLighting
 */
const RAW_LOAD_STORAGE_KEYS = {
  lighting: 'eleccalc_raw_lighting',
  outlet: 'eleccalc_raw_outlet',
  heater: 'eleccalc_raw_heater',
  ac: 'eleccalc_raw_ac',
};

function saveRawLoadValue(category, va) {
  const key = RAW_LOAD_STORAGE_KEYS[category];
  if (!key) return;

  try {
    localStorage.setItem(key, String(va));
  } catch (e) {
    // localStorage อาจใช้งานไม่ได้ (เช่น เปิดแบบ private mode) ข้ามการบันทึกแบบเงียบๆ ไม่กระทบการใช้งานหลัก
  }

  const suffix = category.charAt(0).toUpperCase() + category.slice(1);
  ['feeder', 'main'].forEach((prefix) => {
    const input = document.getElementById(`${prefix}Raw${suffix}`);
    if (input) {
      input.value = Math.round(va);
      input.dispatchEvent(new Event('input'));
    }
  });
}

function loadRawLoadValue(category) {
  const key = RAW_LOAD_STORAGE_KEYS[category];
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? parseFloat(raw) : null;
  } catch (e) {
    return null;
  }
}
