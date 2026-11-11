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
  id: string; // Israeli ID (ת.ז)
  name: string; // Hebrew / Arabic name
  grade: Grade; // ז / ח / ט
  className: string; // כיתת אם: למשל ז'1, ח'1, ח'3, ח'4, ט'1
  homeroomTeacher: string; // שם המחנכת
  notes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: Subject[];
  grades: Grade[];
  roleDescription: string;
  phone?: string;
  email?: string;
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
  phone?: string;
  notes?: string;
}
