/**
 * ตัว render กลางสำหรับ "หน้าเลือกตาราง" ที่ใช้ร่วมกันได้หลายหน้า
 * (เช่น หน้าตารางขนาดสายไฟ และหน้าตารางจำนวนสายในท่อร้อยสาย)
 * รับ config ของแต่ละหน้า แล้วแสดงปุ่มเลือกตาราง + ตารางหัวหลายแถวจาก headerRows
 *
 * แต่ละตารางใน `tables` ต้องมีโครงสร้าง:
 *  - id, code, title, description
 *  - headerRows : อาเรย์ของแถวหัวตาราง แต่ละแถวเป็น { label, colspan }[]
 *  - rows       : { size, values }[] โดย values เรียงลำดับให้ตรงกับคอลัมน์ใน headerRows
 */
function initTablePicker({ pickerId, contentId, tables, noteHtml, cornerLabel = 'ขนาดสาย<br/>(ตร.มม.)' }) {
  const picker = document.getElementById(pickerId);
  const content = document.getElementById(contentId);

  if (!picker || !content || !tables || !tables.length) return;

  let activeId = tables[0].id;

  function buildHeader(table) {
    const rowsHtml = table.headerRows
      .map((headerRow, idx) => {
        const isLast = idx === table.headerRows.length - 1;
        const cells = headerRow
          .map(
            (cell) =>
              `<th colspan="${cell.colspan}" class="px-3 py-2 border-b border-slate-200 text-center whitespace-normal ${
                isLast
                  ? 'font-normal text-slate-500 text-xs leading-snug bg-slate-50/50'
                  : 'font-semibold text-slate-600 bg-slate-50'
              }">${cell.label}</th>`
          )
          .join('');

        if (idx === 0) {
          return `
            <tr>
              <th rowspan="${table.headerRows.length}" class="px-4 py-2 border-b border-slate-200 text-left align-bottom font-semibold text-slate-700 bg-slate-50 sticky left-0">${cornerLabel}</th>
              ${cells}
            </tr>
          `;
        }
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return rowsHtml;
  }

  function buildBody(table) {
    return table.rows
      .map((row) => {
        const cells = row.values
          .map((v) => `<td class="px-3 py-2 text-center text-slate-700">${v === null ? '-' : v}</td>`)
          .join('');
        return `
          <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
            <td class="px-4 py-2 font-semibold text-slate-800 bg-white sticky left-0">${row.size}</td>
            ${cells}
          </tr>
        `;
      })
      .join('');
  }

  function renderTable(tableId) {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    content.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <span class="inline-block text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2">${table.code}</span>
        <h2 class="font-display text-lg font-bold text-slate-900">${table.title}</h2>
        <p class="text-sm text-slate-500 mt-1">${table.description}</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>${buildHeader(table)}</thead>
            <tbody>${buildBody(table)}</tbody>
          </table>
        </div>
      </div>

      <div class="flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl p-4">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        <div>
          <p class="font-semibold">ข้อควรทราบ</p>
          <p class="mt-0.5">${noteHtml}</p>
        </div>
      </div>
    `;
  }

  function renderPicker() {
    const buttons = tables
      .map(
        (table) => `
        <button data-table-id="${table.id}" class="table-picker-tab px-4 py-2 rounded-xl text-sm font-semibold border transition ${
          table.id === activeId
            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
        }">${table.code}</button>
      `
      )
      .join('');

    picker.innerHTML = buttons;

    picker.querySelectorAll('.table-picker-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeId = btn.getAttribute('data-table-id');
        renderPicker();
        renderTable(activeId);
      });
    });
  }

  renderPicker();
  renderTable(activeId);
}
