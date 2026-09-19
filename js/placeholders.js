/**
 * เนื้อหา placeholder สำหรับหน้าเครื่องคำนวณที่ยังไม่เปิดใช้งาน
 * ใช้ config เดียวกันเพื่อลดโค้ดซ้ำ และเพิ่มหน้าใหม่ได้ง่ายในอนาคต
 */
(function () {
  const PLACEHOLDERS = [
    {
      id: 'page-calc-feeder',
      title: 'คำนวณสายป้อน',
      desc: 'คำนวณขนาดสายป้อน (Feeder) ที่รวมโหลดจากวงจรย่อยหลายวงจรก่อนเข้าแผงย่อย',
      color: 'slate',
    },
    {
      id: 'page-calc-main',
      title: 'คำนวณสายเมน (สายประธาน)',
      desc: 'คำนวณขนาดสายเมน (Main/Service) ของอาคารจากผลรวมโหลดทั้งหมด',
      color: 'slate',
    },
  ];

  PLACEHOLDERS.forEach(({ id, title, desc, color }) => {
    const section = document.getElementById(id);
    if (!section) return;

    section.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center py-20 px-6 bg-white border border-dashed border-slate-300 rounded-2xl">
        <span class="w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-500 flex items-center justify-center mb-4">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        </span>
        <h1 class="font-display text-xl font-bold text-slate-800">${title}</h1>
        <p class="text-sm text-slate-500 mt-2 max-w-md">${desc}</p>
        <span class="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
          กำลังพัฒนา — เร็วๆ นี้
        </span>
        <a href="#wire-table" data-nav-jump class="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
          ← กลับไปดูตารางขนาดสายไฟ
        </a>
      </div>
    `;
  });
})();
