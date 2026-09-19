/**
 * ตัวจัดการหน้า "ตารางพิกัดเซอร์กิตเบรกเกอร์"
 * ต่างจากตารางกระแสสาย/ท่อร้อยสาย เพราะแต่ละแถวมีจำนวนค่าพิกัดตัดวงจรไม่เท่ากัน
 * (เป็นรายการค่า ไม่ใช่กริดตัวเลขตามคอลัมน์คงที่) จึง render แบบเฉพาะของตัวเอง
 */
(function () {
  const content = document.getElementById('breakerTableContent');
  if (!content || typeof CIRCUIT_BREAKER_TABLE === 'undefined') return;

  function renderTrip(row) {
    return row.trip
      .map((v) => {
        const isHighlight = row.highlightTrip.includes(v);
        return `<span class="${isHighlight ? 'text-red-600 font-semibold' : ''}">${v}</span>`;
      })
      .join(', ');
  }

  function renderRows() {
    return CIRCUIT_BREAKER_TABLE.map(
      (row) => `
        <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
          <td class="px-4 py-3 text-center font-semibold text-slate-800 bg-brand-50/40">${row.frame}</td>
          <td class="px-4 py-3 text-slate-700">${renderTrip(row)}</td>
          <td class="px-4 py-3 text-center text-slate-600 whitespace-nowrap">${row.type}</td>
        </tr>
      `
    ).join('');
  }

  content.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-4 py-3 border-b border-slate-200 text-center font-semibold text-slate-600 whitespace-nowrap">Ampere Frame</th>
              <th class="px-4 py-3 border-b border-slate-200 text-left font-semibold text-slate-600">Ampere Trip</th>
              <th class="px-4 py-3 border-b border-slate-200 text-center font-semibold text-slate-600 whitespace-nowrap">TYPE</th>
            </tr>
          </thead>
          <tbody>${renderRows()}</tbody>
        </table>
      </div>
    </div>

    <div class="flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl p-4">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
      <div>
        <p class="font-semibold">ข้อควรทราบ</p>
        <p class="mt-0.5">ตารางนี้แสดงพิกัดตัดวงจร (Ampere Trip) มาตรฐานที่มีจำหน่ายทั่วไปตามขนาดเฟรม (Ampere Frame) ของแต่ละชนิดเบรกเกอร์ เพื่อการศึกษา การเลือกใช้งานจริงควรตรวจสอบรุ่นและพิกัดที่ผู้ผลิตแต่ละรายมีจำหน่ายจริงประกอบด้วย</p>
      </div>
    </div>
  `;
})();
