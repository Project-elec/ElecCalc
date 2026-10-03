/**
 * ตัวคำนวณ "สายป้อน" (Feeder)
 * ใช้สาย IEC01 เท่านั้น (จึงมีแค่กลุ่มที่ 1 เดินในฝ้าเพดาน และกลุ่มที่ 2 เกาะผนัง/ฝังผนัง ให้เลือก
 * ตามตารางที่ 5-20 เหมือนวงจรย่อย) ต่างจากวงจรย่อยตรงที่: (1) กรอกกำลังไฟฟ้ารวม (VA) ค่าเดียวแทน
 * รายการโหลดย่อย ไม่มีตัวคูณความต้องการใช้ไฟ (Demand Factor) รวมโหลดตรงๆ แล้วคูณ 1.25 เหมือนวงจรย่อยอื่น
 * (2) เลือกได้ทั้งระบบ 1 เฟส (I = P/V) และ 3 เฟส (I = P/(√3×V)) (3) เบรกเกอร์ไม่จำกัดเฟรมที่ 100A
 * เพราะสายป้อนมักต้องใช้พิกัดสูงกว่าวงจรย่อย (4) แสดงขนาดสายดิน (G) ตามพิกัดเบรกเกอร์ที่เลือกได้
 * อ้างอิงตารางที่ 6.2 ใน js/data/groundWireTable.js
 */
(function () {
  const phaseEl = document.getElementById('feederPhase');
  const voltageInput = document.getElementById('feederVoltage');
  const vaInput = document.getElementById('feederVa');
  const groupEl = document.getElementById('feederGroup');
  const groupDescEl = document.getElementById('feederGroupDesc');
  const countWrap = document.getElementById('feederCountWrap');
  const countEl = document.getElementById('feederCount');
  const coreTypeWrap = document.getElementById('feederCoreTypeWrap');
  const coreTypeEl = document.getElementById('feederCoreType');
  const resultEl = document.getElementById('feederResult');

  if (
    !phaseEl ||
    !groupEl ||
    !coreTypeEl ||
    !resultEl ||
    typeof WIRE_TABLES === 'undefined' ||
    typeof CIRCUIT_BREAKER_TABLE === 'undefined' ||
    typeof CONDUIT_FILL_TABLES === 'undefined' ||
    typeof FEEDER_ELIGIBLE_GROUPS === 'undefined' ||
    typeof GROUND_WIRE_TABLE === 'undefined'
  ) {
    return;
  }

  const CABLE_TYPE = 'IEC01';

  const state = {
    phase: '1phase',
    group: FEEDER_ELIGIBLE_GROUPS[0],
    count: 3,
    coreType: 'single',
  };
  // เบรกเกอร์สายป้อนไม่จำกัดเฟรมที่ 100A เหมือนวงจรย่อย เปิดช่วงเต็มตามตารางพิกัดเซอร์กิตเบรกเกอร์
  const { sizes: STANDARD_BREAKER_SIZES, rows: BREAKER_ROWS } = getStandardBreakerSizes(CIRCUIT_BREAKER_TABLE, 6000);

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

  function renderPhaseButtons() {
    renderToggleGroup(
      phaseEl,
      [
        { value: '1phase', label: '1 เฟส 220V' },
        { value: '3phase', label: '3 เฟส 380V' },
      ],
      state.phase,
      (value) => {
        state.phase = value;
        voltageInput.value = value === '3phase' ? 380 : 220;
        if (value === '3phase') {
          state.count = 3;
          renderCountButtons();
        }
        renderPhaseButtons();
        calculate();
      }
    );
  }

  function renderGroupOptions() {
    groupEl.innerHTML = FEEDER_ELIGIBLE_GROUPS.map((g) => `<option value="${g}" ${g === state.group ? 'selected' : ''}>กลุ่มที่ ${g}</option>`).join(
      ''
    );
    groupDescEl.textContent = INSTALLATION_GROUPS[state.group] || '';
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
    const multiAvailable = getFeederWireColumnSpec(state.group, state.count, 'multi') !== null;
    if (!multiAvailable && state.coreType === 'multi') {
      state.coreType = 'single';
    }
    coreTypeWrap.classList.toggle('hidden', !multiAvailable);
    if (multiAvailable) {
      renderToggleGroup(
        coreTypeEl,
        [
          { value: 'single', label: 'แกนเดี่ยว' },
          { value: 'multi', label: 'หลายแกน' },
        ],
        state.coreType,
        (value) => {
          state.coreType = value;
          renderCoreTypeButtons();
          calculate();
        }
      );
    }
  }

  groupEl.addEventListener('change', () => {
    state.group = parseInt(groupEl.value, 10);
    renderGroupOptions();
  });

  function resolveWireAndBreaker(designCurrent) {
    const spec = getFeederWireColumnSpec(state.group, state.count, state.coreType);
    if (!spec) return { error: 'ไม่มีข้อมูลตารางพิกัดกระแสสำหรับตัวเลือกนี้' };

    const table = WIRE_TABLES.find((t) => t.id === spec.tableId);
    if (!table) return { error: 'ไม่พบตารางอ้างอิงที่เลือก' };

    const picked = pickWireAndBreaker(table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS);
    if (!picked) {
      return { error: 'กระแสออกแบบสูงเกินกว่าที่ตารางนี้จะเลือกขนาดสายไฟและเบรกเกอร์ให้ได้ กรุณาแยกสายป้อนหรือเลือกลักษณะการติดตั้งอื่น' };
    }
    return { ...picked, table };
  }

  function calculate() {
    const totalVa = parseFloat(vaInput.value) || 0;
    const voltage = parseFloat(voltageInput.value) || (state.phase === '3phase' ? 380 : 220);

    const loadCurrent = state.phase === '3phase' ? totalVa / (Math.sqrt(3) * voltage) : totalVa / voltage;
    const designCurrent = loadCurrent * 1.25;

    if (totalVa <= 0) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400">
          กรอกกำลังไฟฟ้ารวมของสายป้อนเพื่อเริ่มคำนวณ
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
    const countLabel = `, ${state.count} ตัวนำ`;

    const conduit = result.wire ? pickConduitSize(CONDUIT_FILL_TABLES, CABLE_TYPE, result.wire.size, state.count) : null;
    if (result.wire && !conduit) {
      warnings.push(`ไม่มีข้อมูลขนาดท่อร้อยสายสำหรับสาย ${result.wire.size} ตร.มม. ในตาราง A-1`);
    }

    const groundWire = result.breaker !== undefined ? pickGroundWireSize(GROUND_WIRE_TABLE, result.breaker) : null;
    if (result.wire && !groundWire) {
      warnings.push(`ไม่มีข้อมูลขนาดสายดินสำหรับเบรกเกอร์พิกัด ${result.breaker} A ในตารางที่ 6.2 (เกินช่วงที่มีข้อมูล)`);
    }

    resultEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-slate-800 mb-4">ผลการคำนวณ</h2>
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">กำลังไฟฟ้ารวม (P)</dt>
          <dd class="text-right font-medium text-slate-800">${totalVa.toLocaleString()} VA</dd>

          <dt class="text-slate-500">กระแสโหลด (I)</dt>
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
        <p class="text-xs text-slate-500 mt-1">รองรับสาย ${state.count} เส้น, ลักษณะตัวนำ${coreTypeLabel} (${conduit.table.code})</p>
      </div>
      `
          : ''
      }

      ${
        groundWire
          ? `
      <div class="bg-lime-50 border border-lime-100 rounded-2xl p-4 text-center">
        <p class="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">ขนาดสายดิน (G) แนะนำ</p>
        <p class="text-2xl font-display font-bold text-lime-700">${groundWire.size} <span class="text-sm font-sans font-medium">ตร.มม.</span>${
              groundWire.note ? ' <span class="text-sm font-sans font-medium">*</span>' : ''
            }</p>
        <p class="text-xs text-slate-500 mt-1">ตามพิกัดเครื่องป้องกันกระแสเกิน ไม่เกิน ${groundWire.maxBreaker} A (ตารางที่ 6.2)</p>
      </div>
      `
          : ''
      }

      <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        อ้างอิงพิกัดกระแสจาก <span class="font-semibold text-slate-700">${result.table.code}</span> — สาย ${CABLE_TYPE}, กลุ่มที่ ${state.group} (${INSTALLATION_GROUPS[state.group]})${countLabel}, ลักษณะตัวนำ${coreTypeLabel}
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

  renderPhaseButtons();
  renderGroupOptions();
  calculate();
})();
