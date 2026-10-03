/**
 * ตารางตัวประกอบความต้องการ (Demand Factor) ตาม วสท. บทที่ 9
 * ใช้คำนวณ "โหลดดีมานด์" จากโหลดติดตั้งจริง (connected load) เป็นเครื่องมือเสริมแยกต่างหาก
 * จากการเลือกสาย/เบรกเกอร์ของวงจรย่อยเดี่ยวที่มีอยู่แล้วในแต่ละหน้า ผลลัพธ์ที่ได้นำไปกรอกเป็น
 * "กำลังไฟฟ้ารวม (VA)" ของหน้าสายป้อน/สายเมนได้ (ผ่านการ์ด "สรุปดีมานด์โหลดรวม")
 *
 * โครงสร้าง tiers แต่ละแถว [{ upTo, percent }] เรียงจากขนาดเล็กไปใหญ่ หมายถึง "สะสมไม่เกิน upTo
 * (VA)" ใช้ดีมานด์แฟกเตอร์ percent นั้น ส่วนที่เกินไปคิดด้วย tier ถัดไป (ขั้นสุดท้ายใช้ Infinity)
 */

// ตารางที่ 9.1 ดีมานด์แฟกเตอร์สำหรับโหลดแสงสว่าง
const LIGHTING_DEMAND_FACTOR_TABLE = [
  { id: 'residential', label: 'ที่พักอาศัย', tiers: [{ upTo: 2000, percent: 100 }, { upTo: Infinity, percent: 35 }] },
  { id: 'hospital', label: 'โรงพยาบาล', tiers: [{ upTo: 50000, percent: 40 }, { upTo: Infinity, percent: 20 }] },
  {
    id: 'hotel',
    label: 'โรงแรม/ห้องชุด (ไม่มีส่วนให้ผู้อยู่อาศัยประกอบอาหารได้)',
    tiers: [
      { upTo: 20000, percent: 50 },
      { upTo: 100000, percent: 40 },
      { upTo: Infinity, percent: 30 },
    ],
  },
  { id: 'warehouse', label: 'โรงเก็บพัสดุ', tiers: [{ upTo: 12500, percent: 100 }, { upTo: Infinity, percent: 50 }] },
  { id: 'other', label: 'อาคารประเภทอื่น', tiers: [{ upTo: Infinity, percent: 100 }] },
];

// ตารางที่ 9.2 ดีมานด์แฟกเตอร์สำหรับโหลดเต้ารับ (เฉพาะสถานที่ที่ไม่ใช่ที่พักอาศัย)
// ที่พักอาศัย: โหลดเต้ารับนับรวมอยู่ในโหลดแสงสว่างแล้ว ไม่มีตารางแยก จึงใช้ดีมานด์แฟกเตอร์ 100%
const RECEPTACLE_DEMAND_FACTOR_TABLE = [
  { id: 'residential', label: 'ที่พักอาศัย', tiers: [{ upTo: Infinity, percent: 100 }] },
  {
    id: 'non_residential',
    label: 'สถานที่ที่ไม่ใช่ที่พักอาศัย (คำนวณโหลดเต้ารับที่ 180 VA/จุด)',
    tiers: [{ upTo: 10000, percent: 100 }, { upTo: Infinity, percent: 50 }],
  },
];

// ตารางที่ 9.3 (เฉพาะแถวเครื่องปรับอากาศ) ดีมานด์แฟกเตอร์คงที่ตามประเภทอาคาร
const AC_DEMAND_FACTOR_TABLE = [
  { id: 'residential', label: 'อาคารที่อยู่อาศัย', tiers: [{ upTo: Infinity, percent: 100 }] },
  { id: 'office_retail', label: 'อาคารสำนักงาน/ร้านค้าทั่วไป/ห้างสรรพสินค้า', tiers: [{ upTo: Infinity, percent: 100 }] },
  { id: 'hotel', label: 'โรงแรม/อาคารประเภทอื่น (เครื่องปรับอากาศแยกแต่ละห้อง)', tiers: [{ upTo: Infinity, percent: 75 }] },
];

/**
 * คำนวณโหลดดีมานด์แบบขั้นบันได (tiered) จากโหลดติดตั้งจริงรวม (VA)
 * ใช้กับตารางที่ 9.1 (แสงสว่าง), 9.2 (เต้ารับ) และแถวเครื่องปรับอากาศในตารางที่ 9.3
 * คืนค่า { demandVa, breakdown } โดย breakdown คือรายการแต่ละขั้นที่ใช้คำนวณจริง
 */
function calcTieredDemandVa(tiers, totalVa) {
  let remaining = totalVa;
  let prevLimit = 0;
  let demandVa = 0;
  const breakdown = [];
  for (const tier of tiers) {
    if (remaining <= 0) break;
    const tierCapacity = tier.upTo - prevLimit;
    const tierVa = Math.min(remaining, tierCapacity);
    const tierDemandVa = tierVa * (tier.percent / 100);
    demandVa += tierDemandVa;
    breakdown.push({ va: tierVa, percent: tier.percent, demandVa: tierDemandVa });
    remaining -= tierVa;
    prevLimit = tier.upTo;
  }
  return { demandVa, breakdown };
}

/**
 * ดีมานด์แฟกเตอร์สำหรับเครื่องทำน้ำอุ่น/เครื่องทำน้ำร้อน (ตารางที่ 9.3) ใช้สูตรเดียวกันทุกประเภท
 * อาคารตามตาราง: "วงจรที่มีโหลดมากที่สุด 2 วงจรแรก คิดร้อยละ 100 ส่วนที่เหลือทั้งหมดคิดร้อยละ 25"
 * รับอาเรย์ของโหลด VA แต่ละวงจร คืนค่า { demandVa, topVa, restVa, restDemandVa, topCount, restCount }
 */
function calcWaterHeaterDemandVa(vaList) {
  const sorted = [...vaList].sort((a, b) => b - a);
  const top = sorted.slice(0, 2);
  const rest = sorted.slice(2);
  const topVa = top.reduce((sum, v) => sum + v, 0);
  const restVa = rest.reduce((sum, v) => sum + v, 0);
  const restDemandVa = restVa * 0.25;
  return { demandVa: topVa + restDemandVa, topVa, restVa, restDemandVa, topCount: top.length, restCount: rest.length };
}
