/**
 * ตัวจัดการหน้า "ตารางโหลดเครื่องปรับอากาศ" (ตารางที่ 7.4)
 * เป็นตารางแบบคงที่ตารางเดียว (ไม่ต้องมีปุ่มเลือกตารางแบบหน้าตารางสายไฟ)
 */
(function () {
  const content = document.getElementById('acLoadTableContent');
  if (!content || typeof AC_LOAD_TABLE === 'undefined') return;

  const rows = AC_LOAD_TABLE.map(
    (row) => `
      <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
        <td class="px-4 py-3 text-center font-semibold text-slate-800">${row.tr}</td>
        <td class="px-4 py-3 text-center text-slate-700">${row.btuh.toLocaleString()}</td>
        <td class="px-4 py-3 text-center text-slate-700">${row.kva}</td>
      </tr>
    `
  ).join('');

  content.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th colspan="2" class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ความจุ (Capacity)</th>
              <th rowspan="2" class="px-4 py-2 border-b border-slate-200 text-center align-middle font-semibold text-slate-600">โหลด<br/>(kVA)</th>
            </tr>
            <tr class="bg-slate-50/70">
              <th class="px-4 py-2 border-b border-slate-200 text-center font-medium text-slate-500">ตันความเย็น (TR)</th>
              <th class="px-4 py-2 border-b border-slate-200 text-center font-medium text-slate-500">BTUH</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl p-4">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
      <p>ค่าโหลด (kVA) เป็นค่าอ้างอิงโดยประมาณสำหรับเครื่องปรับอากาศแบบแยกส่วน (Split Type) ระบบ 1 เฟส 230V การเลือกใช้งานจริงควรตรวจสอบพิกัดกระแส/กำลังไฟฟ้าจากป้ายเครื่อง (Nameplate) ของเครื่องปรับอากาศแต่ละรุ่นประกอบด้วย</p>
    </div>
  `;
})();
