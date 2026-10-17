/**
 * บันทึก/ดึงค่า "ดีมานด์โหลด" ที่คำนวณไว้จากแต่ละหน้าวงจรย่อย (แสงสว่าง/เต้ารับ/เครื่องทำน้ำอุ่น/
 * เครื่องปรับอากาศ) ผ่าน localStorage เพื่อให้ยังอยู่แม้ปิด-เปิดเบราว์เซอร์ใหม่ และ sync เข้าช่องกรอก
 * ในการ์ด "สรุปดีมานด์โหลดรวม" ของหน้าสายป้อน/สายเมนทันทีถ้าเปิดอยู่ในเอกสารเดียวกัน (SPA หน้าเดียว)
 *
 * key ของแต่ละหมวดตรงกับ prefix ที่ใช้เรียก initTieredDemandFactorWidget และ id ของช่องกรอกใน
 * การ์ดสรุป (เช่น หมวด 'lighting' -> localStorage key 'eleccalc_df_lighting' -> ช่อง feederDfLighting)
 */
const DEMAND_FACTOR_STORAGE_KEYS = {
  lighting: 'eleccalc_df_lighting',
  outlet: 'eleccalc_df_outlet',
  heater: 'eleccalc_df_heater',
  ac: 'eleccalc_df_ac',
};

function saveDemandFactorValue(category, va) {
  const key = DEMAND_FACTOR_STORAGE_KEYS[category];
  if (!key) return;

  try {
    localStorage.setItem(key, String(va));
  } catch (e) {
    // localStorage อาจใช้งานไม่ได้ (เช่น เปิดแบบ private mode) ข้ามการบันทึกแบบเงียบๆ ไม่กระทบการใช้งานหลัก
  }

  // ซิงก์เข้าช่องกรอกในการ์ดสรุปของหน้าสายป้อน/สายเมนทันที เพราะเป็น SPA หน้าเดียว ทุกหน้าอยู่ใน
  // DOM เดียวกันอยู่แล้ว (แค่ซ่อน/แสดงด้วย CSS) จึงอ้างอิง element ข้ามหน้าได้โดยตรงโดยไม่ต้องรอ reload
  const suffix = category.charAt(0).toUpperCase() + category.slice(1);
  ['feeder', 'main'].forEach((prefix) => {
    const input = document.getElementById(`${prefix}Df${suffix}`);
    if (input) {
      input.value = Math.round(va);
      input.dispatchEvent(new Event('input'));
    }
  });
}

function loadDemandFactorValue(category) {
  const key = DEMAND_FACTOR_STORAGE_KEYS[category];
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? parseFloat(raw) : null;
  } catch (e) {
    return null;
  }
}
