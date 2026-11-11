export type Grade = 'ז' | 'ח' | 'ט';

export type Subject = 'מתמטיקה' | 'מדעי המחשב' | 'פיזיקה';

export type AttendanceStatus = 'present' | 'late' | 'absent';

export type HomeworkStatus = 'done' | 'partial' | 'not_done';

export type BehaviorType =
  | 'excellence' // ציון לשבח / מצוינות
  | 'normal'     // תקין
  | 'disruption' // הפרעה לשיעור
  | 'phone'      // שימוש בטלפון נייד
  | 'defiance'   // אי-ציות / חוצפה
  | 'equipment'  // פגיעה בציוד / אי הבאת ציוד מעבדה
  | 'other';     // אירוע משמעתי אחר

export interface Student {
  id: string; // Unique student identifier
  name: string; // Hebrew / Arabic name
  grade: Grade; // ז / ח / ט
  className: string; // כיתת אם: למשל ז'1, ח'1, ח'3, ח'4, ט'1
  homeroomTeacher: string; // שם המחנכת
  notes?: string;
  parentCode?: string; // Secret personal code for parent/student portal access (e.g. "84192")
}

export interface Teacher {
  id: string;
  name: string;
  subjects: Subject[];
  grades: Grade[];
  roleDescription: string;
  phone?: string;
  email?: string;
  teacherCode: string; // Personal secret code for teacher login (e.g. "7001")
  isHomeroom?: boolean;
  homeroomClass?: string;
  homeroomCode?: string; // If dual role as homeroom teacher too
}

export interface IncidentReport {
  id: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  lessonPeriod: number; // 1-8
  teacherId: string;
  teacherName: string;
  subject: Subject;
  studentId: string;
  studentName: string;
  grade: Grade;
  className: string;
  homeroomTeacher: string;
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  behavior: BehaviorType;
  description: string; // Free-text description of the event or commendation
  addressedByHomeroom?: boolean; // Whether the homeroom teacher marked it as handled
  addressedAt?: string;
}

export interface LessonSession {
  id: string;
  timestamp: string;
  date: string;
  lessonPeriod: number;
  teacherId: string;
  teacherName: string;
  subject: Subject;
  grade: Grade;
  reports: IncidentReport[];
}

export interface HomeroomTeacherInfo {
  className: string;
  teacherName: string;
  code: string; // Secret code for homeroom login (e.g. "8001")
  phone?: string;
  notes?: string;
}

export interface LessonPeriodConfig {
  period: number;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "08:45"
  name: string;      // e.g. "שיעור 1"
}

export type AuthRole = 'admin' | 'teacher' | 'homeroom' | 'parent';

export interface UserSession {
  role: AuthRole;
  name: string;
  code?: string;
  teacherId?: string;
  teacherObj?: Teacher;
  homeroomClass?: string;
  allowedGrades?: Grade[];
  isDualRole?: boolean;
  activeDualMode?: 'teacher' | 'homeroom';
}

export interface ParentCommitment {
  id: string; // unique ID
  studentId: string;
  studentName: string;
  className: string;
  homeroomTeacher: string;
  parentName: string; // שם ההורה החותם
  parentIdNumber: string; // מספר תעודת זהות של ההורה
  parentPhone: string; // טלפון הורה
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  signatureDataUrl: string; // Base64 data URL from signature canvas
  academicYear: string; // '2026-2027 (תשפ"ז)'
  documentTitle: string; // 'כתב התחייבות והסכמת הורים - עתודה מדעית טכנולוגית (עמ"ט STEM)'
  agreedToTerms: boolean;
  notes?: string;
}

export interface AdminSettings {
  adminPassword: string;
  allowHomeroomPedagogicalAccess: boolean;
  schoolPeriods: LessonPeriodConfig[];
  parentMeetingCode?: string; // קוד כניסה קולקטיבי לפגישת הורים (ברירת מחדל: 640615)
  commitmentCustomPdfUrl?: string; // קישור לקובץ PDF מותאם אישית אם הועלה
}
