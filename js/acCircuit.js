/**
 * ตัวคำนวณ "วงจรย่อยเครื่องปรับอากาศ"
 * ผู้ใช้เลือกขนาดเครื่องปรับอากาศ (BTU) เพื่อดึงค่าโหลด (kVA) จากตารางที่ 7.4 แล้วเลือกชนิดสาย (IEC01/NYY)
 * + ลักษณะการติดตั้ง (กลุ่มที่ 1-7) + ลักษณะตัวนำ (แกนเดี่ยว/หลายแกน) ระบบคำนวณกระแสโหลด, กระแสออกแบบ
 * (เผื่อ 125%), เลือกขนาดสาย/เบรกเกอร์/ท่อร้อยสายผ่านฟังก์ชันกลางใน js/lib/circuitCalc.js เหมือนวงจรย่อยแสงสว่าง
 */
(function () {
  const cableTypeEl = document.getElementById('acCableType');
  const btuEl = document.getElementById('acBtuType');
  const kvaNoteEl = document.getElementById('acKvaNote');
  const groupEl = document.getElementById('acGroup');
  const groupDescEl = document.getElementById('acGroupDesc');
  const trayTypeWrap = document.getElementById('acTrayTypeWrap');
  const trayTypeEl = document.getElementById('acTrayType');
  const countWrap = document.getElementById('acCountWrap');
  const countEl = document.getElementById('acCount');
  const coreTypeEl = document.getElementById('acCoreType');
  const coreNoteEl = document.getElementById('acCoreNote');
  const voltageInput = document.getElementById('acVoltage');
  const resultEl = document.getElementById('acResult');

  if (
    !cableTypeEl ||
    !btuEl ||
    !groupEl ||
    !coreTypeEl ||
    !resultEl ||
    typeof WIRE_TABLES === 'undefined' ||
    typeof CIRCUIT_BREAKER_TABLE === 'undefined' ||
    typeof CABLE_ELIGIBILITY === 'undefined' ||
    typeof CONDUIT_FILL_TABLES === 'undefined' ||
    typeof AC_LOAD_TABLE === 'undefined'
  ) {
    return;
  }

  const MIN_WIRE_SIZE = 2.5;
  const state = { cableType: 'IEC01', btuh: AC_LOAD_TABLE[0].btuh, group: 1, count: 2, coreType: 'single', trayType: TRAY_TYPES[0].id };
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

  function renderBtuButtons() {
    renderToggleGroup(
      btuEl,
      AC_LOAD_TABLE.map((row) => ({ value: String(row.btuh), label: `${row.btuh.toLocaleString()} BTU (${row.tr} TR)` })),
      String(state.btuh),
      (value) => {
        state.btuh = parseInt(value, 10);
        renderBtuButtons();
        calculate();
      }
    );
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
    groupEl.innerHTML = eligibleGroups.map((g) => `<option value="${g}" ${g === state.group ? 'selected' : ''}>กลุ่มที่ ${g}</option>`).join('');
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

  function resolveWireAndBreaker(designCurrent) {
    const spec = getWireColumnSpec(state.group, state.count, state.coreType, state.trayType);
    if (!spec) return { error: 'ไม่มีข้อมูลตารางพิกัดกระแสสำหรับตัวเลือกนี้' };

    const table = WIRE_TABLES.find((t) => t.id === spec.tableId);
    if (!table) return { error: 'ไม่พบตารางอ้างอิงที่เลือก' };

    const picked = pickWireAndBreaker(table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS, MIN_WIRE_SIZE);
    if (!picked) {
      return { error: 'กระแสออกแบบสูงเกินกว่าที่ตารางนี้จะเลือกขนาดสายไฟและเบรกเกอร์ให้ได้ กรุณาเลือกลักษณะการติดตั้งอื่น' };
    }
    return { ...picked, table };
  }

  function calculate() {
    const acRow = AC_LOAD_TABLE.find((row) => row.btuh === state.btuh);
    const kva = acRow ? acRow.kva : 0;
    const totalVa = kva * 1000;
    const voltage = parseFloat(voltageInput.value) || 220;

    const loadCurrent = totalVa / voltage;
    const designCurrent = loadCurrent * 1.25;

    kvaNoteEl.textContent = acRow ? `โหลดไฟฟ้า ${acRow.kva.toLocaleString()} kVA (${acRow.tr} ตันความเย็น) — อ้างอิงตารางที่ 7.4` : '';

    const result = resolveWireAndBreaker(designCurrent);

    const warnings = [];
    if (result.error) {
      warnings.push(result.error);
    }

    const coreTypeLabel = state.coreType === 'single' ? 'แกนเดี่ยว' : 'หลายแกน';
    const countLabel = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? `, ${state.count} ตัวนำ` : '';

    const conductorCount = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? state.count : 2;
    const conduit = result.wire ? pickConduitSize(CONDUIT_FILL_TABLES, state.cableType, result.wire.size, conductorCount) : null;
    if (result.wire && !conduit) {
      warnings.push(`ไม่มีข้อมูลขนาดท่อร้อยสายสำหรับสาย ${result.wire.size} ตร.มม. ในตาราง ${state.cableType === 'IEC01' ? 'A-1' : 'A-2'}`);
    }

    resultEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-slate-800 mb-4">ผลการคำนวณ</h2>
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">โหลดเครื่องปรับอากาศ</dt>
          <dd class="text-right font-medium text-slate-800">${kva.toLocaleString()} kVA</dd>

          <dt class="text-slate-500">กำลังไฟฟ้า (P)</dt>
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
        <p class="text-xs text-slate-500 mt-1">รองรับสาย ${conductorCount} เส้น, ลักษณะตัวนำ${coreTypeLabel} (${conduit.table.code})</p>
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

  voltageInput.addEventListener('input', calculate);

  renderBtuButtons();
  renderCableTypeButtons();
  renderGroupOptions();
  calculate();
})();
