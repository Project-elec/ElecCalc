/**
 * ตัวคำนวณ "วงจรย่อยเครื่องทำน้ำอุ่น"
 * ใช้สาย IEC01 เท่านั้น (จึงมีแค่กลุ่มที่ 1-2 ให้เลือกตามผังการเลือกตาราง) วงจรนี้เป็นวงจรเฉพาะ
 * สำหรับเครื่องทำน้ำอุ่น 1 เครื่องต่อวงจร จึงกรอกกำลังไฟฟ้าเป็นค่าเดียว (VA) แทนรายการหลายแถว
 * แล้วคำนวณกระแสโหลด, กระแสออกแบบ (เผื่อ 125%), เลือกขนาดสาย/เบรกเกอร์/ท่อร้อยสายผ่านฟังก์ชันกลาง
 * ใน js/lib/circuitCalc.js เหมือนวงจรย่อยแสงสว่างและเต้ารับ
 */
(function () {
  const groupEl = document.getElementById('heaterGroup');
  const groupDescEl = document.getElementById('heaterGroupDesc');
  const countWrap = document.getElementById('heaterCountWrap');
  const countEl = document.getElementById('heaterCount');
  const coreTypeEl = document.getElementById('heaterCoreType');
  const coreNoteEl = document.getElementById('heaterCoreNote');
  const voltageInput = document.getElementById('heaterVoltage');
  const vaInput = document.getElementById('heaterVa');
  const resultEl = document.getElementById('heaterResult');

  if (
    !groupEl ||
    !coreTypeEl ||
    !vaInput ||
    !resultEl ||
    typeof WIRE_TABLES === 'undefined' ||
    typeof CIRCUIT_BREAKER_TABLE === 'undefined' ||
    typeof CABLE_ELIGIBILITY === 'undefined' ||
    typeof CONDUIT_FILL_TABLES === 'undefined'
  ) {
    return;
  }

  const CABLE_TYPE = 'IEC01';
  const state = { group: 1, count: 2, coreType: 'single' };
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

  function renderGroupOptions() {
    const eligibleGroups = CABLE_ELIGIBILITY[CABLE_TYPE];
    groupEl.innerHTML = eligibleGroups
      .map((g) => `<option value="${g}" ${g === state.group ? 'selected' : ''}>กลุ่มที่ ${g}</option>`)
      .join('');
    groupDescEl.textContent = INSTALLATION_GROUPS[state.group] || '';
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
    const multiAvailable = getWireColumnSpec(state.group, state.count, 'multi', null) !== null;
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

  function resolveWireAndBreaker(designCurrent) {
    const spec = getWireColumnSpec(state.group, state.count, state.coreType, null);
    if (!spec) return { error: 'ไม่มีข้อมูลตารางพิกัดกระแสสำหรับตัวเลือกนี้' };

    const table = WIRE_TABLES.find((t) => t.id === spec.tableId);
    if (!table) return { error: 'ไม่พบตารางอ้างอิงที่เลือก' };

    const picked = pickWireAndBreaker(table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS);
    if (!picked) {
      return { error: 'กระแสออกแบบสูงเกินกว่าที่ตารางนี้จะเลือกขนาดสายไฟและเบรกเกอร์ให้ได้ กรุณาเลือกลักษณะการติดตั้งอื่น' };
    }
    return { ...picked, table };
  }

  function calculate() {
    const totalVa = parseFloat(vaInput.value) || 0;
    const voltage = parseFloat(voltageInput.value) || 220;

    const loadCurrent = totalVa / voltage;
    const designCurrent = loadCurrent * 1.25;

    if (totalVa <= 0) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400">
          กรอกกำลังไฟฟ้าเครื่องทำน้ำอุ่นเพื่อเริ่มคำนวณ
        </div>
      `;
      return;
    }

    const result = resolveWireAndBreaker(designCurrent);

    const warnings = [];
    if (result.error) {
      warnings.push(result.error);
    }

    const coreTypeLabel = state.coreType === 'single' ? 'แกนเดี่ยว' : 'หลายแกน';
    const countLabel = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? `, ${state.count} ตัวนำ` : '';

    const conductorCount = GROUPS_WITH_CONDUCTOR_COUNT.includes(state.group) ? state.count : 2;
    const conduit = result.wire ? pickConduitSize(CONDUIT_FILL_TABLES, CABLE_TYPE, result.wire.size, conductorCount) : null;
    if (result.wire && !conduit) {
      warnings.push(`ไม่มีข้อมูลขนาดท่อร้อยสายสำหรับสาย ${result.wire.size} ตร.มม. ในตาราง A-1`);
    }

    resultEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-slate-800 mb-4">ผลการคำนวณ</h2>
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">กำลังไฟฟ้าเครื่องทำน้ำอุ่น (P)</dt>
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
        อ้างอิงพิกัดกระแสจาก <span class="font-semibold text-slate-700">${result.table.code}</span> — สาย ${CABLE_TYPE}, กลุ่มที่ ${state.group} (${INSTALLATION_GROUPS[state.group]})${countLabel}, ลักษณะตัวนำ${coreTypeLabel}
      </div>

      <div class="flex gap-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm rounded-xl p-4">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p>วงจรเครื่องทำน้ำอุ่นควรแยกวงจรเฉพาะ ไม่ต่อร่วมกับโหลดอื่น และต้องติดตั้งเครื่องตัดไฟรั่ว (ELCB/RCD) เพราะเป็นอุปกรณ์ที่ใช้งานใกล้น้ำ</p>
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

  vaInput.addEventListener('input', calculate);
  voltageInput.addEventListener('input', calculate);

  renderGroupOptions();
  calculate();
})();
