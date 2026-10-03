/**
 * ตัวช่วยคำนวณ "ดีมานด์โหลด" (Demand Load) แบบทั่วไป ใช้กับตารางที่มีโครงสร้าง
 * [{ id, label, tiers: [{ upTo, percent }] }] เช่น ตารางที่ 9.1 (แสงสว่าง), 9.2 (เต้ารับ)
 * และแถวเครื่องปรับอากาศในตารางที่ 9.3 เป็นเครื่องมือเสริมแยกจากการเลือกสาย/เบรกเกอร์ของ
 * วงจรย่อยเดี่ยวที่มีอยู่แล้วในแต่ละหน้า ใช้ประมาณโหลดดีมานด์รวมของทั้งอาคารในหมวดนั้นๆ
 *
 * อ้างอิงอิลิเมนต์ตาม naming convention `${prefix}DfBuildingType`, `${prefix}DfTotalVa`,
 * `${prefix}DfResult` (เช่น prefix = 'lighting' สำหรับหน้าวงจรย่อยแสงสว่าง)
 */
function initTieredDemandFactorWidget(prefix, table) {
  const buildingTypeEl = document.getElementById(`${prefix}DfBuildingType`);
  const totalVaInput = document.getElementById(`${prefix}DfTotalVa`);
  const resultEl = document.getElementById(`${prefix}DfResult`);

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

    resultEl.innerHTML = `
      <div class="bg-lime-50 border border-lime-100 rounded-xl p-4">
        <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">โหลดดีมานด์โดยประมาณ</p>
        <p class="text-xl font-display font-bold text-lime-700">${Math.round(demandVa).toLocaleString()} <span class="text-sm font-sans font-medium">VA</span></p>
        <ul class="text-xs text-slate-500 mt-2 space-y-0.5 list-disc list-inside">
          ${breakdown
            .map((b) => `<li>${Math.round(b.va).toLocaleString()} VA × ${b.percent}% = ${Math.round(b.demandVa).toLocaleString()} VA</li>`)
            .join('')}
        </ul>
      </div>
    `;
  }

  buildingTypeEl.addEventListener('change', calculate);
  totalVaInput.addEventListener('input', calculate);
  calculate();
}
