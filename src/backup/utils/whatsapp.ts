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
    return `🌟 *הודעת הערכה ומצוינות - ${SCHOOL_INFO.programName}* 🌟
שלום וברכה למשפחת התלמיד/ה *${report.studentName}*,
מדברת *${report.homeroomTeacher}*, מחנכת כיתה *${report.className}* ב${SCHOOL_INFO.name}.

בשמחה וגאווה גדולה הריני לעדכנכם כי היום (${report.date}) בשיעור *${report.subject}* (שעה ${report.lessonPeriod}) בהוראת המורה *${report.teacherName}*, הוענק ל${report.studentName} ציון לשבח:

🏆 *פירוט המצוינות:*
"${report.description || 'הפגין/ה בקיאות, סקרנות מדעית והשתתפות מופתית'}"

• סטטוס נוכחות: ${attendanceHebrew}
• הכנת מטלות: ${homeworkHebrew}

אנו גאים בדרך המדעית וההשקעה של תלמידינו ומאחלים המשך הצלחה בעתודה המדעית! 🔬✨

בברכה חמה,
${report.homeroomTeacher} - מחנכת הכיתה
צוות מורי עמ"ט, ${SCHOOL_INFO.name}`;
  }

  // Disciplinary incident
  return `📋 *עדכון פדגוגי ומשמעתי - ${SCHOOL_INFO.programName}*
שלום רב למשפחת התלמיד/ה *${report.studentName}*,
מדברת *${report.homeroomTeacher}*, מחנכת כיתה *${report.className}* ב${SCHOOL_INFO.name}.

הריני להביא לידיעתכם כי היום (${report.date}) בשיעור *${report.subject}* (שעה ${report.lessonPeriod}) בהוראת המורה *${report.teacherName}*, נרשם דיווח משמעתי:

⚠️ *תיאור האירוע:*
"${report.description || 'אירוע משמעתי במהלך השיעור'}"

• נוכחות בשיעור: ${attendanceHebrew}
• שיעורי בית: ${homeworkHebrew}

אנו רואים חשיבות עליונה בשמירה על סביבת למידה מכבדת ורצינית במסלול המצטיינים של עמ"ט, ומבקשים את התגייסותכם לשיחה בונה עם התלמיד/ה בבית למניעת הישנות המקרה.

בברכה,
${report.homeroomTeacher} - מחנכת הכיתה
צוות עתודה מדעית טכנולוגית עמ"ט`;
}

/**
 * Returns a universal wa.me link without needing phone numbers stored in the app.
 * Opening this link lets the teacher pick any contact in WhatsApp (the parent) or open their chat.
 */
export function getWhatsAppShareUrl(report: IncidentReport): string {
  const text = formatWhatsAppMessage(report);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function copyMessageToClipboard(report: IncidentReport): Promise<boolean> {
  const text = formatWhatsAppMessage(report);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
