/**
 * ฟังก์ชันคำนวณกลางที่ใช้ร่วมกันได้ทุกวงจรย่อย (แสงสว่าง, เต้ารับ, ฯลฯ)
 * แยกจากการ render UI เพื่อไม่ให้ต้องเขียนตรรกะเลือกสาย/เบรกเกอร์/ท่อร้อยสายซ้ำในแต่ละหน้า
 */

// แปลงป้ายพิกัดตัดวงจร เช่น "15(16)" ให้เป็นตัวเลขจริงที่ใช้เปรียบเทียบ (16)
function parseTripValue(label) {
  const bracketMatch = label.match(/\((\d+)\)/);
  return bracketMatch ? parseInt(bracketMatch[1], 10) : parseInt(label, 10);
}

/**
 * คืนพิกัดเบรกเกอร์มาตรฐาน (เรียงจากน้อยไปมาก) และแถวอ้างอิงจาก CIRCUIT_BREAKER_TABLE
 * ที่ frame ไม่เกิน maxFrame (ค่าเริ่มต้น 100 คือช่วง MCB/MCCB ที่ใช้กับวงจรย่อยทั่วไป)
 */
function getStandardBreakerSizes(circuitBreakerTable, maxFrame = 100) {
  const rows = circuitBreakerTable.filter((row) => row.frame <= maxFrame);
  const sizes = Array.from(new Set(rows.flatMap((row) => row.trip).map(parseTripValue))).sort((a, b) => a - b);
  return { sizes, rows };
}

// หาขนาดเฟรม (AF) ที่เล็กที่สุดที่มีพิกัดตัดวงจร (AT) ตรงกับค่าที่เลือก เพื่อบอกเป็น AT/AF
function findFrameForTrip(breakerRows, tripValue) {
  const matchingRow = breakerRows.find((row) => row.trip.map(parseTripValue).includes(tripValue));
  return matchingRow ? matchingRow.frame : null;
}

/**
 * ไล่หาขนาดสายที่เล็กที่สุดในตารางที่มีพิกัดกระแส (คอลัมน์ตาม cols) ไม่น้อยกว่ากระแสออกแบบ
 * แล้วหาพิกัดเบรกเกอร์มาตรฐานที่ไม่น้อยกว่ากระแสออกแบบและไม่เกินพิกัดสายไฟที่เลือกได้
 * minSize (ถ้าระบุ) ใช้จำกัดขนาดสายขั้นต่ำที่เลือกได้ เช่น วงจรเครื่องปรับอากาศกำหนดขั้นต่ำ 2.5 ตร.มม.
 * คืนค่า { wire: {size, ampacity}, breaker, frame } หรือ null ถ้าไม่พบ
 */
function pickWireAndBreaker(wireTable, cols, designCurrent, standardSizes, breakerRows, minSize = 0) {
  for (const row of wireTable.rows) {
    if (row.size < minSize) continue;
    const values = cols.map((c) => row.values[c]).filter((v) => v !== null);
    if (!values.length) continue;
    const ampacity = Math.min(...values);
    if (ampacity < designCurrent) continue;
    const breaker = standardSizes.find((b) => b >= designCurrent && b <= ampacity);
    if (breaker !== undefined) {
      return { wire: { size: row.size, ampacity }, breaker, frame: findFrameForTrip(breakerRows, breaker) };
    }
  }
  return null;
}

/**
 * หาขนาดท่อร้อยสายที่เล็กที่สุดจากตาราง A-1 (IEC01) หรือ A-2 (NYY) ที่รองรับจำนวนตัวนำได้พอ
 * ใช้ได้เฉพาะสายแกนเดี่ยว (ตารางนับจำนวนตัวนำเดี่ยวที่ร้อยรวมในท่อ ไม่ใช่สายหลายแกน)
 */
function pickConduitSize(conduitFillTables, cableType, wireSize, conductorCount) {
  const conduitTableId = cableType === 'IEC01' ? 'table-a-1' : 'table-a-2';
  const conduitTable = conduitFillTables.find((t) => t.id === conduitTableId);
  if (!conduitTable) return null;

  const row = conduitTable.rows.find((r) => r.size === wireSize);
  if (!row) return null;

  const mmLabels = conduitTable.headerRows[1].map((c) => c.label);
  const inchLabels = conduitTable.headerRows[2].map((c) => c.label);

  for (let i = 0; i < row.values.length; i += 1) {
    const maxConductors = row.values[i];
    if (maxConductors !== null && maxConductors >= conductorCount) {
      return { mm: mmLabels[i], inch: inchLabels[i], table: conduitTable };
    }
  }
  return null;
}
