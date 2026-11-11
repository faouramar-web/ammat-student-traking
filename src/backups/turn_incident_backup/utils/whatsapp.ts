import { IncidentReport } from '../types';
import { SCHOOL_INFO } from '../data/initialData';

export function formatWhatsAppMessage(report: IncidentReport): string {
  const isExcellence = report.behavior === 'excellence';
  const attendanceHebrew =
    report.attendance === 'present'
      ? 'נוכח/ת'
      : report.attendance === 'late'
      ? 'איחר/ה לשיעור'
      : 'חיסור מהשיעור';

  const homeworkHebrew =
    report.homework === 'done'
      ? 'הכין/ה במלואם'
      : report.homework === 'partial'
      ? 'הכין/ה באופן חלקי'
      : 'לא הכין/ה שיעורי בית';

  if (isExcellence) {
    return `❖ הודעת הערכה ומצוינות - עתודה מדעית טכנולוגית (עמ"ט STEM) ❖
שלום רב למשפחת התלמיד/ה ${report.studentName},
מדברת ${report.homeroomTeacher || 'מחנכת הכיתה'}, מחנכת כיתה ${report.className} בחטיבת הביניים ב' אבו סנאן.

בשמחה וגאווה רבה הריני להביא לידיעתכם כי היום (${report.date}) בשיעור ${report.subject} (שעה ${report.lessonPeriod}) בהוראת המורה ${report.teacherName}, הוענק ל${report.studentName} ציון לשבח:

❖ פירוט המצוינות:
"${report.description || 'הפגין/ה בקיאות, סקרנות מדעית והשתתפות מופתית'}"

• נוכחות בשיעור: ${attendanceHebrew}
• שיעורי בית: ${homeworkHebrew}

אנו רואים חשיבות רבה בעידוד מצוינות וסקרנות מדעית במסלול עמ"ט, ומאחלים המשך הצלחה רבה והישגים פורצי דרך!`;
  }

  // Exact Disciplinary incident template from Image 3
  return `❖ עדכון פדגוגי ומשמעתי - עתודה מדעית טכנולוגית (עמ"ט STEM) ❖
שלום רב למשפחת התלמיד/ה ${report.studentName},
מדברת ${report.homeroomTeacher || 'מחנכת הכיתה'}, מחנכת כיתה ${report.className} בחטיבת הביניים ב' אבו סנאן.

הריני להביא לידיעתכם כי היום (${report.date}) בשיעור ${report.subject} (שעה ${report.lessonPeriod}) בהוראת המורה ${report.teacherName}, נרשם דיווח משמעתי:

❖ תיאור האירוע:
"${report.description || 'אירוע משמעתי במהלך השיעור'}"

• נוכחות בשיעור: ${attendanceHebrew}
• שיעורי בית: ${homeworkHebrew}

אנו רואים חשיבות עליונה בשמירה על סביבת למידה מכבדת ורצינית במסלול המצטיינים של עמ"ט, ומבקשים את התגייסותכם לשיחה בונה עם התלמיד/ה בבית למניעת הישנות המקרה.`;
}

/**
 * Message sent by the AMAT SUBJECT TEACHER to the HOMEROOM TEACHER
 * (Subject teachers never send directly to parents; they alert the homeroom educator)
 */
export function formatTeacherToHomeroomMessage(params: {
  teacherName: string;
  subject: string;
  lessonPeriod: number;
  date: string;
  studentName: string;
  className: string;
  homeroomTeacher: string;
  description: string;
  attendance?: string;
  homework?: string;
}): string {
  return `🔔 שלום למחנכת ${params.homeroomTeacher} (כיתה ${params.className}),
מדבר/ת ${params.teacherName}, מורה ל${params.subject} בעמ"ט.
דיווחתי כעת בשיעור ${params.subject} (שעה ${params.lessonPeriod}) על אירוע משמעתי עבור התלמיד/ה ${params.studentName}:

❖ תיאור האירוע שנרשם:
"${params.description || 'אירוע משמעתי במהלך השיעור'}"

הדיווח נקלט בלוח המחנכות בזמן אמת במערכת עמ"ט Live.
באפשרותך לעיין בדיווח ולהוציא הודעה רשמית מנוסחת להורי התלמיד בלחיצת כפתור אחת מהלוח שלך.`;
}

/**
 * Returns a universal wa.me link for Homeroom Teacher -> Parents
 */
export function getWhatsAppShareUrl(report: IncidentReport): string {
  const text = formatWhatsAppMessage(report);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Returns a universal wa.me link for Subject Teacher -> Homeroom Teacher
 */
export function getTeacherToHomeroomWhatsAppUrl(params: {
  teacherName: string;
  subject: string;
  lessonPeriod: number;
  date: string;
  studentName: string;
  className: string;
  homeroomTeacher: string;
  description: string;
  homeroomPhone?: string;
}): string {
  const text = formatTeacherToHomeroomMessage(params);
  let phoneParam = '';
  if (params.homeroomPhone) {
    let clean = params.homeroomPhone.replace(/\D/g, '');
    if (clean.startsWith('05')) {
      clean = '972' + clean.slice(1);
    }
    if (clean.length >= 9) {
      phoneParam = clean;
    }
  }
  return phoneParam
    ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function copyMessageToClipboard(report: IncidentReport): Promise<boolean> {
  const text = formatWhatsAppMessage(report);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function copyTeacherToHomeroomToClipboard(params: {
  teacherName: string;
  subject: string;
  lessonPeriod: number;
  date: string;
  studentName: string;
  className: string;
  homeroomTeacher: string;
  description: string;
}): Promise<boolean> {
  const text = formatTeacherToHomeroomMessage(params);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
