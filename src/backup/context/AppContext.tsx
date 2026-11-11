import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Student, Teacher, IncidentReport } from '../types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, INITIAL_REPORTS } from '../data/initialData';
import { playChime, isSoundEnabled, setSoundEnabled } from '../utils/sound';

export type AppRole = 'teacher' | 'homeroom' | 'parent' | 'pedagogical' | 'excel' | 'behavior_reports';

interface AppContextType {
  students: Student[];
  teachers: Teacher[];
  reports: IncidentReport[];
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
  addStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  deleteReport: (id: string) => void;
  deleteReports: (ids: string[]) => void;
  clearAllReports: () => void;
  clearEntireDatabase: () => void;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'amat_students_v1',
  TEACHERS: 'amat_teachers_v1',
  REPORTS: 'amat_reports_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // State for teachers
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  // State for reports
  const [reports, setReports] = useState<IncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [currentRole, setCurrentRole] = useState<AppRole>('teacher');
  const [selectedHomeroomClass, setSelectedHomeroomClass] = useState<string>('ח\'1');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(INITIAL_TEACHERS[0].id);
  const [parentStudentId, setParentStudentId] = useState<string | null>(null);
  const [soundOn, setSoundOnState] = useState<boolean>(isSoundEnabled);
  const [latestAlert, setLatestAlert] = useState<IncidentReport | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

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
            setLatestAlert(urgentReport);
            if (urgentReport.behavior === 'excellence') {
              playChime('excellence');
            } else if (urgentReport.behavior !== 'normal') {
              playChime('alert');
            } else {
              playChime('info');
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
  }, []);

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
    setReports((prev) => [...newReports, ...prev]);

    // Check if any report is disciplinary or excellence
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

    // Broadcast to other tabs/windows in real time
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

  const updateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const updateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
  };

  const addStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const deleteReports = (ids: string[]) => {
    const idSet = new Set(ids);
    setReports((prev) => prev.filter((r) => !idSet.has(r.id)));
  };

  const clearAllReports = () => {
    setReports([]);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    setLatestAlert(null);
  };

  const clearEntireDatabase = () => {
    setStudents([]);
    setTeachers([]);
    setReports([]);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    setLatestAlert(null);
    setParentStudentId(null);
  };

  const resetToDefaultData = () => {
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setReports(INITIAL_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    setLatestAlert(null);
  };

  return (
    <AppContext.Provider
      value={{
        students,
        teachers,
        reports,
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
        addStudent,
        deleteStudent,
        deleteReport,
        deleteReports,
        clearAllReports,
        clearEntireDatabase,
        resetToDefaultData,
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
