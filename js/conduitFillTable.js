/**
 * ตัวจัดการหน้า "จำนวนสายในท่อร้อยสาย"
 * ใช้ initTablePicker (js/lib/tablePicker.js) แสดงปุ่มเลือกตารางจาก CONDUIT_FILL_TABLES
 */
(function () {
  if (typeof CONDUIT_FILL_TABLES === 'undefined' || typeof initTablePicker === 'undefined') return;

  initTablePicker({
    pickerId: 'conduitFillTablePicker',
    contentId: 'conduitFillTableContent',
    tables: CONDUIT_FILL_TABLES,
    cornerLabel: 'ขนาดสายไฟ<br/>(ตร.มม.)',
    noteHtml:
      'จำนวนสายสูงสุดคำนวณจากอัตราส่วนพื้นที่หน้าตัดท่อที่ยอมให้บรรจุสายได้ตามมาตรฐาน วสท. เพื่อการศึกษา การเลือกขนาดท่อใช้งานจริงควรพิจารณาความสะดวกในการร้อยสายและเผื่อสำหรับการเดินสายเพิ่มเติมในอนาคตด้วย',
  });
})();
