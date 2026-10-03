/**
 * ตัวจัดการหน้า "ขนาดสายดินของบริภัณฑ์ไฟฟ้า" (ตารางที่ 6.2)
 * เป็นตารางแบบคงที่ตารางเดียว (ไม่ต้องมีปุ่มเลือกตารางแบบหน้าตารางสายไฟ)
 */
(function () {
  const content = document.getElementById('groundWireTableContent');
  if (!content || typeof GROUND_WIRE_TABLE === 'undefined') return;

  const rows = GROUND_WIRE_TABLE.map(
    (row) => `
      <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
        <td class="px-4 py-3 text-center font-semibold text-slate-800">${row.maxBreaker.toLocaleString()}</td>
        <td class="px-4 py-3 text-center text-slate-700">${row.size}${row.note ? ' <span class="text-amber-600">*</span>' : ''}</td>
      </tr>
    `
  ).join('');

  content.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">พิกัดหรือขนาดปรับตั้งของเครื่องป้องกันกระแสเกิน ไม่เกิน (A)</th>
              <th class="px-4 py-2 border-b border-slate-200 text-center font-semibold text-slate-600">ขนาดต่ำสุดของสายดิน ตัวนำทองแดง (ตร.มม.)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl p-4">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
      <p>ขนาดสายดินของบริภัณฑ์ไฟฟ้าอ้างอิงตามพิกัดหรือขนาดปรับตั้งของเครื่องป้องกันกระแสเกินที่อยู่ด้านหน้าบริภัณฑ์ไฟฟ้านั้น เครื่องหมาย * มีเงื่อนไขเพิ่มเติมตามมาตรฐาน วสท. ควรตรวจสอบประกอบด้วย</p>
    </div>
  `;
})();
