import * as xlsx from 'xlsx';
import * as path from 'path';

const data = [
  { StudentID: "HB-2024-001", Name: "Ali Valiyev", PLD: 85, Exam: 90, Tasks: 80, Attendance: 95, Status: "Active" },
  { StudentID: "HB-2024-002", Name: "Aysel Mammadova", PLD: 40, Exam: 50, Tasks: 45, Attendance: 60, Status: "Active" },
  { StudentID: "HB-2024-003", Name: "Ramil Hasanov", PLD: 70, Exam: 60, Tasks: 75, Attendance: 80, Status: "Active" },
  { StudentID: "HB-2024-004", Name: "Nurlan Quliyev", PLD: 30, Exam: 20, Tasks: 10, Attendance: 40, Status: "At-Risk" },
  { StudentID: "HB-2024-005", Name: "Aygün Rzayeva", PLD: 95, Exam: 98, Tasks: 100, Attendance: 100, Status: "Active" }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Students");

const filePath = path.join(__dirname, '..', 'students_data.xlsx');
xlsx.writeFile(wb, filePath);
console.log(`Mock Excel faylı yaradıldı: ${filePath}`);
