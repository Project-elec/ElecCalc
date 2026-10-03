/**
 * ตัวคำนวณ "สายเมน (สายประธาน)" (Main / Service Entrance)
 * ต่างจากวงจรย่อยและสายป้อนตรงที่: (1) กรอกโหลดรวม (VA) ของอาคาร เผื่อหม้อแปลงคงที่ 130% แล้วปัดขึ้นเป็น
 * ขนาดหม้อแปลงมาตรฐาน (STANDARD_TRANSFORMER_SIZES_KVA ใน js/data/mainGroups.js) ก่อนคำนวณกระแส
 * (2) เลือกได้ทั้งระบบ 1 เฟส (I = P/V) และ 3 เฟส (I = P/(√3×V)) โดย P คือขนาดหม้อแปลงที่ปัดขึ้นแล้ว
 * (3) ใช้ได้เฉพาะชนิดสาย NYY (70°C) หรือ CV (90°C) และลักษณะการเดินสาย: กลุ่มที่ 3 (เกาะผนังในอากาศ,
 * ตารางที่ 5-21), กลุ่มที่ 5/6 (ร้อยท่อฝังดิน/ฝังดินโดยตรง, ตารางที่ 5-23 หรือ 5-29) หรือกลุ่มที่ 7
 * (วางบนรางเคเบิล, ตารางที่ 5-30 ถึง 5-33 ตามรูปแบบราง) ตามข้อมูลใน js/data/mainGroups.js
 * (4) เบรกเกอร์ไม่จำกัดเฟรมที่ 100A เหมือนวงจรย่อย เพราะสายเมนมักต้องใช้พิกัดสูงกว่ามาก (5) แสดงผล
 * 2 รูปแบบคู่กันให้เทียบกัน คือ "เส้นเดียวต่อเฟส" (pickWireAndBreaker ปกติ) และ "หลายเส้นขนานต่อเฟส"
 * (pickParallelWireAndBreaker ไล่จำนวนเส้นขนานน้อยที่สุดก่อน) เนื่องจากกระแสออกแบบของสายเมนมักสูงเกิน
 * กว่าสายเส้นเดียวจะรับไหว (6) ท่อร้อยสายคำนวณให้เฉพาะกลุ่มที่ 5 เท่านั้น (7) แสดงขนาดสายดิน (G)
 * ตามพิกัดเบรกเกอร์ที่เลือกได้ อ้างอิงตารางที่ 6.2 ใน js/data/groundWireTable.js
 *
 * ยังไม่รวม: ขนาดสายต่อหลักดิน (ตารางที่ 6.1) และขนาดรางเดินสายไฟ (สูตรเส้นผ่าศูนย์กลางสาย)
 * เนื่องจากยังไม่มีข้อมูลตารางครบถ้วน
 */
(function () {
  const phaseEl = document.getElementById('mainPhase');
  const voltageInput = document.getElementById('mainVoltage');
  const vaInput = document.getElementById('mainVa');
  const cableTypeEl = document.getElementById('mainCableType');
  const groupEl = document.getElementById('mainGroup');
  const groupDescEl = document.getElementById('mainGroupDesc');
  const trayShapeWrap = document.getElementById('mainTrayShapeWrap');
  const trayShapeEl = document.getElementById('mainTrayShape');
  const trayArrangementEl = document.getElementById('mainTrayArrangement');
  const insulationTypeWrap = document.getElementById('mainInsulationTypeWrap');
  const insulationTypeEl = document.getElementById('mainInsulationType');
  const countWrap = document.getElementById('mainCountWrap');
  const countEl = document.getElementById('mainCount');
  const fixedCountNoteEl = document.getElementById('mainFixedCountNote');
  const coreTypeWrap = document.getElementById('mainCoreTypeWrap');
  const coreTypeEl = document.getElementById('mainCoreType');
  const resultEl = document.getElementById('mainResult');

  if (
    !phaseEl ||
    !cableTypeEl ||
    !groupEl ||
    !trayShapeEl ||
    !insulationTypeEl ||
    !coreTypeEl ||
    !resultEl ||
    typeof WIRE_TABLES === 'undefined' ||
    typeof CIRCUIT_BREAKER_TABLE === 'undefined' ||
    typeof CONDUIT_FILL_TABLES === 'undefined' ||
    typeof MAIN_CABLE_ELIGIBILITY === 'undefined' ||
    typeof MAIN_TRAY_SHAPES === 'undefined' ||
    typeof MAIN_TRAY_ARRANGEMENTS === 'undefined' ||
    typeof GROUND_WIRE_TABLE === 'undefined'
  ) {
    return;
  }

  const MAIN_GROUPS_WITH_COUNT = [5];
  const MAIN_GROUPS_WITH_FIXED_COUNT_NOTE = [6];
  // เผื่อหม้อแปลงคงที่ 130% ของโหลดรวม (ไม่ให้ผู้ใช้ปรับเอง)
  const TRANSFORMER_MARGIN_MULTIPLIER = 1.3;

  const state = {
    phase: '3phase',
    cableType: 'NYY',
    group: 5,
    count: 3,
    coreType: 'single',
    trayShape: MAIN_TRAY_SHAPES[0].id,
    trayArrangementCol: null,
    // ใช้เฉพาะสาย CV กลุ่มที่ 3 (ตารางที่ 5-21 มีคอลัมน์ IEC 60502-1 ทั้งฝั่ง 70°C และ 90°C)
    // ค่าเริ่มต้น 'xlpe' เพราะเป็นสเปกทั่วไปของสาย CV (ครอสลิงค์พอลิเอทิลีน 90°C)
    insulationType: 'xlpe',
  };
  // เบรกเกอร์สายเมนไม่จำกัดเฟรมที่ 100A เหมือนวงจรย่อย เปิดช่วงเต็มตามตารางพิกัดเซอร์กิตเบรกเกอร์
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
        { value: '3phase', label: '3 เฟส 400V' },
      ],
      state.phase,
      (value) => {
        state.phase = value;
        voltageInput.value = value === '3phase' ? 400 : 220;
        if (value === '3phase') {
          state.count = 3;
          renderCountButtons();
        }
        renderPhaseButtons();
        calculate();
      }
    );
  }

  function renderCableTypeButtons() {
    renderToggleGroup(
      cableTypeEl,
      Object.keys(MAIN_CABLE_ELIGIBILITY).map((v) => ({ value: v, label: v })),
      state.cableType,
      (value) => {
        state.cableType = value;
        renderCableTypeButtons();
        renderGroupOptions();
      }
    );
  }

  function renderInsulationTypeButtons() {
    renderToggleGroup(
      insulationTypeEl,
      [
        { value: 'xlpe', label: 'ครอสลิงค์พอลิเอทิลีน 90°C' },
        { value: 'pvc', label: 'พีวีซี 70°C' },
      ],
      state.insulationType,
      (value) => {
        state.insulationType = value;
        renderInsulationTypeButtons();
        calculate();
      }
    );
  }

  function renderGroupOptions() {
    const eligibleGroups = MAIN_CABLE_ELIGIBILITY[state.cableType];
    groupEl.innerHTML = eligibleGroups
      .map((g) => `<option value="${g}" ${g === state.group ? 'selected' : ''}>กลุ่มที่ ${g}</option>`)
      .join('');
    groupDescEl.textContent = INSTALLATION_GROUPS[state.group] || '';

    trayShapeWrap.classList.toggle('hidden', state.group !== 7);
    if (state.group === 7 && trayShapeEl.innerHTML === '') {
      trayShapeEl.innerHTML = MAIN_TRAY_SHAPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
    }
    if (state.group === 7) {
      renderTrayArrangementOptions();
    }

    insulationTypeWrap.classList.toggle('hidden', !(state.group === 3 && state.cableType === 'CV'));
    if (state.group === 3 && state.cableType === 'CV') {
      renderInsulationTypeButtons();
    }

    countWrap.classList.toggle('hidden', !MAIN_GROUPS_WITH_COUNT.includes(state.group));
    fixedCountNoteEl.classList.toggle('hidden', !MAIN_GROUPS_WITH_FIXED_COUNT_NOTE.includes(state.group));
    if (state.group === 6) {
      fixedCountNoteEl.textContent = 'จำนวนตัวนำกระแสไม่เกิน 3 เส้น (สายฝังดินโดยตรง ค่าพิกัดกระแสเท่ากันทั้งแกนเดี่ยวและหลายแกน)';
    }

    renderCountButtons();
  }

  function renderTrayArrangementOptions() {
    const options = (MAIN_TRAY_ARRANGEMENTS[state.trayShape] || []).filter((a) => a.coreType === state.coreType);
    if (!options.some((a) => a.col === state.trayArrangementCol)) {
      state.trayArrangementCol = options.length ? options[0].col : null;
    }
    trayArrangementEl.innerHTML = options
      .map((a) => `<option value="${a.col}" ${a.col === state.trayArrangementCol ? 'selected' : ''}>${a.label}</option>`)
      .join('');
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
    const multiAvailable =
      getMainWireColumnSpec(state.cableType, state.group, state.count, 'multi', state.trayShape, state.trayArrangementCol, state.insulationType) !==
      null;
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
    if (state.group === 7) {
      renderTrayArrangementOptions();
    }
  }

  groupEl.addEventListener('change', () => {
    state.group = parseInt(groupEl.value, 10);
    renderGroupOptions();
  });

  trayShapeEl.addEventListener('change', () => {
    state.trayShape = trayShapeEl.value;
    state.trayArrangementCol = null;
    renderCoreTypeButtons();
    calculate();
  });

  trayArrangementEl.addEventListener('change', () => {
    state.trayArrangementCol = parseInt(trayArrangementEl.value, 10);
    calculate();
  });

  function resolveSpec() {
    const spec = getMainWireColumnSpec(
      state.cableType,
      state.group,
      state.count,
      state.coreType,
      state.trayShape,
      state.trayArrangementCol,
      state.insulationType
    );
    if (!spec) return null;
    const table = WIRE_TABLES.find((t) => t.id === spec.tableId);
    if (!table) return null;
    return { table, cols: spec.cols };
  }

  function renderResultCard(label, result, conductorCountForConduit) {
    if (!result) {
      return `
        <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-5 text-center text-sm text-slate-400">
          ${label}: ไม่สามารถเลือกขนาดสายไฟและเบรกเกอร์ให้ได้ด้วยตัวเลือกนี้
        </div>
      `;
    }

    const coreTypeLabel = state.coreType === 'single' ? 'แกนเดี่ยว' : 'หลายแกน';
    const conduit =
      state.group === 5 ? pickConduitSize(CONDUIT_FILL_TABLES, state.cableType, result.wire.size, conductorCountForConduit) : null;
    const groundWire = pickGroundWireSize(GROUND_WIRE_TABLE, result.breaker);

    return `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h3 class="font-semibold text-slate-800">${label}</h3>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-center">
            <p class="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">ขนาดสายไฟแนะนำ</p>
            <p class="text-2xl font-display font-bold text-brand-700">${result.wire.size} <span class="text-sm font-sans font-medium">ตร.มม.</span></p>
            <p class="text-xs text-slate-500 mt-1">พิกัดกระแส ${result.wire.ampacity} A${
              result.parallelCount ? ` × ${result.parallelCount} เส้น/เฟส = ${result.totalCapacity} A` : ''
            }</p>
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
          <p class="text-xs text-slate-500 mt-1">รองรับสาย ${conductorCountForConduit} เส้น, ลักษณะตัวนำ${coreTypeLabel} (${conduit.table.code})</p>
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
      </div>
    `;
  }

  function calculate() {
    const totalVa = parseFloat(vaInput.value) || 0;
    const voltage = parseFloat(voltageInput.value) || (state.phase === '3phase' ? 400 : 220);

    if (totalVa <= 0) {
      resultEl.innerHTML = `
        <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400">
          กรอกกำลังไฟฟ้ารวมของอาคารเพื่อเริ่มคำนวณ
        </div>
      `;
      return;
    }

    const loadWithMargin = totalVa * TRANSFORMER_MARGIN_MULTIPLIER;
    const transformerKva = pickStandardTransformerSize(loadWithMargin / 1000);

    const warnings = [];
    if (!transformerKva) {
      warnings.push(`โหลดที่เผื่อหม้อแปลงแล้ว (${Math.round(loadWithMargin).toLocaleString()} VA) เกินกว่าขนาดหม้อแปลงมาตรฐานสูงสุดที่มีในรายการ`);
    }
    const transformerVa = (transformerKva || loadWithMargin / 1000) * 1000;

    const loadCurrent = state.phase === '3phase' ? transformerVa / (Math.sqrt(3) * voltage) : transformerVa / voltage;
    const designCurrent = loadCurrent * 1.25;

    const spec = resolveSpec();
    if (!spec) {
      warnings.push('ไม่มีข้อมูลตารางพิกัดกระแสสำหรับตัวเลือกนี้');
    }

    const singleResult = spec ? pickWireAndBreaker(spec.table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS) : null;
    const parallelResult = spec ? pickParallelWireAndBreaker(spec.table, spec.cols, designCurrent, STANDARD_BREAKER_SIZES, BREAKER_ROWS) : null;

    const conductorCountForConduit = state.count;
    const parallelConductorCountForConduit = parallelResult ? state.count * parallelResult.parallelCount : state.count;

    const trayArrangementOption =
      state.group === 7 ? (MAIN_TRAY_ARRANGEMENTS[state.trayShape] || []).find((a) => a.col === state.trayArrangementCol) : null;
    const trayArrangementLabel = trayArrangementOption ? `, ${trayArrangementOption.label}` : '';
    const insulationLabel =
      state.group === 3 && state.cableType === 'CV' ? `, ฉนวน${state.insulationType === 'pvc' ? 'พีวีซี 70°C' : 'ครอสลิงค์พอลิเอทิลีน 90°C'}` : '';

    resultEl.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-slate-800 mb-4">ผลการคำนวณ</h2>
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">โหลดรวม + เผื่อหม้อแปลง (130%)</dt>
          <dd class="text-right font-medium text-slate-800">${Math.round(loadWithMargin).toLocaleString()} VA</dd>

          <dt class="text-slate-500">ขนาดหม้อแปลงที่แนะนำ</dt>
          <dd class="text-right font-medium text-slate-800">${transformerKva ? transformerKva.toLocaleString() + ' kVA' : '-'}</dd>

          <dt class="text-slate-500">กระแสโหลด (I)</dt>
          <dd class="text-right font-medium text-slate-800">${loadCurrent.toFixed(2)} A</dd>

          <dt class="text-slate-500">กระแสออกแบบ (125%)</dt>
          <dd class="text-right font-medium text-brand-700">${designCurrent.toFixed(2)} A</dd>
        </dl>
      </div>

      ${renderResultCard('เส้นเดียวต่อเฟส', singleResult, conductorCountForConduit)}
      ${renderResultCard('หลายเส้นขนานต่อเฟส', parallelResult, parallelConductorCountForConduit)}

      ${
        spec
          ? `
      <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        อ้างอิงพิกัดกระแสจาก <span class="font-semibold text-slate-700">${spec.table.code}</span> — สาย ${state.cableType}, กลุ่มที่ ${state.group} (${INSTALLATION_GROUPS[state.group]})${
          MAIN_GROUPS_WITH_COUNT.includes(state.group) ? `, ${state.count} ตัวนำ` : ''
        }, ลักษณะตัวนำ${state.coreType === 'single' ? 'แกนเดี่ยว' : 'หลายแกน'}${insulationLabel}${trayArrangementLabel}
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
  renderCableTypeButtons();
  renderGroupOptions();
  calculate();
})();
