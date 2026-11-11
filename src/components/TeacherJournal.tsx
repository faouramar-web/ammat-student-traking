import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Grade,
  Subject,
  AttendanceStatus,
  HomeworkStatus,
  BehaviorType,
  IncidentReport,
  Student,
} from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  CheckCircle,
  AlertCircle,
  UserCheck,
  CheckCheck,
  Search,
  BookOpen,
  Filter,
  Zap,
  Award,
  Smile,
  Check,
  MessageCircle,
  Copy,
  Save,
} from 'lucide-react';
import {
  getTeacherToHomeroomWhatsAppUrl,
  copyTeacherToHomeroomToClipboard,
} from '../utils/whatsapp';

interface StudentJournalEntry {
  studentId: string;
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  behavior: BehaviorType;
  description: string;
  isModified: boolean;
}

const PRESET_DISCIPLINE_PHRASES = [
  'שימוש בטלפון נייד במהלך ההסבר בכיתה למרות התראה.',
  'הפרעה חוזרת למהלך התקין של השיעור ודיבור ללא רשות.',
  'אי קבלת סמכות המורה והתחצפות מול תלמידי הכיתה.',
  'אי הבאת חוברת עמ"ט, מחשבון או ציוד לימודי נדרש.',
  'חוסר שמירה על נהלי בטיחות במעבדת הפיזיקה/מחשבים.',
  'יציאה מהכיתה ללא קבלת רשות מהמורה.',
];

const PRESET_EXCELLENCE_PHRASES = [
  'השתתפות מעוררת השראה ופתרון אלגנטי של אתגר חשיבה מורכב.',
  'הובלת פרויקט קוד מצטיין במדעי המחשב וסיוע סבלני לעמיתים.',
  'הפגנת סקרנות מדעית יוצאת דופן וניתוח מעמיק בניסוי החקר.',
  'הכנה מופתית של כל מטלות העמ"ט ושליטה גבוהה בחומר.',
];

export const TeacherJournal: React.FC = () => {
  const {
    students,
    teachers,
    selectedTeacherId,
    setSelectedTeacherId,
    addReports,
    setCurrentRole,
    session,
    adminSettings,
    homeroomTeachers,
  } = useApp();

  // If database is empty
  if (teachers.length === 0 || students.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-sm my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-['Rubik']">
          מסד הנתונים ריק כרגע
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          כדי לנהל יומן שיעור מהיר, נא לעבור למודול <strong>"ניהול מסד נתונים ואקסל"</strong> ולהעלות את קובץ האקסל שהכנת (עם גליונות מחנכות, מורים ושכבות עמ"ט), או לטעון נתוני דוגמה.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCurrentRole('excel')}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            מעבר לניהול והעלאת אקסל
          </button>
        </div>
      </div>
    );
  }

  // If a teacher is logged in with secret code, lock to their assigned teacherId and allowed grades
  const isTeacherLocked = session?.role === 'teacher' && !!session.teacherId;
  const effectiveTeacherId = isTeacherLocked ? session.teacherId : selectedTeacherId;
  const currentTeacher = teachers.find((t) => t.id === effectiveTeacherId) || teachers[0];

  // Allowed grades for this teacher (e.g. only ז' for Rabia, only ח' ו-ט' for Dr. Rami)
  const allowedGrades: Grade[] =
    isTeacherLocked && session?.allowedGrades && session.allowedGrades.length > 0
      ? session.allowedGrades
      : (['ז', 'ח', 'ט'] as Grade[]);

  // Journal Configuration
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    currentTeacher?.subjects[0] || 'מדעי המחשב'
  );
  const [selectedGrade, setSelectedGrade] = useState<Grade>(
    allowedGrades.includes(currentTeacher?.grades[0])
      ? currentTeacher?.grades[0]
      : allowedGrades[0] || 'ח'
  );
  const [lessonPeriod, setLessonPeriod] = useState<number>(
    adminSettings?.schoolPeriods?.[0]?.period || 2
  );
  const [lessonDate, setLessonDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Active dictation tracking: studentId currently recording
  const [recordingStudentId, setRecordingStudentId] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'he-IL' | 'ar-IL'>('he-IL');
  const [speechActiveObj, setSpeechActiveObj] = useState<{ stop: () => void } | null>(null);

  // Journal entries state keyed by studentId
  const [journalData, setJournalData] = useState<Record<string, StudentJournalEntry>>({});

  // Submission feedback
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Auto-sync if teacher session changes
  useEffect(() => {
    if (isTeacherLocked && session?.teacherId) {
      if (selectedTeacherId !== session.teacherId) {
        setSelectedTeacherId(session.teacherId);
      }
    }
  }, [isTeacherLocked, session, selectedTeacherId, setSelectedTeacherId]);

  // Ensure selected grade is within allowedGrades
  useEffect(() => {
    if (!allowedGrades.includes(selectedGrade)) {
      setSelectedGrade(allowedGrades[0]);
    }
  }, [allowedGrades, selectedGrade]);

  // Update subject/grade options when selected teacher changes
  useEffect(() => {
    if (currentTeacher) {
      if (!currentTeacher.subjects.includes(selectedSubject)) {
        setSelectedSubject(currentTeacher.subjects[0]);
      }
    }
  }, [effectiveTeacherId, currentTeacher, selectedSubject]);

  // Filter students by selected Grade
  const gradeStudents = students.filter((s) => s.grade === selectedGrade);

  // Initialize journal entries for all students in grade
  useEffect(() => {
    const initial: Record<string, StudentJournalEntry> = {};
    gradeStudents.forEach((student) => {
      initial[student.id] = {
        studentId: student.id,
        attendance: 'present',
        homework: 'done',
        behavior: 'normal',
        description: '',
        isModified: false,
      };
    });
    setJournalData(initial);
  }, [selectedGrade, students.length]);

  // Distinct classes in this grade for quick filtering
  const availableClasses = Array.from(
    new Set(gradeStudents.map((s) => s.className))
  ).sort();

  // Visible students after filters
  const visibleStudents = gradeStudents.filter((student) => {
    if (classFilter !== 'all' && student.className !== classFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = student.name.toLowerCase().includes(q);
      const matchId = student.id.includes(q);
      const matchClass = student.className.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchClass) return false;
    }
    return true;
  });

  // Handle entry changes
  const updateStudentField = <K extends keyof StudentJournalEntry>(
    studentId: string,
    field: K,
    value: StudentJournalEntry[K]
  ) => {
    setJournalData((prev) => {
      const current = prev[studentId] || {
        studentId,
        attendance: 'present',
        homework: 'done',
        behavior: 'normal',
        description: '',
        isModified: false,
      };

      const updated = {
        ...current,
        [field]: value,
        isModified: true,
      };

      // If behavior changed to normal and description was empty or preset, keep it tidy
      return {
        ...prev,
        [studentId]: updated,
      };
    });
  };

  // Positive Audio Chime synthesized via Web Audio API
  const playPositiveChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio not permitted or supported
    }
  };

  // Bulk actions
  const handleMarkAllPresentAndHomeworkDone = () => {
    setJournalData((prev) => {
      const next = { ...prev };
      visibleStudents.forEach((s) => {
        if (next[s.id]) {
          next[s.id] = {
            ...next[s.id],
            attendance: 'present',
            homework: 'done',
            isModified: true,
          };
        }
      });
      return next;
    });
    playPositiveChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });
  };

  const handleMarkAllPresent = () => {
    setJournalData((prev) => {
      const next = { ...prev };
      visibleStudents.forEach((s) => {
        if (next[s.id]) {
          next[s.id] = { ...next[s.id], attendance: 'present', isModified: true };
        }
      });
      return next;
    });
  };

  const handleMarkAllHomeworkDone = () => {
    setJournalData((prev) => {
      const next = { ...prev };
      visibleStudents.forEach((s) => {
        if (next[s.id]) {
          next[s.id] = { ...next[s.id], homework: 'done', isModified: true };
        }
      });
      return next;
    });
  };

  // Quick 1-Tap Excellence helper
  const handleQuickExcellence = (studentId: string, phrase: string) => {
    setJournalData((prev) => {
      const current = prev[studentId] || {
        studentId,
        attendance: 'present',
        homework: 'done',
        behavior: 'normal',
        description: '',
        isModified: true,
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          behavior: 'excellence',
          description: phrase,
          isModified: true,
        },
      };
    });
    playPositiveChime();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Quick 1-Tap Discipline helper
  const handleQuickDiscipline = (studentId: string, behavior: BehaviorType, phrase: string) => {
    setJournalData((prev) => {
      const current = prev[studentId] || {
        studentId,
        attendance: 'present',
        homework: 'done',
        behavior: 'normal',
        description: '',
        isModified: true,
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          behavior,
          description: phrase,
          isModified: true,
        },
      };
    });
  };

  // Voice dictation toggle
  const toggleRecording = (studentId: string) => {
    if (recordingStudentId === studentId) {
      // Stop recording
      speechActiveObj?.stop();
      setSpeechActiveObj(null);
      setRecordingStudentId(null);
    } else {
      // If another student was recording, stop that first
      if (speechActiveObj) {
        speechActiveObj.stop();
      }

      if (!isSpeechRecognitionSupported()) {
        alert('הכתבה קולית אינה נתמכת בדפדפן זה. ניתן להקליד ישירות במקלדת.');
        return;
      }

      const recognizer = createSpeechRecognizer(
        speechLang,
        (transcript) => {
          setJournalData((prev) => {
            const currentDesc = prev[studentId]?.description || '';
            const newDesc = currentDesc ? `${currentDesc} ${transcript}` : transcript;
            return {
              ...prev,
              [studentId]: {
                ...(prev[studentId] || {
                  studentId,
                  attendance: 'present',
                  homework: 'done',
                  behavior: 'normal',
                  isModified: true,
                }),
                description: newDesc,
                isModified: true,
              },
            };
          });
        },
        () => {
          setRecordingStudentId(null);
          setSpeechActiveObj(null);
        },
        (err) => {
          console.warn('Speech error:', err);
          setRecordingStudentId(null);
          setSpeechActiveObj(null);
        }
      );

      if (recognizer) {
        recognizer.start();
        setSpeechActiveObj(recognizer);
        setRecordingStudentId(studentId);
      }
    }
  };

  // Apply preset phrase
  const handleApplyPreset = (studentId: string, phrase: string) => {
    setJournalData((prev) => {
      const currentDesc = prev[studentId]?.description || '';
      const newDesc = currentDesc ? `${currentDesc} ${phrase}` : phrase;
      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {
            studentId,
            attendance: 'present',
            homework: 'done',
            behavior: 'normal',
            isModified: true,
          }),
          description: newDesc,
          isModified: true,
        },
      };
    });
  };

  // Calculate statistics of current session
  const modifiedCount = Object.values(journalData).filter((e) => e.isModified).length;
  const disciplinaryCount = Object.values(journalData).filter(
    (e) => e.behavior !== 'normal' && e.behavior !== 'excellence'
  ).length;
  const excellenceCount = Object.values(journalData).filter(
    (e) => e.behavior === 'excellence'
  ).length;

  // Track which students have been saved individually
  const [savedStudentIds, setSavedStudentIds] = useState<Record<string, boolean>>({});

  // Save report for a single specific student immediately
  const handleSaveSingleStudent = (student: Student): IncidentReport | null => {
    const entry = journalData[student.id];
    if (!entry) return null;

    const reportItem: IncidentReport = {
      id: `rep-${Date.now()}-${student.id}`,
      timestamp: new Date().toISOString(),
      date: lessonDate,
      lessonPeriod,
      teacherId: currentTeacher?.id || 't1',
      teacherName: currentTeacher?.name || 'מורה מקצועי',
      subject: selectedSubject,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      className: student.className,
      homeroomTeacher: student.homeroomTeacher || '',
      attendance: entry.attendance,
      homework: entry.homework,
      behavior: entry.behavior,
      description:
        entry.description.trim() ||
        (entry.behavior === 'excellence'
          ? 'ציון לשבח על השתתפות והצטיינות במשימת עמ"ט.'
          : entry.behavior === 'normal'
          ? 'שיעור תקין.'
          : 'אירוע משמעתי במהלך השיעור.'),
      addressedByHomeroom: false,
    };

    addReports([reportItem]);
    setSavedStudentIds((prev) => ({ ...prev, [student.id]: true }));
    setTimeout(() => {
      setSavedStudentIds((prev) => ({ ...prev, [student.id]: false }));
    }, 3500);

    return reportItem;
  };

  // Submit entire session reports
  const handleSubmitSession = () => {
    const newReports: IncidentReport[] = [];

    gradeStudents.forEach((student) => {
      const entry = journalData[student.id];
      if (!entry) return;

      // Always submit modified entries or entries with non-default state
      const isImportant =
        entry.isModified ||
        entry.attendance !== 'present' ||
        entry.homework !== 'done' ||
        entry.behavior !== 'normal' ||
        entry.description.trim().length > 0;

      if (isImportant) {
        newReports.push({
          id: `rep-${Date.now()}-${student.id}`,
          timestamp: new Date().toISOString(),
          date: lessonDate,
          lessonPeriod,
          teacherId: currentTeacher.id,
          teacherName: currentTeacher.name,
          subject: selectedSubject,
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          className: student.className,
          homeroomTeacher: student.homeroomTeacher,
          attendance: entry.attendance,
          homework: entry.homework,
          behavior: entry.behavior,
          description:
            entry.description.trim() ||
            (entry.behavior === 'excellence'
              ? 'ציון לשבח על השתתפות והצטיינות במשימת עמ"ט.'
              : entry.behavior === 'normal'
              ? 'שיעור תקין.'
              : 'אירוע משמעתי במהלך השיעור.'),
          addressedByHomeroom: false,
        });
      }
    });

    if (newReports.length === 0) {
      alert('נא לסמן לפחות תלמיד אחד או לבצע שינוי לפני השמירה.');
      return;
    }

    addReports(newReports);

    // Trigger confetti if excellence was reported
    if (excellenceCount > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Teacher & Lesson Setup Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-['Rubik']">
                  יומן שיעור מהיר למורי עמ"ט
                </h2>
                <p className="text-xs text-slate-700">
                  דיווח נוכחות, הכנת שיעורי בית ומשמעת/הצטיינות בזמן אמת עם שידור למחנכות הכיתה
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
              סה״כ {gradeStudents.length} תלמידי עמ"ט בשכבה {selectedGrade}'
            </span>
            {disciplinaryCount > 0 && (
              <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center gap-1 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {disciplinaryCount} אירועי משמעת לדיווח
              </span>
            )}
            {excellenceCount > 0 && (
              <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center gap-1 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5" />
                {excellenceCount} ציונים לשבח
              </span>
            )}
          </div>
        </div>

        {/* Form controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
          {/* Teacher Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>מורה מדווח (עמ"ט)</span>
              {isTeacherLocked && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  נעול לקוד {session?.code}
                </span>
              )}
            </label>
            {isTeacherLocked ? (
              <div className="w-full bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 font-bold flex items-center justify-between">
                <span>{currentTeacher.name}</span>
                <span className="text-slate-500 text-xs">({currentTeacher.subjects.join('/')})</span>
              </div>
            ) : (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.subjects.join('/')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              תחום דעת עמ"ט
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {currentTeacher?.subjects?.length > 0 ? (
                currentTeacher.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s === 'מדעי המחשב' && '💻 מדעי המחשב וסייבר'}
                    {s === 'מתמטיקה' && '📐 מתמטיקה מואצת'}
                    {s === 'פיזיקה' && '🔬 פיזיקה ומדעי החלל'}
                  </option>
                ))
              ) : (
                <>
                  <option value="מדעי המחשב">💻 מדעי המחשב וסייבר</option>
                  <option value="מתמטיקה">📐 מתמטיקה מואצת</option>
                  <option value="פיזיקה">🔬 פיזיקה ומדעי החלל</option>
                </>
              )}
            </select>
          </div>

          {/* Grade Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>שכבת לימוד</span>
              {isTeacherLocked && (
                <span className="text-[10px] text-slate-500 font-normal">
                  (שיוך מורה)
                </span>
              )}
            </label>
            <div className={`grid gap-1 bg-slate-100 p-1 rounded-xl ${allowedGrades.length === 1 ? 'grid-cols-1' : allowedGrades.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {allowedGrades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  שכבה {g}'
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Period */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              שעת השיעור
            </label>
            <select
              value={lessonPeriod}
              onChange={(e) => setLessonPeriod(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {adminSettings?.schoolPeriods && adminSettings.schoolPeriods.length > 0 ? (
                adminSettings.schoolPeriods.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.name} ({p.startTime} - {p.endTime})
                  </option>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <option key={period} value={period}>
                    שיעור {period} ({8 + period - 1}:00 - {8 + period}:00)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              תאריך
            </label>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Action Bar & Filter */}
      <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש תלמיד לפי שם או כיתה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-cyan-400 mx-1" />
            <button
              onClick={() => setClassFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                classFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              כל כיתות {selectedGrade}'
            </button>
            {availableClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  classFilter === cls
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
              }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Batch Marking Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={handleMarkAllPresentAndHomeworkDone}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
            title="סמן את כל הכיתה כנוכחים והכינו שיעורי בית בנגיעה אחת"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>⚡ סימון מהיר: כולם נוכחים והכינו ש"ב ✅</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>נוכחים בלבד</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllHomeworkDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>הכינו ש"ב</span>
          </button>
        </div>
      </section>

      {/* Success Notification Bar */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-xl flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <p className="font-bold text-sm">היומן נשמר ושודר בהצלחה בזמן אמת!</p>
              <p className="text-xs text-emerald-100">
                המחנכות קיבלו התראה קולית וכרטיס עדכון בלוח הבקרה שלהן.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <section className="space-y-3.5">
        {visibleStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 font-medium">לא נמצאו תלמידים התואמים את הסינון הנוכחי.</p>
          </div>
        ) : (
          visibleStudents.map((student, index) => {
            const entry = journalData[student.id] || {
              studentId: student.id,
              attendance: 'present',
              homework: 'done',
              behavior: 'normal',
              description: '',
              isModified: false,
            };

            const isDisciplinary =
              entry.behavior !== 'normal' && entry.behavior !== 'excellence';
            const isExcellence = entry.behavior === 'excellence';
            const showIncidentField = isDisciplinary || isExcellence;
            const isRecording = recordingStudentId === student.id;

            return (
              <div
                key={student.id}
                className={`rounded-2xl transition-all border p-4 sm:p-5 ${
                  isExcellence
                    ? 'bg-gradient-to-r from-amber-50/90 to-amber-50/40 border-amber-300 ring-2 ring-amber-400/30'
                    : isDisciplinary
                    ? 'bg-gradient-to-r from-rose-50/90 to-rose-50/30 border-rose-300 ring-2 ring-rose-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Top Student Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">
                          {student.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                          כיתה {student.className}
                        </span>
                        <span className="text-xs text-slate-700">
                          מחנכת: <strong className="text-slate-800">{student.homeroomTeacher}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges preview */}
                  <div className="flex items-center gap-2">
                    {entry.attendance === 'late' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        איחור לשיעור
                      </span>
                    )}
                    {entry.attendance === 'absent' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                        חיסור
                      </span>
                    )}
                    {entry.homework === 'not_done' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                        ללא שיעורי בית
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Fast Reporting Action Bar - Fun, rapid & effortless */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-900 ml-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      ציון לשבח מהיר:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickExcellence(student.id, 'השתתפות מעולה וחשיבה מתמטית יצירתית בניתוח אתגר')}
                      className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      💡 חשיבה מתמטית
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExcellence(student.id, 'מצטיין/ת השיעור - תרומה בולטת ללמידה וסיוע סבלני לעמיתים')}
                      className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      🚀 מצטיין השיעור
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExcellence(student.id, 'סיוע ועזרה מעוררת כבוד לחבר/ה במהלך משימת החקר')}
                      className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      🤝 עזרה לחבר
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExcellence(student.id, 'הכנה מופתית של מטלות עמ"ט ושליטה גבוהה בחומר הנלמד')}
                      className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      ⭐ הכנה מופתית
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-rose-900 ml-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      אירוע משמעת:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickDiscipline(student.id, 'phone', 'שימוש בטלפון נייד במהלך ההסבר בכיתה בניגוד לנהלים')}
                      className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      📱 טלפון
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDiscipline(student.id, 'disruption', 'הפרעה חוזרת למהלך התקין של השיעור ודיבור ללא רשות')}
                      className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      🗣️ הפרעה לשיעור
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDiscipline(student.id, 'equipment', 'אי הבאת חוברת עמ"ט, מחשבון או ציוד לימודי נדרש')}
                      className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      📓 חוסר ציוד
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentField(student.id, 'behavior', 'normal')}
                      className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition-all cursor-pointer"
                      title="איפוס להתנהגות תקינה"
                    >
                      ✓ איפוס
                    </button>
                  </div>
                </div>

                {/* 3 Main Toggles Row: Attendance, Homework, Behavior */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  {/* Attendance Controls */}
                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. נוכחות בשיעור
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'attendance', 'present')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                          entry.attendance === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        נוכח/ת
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'attendance', 'late')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          entry.attendance === 'late'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        איחור
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'attendance', 'absent')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          entry.attendance === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        חיסור
                      </button>
                    </div>
                  </div>

                  {/* Homework Controls */}
                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. הכנת שיעורי בית
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'homework', 'done')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                          entry.homework === 'done'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        הכין/ה
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'homework', 'partial')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          entry.homework === 'partial'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        חלקי
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'homework', 'not_done')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          entry.homework === 'not_done'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        לא הכין/ה
                      </button>
                    </div>
                  </div>

                  {/* Behavior Type Controls */}
                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. התנהגות ומצוינות
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'normal')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          entry.behavior === 'normal'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        תקין
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'excellence')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 ${
                          entry.behavior === 'excellence'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        ציון לשבח ⭐
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'disruption')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          entry.behavior === 'disruption'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        הפרעה לשיעור
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'phone')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          entry.behavior === 'phone'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        שימוש בטלפון 📱
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'defiance')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          entry.behavior === 'defiance'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        חוצפה / אי-ציות
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentField(student.id, 'behavior', 'equipment')}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          entry.behavior === 'equipment'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        ציוד מעבדה
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Free-Text Incident Field (Requirement: Opens when inappropriate behavior is selected) */}
                {showIncidentField && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200/80 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {isExcellence ? (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>תיאור המצוינות / ציון לשבח עבור {student.name}:</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span>תיאור האירוע המשמעתי המדויק (נשלח מיד למחנכת הכיתה):</span>
                          </>
                        )}
                      </label>

                      {/* Dictation Controls */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={speechLang}
                          onChange={(e) => setSpeechLang(e.target.value as 'he-IL' | 'ar-IL')}
                          className="bg-white border border-slate-200 text-[11px] rounded-lg px-2 py-1 text-slate-700"
                        >
                          <option value="he-IL">עברית</option>
                          <option value="ar-IL">العربية</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleRecording(student.id)}
                          className={`flex items-center gap-1 px-3 py-1 text-xs rounded-xl font-bold transition-all ${
                            isRecording
                              ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-3.5 h-3.5" />
                              <span>מקליט כעת...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-blue-600" />
                              <span>הכתבה קולית 🎙️</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Free-text textarea */}
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={entry.description}
                        onChange={(e) =>
                          updateStudentField(student.id, 'description', e.target.value)
                        }
                        placeholder={
                          isExcellence
                            ? 'תאר/י את הישגו הבולט של התלמיד/ה, שאלת חקר שפתר/ה או עזרה שסיפק/ה לחברים...'
                            : 'תאר/י במדויק את פרטי האירוע המשמעתי: מה התלמיד/ה עשה/תה, מתי והאם ניתנה התראה מקדימה...'
                        }
                        className={`w-full rounded-xl p-3 text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all ${
                          isExcellence
                            ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-400 text-slate-900'
                            : 'bg-rose-50/40 border-rose-300 focus:ring-rose-400 text-slate-900'
                        }`}
                      />
                    </div>

                    {/* Quick Preset Phrases */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[11px] text-slate-600 font-semibold ml-1">
                        ניסוח מהיר:
                      </span>
                      {(isExcellence ? PRESET_EXCELLENCE_PHRASES : PRESET_DISCIPLINE_PHRASES).map(
                        (phrase, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleApplyPreset(student.id, phrase)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            + {phrase.slice(0, 36)}...
                          </button>
                        )
                      )}
                    </div>

                    {/* Notification to Homeroom Teacher via WhatsApp (Subject teacher sends ONLY to homeroom, homeroom forwards to parents) */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 bg-white/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>שליחה למחנכת הכיתה ({student.homeroomTeacher || 'מחנכת'} - כיתה {student.className}):</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          🔒 <strong>נוהל בית ספרי:</strong> מורה מקצועי מדווח למחנכת בלבד. המחנכת רואה את הדיווח בזמן אמת והיא זו שמוציאה את ההודעה הרשמית להורים.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct Save Student Button */}
                        <button
                          type="button"
                          onClick={() => handleSaveSingleStudent(student)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                            savedStudentIds[student.id]
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                          title="שמור דיווח זה במערכת מיידית"
                        >
                          {savedStudentIds[student.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>נשמר במערכת! ✓</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>שמור דיווח 💾</span>
                            </>
                          )}
                        </button>

                        <a
                          href={getTeacherToHomeroomWhatsAppUrl({
                            teacherName: currentTeacher?.name || 'מורה מקצועי',
                            subject: selectedSubject,
                            lessonPeriod,
                            date: lessonDate,
                            studentName: student.name,
                            className: student.className,
                            homeroomTeacher: student.homeroomTeacher,
                            description: entry.description.trim() || (isExcellence ? 'ציון לשבח על מצוינות' : 'אירוע משמעתי במהלך השיעור'),
                            homeroomPhone: homeroomTeachers.find((h) => h.className === student.className)?.phone,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            // Ensure report is immediately saved in DB when clicking WhatsApp!
                            handleSaveSingleStudent(student);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                          title="שמירה אוטומטית במערכת ופתיחת וואטסאפ לשליחת ההודעה למחנכת הכיתה"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>שלח למחנכת בוואטסאפ 📱</span>
                        </a>

                        <button
                          type="button"
                          onClick={async () => {
                            const success = await copyTeacherToHomeroomToClipboard({
                              teacherName: currentTeacher?.name || 'מורה מקצועי',
                              subject: selectedSubject,
                              lessonPeriod,
                              date: lessonDate,
                              studentName: student.name,
                              className: student.className,
                              homeroomTeacher: student.homeroomTeacher,
                              description: entry.description.trim() || (isExcellence ? 'ציון לשבח על מצוינות' : 'אירוע משמעתי במהלך השיעור'),
                            });
                            if (success) {
                              setCopiedStudentId(student.id);
                              setTimeout(() => setCopiedStudentId(null), 2500);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {copiedStudentId === student.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">הועתק!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>העתק נוסח למחנכת</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Floating Bottom Submit Bar */}
      <div className="sticky bottom-4 z-30">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/30">
              {modifiedCount}
            </div>
            <div>
              <p className="text-sm font-bold">
                מוכנים לשמירה ולשידור חי למחנכות ({gradeStudents.length} תלמידים ביומן)
              </p>
              <p className="text-xs text-slate-300">
                המערכת תשלח התראה קולית (Audio Chime) ועדכון מיידי ללוח המחנכות של כל כיתה
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitSession}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="w-4 h-4 ml-1" />
            <span>שמור ושלח התראות בזמן אמת 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
