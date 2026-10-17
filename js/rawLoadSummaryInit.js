/**
 * ตัวเริ่มต้นการ์ด "สรุปโหลดรวม (ไม่ผ่าน Demand Factor)" ในหน้าสายป้อน/สายเมน
 * ทำงานเหมือนส่วน "สรุปดีมานด์โหลดรวม" ใน js/demandFactorInit.js ทุกประการ (รวมค่าที่บันทึกไว้
 * จากแต่ละหน้าวงจรย่อย, ดึงค่าที่เคยบันทึกจาก localStorage มาเติมอัตโนมัติถ้าช่องว่างอยู่, ปุ่ม
 * "ใช้ผลรวมนี้" เพื่อนำไปกรอกเป็นกำลังไฟฟ้ารวม) แต่ใช้ข้อมูลกำลังไฟฟ้ารวมดิบ (ก่อนคิด DF) จาก
 * js/lib/rawLoadStorage.js แทนดีมานด์โหลด แยกเป็นไฟล์ต่างหากเพื่อไม่ต้องแก้ demandFactorInit.js
 */
(function () {
  function initRawSummary(prefix, targetVaInputId) {
    const categories = ['Lighting', 'Outlet', 'Heater', 'Ac', 'Other'];
    const inputs = categories.map((c) => document.getElementById(`${prefix}Raw${c}`));
    const resultEl = document.getElementById(`${prefix}RawResult`);
    const applyBtn = document.getElementById(`${prefix}RawApplyBtn`);
    const targetInput = document.getElementById(targetVaInputId);
    if (!resultEl || !applyBtn || !targetInput || inputs.some((el) => !el)) return;

    if (typeof loadRawLoadValue === 'function') {
      categories.forEach((c, i) => {
        if (c === 'Other') return;
        const input = inputs[i];
        if (input.value !== '') return;
        const saved = loadRawLoadValue(c.charAt(0).toLowerCase() + c.slice(1));
        if (saved !== null && !Number.isNaN(saved)) {
          input.value = Math.round(saved);
        }
      });
    }

    let total = 0;

    function calculate() {
      total = inputs.reduce((sum, el) => sum + (parseFloat(el.value) || 0), 0);
      resultEl.innerHTML = `
        <div class="bg-lime-50 border border-lime-100 rounded-xl p-4">
          <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">ผลรวมโหลด (ไม่ผ่าน Demand Factor)</p>
          <p class="text-xl font-display font-bold text-lime-700">${Math.round(total).toLocaleString()} <span class="text-sm font-sans font-medium">VA</span></p>
        </div>
      `;
    }

    inputs.forEach((el) => el.addEventListener('input', calculate));
    applyBtn.addEventListener('click', () => {
      targetInput.value = Math.round(total);
      targetInput.dispatchEvent(new Event('input'));
    });

    calculate();
  }

  initRawSummary('feeder', 'feederVa');
  initRawSummary('main', 'mainVa');
})();
