/**
 * ตัวคำนวณ "วงจรย่อยแสงสว่าง"
 * ผู้ใช้เลือกชนิดสาย (IEC01/NYY) + ลักษณะการติดตั้ง (กลุ่มที่ 1-7) + ลักษณะตัวนำ (แกนเดี่ยว/หลายแกน)
 * แล้วกรอกรายการดวงโคม (จำนวน x กำลังไฟฟ้าต่อจุด) ระบบคำนวณกระแสโหลด, กระแสออกแบบ (เผื่อ 125%
 * สำหรับโหลดต่อเนื่อง), เลือกขนาดสาย/เบรกเกอร์/ท่อร้อยสายผ่านฟังก์ชันกลางใน js/lib/circuitCalc.js
 */
(function () {
  const cableTypeEl = document.getElementById('lightingCableType');
  const groupEl = document.getElementById('lightingGroup');
  const groupDescEl = document.getElementById('lightingGroupDesc');
  const trayTypeWrap = document.getElementById('lightingTrayTypeWrap');
  const trayTypeEl = document.getElementById('lightingTrayType');
  const countWrap = document.getElementById('lightingCountWrap');
  const countEl = document.getElementById('lightingCount');
  const coreTypeEl = document.getElementById('lightingCoreType');
  const coreNoteEl = document.getElementById('lightingCoreNote');
  const rowsContainer = document.getElementById('lightingRows');
  const addRowBtn = document.getElementById('lightingAddRow');
  const voltageInput = document.getElementById('lightingVoltage');
  const resultEl = document.getElementById('lightingResult');

  if (
    !cableTypeEl ||
    !groupEl ||
    !coreTypeEl ||
    !rowsContainer ||
    !resultEl ||
    typeof WIRE_TABLES === 'undefined' ||
    typeof CIRCUIT_BREAKER_TABLE === 'undefined' ||
    typeof CABLE_ELIGIBILITY === 'undefined' ||
    typeof CONDUIT_FILL_TABLES === 'undefined'
  ) {
    return;
  }

  const state = { cableType: 'IEC01', group: 1, count: 2, coreType: 'single', trayType: TRAY_TYPES[0].id };
  const { sizes: STANDARD_BREAKER_SIZES, rows: BREAKER_ROWS } = getStandardBreakerSizes(CIRCUIT_BREAKER_TABLE);

  function renderToggleGroup(container, options, activeValue, onSelect) {
    container.innerHTML = options
      .map(
        (opt) =>
          `<button type="button" data-value="${opt.value}" class="toggle-btn${opt.value === activeValue ? ' active' : ''}" ${
            opt.disabled ? 'disabled' : ''
          }>${opt.label}</button>`
      )
      .join('');
    container.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => onSelect(btn.getAttribute('data-value')));
    });
  }

  function renderCableTypeButtons() {
    renderToggleGroup(
      cableTypeEl,
      Object.keys(CABLE_ELIGIBILITY).map((v) => ({ value: v, label: v })),
      state.cableType,
      (value) => {
        state.cableType = value;
        const eligibleGroups = CABLE_ELIGIBILITY[state.cableType];
        if (!eligibleGroups.includes(state.group)) {
          state.group = eligibleGroups[0];
        }
        renderCableTypeButtons();
        renderGroupOptions();
      }
    );
  }

  function renderGroupOptions() {
    const eligibleGroups = CABLE_ELIGIBILITY[state.cableType];
    groupEl.innerHTML = eligibleGroups
      .map((g) => `<option value="${g}" ${g === state.group ? 'selected' : ''}>กลุ่มที่ ${g}</option>`)
      .join('');
    groupDescEl.textContent = INSTALLATION_GROUPS[state.group] || '';
    trayTypeWrap.classList.toggle('hidden', state.group !== 7);
    if (state.group === 7 && trayTypeEl.innerHTML === '') {
      trayTypeEl.innerHTML = TRAY_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
    }
    countWrap.classList.toggle('hidden', !GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group));
    renderCountButtons();
  }

  function renderCountButtons() {
    renderToggleGroup(
      countEl,
      [
        { value: '2', label: '2 ตัวนำ' },
        { value: '3', label: '3 ตัวนำ' },
      ],
      String(state.count),
      (value) => {
        state.count = parseInt(value, 10);
        renderCountButtons();
        calculate();
      }
    );
    renderCoreTypeButtons();
    calculate();
  }

  function renderCoreTypeButtons() {
    const multiAvailable = getWireColumnSpec(state.group, state.count, 'multi', state.trayType) !== null;
    if (!multiAvailable && state.coreType === 'multi') {
      state.coreType = 'single';
    }
    renderToggleGroup(
      coreTypeEl,
      [
        { value: 'single', label: 'แกนเดี่ยว' },
        { value: 'multi', label: 'หลายแกน', disabled: !multiAvailable },
      ],
      state.coreType,
      (value) => {
        state.coreType = value;
        renderCoreTypeButtons();
        calculate();
      }
    );
    coreNoteEl.classList.toggle('hidden', multiAvailable);
    if (!multiAvailable) {
      coreNoteEl.textContent = 'ลักษณะการติดตั้งนี้มีข้อมูลเฉพาะสายแกนเดี่ยวเท่านั้น';
    }
  }

  groupEl.addEventListener('change', () => {
    state.group = parseInt(groupEl.value, 10);
    renderGroupOptions();
  });

  trayTypeEl.addEventListener('change', () => {
    state.trayType = trayTypeEl.value;
    renderCoreTypeButtons();
    calculate();
  });

  let rowIdCounter = 0;

  function addRow(qty = '', va = '') {
    rowIdCounter += 1;
    const row = document.createElement('div');
    row.className = 'grid grid-cols-[1fr_1fr_auto] gap-2';
    row.dataset.rowId = `lighting-row-${rowIdCounter}`;
    row.innerHTML = `
      <input type="number" min="0" value="${qty}" class="calc-input lighting-qty" placeholder="เช่น 10" />
      <input type="number" min="0" value="${va}" class="calc-input lighting-va" placeholder="เช่น 40" />
      <button type="button" class="lighting-remove-row px-2 text-slate-400 hover:text-red-500" title="ลบรายการ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;
    rowsContainer.appendChild(row);

    row.querySelector('.lighting-remove-row').addEventListener('click', () => {
      if (rowsContainer.children.length <= 1) return;
      row.remove();
      calculate();
    });
    row.querySelectorAll('input').forEach((input) => input.addEventListener('input', calculate));
  }

  function getLoadRows() {
    return Array.from(rowsContainer.children).map((row) => ({
      qty: parseFloat(row.querySelector('.lighting-qty').value) || 0,
      va: parseFloat(row.querySelector('.lighting-va').value) || 0,
    }));
  }

  function resolveWireAndBreaker(designCurrent) {
    const spec = getWireColumnSpec(state.group, state.count, state.coreType, state.trayType);
    if (!spec) return { error: 'ไม่มีข้อมูลตารางพิกัดกระแสสำหรับตัวเลือกนี้' };

    const table = WIRE_TABLES.find((t) => t.id === spec.tableId);
    if (!table) return { error: 'ไม่พบตารางอ้างอิงที่เลือก' };

    const picked = pickWireAndBreaker(table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS);
    if (!picked) {
      return { error: 'กระแสออกแบบสูงเกินกว่าที่ตารางนี้จะเลือกขนาดสายไฟและเบรกเกอร์ให้ได้ กรุณาแยกวงจรหรือเลือกลักษณะการติดตั้งอื่น' };
    }
    return { ...picked, table };
  }

  function calculate() {
    const loadRows = getLoadRows();
    const totalPoints = loadRows.reduce((sum, r) => sum + r.qty, 0);
    const totalVa = loadRows.reduce((sum, r) => sum + r.qty * r.va, 0);
    const voltage = parseFloat(voltageInput.value) || 220;

    const loadCurrent = totalVa / voltage;
    const designCurrent = loadCurrent * 1.25;

    if (totalVa <= 0) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400">
          กรอกจำนวนและกำลังไฟฟ้าของดวงโคมเพื่อเริ่มคำนวณ
        </div>
      `;
      return;
    }

    const result = resolveWireAndBreaker(designCurrent);

    const warnings = [];
    if (totalPoints > 20) {
      warnings.push('จำนวนจุดจ่ายไฟรวมเกิน 20 จุดต่อวงจร ควรพิจารณาแยกเป็นหลายวงจรย่อย');
    }
    if (designCurrent > 16) {
      warnings.push('กระแสออกแบบเกิน 16 A ซึ่งเกินพิกัดทั่วไปของวงจรย่อยแสงสว่างในบ้านพักอาศัย ควรพิจารณาแยกวงจร');
    }
    if (result.error) {
      warnings.push(result.error);
    }

    const coreTypeLabel = state.coreType === 'single' ? 'แกนเดี่ยว' : 'หลายแกน';
    const countLabel = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? `, ${state.count} ตัวนำ` : '';

    const conductorCount = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? state.count : 2;
    const conduit =
      result.wire && state.coreType === 'single'
        ? pickConduitSize(CONDUIT_FILL_TABLES, state.cableType, result.wire.size, conductorCount)
        : null;
    if (result.wire && state.coreType === 'single' && !conduit) {
      warnings.push(`ไม่มีข้อมูลขนาดท่อร้อยสายสำหรับสาย ${result.wire.size} ตร.มม. ในตาราง ${state.cableType === 'IEC01' ? 'A-1' : 'A-2'}`);
    }

    resultEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-slate-800 mb-4">ผลการคำนวณ</h2>
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">จำนวนจุดจ่ายไฟรวม</dt>
          <dd class="text-right font-medium text-slate-800">${totalPoints.toLocaleString()} จุด</dd>

          <dt class="text-slate-500">กำลังไฟฟ้ารวม (P)</dt>
          <dd class="text-right font-medium text-slate-800">${totalVa.toLocaleString()} VA</dd>

          <dt class="text-slate-500">กระแสโหลด (I = P / V)</dt>
          <dd class="text-right font-medium text-slate-800">${loadCurrent.toFixed(2)} A</dd>

          <dt class="text-slate-500">กระแสออกแบบ (125%)</dt>
          <dd class="text-right font-medium text-brand-700">${designCurrent.toFixed(2)} A</dd>
        </dl>
      </div>

      ${
        result.wire
          ? `
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-center">
          <p class="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">ขนาดสายไฟแนะนำ</p>
          <p class="text-2xl font-display font-bold text-brand-700">${result.wire.size} <span class="text-sm font-sans font-medium">ตร.มม.</span></p>
          <p class="text-xs text-slate-500 mt-1">พิกัดกระแส ${result.wire.ampacity} A</p>
        </div>
        <div class="bg-amp-50 border border-amp-100 rounded-2xl p-4 text-center">
          <p class="text-xs font-semibold text-amp-600 uppercase tracking-wide mb-1">ขนาดเบรกเกอร์แนะนำ</p>
          <p class="text-2xl font-display font-bold text-amp-700">${result.breaker} <span class="text-sm font-sans font-medium">AT</span>${
            result.frame ? ` / ${result.frame} <span class="text-sm font-sans font-medium">AF</span>` : ''
          }</p>
          <p class="text-xs text-slate-500 mt-1">พิกัดมาตรฐาน (ตารางพิกัดเซอร์กิตเบรกเกอร์)</p>
        </div>
      </div>

      ${
        conduit
          ? `
      <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
        <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">ขนาดท่อร้อยสายแนะนำ</p>
        <p class="text-2xl font-display font-bold text-indigo-700">${conduit.mm} <span class="text-sm font-sans font-medium">(${conduit.inch})</span></p>
        <p class="text-xs text-slate-500 mt-1">รองรับสายแกนเดี่ยว ${conductorCount} เส้น (${conduit.table.code})</p>
      </div>
      `
          : ''
      }

      <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        อ้างอิงพิกัดกระแสจาก <span class="font-semibold text-slate-700">${result.table.code}</span> — สาย ${state.cableType}, กลุ่มที่ ${state.group} (${INSTALLATION_GROUPS[state.group]})${countLabel}, ลักษณะตัวนำ${coreTypeLabel}
      </div>
      `
          : ''
      }

      ${
        warnings.length
          ? `
      <div class="flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl p-4">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        <div>
          <p class="font-semibold">ข้อควรพิจารณา</p>
          <ul class="list-disc list-inside mt-0.5 space-y-0.5">
            ${warnings.map((w) => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
      `
          : ''
      }
    `;
  }

  addRowBtn.addEventListener('click', () => {
    addRow();
    calculate();
  });
  voltageInput.addEventListener('input', calculate);

  renderCableTypeButtons();
  renderGroupOptions();
  addRow();
  calculate();
})();
