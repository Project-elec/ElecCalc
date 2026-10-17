/**
 * ตัวจัดการหน้า "ตารางโหลดแผงย่อย" (Panel Board Load Schedule)
 * เลือกชนิดแผง (1 เฟส/3 เฟส) + ขนาดช่อง (จำนวนวงจร) แล้วตารางจะสร้างแถวให้อัตโนมัติตามขนาดที่เลือก
 * 1 เฟสมีช่องโหลด (VA) เดียวต่อแถว ส่วน 3 เฟสมี 3 ช่อง (L1/L2/L3) ให้กรอกค่าโหลดแยกตามเฟสที่ต่อ
 * อ่าน/แก้ไข/ลบค่าที่เก็บไว้ใน localStorage ผ่าน js/lib/panelScheduleStorage.js (แถวถูกเติมจากปุ่ม
 * "+ เพิ่มลงตารางโหลดแผงย่อย" ในหน้าวงจรย่อยต่างๆ หรือกรอกเองในตารางนี้โดยตรง)
 * สรุป TOTAL VA (และ VA/PHASE สำหรับ 3 เฟส), คำนวณกระแส (AMP.) จากดีมานด์โหลด (ถ้ามี) หรือ TOTAL VA
 * และแนะนำ MAIN CB จากตารางพิกัดเซอร์กิตเบรกเกอร์เดียวกับเครื่องคำนวณอื่นๆ ในเว็บนี้
 */
(function () {
  const phaseTypeEl = document.getElementById('panelSchedulePhaseType');
  const sizeEl = document.getElementById('panelScheduleSize');
  const tableWrap = document.getElementById('panelScheduleTableWrap');
  const clearBtn = document.getElementById('panelScheduleClearBtn');
  const voltageInput = document.getElementById('panelScheduleVoltage');
  const demandVaInput = document.getElementById('panelScheduleDemandVa');
  const summaryEl = document.getElementById('panelScheduleSummary');

  if (
    !phaseTypeEl ||
    !sizeEl ||
    !tableWrap ||
    !clearBtn ||
    !voltageInput ||
    !demandVaInput ||
    !summaryEl ||
    typeof loadPanelSchedule === 'undefined' ||
    typeof savePanelSchedule === 'undefined' ||
    typeof emptyPanelScheduleRow === 'undefined' ||
    typeof PANEL_SCHEDULE_SIZES === 'undefined'
  ) {
    return;
  }

  let schedule = loadPanelSchedule();

  const { sizes: STANDARD_BREAKER_SIZES, rows: BREAKER_ROWS } =
    typeof CIRCUIT_BREAKER_TABLE !== 'undefined' && typeof getStandardBreakerSizes === 'function'
      ? getStandardBreakerSizes(CIRCUIT_BREAKER_TABLE, 6000)
      : { sizes: [], rows: [] };

  function escapeAttr(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderToggleGroup(container, options, activeValue, onSelect) {
    container.innerHTML = options
      .map((opt) => `<button type="button" data-value="${opt.value}" class="toggle-btn${opt.value === activeValue ? ' active' : ''}">${opt.label}</button>`)
      .join('');
    container.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => onSelect(btn.getAttribute('data-value')));
    });
  }

  function hasAnyData() {
    return schedule.rows.some(
      (r) => r.description || (r.loadVa > 0) || (r.loadL1 > 0) || (r.loadL2 > 0) || (r.loadL3 > 0) || (r.cbAt > 0) || r.cableSize || r.cableType || r.conduit
    );
  }

  function rebuildRows(phaseType, size) {
    schedule = { phaseType, size, rows: Array.from({ length: size }, () => emptyPanelScheduleRow(phaseType)) };
    savePanelSchedule(schedule);
    renderAll();
  }

  function renderControls() {
    renderToggleGroup(
      phaseTypeEl,
      [
        { value: '1phase', label: '1 เฟส' },
        { value: '3phase', label: '3 เฟส' },
      ],
      schedule.phaseType,
      (value) => {
        if (value === schedule.phaseType) return;
        if (hasAnyData() && !window.confirm('เปลี่ยนชนิดแผงจะล้างข้อมูลในตารางปัจจุบันทั้งหมด ดำเนินการต่อหรือไม่?')) return;
        voltageInput.value = value === '3phase' ? 380 : 220;
        rebuildRows(value, PANEL_SCHEDULE_SIZES[value][0]);
      }
    );

    renderToggleGroup(
      sizeEl,
      PANEL_SCHEDULE_SIZES[schedule.phaseType].map((n) => ({ value: String(n), label: `${n} ช่อง` })),
      String(schedule.size),
      (value) => {
        const size = parseInt(value, 10);
        if (size === schedule.size) return;
        if (hasAnyData() && !window.confirm('เปลี่ยนขนาดช่องจะล้างข้อมูลในตารางปัจจุบันทั้งหมด ดำเนินการต่อหรือไม่?')) return;
        rebuildRows(schedule.phaseType, size);
      }
    );
  }

  function renderTable() {
    const is3Phase = schedule.phaseType === '3phase';

    tableWrap.innerHTML = `
      <table class="w-full text-sm border-collapse min-w-[900px]">
        <thead>
          <tr class="bg-slate-50">
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-10">CCT</th>
            <th class="px-2 py-2 border-b border-slate-200 text-left font-semibold text-slate-600 min-w-[150px]">รายละเอียด</th>
            ${
              is3Phase
                ? `
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-20">L1 (VA)</th>
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-20">L2 (VA)</th>
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-20">L3 (VA)</th>
            `
                : `<th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-24">โหลด (VA)</th>`
            }
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-20">CB (P)</th>
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-20">CB (AT)</th>
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-24">ขนาดสาย</th>
            <th class="px-2 py-2 border-b border-slate-200 text-center font-semibold text-slate-600 w-24">ชนิดสาย</th>
            <th class="px-2 py-2 border-b border-slate-200 text-left font-semibold text-slate-600 min-w-[120px]">ท่อร้อยสาย</th>
          </tr>
        </thead>
        <tbody>
          ${schedule.rows
            .map(
              (row, i) => `
            <tr class="border-b border-slate-100 last:border-0" data-row-id="${row.id}">
              <td class="px-2 py-1.5 text-center text-slate-400">${i + 1}</td>
              <td class="px-2 py-1.5"><input type="text" value="${escapeAttr(row.description)}" class="calc-input panel-field" data-field="description" /></td>
              ${
                is3Phase
                  ? `
              <td class="px-2 py-1.5"><input type="number" min="0" value="${row.loadL1 || ''}" class="calc-input panel-field text-center" data-field="loadL1" /></td>
              <td class="px-2 py-1.5"><input type="number" min="0" value="${row.loadL2 || ''}" class="calc-input panel-field text-center" data-field="loadL2" /></td>
              <td class="px-2 py-1.5"><input type="number" min="0" value="${row.loadL3 || ''}" class="calc-input panel-field text-center" data-field="loadL3" /></td>
              `
                  : `<td class="px-2 py-1.5"><input type="number" min="0" value="${row.loadVa || ''}" class="calc-input panel-field text-center" data-field="loadVa" /></td>`
              }
              <td class="px-2 py-1.5">
                <select class="calc-input panel-field text-center" data-field="cbPole">
                  <option value="1P" ${row.cbPole === '1P' ? 'selected' : ''}>1P</option>
                  <option value="2P" ${row.cbPole === '2P' ? 'selected' : ''}>2P</option>
                  <option value="3P" ${row.cbPole === '3P' ? 'selected' : ''}>3P</option>
                </select>
              </td>
              <td class="px-2 py-1.5"><input type="number" min="0" value="${row.cbAt || ''}" class="calc-input panel-field text-center" data-field="cbAt" /></td>
              <td class="px-2 py-1.5"><input type="text" value="${escapeAttr(row.cableSize)}" class="calc-input panel-field text-center" data-field="cableSize" /></td>
              <td class="px-2 py-1.5"><input type="text" value="${escapeAttr(row.cableType)}" class="calc-input panel-field text-center" data-field="cableType" /></td>
              <td class="px-2 py-1.5"><input type="text" value="${escapeAttr(row.conduit)}" class="calc-input panel-field" data-field="conduit" /></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    tableWrap.querySelectorAll('tr[data-row-id]').forEach((tr) => {
      const rowId = tr.getAttribute('data-row-id');
      tr.querySelectorAll('.panel-field').forEach((field) => {
        field.addEventListener('input', () => {
          const row = schedule.rows.find((r) => r.id === rowId);
          if (!row) return;
          const key = field.getAttribute('data-field');
          const numericFields = ['loadVa', 'loadL1', 'loadL2', 'loadL3', 'cbAt'];
          row[key] = numericFields.includes(key) ? parseFloat(field.value) || 0 : field.value;
          savePanelSchedule(schedule);
          updateSummary();
        });
      });
    });
  }

  function updateSummary() {
    const is3Phase = schedule.phaseType === '3phase';
    const voltage = parseFloat(voltageInput.value) || (is3Phase ? 380 : 220);
    const demandVa = parseFloat(demandVaInput.value) || 0;

    let totalVa = 0;
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;

    if (is3Phase) {
      schedule.rows.forEach((r) => {
        l1 += parseFloat(r.loadL1) || 0;
        l2 += parseFloat(r.loadL2) || 0;
        l3 += parseFloat(r.loadL3) || 0;
      });
      totalVa = l1 + l2 + l3;
    } else {
      totalVa = schedule.rows.reduce((sum, r) => sum + (parseFloat(r.loadVa) || 0), 0);
    }

    const ampBasisVa = demandVa > 0 ? demandVa : totalVa;
    const amp = is3Phase ? ampBasisVa / (Math.sqrt(3) * voltage) : ampBasisVa / voltage;

    let mainBreaker = null;
    let mainFrame = null;
    if (amp > 0 && STANDARD_BREAKER_SIZES.length) {
      const found = STANDARD_BREAKER_SIZES.find((b) => b >= amp);
      mainBreaker = found === undefined ? null : found;
      if (mainBreaker !== null && typeof findFrameForTrip === 'function') {
        mainFrame = findFrameForTrip(BREAKER_ROWS, mainBreaker);
      }
    }

    summaryEl.innerHTML = `
      <dl class="grid grid-cols-2 gap-y-3 text-sm">
        ${
          is3Phase
            ? `
        <dt class="text-slate-500">VA / PHASE (L1 / L2 / L3)</dt>
        <dd class="text-right font-medium text-slate-800">${Math.round(l1).toLocaleString()} / ${Math.round(l2).toLocaleString()} / ${Math.round(l3).toLocaleString()}</dd>
        `
            : ''
        }

        <dt class="text-slate-500">TOTAL VA</dt>
        <dd class="text-right font-medium text-slate-800">${Math.round(totalVa).toLocaleString()} VA</dd>

        <dt class="text-slate-500">DEMAND LOAD</dt>
        <dd class="text-right font-medium text-slate-800">${demandVa > 0 ? Math.round(demandVa).toLocaleString() + ' VA' : '-'}</dd>

        <dt class="text-slate-500">AMP. (จาก${demandVa > 0 ? 'ดีมานด์โหลด' : 'TOTAL VA'})</dt>
        <dd class="text-right font-medium text-brand-700">${amp.toFixed(2)} A</dd>
      </dl>

      ${
        mainBreaker !== null
          ? `
      <div class="mt-4 bg-amp-50 border border-amp-100 rounded-2xl p-4 text-center">
        <p class="text-xs font-semibold text-amp-600 uppercase tracking-wide mb-1">MAIN CB แนะนำ</p>
        <p class="text-2xl font-display font-bold text-amp-700">${mainBreaker} <span class="text-sm font-sans font-medium">AT</span>${
              mainFrame ? ` / ${mainFrame} <span class="text-sm font-sans font-medium">AF</span>` : ''
            }</p>
        <p class="text-xs text-slate-500 mt-1">พิกัดมาตรฐานที่ไม่น้อยกว่ากระแส AMP. ด้านบน (ตารางพิกัดเซอร์กิตเบรกเกอร์)</p>
      </div>
      `
          : ''
      }
    `;
  }

  function renderAll() {
    if (!voltageInput.value) {
      voltageInput.value = schedule.phaseType === '3phase' ? 380 : 220;
    }
    renderControls();
    renderTable();
    updateSummary();
  }

  clearBtn.addEventListener('click', () => {
    if (!hasAnyData()) return;
    if (!window.confirm('ต้องการล้างข้อมูลในตารางทั้งหมดใช่หรือไม่? ไม่สามารถย้อนกลับได้ (ขนาดช่อง/ชนิดแผงยังคงเดิม)')) return;
    schedule.rows = Array.from({ length: schedule.size }, () => emptyPanelScheduleRow(schedule.phaseType));
    savePanelSchedule(schedule);
    renderTable();
    updateSummary();
  });

  voltageInput.addEventListener('input', updateSummary);
  demandVaInput.addEventListener('input', updateSummary);

  // SPA หน้าเดียว: ถ้ากดปุ่ม "+ เพิ่มลงตารางโหลดแผงย่อย" จากหน้าวงจรย่อยอื่นระหว่างที่เปิดหน้านี้ค้างไว้
  // (ไม่ได้ reload) ให้ดึงข้อมูลล่าสุดจาก localStorage มาแสดงใหม่ทุกครั้งที่กลับมาที่หน้านี้
  window.addEventListener('hashchange', () => {
    if (window.location.hash.replace('#', '') === 'panel-schedule') {
      schedule = loadPanelSchedule();
      renderControls();
      renderTable();
      updateSummary();
    }
  });

  renderAll();
})();
