/**
 * ตัวจัดการหน้า "ตารางขนาดสายไฟ"
 * ใช้ initTablePicker (js/lib/tablePicker.js) แสดงปุ่มเลือกตารางจาก WIRE_TABLES
 * และ render ตารางหัวหลายแถวตามต้นฉบับมาตรฐาน วสท. ของแต่ละตาราง
 */
(function () {
  if (typeof WIRE_TABLES === 'undefined' || typeof initTablePicker === 'undefined') return;

  initTablePicker({
    pickerId: 'wireTablePicker',
    contentId: 'wireTableContent',
    tables: WIRE_TABLES,
    noteHtml:
      'ค่ากระแสในตารางนี้คัดลอกจากตารางอ้างอิงมาตรฐาน วสท. เพื่อการศึกษา ยังไม่ได้ปรับตัวคูณลดพิกัด (derating factor) ตามอุณหภูมิแวดล้อมหรือการจัดกลุ่มสายที่แตกต่างจากเงื่อนไขที่ระบุในตาราง การออกแบบใช้งานจริงต้องตรวจสอบกับมาตรฐานฉบับล่าสุดเสมอ',
  });
})();
