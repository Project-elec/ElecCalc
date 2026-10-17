/**
 * ตัวเริ่มต้นเครื่องมือ "คำนวณดีมานด์โหลด" (ตารางที่ 9.1-9.3) ของทุกหน้าที่เกี่ยวข้อง
 * แยกไฟล์นี้ออกจาก lightingCircuit.js/outletCircuit.js/.../mainCircuit.js เพื่อไม่ต้องแก้ไข
 * โค้ดคำนวณสาย/เบรกเกอร์ของวงจรย่อยเดี่ยวที่มีอยู่แล้ว เครื่องมือในไฟล์นี้เป็นส่วนเสริมอิสระ
 */

// แสงสว่าง (ตารางที่ 9.1), เต้ารับ (ตารางที่ 9.2), เครื่องปรับอากาศ (ตารางที่ 9.3) ใช้ widget ร่วมกัน
(function () {
  if (typeof initTieredDemandFactorWidget !== 'function') return;
  if (typeof LIGHTING_DEMAND_FACTOR_TABLE !== 'undefined') initTieredDemandFactorWidget('lighting', LIGHTING_DEMAND_FACTOR_TABLE);
  if (typeof RECEPTACLE_DEMAND_FACTOR_TABLE !== 'undefined') initTieredDemandFactorWidget('outlet', RECEPTACLE_DEMAND_FACTOR_TABLE);
  if (typeof AC_DEMAND_FACTOR_TABLE !== 'undefined') initTieredDemandFactorWidget('ac', AC_DEMAND_FACTOR_TABLE);
})();

// เครื่องทำน้ำอุ่น (ตารางที่ 9.3) ใช้สูตรพิเศษ: วงจรใหญ่สุด 2 วงจรแรกคิด 100% + ที่เหลือคิด 25%
// จึงเป็นรายการ VA หลายแถว (เหมือนรายการดวงโคม/เต้ารับ) ไม่ใช่ building type + ค่าเดียวแบบ widget ทั่วไป
(function () {
  const rowsContainer = document.getElementById('heaterDfRows');
  const addRowBtn = document.getElementById('heaterDfAddRow');
  const resultEl = document.getElementById('heaterDfResult');
  const saveToggleEl = document.getElementById('heaterDfSaveToggle');
  if (!rowsContainer || !addRowBtn || !resultEl || typeof calcWaterHeaterDemandVa === 'undefined') return;

  let rowIdCounter = 0;

  function calculate() {
    const vaList = [...rowsContainer.querySelectorAll('.heater-df-va')]
      .map((input) => parseFloat(input.value) || 0)
      .filter((v) => v > 0);

    if (!vaList.length) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
          กรอกโหลดติดตั้งจริง (VA) ของแต่ละวงจรเครื่องทำน้ำอุ่นเพื่อคำนวณดีมานด์โหลด
        </div>
      `;
      return;
    }

    const { demandVa, topVa, restVa, restDemandVa, topCount, restCount } = calcWaterHeaterDemandVa(vaList);
    const shouldSave = Boolean(saveToggleEl && saveToggleEl.checked);

    if (shouldSave && typeof saveDemandFactorValue === 'function') {
      saveDemandFactorValue('heater', demandVa);
    }

    resultEl.innerHTML = `
      <div class="bg-lime-50 border border-lime-100 rounded-xl p-4">
        <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">โหลดดีมานด์โดยประมาณ</p>
        <p class="text-xl font-display font-bold text-lime-700">${Math.round(demandVa).toLocaleString()} <span class="text-sm font-sans font-medium">VA</span></p>
        <ul class="text-xs text-slate-500 mt-2 space-y-0.5 list-disc list-inside">
          <li>วงจรใหญ่ที่สุด ${topCount} วงจรแรก: ${Math.round(topVa).toLocaleString()} VA × 100%</li>
          ${
            restCount
              ? `<li>ที่เหลืออีก ${restCount} วงจร: ${Math.round(restVa).toLocaleString()} VA × 25% = ${Math.round(restDemandVa).toLocaleString()} VA</li>`
              : ''
          }
        </ul>
        <p class="text-xs ${shouldSave ? 'text-lime-600' : 'text-slate-400'} mt-2">${
          shouldSave
            ? 'บันทึกค่านี้ไว้แล้ว — ไปกรอกอัตโนมัติที่การ์ด "สรุปดีมานด์โหลดรวม" ในหน้าสายป้อน/สายเมนให้'
            : 'ยังไม่ได้บันทึก — ติ๊กเลือกด้านบนถ้าต้องการบันทึกและส่งค่านี้ไปหน้าสายป้อน/สายเมน'
        }</p>
      </div>
    `;
  }

  function addRow() {
    rowIdCounter += 1;
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `
      <input type="number" min="0" placeholder="VA ของวงจรที่ ${rowIdCounter}" class="calc-input heater-df-va" />
      <button type="button" class="text-slate-400 hover:text-red-500 heater-df-remove" aria-label="ลบแถว">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;
    row.querySelector('.heater-df-va').addEventListener('input', calculate);
    row.querySelector('.heater-df-remove').addEventListener('click', () => {
      row.remove();
      calculate();
    });
    rowsContainer.appendChild(row);
  }

  addRowBtn.addEventListener('click', () => {
    addRow();
    calculate();
  });

  if (saveToggleEl) {
    saveToggleEl.addEventListener('change', calculate);
  }

  addRow();
  addRow();
  calculate();
})();

// สรุปดีมานด์โหลดรวม สำหรับหน้าสายป้อน/สายเมน: รวมค่าดีมานด์โหลดที่คำนวณแยกไว้แต่ละหมวด
// แล้วกดปุ่มเพื่อนำผลรวมไปกรอกใน "กำลังไฟฟ้ารวม (VA)" ของเครื่องคำนวณหลักได้ทันที (ไม่ได้แทนที่
// ช่องกรอกเดิม แค่ช่วยรวมเลขให้ ผู้ใช้ยังแก้ไขค่าสุดท้ายในช่อง VA รวมได้เองตามปกติ)
//
// ที่เริ่มต้น ถ้าช่องไหนยังว่างอยู่ จะดึงค่าที่เคยบันทึกไว้จากหน้าวงจรย่อยนั้นๆ (ผ่าน localStorage,
// ดู js/lib/demandFactorStorage.js) มาเติมให้อัตโนมัติ เพื่อไม่ต้องย้อนไปคัดลอกตัวเลขเองทุกครั้ง
(function () {
  function initSummary(prefix, targetVaInputId) {
    const categories = ['Lighting', 'Outlet', 'Heater', 'Ac', 'Other'];
    const inputs = categories.map((c) => document.getElementById(`${prefix}Df${c}`));
    const resultEl = document.getElementById(`${prefix}DfResult`);
    const applyBtn = document.getElementById(`${prefix}DfApplyBtn`);
    const targetInput = document.getElementById(targetVaInputId);
    if (!resultEl || !applyBtn || !targetInput || inputs.some((el) => !el)) return;

    if (typeof loadDemandFactorValue === 'function') {
      categories.forEach((c, i) => {
        if (c === 'Other') return;
        const input = inputs[i];
        if (input.value !== '') return;
        const saved = loadDemandFactorValue(c.charAt(0).toLowerCase() + c.slice(1));
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
          <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">ผลรวมดีมานด์โหลด</p>
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

  initSummary('feeder', 'feederVa');
  initSummary('main', 'mainVa');
})();
