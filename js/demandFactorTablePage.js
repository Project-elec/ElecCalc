/**
 * ตัวจัดการหน้า "ตารางดีมานด์แฟกเตอร์" (ตารางที่ 9.1-9.3) หน้าอ้างอิงล้วนๆ ไม่มีการคำนวณ
 * (การคำนวณจริงอยู่ที่การ์ด "คำนวณดีมานด์โหลด" ในแต่ละหน้าวงจรย่อย ผ่าน js/lib/demandFactorWidget.js
 * และ js/demandFactorInit.js) หน้านี้แค่แสดงตารางอ้างอิงให้ดูประกอบ
 *
 * ตัวเลขของตารางที่ 9.1 (แสงสว่าง), 9.2 (เต้ารับ) และแถวเครื่องปรับอากาศในตารางที่ 9.3 ดึงมาจาก
 * LIGHTING_DEMAND_FACTOR_TABLE / RECEPTACLE_DEMAND_FACTOR_TABLE / AC_DEMAND_FACTOR_TABLE ใน
 * js/data/demandFactorTable.js โดยตรง (แหล่งข้อมูลเดียวกับที่เครื่องคำนวณใช้จริง) เพื่อไม่ให้ตัวเลข
 * ในหน้าอ้างอิงนี้เพี้ยนไปจากที่เครื่องคำนวณใช้จริง ส่วนสูตรเครื่องหุงต้มอาหารและเครื่องทำน้ำร้อน
 * เป็นข้อความคำอธิบาย (ไม่ใช่ตัวเลขขั้นบันไดแบบ VA/ร้อยละตรงๆ) จึงเขียนข้อความตามภาพต้นฉบับโดยตรง
 */
(function () {
  const content = document.getElementById('demandFactorTableContent');
  if (!content) return;

  // แปลง tiers ของตารางที่ 9.1 เป็นข้อความ "ไม่เกิน X / X+1–Y / ส่วนเกิน Y" (หน่วย VA) ตามภาพ
  function formatVaTierLabel(tiers, index) {
    const tier = tiers[index];
    const prevLimit = index === 0 ? 0 : tiers[index - 1].upTo;
    if (tiers.length === 1) return 'ทุกขนาด';
    if (index === 0) return `ไม่เกิน ${tier.upTo.toLocaleString()}`;
    if (tier.upTo === Infinity) return `ส่วนเกิน ${prevLimit.toLocaleString()}`;
    return `${(prevLimit + 1).toLocaleString()} – ${tier.upTo.toLocaleString()}`;
  }

  // แปลง tiers ของตารางที่ 9.2 เป็นข้อความ "X kVA แรก / ส่วนที่เกิน X kVA" (หน่วย kVA) ตามภาพ
  function formatKvaTierLabel(tiers, index) {
    const tier = tiers[index];
    const prevLimit = index === 0 ? 0 : tiers[index - 1].upTo;
    const kva = (va) => (va / 1000).toLocaleString();
    if (index === 0) return `${kva(tier.upTo)} kVA แรก`;
    return `ส่วนที่เกิน ${kva(prevLimit)} kVA`;
  }

  function buildTable91() {
    if (typeof LIGHTING_DEMAND_FACTOR_TABLE === 'undefined') return '';
    const rows = LIGHTING_DEMAND_FACTOR_TABLE.flatMap((row) =>
      row.tiers.map((tier, i) => ({
        buildingLabel: i === 0 ? row.label : null,
        rowspan: row.tiers.length,
        vaLabel: formatVaTierLabel(row.tiers, i),
        percent: tier.percent,
      }))
    );

    return `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-5 pt-4 pb-2">
          <h2 class="font-semibold text-slate-800">ตารางที่ 9.1 ดีมานด์แฟกเตอร์สำหรับโหลดแสงสว่าง</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ชนิดของอาคาร</th>
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ขนาดของไฟแสงสว่าง (VA)</th>
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ดีมานด์แฟกเตอร์ (%)</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  ${r.buildingLabel !== null ? `<td class="px-4 py-3 text-slate-700 align-top" rowspan="${r.rowspan}">${r.buildingLabel}</td>` : ''}
                  <td class="px-4 py-3 text-center text-slate-700">${r.vaLabel}</td>
                  <td class="px-4 py-3 text-center font-semibold text-slate-800">${r.percent}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <p class="px-5 pt-2 pb-4 text-xs text-slate-400">* โรงพยาบาลและโรงแรม ไม่ใช่ที่พักอาศัย โหลดเต้ารับของสถานที่เหล่านี้จึงต้องใช้ดีมานด์แฟกเตอร์ตามตารางที่ 9.2 แยกต่างหาก (ไม่รวมอยู่ในตารางนี้)</p>
      </div>
    `;
  }

  function buildTable92() {
    if (typeof RECEPTACLE_DEMAND_FACTOR_TABLE === 'undefined') return '';
    const nonResidential = RECEPTACLE_DEMAND_FACTOR_TABLE.find((r) => r.id === 'non_residential');
    if (!nonResidential) return '';

    const rows = nonResidential.tiers.map((tier, i) => ({
      vaLabel: formatKvaTierLabel(nonResidential.tiers, i),
      percent: tier.percent,
    }));

    return `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-5 pt-4 pb-2">
          <h2 class="font-semibold text-slate-800">ตารางที่ 9.2 ดีมานด์แฟกเตอร์สำหรับโหลดเต้ารับในสถานที่ที่ไม่ใช่ที่พักอาศัย</h2>
          <p class="text-xs text-slate-400 mt-1">โหลดเต้ารับของสถานที่ที่ไม่ใช่ที่พักอาศัย ให้ใช้ดีมานด์แฟกเตอร์ตามตารางนี้ (คำนวณโหลดเต้ารับที่ 180 VA ต่อจุด)</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">โหลดของเต้ารับรวม</th>
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ดีมานด์แฟกเตอร์ (%)</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td class="px-4 py-3 text-center text-slate-700">${r.vaLabel}</td>
                  <td class="px-4 py-3 text-center font-semibold text-slate-800">${r.percent}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <p class="px-5 pt-2 pb-4 text-xs text-slate-400">ที่พักอาศัย: ไม่มีตารางแยก โหลดเต้ารับนับรวมอยู่ในโหลดแสงสว่าง (ตารางที่ 9.1) แล้ว จึงใช้ดีมานด์แฟกเตอร์ 100%</p>
      </div>
    `;
  }

  function acPercent(id) {
    if (typeof AC_DEMAND_FACTOR_TABLE === 'undefined') return '-';
    const row = AC_DEMAND_FACTOR_TABLE.find((r) => r.id === id);
    return row ? row.tiers[0].percent : '-';
  }

  function buildTable93() {
    // เครื่องหุงต้มอาหารและเครื่องทำน้ำร้อนเป็นสูตรข้อความ (ไม่ใช่ตัวเลขขั้นบันไดแบบ 9.1/9.2) จึง
    // เขียนตามภาพต้นฉบับตรงๆ ส่วนเครื่องปรับอากาศดึงตัวเลขจาก AC_DEMAND_FACTOR_TABLE จริง
    const groups = [
      {
        building: '1. อาคารที่อยู่อาศัย',
        rows: [
          { load: 'เครื่องหุงต้มอาหาร', df: '10 แอมแปร์ + ร้อยละ 30 ของส่วนที่เกิน 10 แอมแปร์' },
          { load: 'เครื่องทำน้ำร้อน', df: 'กระแสใช้งานจริงของสองวงจรแรกที่ใช้งาน + ร้อยละ 25 ของที่เหลือทั้งหมด' },
          { load: 'เครื่องปรับอากาศ', df: `ร้อยละ ${acPercent('residential')}` },
        ],
      },
      {
        building: '2. อาคารสำนักงานและร้านค้าทั่วไป รวมถึงห้างสรรพสินค้า',
        rows: [
          { load: 'เครื่องหุงต้มอาหาร', df: 'กระแสใช้งานจริงของสองวงจรที่ใหญ่ที่สุด + ร้อยละ 80 ของตัวใหญ่รองลงมา + ร้อยละ 60 ของที่เหลือทั้งหมด' },
          { load: 'เครื่องทำน้ำร้อน', df: 'ร้อยละ 100 ของสองวงจรแรกที่ใหญ่ที่สุด + ร้อยละ 25 ของที่เหลือทั้งหมด' },
          { load: 'เครื่องปรับอากาศ', df: `ร้อยละ ${acPercent('office_retail')}` },
        ],
      },
      {
        building: '3. โรงแรม และอาคารประเภทอื่น',
        rows: [
          { load: 'เครื่องหุงต้มอาหาร', df: 'เหมือนข้อ 2' },
          { load: 'เครื่องทำน้ำร้อน', df: 'เหมือนข้อ 2' },
          { load: 'เครื่องปรับอากาศ', df: `ประเภทแยกแต่ละห้อง ร้อยละ ${acPercent('hotel')}` },
        ],
      },
    ];

    const bodyRows = groups.flatMap((g) =>
      g.rows.map((r, i) => ({
        buildingLabel: i === 0 ? g.building : null,
        rowspan: g.rows.length,
        load: r.load,
        df: r.df,
      }))
    );

    return `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-5 pt-4 pb-2">
          <h2 class="font-semibold text-slate-800">ตารางที่ 9.3 ดีมานด์แฟกเตอร์สำหรับเครื่องใช้ไฟฟ้าทั่วไป</h2>
          <p class="text-xs text-slate-400 mt-1">โหลดเครื่องใช้ไฟฟ้าทั่วไป อนุญาตให้ใช้ดีมานด์แฟกเตอร์ตามตารางนี้</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ชนิดของอาคาร</th>
                <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ประเภทของโหลด</th>
                <th class="px-4 py-2 border-b border-slate-200 text-left font-semibold text-slate-600">ดีมานด์แฟกเตอร์</th>
              </tr>
            </thead>
            <tbody>
              ${bodyRows
                .map(
                  (r) => `
                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  ${r.buildingLabel !== null ? `<td class="px-4 py-3 text-slate-700 align-top" rowspan="${r.rowspan}">${r.buildingLabel}</td>` : ''}
                  <td class="px-4 py-3 text-center text-slate-700 whitespace-nowrap">${r.load}</td>
                  <td class="px-4 py-3 text-slate-700">${r.df}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <p class="px-5 pt-2 pb-4 text-xs text-slate-400">หมายเหตุ: เว็บนี้มีเครื่องคำนวณดีมานด์โหลดให้เฉพาะแถว "เครื่องทำน้ำร้อน" (หน้าเครื่องทำน้ำอุ่น) และ "เครื่องปรับอากาศ" (หน้าเครื่องปรับอากาศ) ยังไม่มีเครื่องคำนวณวงจรย่อยเครื่องหุงต้มอาหารแยกต่างหาก จึงยังไม่ได้เพิ่มเครื่องคำนวณดีมานด์โหลดของแถวนี้</p>
      </div>
    `;
  }

  content.innerHTML = `
    ${buildTable91()}
    ${buildTable92()}
    ${buildTable93()}
  `;
})();
