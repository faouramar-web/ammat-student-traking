import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../firebase';
import {
  Student,
  Teacher,
  IncidentReport,
  HomeroomTeacherInfo,
  LessonPeriodConfig,
  AdminSettings,
  UserSession,
  ParentCommitment,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_REPORTS,
  INITIAL_HOMEROOM_TEACHERS,
  DEFAULT_ADMIN_SETTINGS,
} from '../data/initialData';
import { playChime, isSoundEnabled, setSoundEnabled } from '../utils/sound';

export type AppRole = 'teacher' | 'homeroom' | 'parent' | 'pedagogical' | 'excel' | 'behavior_reports' | 'admin';

interface AppContextType {
  students: Student[];
  teachers: Teacher[];
  reports: IncidentReport[];
  homeroomTeachers: HomeroomTeacherInfo[];
  adminSettings: AdminSettings;
  session: UserSession | null;
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  selectedHomeroomClass: string;
  setSelectedHomeroomClass: (cls: string) => void;
  selectedTeacherId: string;
  setSelectedTeacherId: (id: string) => void;
  parentStudentId: string | null;
  setParentStudentId: (id: string | null) => void;
  soundOn: boolean;
  setSoundOn: (enabled: boolean) => void;
  testSound: () => void;
  latestAlert: IncidentReport | null;
  clearLatestAlert: () => void;
  addReports: (newReports: IncidentReport[]) => void;
  toggleAddressed: (reportId: string) => void;
  updateStudents: (students: Student[]) => void;
  updateTeachers: (teachers: Teacher[]) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  addStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  deleteReport: (id: string) => void;
  deleteReports: (ids: string[]) => void;
  clearAllReports: () => void;
  clearEntireDatabase: () => void;
  resetToDefaultData: () => void;
  regenerateAllCodes: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginWithCode: (code: string) => { success: boolean; message: string; session?: UserSession };
  logout: () => void;
  switchDualMode: (mode: 'teacher' | 'homeroom') => void;
  updateAdminSettings: (newSettings: Partial<AdminSettings>) => void;
  updateSchoolPeriods: (periods: LessonPeriodConfig[]) => void;
  updateHomeroomTeachers: (list: HomeroomTeacherInfo[]) => void;
  commitments: ParentCommitment[];
  addCommitment: (commitment: ParentCommitment) => Promise<boolean>;
  deleteCommitment: (id: string) => Promise<void>;
  clearAllCommitments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'amat_students_v2',
  TEACHERS: 'amat_teachers_v2',
  REPORTS: 'amat_reports_v2',
  HOMEROOM_TEACHERS: 'amat_homeroom_teachers_v2',
  ADMIN_SETTINGS: 'amat_admin_settings_v2',
  SESSION: 'amat_session_v2',
  COMMITMENTS: 'amat_parent_commitments_v2',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for students with guaranteed 5-digit personal parent codes
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const state = localStorage.getItem('amat_db_state');
      if (state === 'empty') return [];
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      let list: Student[] = saved !== null ? JSON.parse(saved) : [];
      if (list.length === 0 && (!state || state !== 'empty')) {
        list = INITIAL_STUDENTS;
      }
      return list.map((s, idx) => {
        if (!s.parentCode) {
          return { ...s, parentCode: String(10101 + idx) };
        }
        return s;
      });
    } catch {
      return [];
    }
  });

  // State for teachers
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const state = localStorage.getItem('amat_db_state');
      if (state === 'empty') return [];
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for homeroom teachers
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherInfo[]>(() => {
    try {
      const state = localStorage.getItem('amat_db_state');
      if (state === 'empty') return [];
      const saved = localStorage.getItem(STORAGE_KEYS.HOMEROOM_TEACHERS);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for admin settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  });

  // State for reports
  const [reports, setReports] = useState<IncidentReport[]>(() => {
    try {
      const state = localStorage.getItem('amat_db_state');
      if (state === 'empty') return [];
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for signed parent commitments
  const [commitments, setCommitments] = useState<ParentCommitment[]>(() => {
    try {
      const state = localStorage.getItem('amat_db_state');
      if (state === 'empty') return [];
      const saved = localStorage.getItem(STORAGE_KEYS.COMMITMENTS);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(commitments));
  }, [commitments]);

  // User session state (authentication with code)
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    if (session?.role === 'admin') return 'admin';
    if (session?.role === 'teacher') return 'teacher';
    if (session?.role === 'homeroom') return 'homeroom';
    if (session?.role === 'parent') return 'parent';
    return 'parent';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [selectedHomeroomClass, setSelectedHomeroomClass] = useState<string>(
    session?.homeroomClass || "ח'1"
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    session?.teacherId || INITIAL_TEACHERS[0].id
  );
  const [parentStudentId, setParentStudentId] = useState<string | null>(null);
  const [soundOn, setSoundOnState] = useState<boolean>(isSoundEnabled);
  const [latestAlert, setLatestAlert] = useState<IncidentReport | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, JSON.stringify(homeroomTeachers));
  }, [homeroomTeachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [session]);

  // Real-Time Firestore Cloud Database Synchronization
  useEffect(() => {
    testFirestoreConnection();

    // 1. Sync live reports from Firestore
    const unsubReports = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudList: IncidentReport[] = [];
          snapshot.forEach((d) => cloudList.push(d.data() as IncidentReport));
          cloudList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setReports((prev) => {
            const cloudIds = new Set(cloudList.map((r) => r.id));
            const localOnly = prev.filter((r) => !cloudIds.has(r.id));
            const merged = [...cloudList, ...localOnly].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(merged));
            return merged;
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'reports')
    );

    // 2. Sync students from Firestore
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Student[] = [];
          snapshot.forEach((d) => {
            const s = d.data() as Student;
            if (!s.parentCode) {
              s.parentCode = String(10101 + list.length);
            }
            list.push(s);
          });
          setStudents(list);
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
        } else {
          // Collection is empty: keep empty state
          setStudents([]);
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'students')
    );

    // 3. Sync teachers from Firestore
    const unsubTeachers = onSnapshot(
      collection(db, 'teachers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Teacher[] = [];
          snapshot.forEach((d) => list.push(d.data() as Teacher));
          setTeachers(list);
          localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(list));
        } else {
          // Collection is empty: keep empty state
          setTeachers([]);
          localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify([]));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'teachers')
    );

    // 4. Sync homeroom teachers from Firestore
    const unsubHomerooms = onSnapshot(
      collection(db, 'homeroomTeachers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: HomeroomTeacherInfo[] = [];
          snapshot.forEach((d) => list.push(d.data() as HomeroomTeacherInfo));
          setHomeroomTeachers(list);
          localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, JSON.stringify(list));
        } else {
          // Collection is empty: keep empty state
          setHomeroomTeachers([]);
          localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, JSON.stringify([]));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'homeroomTeachers')
    );

    // 5. Sync admin settings from Firestore
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'admin'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AdminSettings;
          setAdminSettings(data);
          localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(data));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/admin')
    );

    // 6. Sync parent commitments from Firestore
    const unsubCommitments = onSnapshot(
      collection(db, 'parentCommitments'),
      (snapshot) => {
        const comms: ParentCommitment[] = [];
        snapshot.forEach((d) => comms.push(d.data() as ParentCommitment));
        if (comms.length > 0 || localStorage.getItem('amat_db_state') !== 'empty') {
          comms.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setCommitments(comms);
          localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(comms));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'parentCommitments')
    );

    return () => {
      unsubReports();
      unsubStudents();
      unsubTeachers();
      unsubHomerooms();
      unsubSettings();
      unsubCommitments();
    };
  }, []);

  // Real-Time Cross-tab Broadcast Channel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('amat_live_channel');
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'NEW_REPORTS' && Array.isArray(payload)) {
          setReports((prev) => [...payload, ...prev]);

          // Pick most urgent report for banner & chime
          const urgentReport = payload.find((r: IncidentReport) => r.behavior !== 'normal') || payload[0];
          if (urgentReport) {
            // Only trigger alert if admin OR homeroom teacher of this class OR teacher who submitted
            const isRelevantForUser =
              !session ||
              session.role === 'admin' ||
              (session.role === 'homeroom' && session.homeroomClass === urgentReport.className) ||
              (session.role === 'teacher' && session.allowedGrades?.includes(urgentReport.grade));

            if (isRelevantForUser) {
              setLatestAlert(urgentReport);
              if (urgentReport.behavior === 'excellence') {
                playChime('excellence');
              } else if (urgentReport.behavior !== 'normal') {
                playChime('alert');
              } else {
                playChime('info');
              }
            }
          }
        } else if (type === 'REPORT_UPDATED' && payload) {
          setReports((prev) =>
            prev.map((r) => (r.id === payload.id ? payload : r))
          );
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted:', e);
    }

    return () => {
      channel?.close();
    };
  }, [session]);

  const setSoundOn = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundOnState(enabled);
  };

  const testSound = () => {
    playChime('alert');
  };

  const clearLatestAlert = () => {
    setLatestAlert(null);
  };

  const addReports = useCallback((newReports: IncidentReport[]) => {
    setReports((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = newReports.filter((r) => !existingIds.has(r.id));
      const updated = [...fresh, ...prev];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      return updated;
    });

    // Persist each report to Firestore cloud database
    newReports.forEach((rep) => {
      setDoc(doc(db, 'reports', rep.id), rep).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `reports/${rep.id}`)
      );
    });

    const urgent = newReports.find((r) => r.behavior !== 'normal');
    if (urgent) {
      setLatestAlert(urgent);
      if (urgent.behavior === 'excellence') {
        playChime('excellence');
      } else {
        playChime('alert');
      }
    } else {
      playChime('info');
    }

    try {
      const channel = new BroadcastChannel('amat_live_channel');
      channel.postMessage({ type: 'NEW_REPORTS', payload: newReports });
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel postMessage failed:', e);
    }
  }, []);

  const toggleAddressed = useCallback((reportId: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          const nowVal = !r.addressedByHomeroom;
          const updatedReport: IncidentReport = {
            ...r,
            addressedByHomeroom: nowVal,
            addressedAt: nowVal ? new Date().toISOString() : undefined,
          };

          // Persist addressed status to Firestore cloud database
          updateDoc(doc(db, 'reports', reportId), {
            addressedByHomeroom: nowVal,
            addressedAt: nowVal ? new Date().toISOString() : null,
          }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`)
          );

          try {
            const channel = new BroadcastChannel('amat_live_channel');
            channel.postMessage({ type: 'REPORT_UPDATED', payload: updatedReport });
            channel.close();
          } catch {
            // Ignore channel errors
          }
          return updatedReport;
        }
        return r;
      });
      return updated;
    });
  }, []);

  /**
   * Secret Code Login Engine
   * 1. 160525 -> Admin (full access)
   * 2. Teacher code -> Teacher mode locked to teacher's assigned grades
   * 3. Homeroom code -> Homeroom mode locked to homeroom's specific class
   * 4. Dual role support (e.g. Rabia Khatib)
   */
  const loginWithCode = (code: string): { success: boolean; message: string; session?: UserSession } => {
    const cleanCode = code.trim();

    // 1. Check Admin Password (exact 160525 or custom configured)
    if (cleanCode === adminSettings.adminPassword || cleanCode === '160525') {
      const adminSession: UserSession = {
        role: 'admin',
        name: 'מנהל/ת המערכת',
        code: cleanCode,
      };
      setSession(adminSession);
      setCurrentRole('admin');
      return { success: true, message: 'ברוך הבא מנהל המערכת!', session: adminSession };
    }

    // 2. Check Teacher codes
    const matchedTeacher = teachers.find((t) => t.teacherCode === cleanCode);
    if (matchedTeacher) {
      const teacherSession: UserSession = {
        role: 'teacher',
        name: matchedTeacher.name,
        code: cleanCode,
        teacherId: matchedTeacher.id,
        teacherObj: matchedTeacher,
        allowedGrades: matchedTeacher.grades,
        isDualRole: !!matchedTeacher.isHomeroom,
        activeDualMode: 'teacher',
        homeroomClass: matchedTeacher.homeroomClass,
      };
      setSession(teacherSession);
      setSelectedTeacherId(matchedTeacher.id);
      setCurrentRole('teacher');
      return {
        success: true,
        message: `שלום ${matchedTeacher.name}! מחובר/ת כמורה עמ"ט לשכבות ${matchedTeacher.grades.join(', ')}'`,
        session: teacherSession,
      };
    }

    // 3. Check Homeroom codes (both from teachers list and homeroom list)
    // Check if teacher has homeroomCode
    const teacherWithHomeroomCode = teachers.find(
      (t) => t.isHomeroom && t.homeroomCode === cleanCode
    );
    if (teacherWithHomeroomCode && teacherWithHomeroomCode.homeroomClass) {
      const homeroomSession: UserSession = {
        role: 'homeroom',
        name: teacherWithHomeroomCode.name,
        code: cleanCode,
        homeroomClass: teacherWithHomeroomCode.homeroomClass,
        isDualRole: true,
        activeDualMode: 'homeroom',
        teacherId: teacherWithHomeroomCode.id,
        teacherObj: teacherWithHomeroomCode,
        allowedGrades: teacherWithHomeroomCode.grades,
      };
      setSession(homeroomSession);
      setSelectedHomeroomClass(teacherWithHomeroomCode.homeroomClass);
      setCurrentRole('homeroom');
      return {
        success: true,
        message: `שלום ${teacherWithHomeroomCode.name}! מחובר/ת כמחנכת כיתה ${teacherWithHomeroomCode.homeroomClass}`,
        session: homeroomSession,
      };
    }

    // Check homeroom list
    const matchedHomeroom = homeroomTeachers.find((h) => h.code === cleanCode);
    if (matchedHomeroom) {
      const homeroomSession: UserSession = {
        role: 'homeroom',
        name: matchedHomeroom.teacherName,
        code: cleanCode,
        homeroomClass: matchedHomeroom.className,
      };
      setSession(homeroomSession);
      setSelectedHomeroomClass(matchedHomeroom.className);
      setCurrentRole('homeroom');
      return {
        success: true,
        message: `שלום ${matchedHomeroom.teacherName}! מחובר/ת כמחנכת כיתה ${matchedHomeroom.className}`,
        session: homeroomSession,
      };
    }

    return { success: false, message: 'קוד סודי שגוי. אנא ודא/י את הקוד שהוקלד או פנה/י למנהל המערכת.' };
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setCurrentRole('parent');
    setIsLoginModalOpen(true);
  };

  const switchDualMode = (mode: 'teacher' | 'homeroom') => {
    if (!session || !session.isDualRole) return;

    if (mode === 'teacher') {
      const updated: UserSession = {
        ...session,
        role: 'teacher',
        activeDualMode: 'teacher',
      };
      setSession(updated);
      if (session.teacherId) setSelectedTeacherId(session.teacherId);
      setCurrentRole('teacher');
    } else {
      const updated: UserSession = {
        ...session,
        role: 'homeroom',
        activeDualMode: 'homeroom',
      };
      setSession(updated);
      if (session.homeroomClass) setSelectedHomeroomClass(session.homeroomClass);
      setCurrentRole('homeroom');
    }
  };

  const updateAdminSettings = (newSettings: Partial<AdminSettings>) => {
    setAdminSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      setDoc(doc(db, 'settings', 'admin'), updated, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin')
      );
      return updated;
    });
  };

  const updateSchoolPeriods = (periods: LessonPeriodConfig[]) => {
    setAdminSettings((prev) => {
      const updated = { ...prev, schoolPeriods: periods };
      setDoc(doc(db, 'settings', 'admin'), { schoolPeriods: periods }, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin')
      );
      return updated;
    });
  };

  const updateHomeroomTeachers = (list: HomeroomTeacherInfo[]) => {
    setHomeroomTeachers(list);
    list.forEach((h) => {
      setDoc(doc(db, 'homeroomTeachers', h.className), h).catch(console.warn);
    });
  };

  const updateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    // Sync batch to Firestore
    newStudents.forEach((s) => {
      setDoc(doc(db, 'students', s.id), s).catch(console.warn);
    });
  };

  const updateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    newTeachers.forEach((t) => {
      setDoc(doc(db, 'teachers', t.id), t).catch(console.warn);
    });
  };

  const updateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );
    setDoc(doc(db, 'teachers', updatedTeacher.id), updatedTeacher).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `teachers/${updatedTeacher.id}`)
    );
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, 'teachers', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `teachers/${id}`)
    );
  };

  const addStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    setDoc(doc(db, 'students', newStudent.id), newStudent).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `students/${newStudent.id}`)
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    deleteDoc(doc(db, 'students', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`)
    );
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    deleteDoc(doc(db, 'reports', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `reports/${id}`)
    );
  };

  const deleteReports = (ids: string[]) => {
    const idSet = new Set(ids);
    setReports((prev) => prev.filter((r) => !idSet.has(r.id)));
    ids.forEach((id) => {
      deleteDoc(doc(db, 'reports', id)).catch(console.warn);
    });
  };

  const clearAllReports = () => {
    setReports([]);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    setLatestAlert(null);

    // Delete all reports from Firestore
    getDocs(collection(db, 'reports')).then((snap) => {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      batch.commit().catch(console.warn);
    }).catch(console.warn);
  };

  const clearEntireDatabase = () => {
    localStorage.setItem('amat_db_state', 'empty');
    setStudents([]);
    setTeachers([]);
    setHomeroomTeachers([]);
    setReports([]);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.TEACHERS, '[]');
    localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, '[]');
    localStorage.setItem(STORAGE_KEYS.REPORTS, '[]');
    setLatestAlert(null);
    setParentStudentId(null);

    // Delete all records from Firestore collections
    ['reports', 'students', 'teachers', 'homeroomTeachers', 'parentCommitments'].forEach((colName) => {
      getDocs(collection(db, colName)).then((snap) => {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        batch.commit().catch(console.warn);
      }).catch(console.warn);
    });
    setCommitments([]);
    localStorage.setItem(STORAGE_KEYS.COMMITMENTS, '[]');
  };

  const addCommitment = async (newCommitment: ParentCommitment): Promise<boolean> => {
    try {
      setCommitments((prev) => {
        const filtered = prev.filter((c) => c.id !== newCommitment.id && c.studentId !== newCommitment.studentId);
        const updated = [newCommitment, ...filtered];
        localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(updated));
        return updated;
      });
      await setDoc(doc(db, 'parentCommitments', newCommitment.id), newCommitment);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parentCommitments/${newCommitment.id}`);
      return false;
    }
  };

  const deleteCommitment = async (id: string): Promise<void> => {
    try {
      setCommitments((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(updated));
        return updated;
      });
      await deleteDoc(doc(db, 'parentCommitments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `parentCommitments/${id}`);
    }
  };

  const clearAllCommitments = async (): Promise<void> => {
    try {
      setCommitments([]);
      localStorage.setItem(STORAGE_KEYS.COMMITMENTS, '[]');
      const snap = await getDocs(collection(db, 'parentCommitments'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn('Error clearing commitments:', err);
    }
  };

  const regenerateAllCodes = () => {
    // Regenerate clean unique 4-digit codes for all teachers and homerooms
    const updatedTeachers = teachers.map((t, idx) => ({
      ...t,
      teacherCode: String(7001 + idx),
      homeroomCode: t.isHomeroom ? String(8001 + idx) : undefined,
    }));
    setTeachers(updatedTeachers);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(updatedTeachers));
    updatedTeachers.forEach((t) => {
      setDoc(doc(db, 'teachers', t.id), t).catch(console.warn);
    });

    const updatedHomerooms = homeroomTeachers.map((h, idx) => ({
      ...h,
      code: String(8001 + idx),
    }));
    setHomeroomTeachers(updatedHomerooms);
    localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, JSON.stringify(updatedHomerooms));
    updatedHomerooms.forEach((h) => {
      setDoc(doc(db, 'homeroomTeachers', h.className), h).catch(console.warn);
    });
  };

  const resetToDefaultData = () => {
    localStorage.removeItem('amat_db_state');
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setReports(INITIAL_REPORTS);
    setHomeroomTeachers(INITIAL_HOMEROOM_TEACHERS);
    setAdminSettings(DEFAULT_ADMIN_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(STORAGE_KEYS.HOMEROOM_TEACHERS, JSON.stringify(INITIAL_HOMEROOM_TEACHERS));
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
    setLatestAlert(null);

    // Reseed Firestore
    INITIAL_STUDENTS.forEach((s) => setDoc(doc(db, 'students', s.id), s).catch(console.warn));
    INITIAL_TEACHERS.forEach((t) => setDoc(doc(db, 'teachers', t.id), t).catch(console.warn));
    INITIAL_HOMEROOM_TEACHERS.forEach((h) => setDoc(doc(db, 'homeroomTeachers', h.className), h).catch(console.warn));
    INITIAL_REPORTS.forEach((r) => setDoc(doc(db, 'reports', r.id), r).catch(console.warn));
    setDoc(doc(db, 'settings', 'admin'), DEFAULT_ADMIN_SETTINGS).catch(console.warn);
  };

  return (
    <AppContext.Provider
      value={{
        students,
        teachers,
        reports,
        homeroomTeachers,
        adminSettings,
        session,
        currentRole,
        setCurrentRole,
        selectedHomeroomClass,
        setSelectedHomeroomClass,
        selectedTeacherId,
        setSelectedTeacherId,
        parentStudentId,
        setParentStudentId,
        soundOn,
        setSoundOn,
        testSound,
        latestAlert,
        clearLatestAlert,
        addReports,
        toggleAddressed,
        updateStudents,
        updateTeachers,
        updateTeacher,
        deleteTeacher,
        addStudent,
        deleteStudent,
        deleteReport,
        deleteReports,
        clearAllReports,
        clearEntireDatabase,
        resetToDefaultData,
        regenerateAllCodes,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithCode,
        logout,
        switchDualMode,
        updateAdminSettings,
        updateSchoolPeriods,
        updateHomeroomTeachers,
        commitments,
        addCommitment,
        deleteCommitment,
        clearAllCommitments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
