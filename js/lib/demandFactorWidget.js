/**
 * ตัวช่วยคำนวณ "ดีมานด์โหลด" (Demand Load) แบบทั่วไป ใช้กับตารางที่มีโครงสร้าง
 * [{ id, label, tiers: [{ upTo, percent }] }] เช่น ตารางที่ 9.1 (แสงสว่าง), 9.2 (เต้ารับ)
 * และแถวเครื่องปรับอากาศในตารางที่ 9.3 เป็นเครื่องมือเสริมแยกจากการเลือกสาย/เบรกเกอร์ของ
 * วงจรย่อยเดี่ยวที่มีอยู่แล้วในแต่ละหน้า ใช้ประมาณโหลดดีมานด์รวมของทั้งอาคารในหมวดนั้นๆ
 *
 * อ้างอิงอิลิเมนต์ตาม naming convention `${prefix}DfBuildingType`, `${prefix}DfTotalVa`,
 * `${prefix}DfResult`, `${prefix}DfSaveToggle` (เช่น prefix = 'lighting' สำหรับหน้าวงจรย่อยแสงสว่าง)
 *
 * ผู้ใช้เลือกเองว่าจะบันทึกผลดีมานด์โหลดหรือไม่ผ่านช่องติ๊ก `${prefix}DfSaveToggle` — ติ๊กไว้
 * เมื่อไหร่ ทุกครั้งที่คำนวณสำเร็จจะบันทึกผ่าน saveDemandFactorValue(prefix, demandVa) (ถ้ามี
 * ฟังก์ชันนี้โหลดไว้) เพื่อให้ช่องกรอกในการ์ด "สรุปดีมานด์โหลดรวม" ของหน้าสายป้อน/สายเมน
 * ถูกเติมค่าให้อัตโนมัติ ไม่ติ๊กไว้จะคำนวณแสดงผลตามปกติแต่ไม่บันทึก/ไม่ส่งค่าไปที่อื่น
 * (ดู js/lib/demandFactorStorage.js)
 */
function initTieredDemandFactorWidget(prefix, table) {
  const buildingTypeEl = document.getElementById(`${prefix}DfBuildingType`);
  const totalVaInput = document.getElementById(`${prefix}DfTotalVa`);
  const resultEl = document.getElementById(`${prefix}DfResult`);
  const saveToggleEl = document.getElementById(`${prefix}DfSaveToggle`);

  if (!buildingTypeEl || !totalVaInput || !resultEl || typeof calcTieredDemandVa === 'undefined') return;

  buildingTypeEl.innerHTML = table.map((row) => `<option value="${row.id}">${row.label}</option>`).join('');

  function calculate() {
    const totalVa = parseFloat(totalVaInput.value) || 0;
    const row = table.find((r) => r.id === buildingTypeEl.value) || table[0];

    if (totalVa <= 0) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
          กรอกโหลดติดตั้งจริงรวม (VA) เพื่อคำนวณดีมานด์โหลด
        </div>
      `;
      return;
    }

    const { demandVa, breakdown } = calcTieredDemandVa(row.tiers, totalVa);
    const shouldSave = Boolean(saveToggleEl && saveToggleEl.checked);

    if (shouldSave && typeof saveDemandFactorValue === 'function') {
      saveDemandFactorValue(prefix, demandVa);
    }

    resultEl.innerHTML = `
      <div class="bg-lime-50 border border-lime-100 rounded-xl p-4">
        <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">โหลดดีมานด์โดยประมาณ</p>
        <p class="text-xl font-display font-bold text-lime-700">${Math.round(demandVa).toLocaleString()} <span class="text-sm font-sans font-medium">VA</span></p>
        <ul class="text-xs text-slate-500 mt-2 space-y-0.5 list-disc list-inside">
          ${breakdown
            .map((b) => `<li>${Math.round(b.va).toLocaleString()} VA × ${b.percent}% = ${Math.round(b.demandVa).toLocaleString()} VA</li>`)
            .join('')}
        </ul>
        <p class="text-xs ${shouldSave ? 'text-lime-600' : 'text-slate-400'} mt-2">${
          shouldSave
            ? 'บันทึกค่านี้ไว้แล้ว — ไปกรอกอัตโนมัติที่การ์ด "สรุปดีมานด์โหลดรวม" ในหน้าสายป้อน/สายเมนให้'
            : 'ยังไม่ได้บันทึก — ติ๊กเลือกด้านบนถ้าต้องการบันทึกและส่งค่านี้ไปหน้าสายป้อน/สายเมน'
        }</p>
      </div>
    `;
  }

  buildingTypeEl.addEventListener('change', calculate);
  totalVaInput.addEventListener('input', calculate);
  if (saveToggleEl) {
    saveToggleEl.addEventListener('change', calculate);
  }
  calculate();
}
