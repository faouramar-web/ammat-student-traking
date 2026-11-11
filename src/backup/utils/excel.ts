import * as XLSX from 'xlsx';
import { Student, Teacher, IncidentReport, Grade, Subject } from '../types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from '../data/initialData';

export async function importExcelFile(file: File): Promise<{
  students: Student[];
  teachers: Teacher[];
  summary: {
    studentCount: number;
    teacherCount: number;
    sheetsFound: string[];
    errors: string[];
  };
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const errors: string[] = [];
  const parsedStudents: Student[] = [];
  const parsedTeachers: Teacher[] = [];
  const homeroomMap: Record<string, string> = {};

  const sheetNames = workbook.SheetNames;

  // 1. Parse 'מחנכות' sheet if present to build class-to-teacher map
  const homeroomSheetName = sheetNames.find((name) =>
    name.trim().includes('מחנכ') || name.toLowerCase().includes('homeroom')
  );

  if (homeroomSheetName) {
    const sheet = workbook.Sheets[homeroomSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    rawRows.forEach((row) => {
      const classKey = Object.keys(row).find((k) =>
        k.includes('כיתה') || k.toLowerCase().includes('class')
      );
      const teacherKey = Object.keys(row).find((k) =>
        k.includes('שם') || k.includes('מחנכ') || k.toLowerCase().includes('teacher')
      );

      const cls = classKey ? String(row[classKey] || '').trim() : '';
      const teacher = teacherKey ? String(row[teacherKey] || '').trim() : '';

      if (cls && teacher) {
        homeroomMap[cls] = teacher;
      }
    });
  }

  // 2. Parse 'רשימת מורים ומקצועות' sheet if present
  const teachersSheetName = sheetNames.find((name) =>
    name.includes('מורים') || name.includes('מקצועות') || name.toLowerCase().includes('teacher')
  );

  if (teachersSheetName) {
    const sheet = workbook.Sheets[teachersSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    rawRows.forEach((row, index) => {
      const nameKey = Object.keys(row).find((k) => k.includes('שם')) || 'שם המורה';
      const name = String(row[nameKey] || row['name'] || '').trim();

      const subjectKey = Object.keys(row).find((k) =>
        k.includes('מקצוע') || k.includes('תחום דעת') || k.toLowerCase().includes('subject')
      );
      const subjectStr = String(row[subjectKey || ''] || 'מדעי המחשב').trim();
      const subjects: Subject[] = [];
      if (subjectStr.includes('מתמטיקה')) subjects.push('מתמטיקה');
      if (subjectStr.includes('מחשב') || subjectStr.includes('סייבר') || subjectStr.includes('תכנות')) {
        subjects.push('מדעי המחשב');
      }
      if (subjectStr.includes('פיזיקה') || subjectStr.includes('חלל') || subjectStr.includes('מדע')) {
        subjects.push('פיזיקה');
      }
      if (subjects.length === 0) subjects.push('מדעי המחשב');

      const gradesKey = Object.keys(row).find((k) => k.includes('שכבו') || k.includes('שכבה'));
      const gradesStr = String(row[gradesKey || ''] || 'ז,ח,ט');
      const grades: Grade[] = [];
      if (gradesStr.includes('ז')) grades.push('ז');
      if (gradesStr.includes('ח')) grades.push('ח');
      if (gradesStr.includes('ט')) grades.push('ט');
      if (grades.length === 0) grades.push('ח');

      const descKey = Object.keys(row).find((k) => k.includes('תפקיד') || k.includes('תיאור'));
      const roleDescription = String(row[descKey || ''] || `מורה עמ"ט ל${subjects.join(', ')}`);

      if (name) {
        parsedTeachers.push({
          id: `t-imp-${index + 1}`,
          name,
          subjects,
          grades,
          roleDescription,
        });
      }
    });
  }

  // Helper function to extract student row from a sheet
  const parseStudentRow = (
    row: Record<string, unknown>,
    sheetDefaultGrade: Grade | null,
    sheetName: string,
    rowIndex: number
  ) => {
    // Student Name
    const nameKey = Object.keys(row).find(
      (k) =>
        (k.includes('שם') && !k.includes('מחנכ')) ||
        k.includes('طالب') ||
        k.toLowerCase().includes('name')
    );
    const name = String((nameKey ? row[nameKey] : '') || row['name'] || '').trim();

    if (!name) return; // skip empty rows

    // Student ID (optional - auto-generated if omitted)
    const idKey = Object.keys(row).find((k) =>
      k.includes('ת.ז') ||
      k.includes('זהות') ||
      k.includes('מזהה') ||
      k.toLowerCase().includes('id')
    );
    const rawId = idKey ? String(row[idKey] || '').trim() : '';
    // Auto-generate stable identifier when user omits ID
    const cleanNameKey = name.replace(/[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]/g, '_');
    const id = rawId || `std_${sheetDefaultGrade || 'grade'}_${rowIndex + 1}_${cleanNameKey}`;

    // Grade
    let grade: Grade = sheetDefaultGrade || 'ח';
    const gradeKey = Object.keys(row).find((k) =>
      k.includes('שכבה') || k.toLowerCase().includes('grade')
    );
    if (gradeKey && row[gradeKey]) {
      const gradeStr = String(row[gradeKey]).trim();
      if (gradeStr.includes('ז') || gradeStr === '7') grade = 'ז';
      else if (gradeStr.includes('ח') || gradeStr === '8') grade = 'ח';
      else if (gradeStr.includes('ט') || gradeStr === '9') grade = 'ט';
    }

    // Class name (e.g. ח'1, ח'3, ח'4, ז'1)
    const classKey = Object.keys(row).find((k) =>
      k.includes('כיתת אם') ||
      k.includes('כיתה') ||
      k.includes('الصف') ||
      k.toLowerCase().includes('class')
    );
    let className = String((classKey ? row[classKey] : '') || '').trim();
    if (!className) {
      className = `${grade}'1`;
    }

    // Homeroom teacher
    const homeroomKey = Object.keys(row).find((k) =>
      k.includes('מחנכת') || k.includes('מחנך') || k.toLowerCase().includes('homeroom')
    );
    let homeroomTeacher = String((homeroomKey ? row[homeroomKey] : '') || '').trim();

    // If homeroom teacher is not in student row, lookup from 'מחנכות' sheet!
    if (!homeroomTeacher && homeroomMap[className]) {
      homeroomTeacher = homeroomMap[className];
    }
    if (!homeroomTeacher) {
      // Fuzzy lookup (e.g. if className is ח'1 but map has ח1)
      const cleanClass = className.replace(/['"״]/g, '');
      const match = Object.keys(homeroomMap).find(
        (k) => k.replace(/['"״]/g, '') === cleanClass
      );
      if (match) {
        homeroomTeacher = homeroomMap[match];
      }
    }
    if (!homeroomTeacher) {
      homeroomTeacher = 'צוות מחנכות';
    }

    parsedStudents.push({
      id,
      name,
      grade,
      className,
      homeroomTeacher,
    });
  };

  // 3. Scan sheets matching the user's specific tabs:
  // "עמ"ט ז 2027", "עמ"ט ח 2027", "עמ"ט ט-2027"
  let gradeSheetsFound = 0;

  sheetNames.forEach((sheetName) => {
    // Skip homeroom / teachers list sheets
    if (sheetName === homeroomSheetName || sheetName === teachersSheetName) return;

    let defaultGrade: Grade | null = null;
    if (sheetName.includes('ז')) defaultGrade = 'ז';
    else if (sheetName.includes('ח')) defaultGrade = 'ח';
    else if (sheetName.includes('ט')) defaultGrade = 'ט';

    // If it's a student sheet
    if (
      defaultGrade ||
      sheetName.includes('תלמיד') ||
      sheetName.includes('עמ"ט') ||
      sheetName.includes('עמט') ||
      sheetName.includes('طلاب')
    ) {
      gradeSheetsFound++;
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      rawRows.forEach((row, rowIndex) => {
        parseStudentRow(row, defaultGrade, sheetName, rowIndex);
      });
    }
  });

  // Fallback: If no recognized grade sheets were found, parse sheet 0 as students
  if (parsedStudents.length === 0 && sheetNames.length > 0) {
    const sheet = workbook.Sheets[sheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    rawRows.forEach((row, rowIndex) => {
      parseStudentRow(row, 'ח', sheetNames[0], rowIndex);
    });
  }

  return {
    students: parsedStudents.length > 0 ? parsedStudents : INITIAL_STUDENTS,
    teachers: parsedTeachers.length > 0 ? parsedTeachers : INITIAL_TEACHERS,
    summary: {
      studentCount: parsedStudents.length,
      teacherCount: parsedTeachers.length,
      sheetsFound: sheetNames,
      errors,
    },
  };
}

/**
 * Downloads a template Excel matching EXACTLY the user's 5-tab structure:
 * 1. מחנכות
 * 2. רשימת מורים ומקצועות
 * 3. עמ"ט ז 2027
 * 4. עמ"ט ח 2027
 * 5. עמ"ט ט-2027
 */
export function downloadTemplateExcel() {
  const wb = XLSX.utils.book_new();

  // Tab 1: מחנכות
  const homeroomData = [
    { 'כיתה': "ז'1", 'שם המחנכת': 'נור עת\'מאנה', 'טלפון': '050-1111111' },
    { 'כיתה': "ז'2", 'שם המחנכת': 'היבה ג\'בארין', 'טלפון': '050-2222222' },
    { 'כיתה': "ח'1", 'שם המחנכת': 'מייסון ח\'יר', 'טלפון': '050-3333333' },
    { 'כיתה': "ח'3", 'שם המחנכת': 'ראניה שיח\'', 'טלפון': '050-4444444' },
    { 'כיתה': "ח'4", 'שם המחנכת': 'סיהאם נעים', 'טלפון': '050-5555555' },
    { 'כיתה': "ט'1", 'שם המחנכת': 'ראודה ח\'ורי', 'טלפון': '050-6666666' },
    { 'כיתה': "ט'2", 'שם המחנכת': 'סוהיר אבראהים', 'טלפון': '050-7777777' },
  ];
  const wsHomeroom = XLSX.utils.json_to_sheet(homeroomData);
  XLSX.utils.book_append_sheet(wb, wsHomeroom, 'מחנכות');

  // Tab 2: רשימת מורים ומקצועות
  const teachersData = [
    {
      'שם המורה': 'ד"ר ראמי סלאמה',
      'מקצוע / תחום דעת': 'מדעי המחשב',
      'שכבות': 'ח, ט',
      'תיאור תפקיד': 'רכז מדעי המחשב עמ"ט ותכנות Python',
    },
    {
      'שם המורה': 'מנאר ח\'ורי',
      'מקצוע / תחום דעת': 'מדעי המחשב',
      'שכבות': 'ז, ח',
      'תיאור תפקיד': 'מורת תכנות, רובוטיקה ואלגוריתמיקה',
    },
    {
      'שם המורה': 'נדים חאג\'',
      'מקצוע / תחום דעת': 'מתמטיקה',
      'שכבות': 'ז, ח',
      'תיאור תפקיד': 'רכז מתמטיקה מואצת עמ"ט',
    },
    {
      'שם המורה': 'רנא אבראהים',
      'מקצוע / תחום דעת': 'מתמטיקה',
      'שכבות': 'ח, ט',
      'תיאור תפקיד': 'מורת מתמטיקה מואצת ואולימפיאדות',
    },
    {
      'שם המורה': 'וסאם ג\'בארין',
      'מקצוע / תחום דעת': 'פיזיקה',
      'שכבות': 'ח, ט',
      'תיאור תפקיד': 'מורה לפיזיקה, חקר מדעי ומכניקה',
    },
    {
      'שם המורה': 'סוהא מרעי',
      'מקצוע / תחום דעת': 'פיזיקה',
      'שכבות': 'ז, ח',
      'תיאור תפקיד': 'מורת פיזיקה, אסטרונומיה ומדעי החלל',
    },
  ];
  const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'רשימת מורים ומקצועות');

  // Tab 3: עמ"ט ט-2027 (ללא צורך בת.ז - רק שם וכיתה)
  const studentsGrade9 = [
    { 'שם התלמיד': 'באסל ח\'ורי (باسل خوري)', 'כיתת אם': "ט'1" },
    { 'שם התלמיד': 'שדא סואעד (شذا سواعد)', 'כיתת אם': "ט'1" },
    { 'שם התלמיד': 'מג\'ד אבריק (مجد ابريق)', 'כיתת אם': "ט'1" },
    { 'שם התלמיד': 'זיאד מסאלחה (زياد مصالحة)', 'כיתת אם': "ט'2" },
  ];
  const wsGrade9 = XLSX.utils.json_to_sheet(studentsGrade9);
  XLSX.utils.book_append_sheet(wb, wsGrade9, 'עמ"ט ט-2027');

  // Tab 4: עמ"ט ח 2027 (ללא צורך בת.ז - רק שם וכיתה)
  const studentsGrade8 = [
    { 'שם התלמיד': 'וג\'די ח\'יר (وجدي خير)', 'כיתת אם': "ח'1" },
    { 'שם התלמיד': 'אמירה שאמי (اميرة شامي)', 'כיתת אם': "ח'1" },
    { 'שם התלמיד': 'דארין סוויטי (دارين סוויטי)', 'כיתת אם': "ח'1" },
    { 'שם התלמיד': 'עדי משלב (عدي משלב)', 'כיתת אם': "ח'1" },
    { 'שם התלמיד': 'אלין אלשיח\' (الين الشيخ)', 'כיתת אם': "ח'3" },
    { 'שם התלמיד': 'ראזי סעיד (رازي سعيد)', 'כיתת אם': "ח'3" },
    { 'שם התלמיד': 'דארין סואעד (دارين سواعد)', 'כיתת אם': "ח'4" },
    { 'שם התלמיד': 'רויא מסאלחה (רויא מסאלחה)', 'כיתת אם': "ח'4" },
  ];
  const wsGrade8 = XLSX.utils.json_to_sheet(studentsGrade8);
  XLSX.utils.book_append_sheet(wb, wsGrade8, 'עמ"ט ח 2027');

  // Tab 5: עמ"ט ז 2027 (ללא צורך בת.ז - רק שם וכיתה)
  const studentsGrade7 = [
    { 'שם התלמיד': 'כרם דביאת (كرم دبيات)', 'כיתת אם': "ז'1" },
    { 'שם התלמיד': 'ליאן קאסם (ليان قاسم)', 'כיתת אם': "ז'1" },
    { 'שם התלמיד': 'אדם נעים (ادم نعيم)', 'כיתת אם': "ז'2" },
    { 'שם התלמיד': 'מאיא סעב (مايا صعب)', 'כיתת אם': "ז'2" },
  ];
  const wsGrade7 = XLSX.utils.json_to_sheet(studentsGrade7);
  XLSX.utils.book_append_sheet(wb, wsGrade7, 'עמ"ט ז 2027');

  XLSX.writeFile(wb, 'תבנית_נתוני_עמט_2027.xlsx');
}

/**
 * Specifically exports Behavior Reports according to the exact requested columns:
 * "שם התלמיד, כיתה, תאריך האירוע, האירוע, מי דיווח"
 */
export function exportBehaviorReportToExcel(
  reports: IncidentReport[],
  filterInfo?: { className?: string; subject?: string }
) {
  const wb = XLSX.utils.book_new();

  const exportRows = reports.map((r, index) => ({
    'מספר': index + 1,
    'שם התלמיד': r.studentName,
    'כיתה': r.className,
    'תאריך האירוע': `${r.date} (שיעור ${r.lessonPeriod})`,
    'האירוע': r.description || (r.behavior === 'excellence' ? 'ציון לשבח ומצוינות' : 'אירוע משמעתי'),
    'מי דיווח': r.teacherName,
    'מקצוע עמ"ט': r.subject,
    'סוג התנהגות': r.behavior === 'excellence' ? 'ציון לשבח ⭐' : r.behavior === 'normal' ? 'תקין' : 'התנהגות לא ראויה ⚠️',
    'סטטוס טיפול מחנכת': r.addressedByHomeroom ? 'טופל ע"י המחנכת' : 'ממתין לטיפול',
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 6 },  // מס'
    { wch: 24 }, // שם התלמיד
    { wch: 10 }, // כיתה
    { wch: 18 }, // תאריך
    { wch: 50 }, // האירוע
    { wch: 20 }, // מי דיווח
    { wch: 16 }, // מקצוע
    { wch: 18 }, // סוג
    { wch: 18 }, // סטטוס
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'דוח התנהגות עמט');

  const suffix = filterInfo?.className
    ? `_כיתה_${filterInfo.className}`
    : filterInfo?.subject
    ? `_${filterInfo.subject}`
    : '';

  const fileName = `דוח_התנהגות_עמט${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportAllToExcel(
  students: Student[],
  teachers: Teacher[],
  reports: IncidentReport[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Students sheet
  const studentsData = students.map((s, index) => ({
    'מספר': index + 1,
    'שם התלמיד/ה': s.name,
    'שכבה': s.grade,
    'כיתת אם': s.className,
    'שם המחנכת': s.homeroomTeacher,
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentsData);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'תלמידי עמט');

  // 2. Teachers sheet
  const teachersData = teachers.map((t, index) => ({
    'מספר': index + 1,
    'שם המורה': t.name,
    'תחומי דעת עמ"ט': t.subjects.join(', '),
    'שכבות לימוד': t.grades.join(', '),
    'תיאור תפקיד': t.roleDescription,
    'טלפון': t.phone || '',
    'דוא"ל': t.email || '',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, '6 מורי עמט');

  // 3. Reports sheet
  const reportsData = reports.map((r, index) => ({
    'מספר': index + 1,
    'שם התלמיד': r.studentName,
    'כיתה': r.className,
    'תאריך האירוע': `${r.date} (שיעור ${r.lessonPeriod})`,
    'האירוע': r.description,
    'מי דיווח': r.teacherName,
    'תחום דעת': r.subject,
    'נוכחות': r.attendance === 'present' ? 'נוכח' : r.attendance === 'late' ? 'איחור' : 'חיסור',
    'שיעורי בית': r.homework === 'done' ? 'הכין' : r.homework === 'partial' ? 'חלקי' : 'לא הכין',
    'סוג התנהגות': r.behavior === 'excellence' ? 'ציון לשבח / מצוינות' : r.behavior === 'normal' ? 'תקין' : 'התנהגות לא ראויה',
    'טופל ע"י מחנכת': r.addressedByHomeroom ? 'כן' : 'לא',
  }));
  const wsReports = XLSX.utils.json_to_sheet(reportsData);
  XLSX.utils.book_append_sheet(wb, wsReports, 'יומן דיווחים');

  const fileName = `עמט_Live_מאגר_נתונים_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
