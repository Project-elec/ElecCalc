/**
 * ข้อมูลตารางขนาดพิกัดเซอร์กิตเบรกเกอร์ (Circuit Breaker)
 * แต่ละแถวคือขนาดเฟรม (Ampere Frame) ที่มีพิกัดตัดวงจร (Ampere Trip) ให้เลือกได้หลายค่า
 * และชนิดเบรกเกอร์ที่ใช้ในเฟรมนั้น (MCB / MCCB / ACB)
 *
 * highlightTrip เก็บค่าพิกัดตัดวงจรที่ต้นฉบับเน้นสีแดงไว้ (พิกัดขนาดเล็กที่พบบ่อยในตู้โหลดเซนเตอร์)
 */
const CIRCUIT_BREAKER_TABLE = [
  {
    frame: 50,
    trip: ['10', '15(16)', '20', '25', '30(32)', '35', '40', '50'],
    highlightTrip: ['10', '15(16)'],
    type: 'MCB / MCCB',
  },
  {
    frame: 100,
    trip: ['10', '15(16)', '20', '25', '30(32)', '35', '40', '45', '50', '60', '70', '80', '90', '100'],
    highlightTrip: ['10', '15(16)'],
    type: 'MCCB',
  },
  {
    frame: 250,
    trip: ['100', '110', '125', '150', '175', '200', '225', '250'],
    highlightTrip: [],
    type: 'MCCB',
  },
  {
    frame: 400,
    trip: ['125', '150', '175', '200', '225', '250', '300', '350', '400'],
    highlightTrip: [],
    type: 'MCCB',
  },
  {
    frame: 600,
    trip: ['450', '500', '600'],
    highlightTrip: [],
    type: 'MCCB / ACB',
  },
  {
    frame: 800,
    trip: ['600', '700', '800'],
    highlightTrip: [],
    type: 'MCCB / ACB',
  },
  {
    frame: 1000,
    trip: ['800', '900', '1000'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 1200,
    trip: ['800', '900', '1000', '1200'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 1600,
    trip: ['1000', '1200', '1600'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 2000,
    trip: ['2000', '2500', '3000'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 3000,
    trip: ['2000', '2500', '3000'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 4000,
    trip: ['4000'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 5000,
    trip: ['5000'],
    highlightTrip: [],
    type: 'ACB',
  },
  {
    frame: 6000,
    trip: ['6000'],
    highlightTrip: [],
    type: 'ACB',
  },
];
