import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SCHOOL_INFO } from '../data/initialData';
import { Student } from '../types';
import {
  Sparkles,
  AlertTriangle,
  BookOpen,
  Calendar,
  LogOut,
  ShieldCheck,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  School,
  Lock,
  UserCheck,
  Search,
  KeyRound,
  Info,
  Check,
  ArrowRight,
  HelpCircle,
  FileSignature,
  CheckCircle2,
} from 'lucide-react';
import { ParentCommitmentSigner } from './ParentCommitmentSigner';

export const ParentPortal: React.FC = () => {
  const { students, reports, parentStudentId, setParentStudentId, commitments, adminSettings } = useApp();

  // Code input state
  const [codeInput, setCodeInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [isSignerModalOpen, setIsSignerModalOpen] = useState<boolean>(false);

  // Check URL parameter (?code=... or ?studentId=...) or existing session
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('code');
      const urlStudentId = urlParams.get('studentId');

      if (urlCode) {
        const found = students.find(
          (s) => s.parentCode === urlCode.trim() || s.id === urlCode.trim()
        );
        if (found) {
          setPendingStudent(found);
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return;
        }
      }

      if (urlStudentId) {
        const found = students.find((s) => s.id === urlStudentId.trim());
        if (found) {
          setPendingStudent(found);
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return;
        }
      }

      // Restore session if parent verified earlier during this browser tab
      const savedStudentId = sessionStorage.getItem('amat_parent_student_id');
      if (savedStudentId && !parentStudentId) {
        const match = students.find((s) => s.id === savedStudentId);
        if (match) {
          setParentStudentId(match.id);
        }
      }
    } catch {
      // safe fallback
    }
  }, [students, parentStudentId, setParentStudentId]);

  // Find currently logged in student
  const currentStudent = students.find((s) => s.id === parentStudentId);

  // Student specific reports
  const studentReports = reports.filter((r) => r.studentId === parentStudentId);

  // Attendance metrics
  const totalReports = studentReports.length;
  const presentCount = studentReports.filter((r) => r.attendance === 'present').length;
  const lateCount = studentReports.filter((r) => r.attendance === 'late').length;
  const absentCount = studentReports.filter((r) => r.attendance === 'absent').length;
  const attendanceRate =
    totalReports > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalReports) * 100)
      : 100;

  // Homework metrics
  const hwDoneCount = studentReports.filter((r) => r.homework === 'done').length;
  const hwRate = totalReports > 0 ? Math.round((hwDoneCount / totalReports) * 100) : 100;

  // Excellence & Disciplinary logs
  const excellenceReports = studentReports.filter((r) => r.behavior === 'excellence');
  const disciplineReports = studentReports.filter(
    (r) => r.behavior !== 'normal' && r.behavior !== 'excellence'
  );

  // Handle Code Submission
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = codeInput.trim();

    if (!cleanCode) {
      setErrorMsg('נא להקליד את הקוד הסודי האישי של התלמיד/ה');
      return;
    }

    // Match collective meeting code (e.g. 640615 or custom)
    const collectiveMeetingCode = (adminSettings?.parentMeetingCode || '640615').trim();
    if (cleanCode === collectiveMeetingCode || cleanCode === '640615') {
      setIsSignerModalOpen(true);
      setCodeInput('');
      setErrorMsg('');
      return;
    }

    // Match student by personal secret parentCode (or ID)
    const matched = students.find(
      (s) =>
        (s.parentCode && s.parentCode.trim() === cleanCode) ||
        s.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched) {
      setPendingStudent(matched);
      setErrorMsg('');
    } else {
      setErrorMsg(
        'הקוד שהוקלד אינו תואם אף תלמיד/ה במסד הנתונים. אנא ודאו את הקוד בן 5 הספרות שנמסר ממחנכת הכיתה.'
      );
    }
  };

  // Confirm child details and enter personal portfolio
  const handleConfirmStudent = () => {
    if (!pendingStudent) return;
    setParentStudentId(pendingStudent.id);
    sessionStorage.setItem('amat_parent_student_id', pendingStudent.id);
    setPendingStudent(null);
    setCodeInput('');
    setErrorMsg('');
  };

  // Logout from student file
  const handleLogout = () => {
    setParentStudentId(null);
    sessionStorage.removeItem('amat_parent_student_id');
    setPendingStudent(null);
    setCodeInput('');
    setErrorMsg('');
  };

  // If Signer is open in unauthenticated or meeting mode
  if (isSignerModalOpen) {
    return (
      <div className="py-2">
        <ParentCommitmentSigner
          initialStudent={currentStudent || pendingStudent || null}
          onClose={() => setIsSignerModalOpen(false)}
        />
      </div>
    );
  }

  // SCREEN 1 & 2: Not authenticated - Code Entry or Child Confirmation Preview
  if (!currentStudent) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        {/* PROMINENT PARENT MEETING COMMITMENT CARD */}
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-cyan-500/15 border-2 border-dashed border-amber-400 text-right shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shrink-0">
                <FileSignature className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950 font-['Rubik']">
                    מפגש הורי עמ"ט תשפ"ז
                  </span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                    חתימה דיגיטלית חובה
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  כתב התחייבות והסכמת הורים לתכנית עמ"ט
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  קריאת המסמך וחתימה מהירה באצבע או בעכבר. (קוד מפגש כיתתי:{' '}
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                    {adminSettings?.parentMeetingCode || '640615'}
                  </span>
                  )
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignerModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap transform hover:-translate-y-0.5"
            >
              <FileSignature className="w-4 h-4" />
              <span>חתימה על כתב התחייבות ✍️</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Top security icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30 mb-4 ring-4 ring-cyan-100">
            <KeyRound className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold border border-cyan-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            כניסה מאובטחת באמצעות קוד סודי אישי לתלמיד
          </span>

          <h2 className="text-2xl font-black text-slate-900 font-['Rubik'] mt-1">
            פורטל הורים ותלמידים - עמ"ט Live
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-md mx-auto">
            מערכת שקיפות ומעקב פדגוגי אישי למסלול עתודה מדעית טכנולוגית (STEM) ב
            <strong>{SCHOOL_INFO.name}</strong>.
          </p>

          {/* PREVIEW & CONFIRMATION STEP: When a valid code is detected */}
          {pendingStudent ? (
            <div className="mt-6 p-5 sm:p-6 bg-gradient-to-br from-cyan-50/90 via-blue-50/50 to-indigo-50/70 border-2 border-cyan-400 rounded-3xl text-right shadow-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-cyan-600 text-white shadow-sm">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-cyan-900">
                    נמצא תיק תלמיד/ה בהצלחה!
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded-lg border border-cyan-200 text-cyan-800 font-bold">
                  קוד: {pendingStudent.parentCode || codeInput}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs text-slate-600 font-medium">
                  אנא אשרו כי אלו פרטי ילדכם:
                </div>

                <div className="p-3 bg-white/95 rounded-2xl border border-cyan-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">שם התלמיד/ה:</span>
                    <strong className="text-base sm:text-lg text-slate-900 font-['Rubik'] font-black">
                      {pendingStudent.name}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">כיתת אם:</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                      כיתה {pendingStudent.className}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">מחנכת הכיתה:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {pendingStudent.homeroomTeacher}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>מסלול לימודים:</span>
                    <span className="text-emerald-700 font-bold">עתודה מדעית טכנולוגית (עמ"ט)</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmStudent}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>כן, זהו ילדי - אישור וכניסה לתיק האישי</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingStudent(null);
                    setCodeInput('');
                    setErrorMsg('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
                >
                  הקלדת קוד אחר / חזרה
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: Code Input Form */
            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>הקלידו את הקוד הסודי האישי של התלמיד/ה:</span>
                  <span className="text-[11px] text-cyan-700 font-medium bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                    נמסר ע"י מחנכת הכיתה
                  </span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="off"
                    maxLength={10}
                    placeholder="לדוגמה: 10110"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-slate-50 border-2 border-slate-300 focus:border-cyan-500 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed text-right flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>בדיקת קוד אישי ואיתור תיק התלמיד</span>
              </button>
            </form>
          )}

          {/* Security & Instructions Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-right space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <span>
                <strong>כיצד משיגים את הקוד?</strong> מנהל המערכת הפיק כרטיסיות קוד אישיות לכלל תלמידי עמ"ט. מחנכת הכיתה מוסרת את הקוד באופן פרטני לכל הורה ותלמיד.
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              🔒 הפרטיות מובטחת: אין אפשרות לצפות ברשימת התלמידים הכללית או בנתונים של תלמיד אחר.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 3: Authenticated State - Personal Student Portfolio
  return (
    <div className="space-y-6">
      {/* Student Welcome Header Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold text-2xl shadow-inner font-['Rubik']">
              {currentStudent.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black font-['Rubik']">
                  תיק תלמיד אישי: {currentStudent.name}
                </h2>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                  כיתה {currentStudent.className}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  מסלול עמ"ט
                </span>
                {currentStudent.parentCode && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-cyan-300 border border-cyan-400/30 text-[11px] font-mono">
                    קוד כניסה: {currentStudent.parentCode}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>
                  כיתת אם: <strong className="text-cyan-300">{currentStudent.className}</strong>
                </span>
                <span>•</span>
                <span>
                  מחנכת הכיתה: <strong className="text-white">{currentStudent.homeroomTeacher}</strong>
                </span>
                <span>•</span>
                <span>{SCHOOL_INFO.name}</span>
              </p>
            </div>
          </div>

          {/* Secure Logout / Exit Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="סגירת תיק התלמיד ויציאה מאובטחת"
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/40 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>יציאה מתיק התלמיד</span>
          </button>
        </div>
      </section>

      {/* Commitment Status Card for Student */}
      {(() => {
        const studentCommitment = commitments.find((c) => c.studentId === currentStudent.id);
        if (studentCommitment) {
          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-right">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-900">
                      כתב התחייבות הורים - חתום ומאומת
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      תשפ"ז
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    נחתם דיגיטלית ע"י {studentCommitment.parentName} (ת.ז {studentCommitment.parentIdNumber})
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    תאריך חתימה: {new Date(studentCommitment.timestamp).toLocaleDateString('he-IL')} • טלפון ליצירת קשר: {studentCommitment.parentPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <div className="bg-white p-1 rounded-xl border border-emerald-300 shadow-inner hidden md:block">
                  <img
                    src={studentCommitment.signatureDataUrl}
                    alt="חתימה"
                    className="h-9 max-w-[110px] object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignerModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  צפה / עדכן חתימה
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-right">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950">
                    תשומת לב ההורים: טרם נחתם כתב התחייבות
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    דרושה חתימה
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  כתב התחייבות והסכמת הורים להשתתפות במסלול עמ"ט לשנה"ל {SCHOOL_INFO.academicYear}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  הנכם מתבקשים לקרוא את עיקרי התכנית ולחתום דיגיטלית באמצעות האצבע או העכבר.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignerModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap animate-pulse"
            >
              <FileSignature className="w-4 h-4" />
              <span>חתימה על כתב ההתחייבות ✍️</span>
            </button>
          </div>
        );
      })()}

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">מדד נוכחות בעמ"ט</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-['Rubik']">
              {attendanceRate}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">שיעורים שהתקיימו</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendanceRate >= 90
                  ? 'bg-emerald-500'
                  : attendanceRate >= 75
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 font-medium">
            <span>נוכחות: {presentCount}</span>
            <span>איחורים: {lateCount}</span>
            <span>חיסורים: {absentCount}</span>
          </div>
        </div>

        {/* Homework Done Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">הכנת שיעורי בית ומטלות</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-['Rubik']">
              {hwRate}%
            </span>
            <span className="text-xs text-blue-600 font-semibold">הכנה מלאה</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${hwRate}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 font-medium">
            <span>מטלות שהוכנו: {hwDoneCount}</span>
            <span>חלקי / לא הוגש: {totalReports - hwDoneCount}</span>
          </div>
        </div>

        {/* Stars of Excellence */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-2xl p-5 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">ציונים לשבח (מצוינות)</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 font-['Rubik']">
              {excellenceReports.length}
            </span>
            <span className="text-xs text-amber-800 font-semibold">אותות הערכה</span>
          </div>
          <p className="text-xs text-amber-800 mt-3 font-medium">
            תעודות הערכה והצטיינות ממורי המתמטיקה, הפיזיקה ומדעי המחשב
          </p>
        </div>

        {/* Pedagogical Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">הערות לשיפור ומשמעת</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-['Rubik'] ${
                disciplineReports.length > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {disciplineReports.length}
            </span>
            <span className="text-xs text-slate-600 font-semibold">אירועים מתועדים</span>
          </div>
          <p className="text-xs text-slate-600 mt-3 font-medium">
            {disciplineReports.length === 0
              ? 'התנהגות למופת! ללא אירועי משמעת.'
              : `${disciplineReports.filter((r) => r.addressedByHomeroom).length} אירועים טופלו ע"י המחנכת.`}
          </p>
        </div>
      </section>

      {/* Excellence Awards Highlight Section */}
      {excellenceReports.length > 0 && (
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-bold text-amber-950 font-['Rubik']">
              תעודות הערכה ומצוינות בתוכנית עמ"ט 🏆
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {excellenceReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                <div className="flex items-center justify-between text-xs text-slate-700 mb-2">
                  <span className="font-bold text-amber-800">שיעור {report.subject}</span>
                  <span className="flex items-center gap-1 text-slate-600 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.date}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 leading-relaxed italic">
                  "{report.description}"
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    מורה מעניק: <strong className="text-slate-900">{report.teacherName}</strong>
                  </span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    ציון לשבח רשמי
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Complete Historical Activity Log for THIS Student Only */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
              יומן מעקב פדגוגי ודיווחים בשיעורי עמ"ט
            </h3>
            <p className="text-xs text-slate-600">
              שקיפות מלאה של כלל שיעורי המתמטיקה, מדעי המחשב והפיזיקה עבור {currentStudent.name} בלבד
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
            סה"כ {studentReports.length} רשומות
          </span>
        </div>

        {studentReports.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            עדיין לא נרשמו דיווחים עבור תלמיד/ה זה/זו במערכת.
          </div>
        ) : (
          <div className="space-y-3">
            {studentReports.map((report) => {
              const isExcellence = report.behavior === 'excellence';
              const isDisciplinary =
                report.behavior !== 'normal' && report.behavior !== 'excellence';

              return (
                <div
                  key={report.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isExcellence
                      ? 'bg-amber-50/50 border-amber-200'
                      : isDisciplinary
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        שיעור {report.subject}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-700">
                        מורה: <strong className="text-slate-900">{report.teacherName}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-600 font-mono">
                        {report.date} (שעה {report.lessonPeriod})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          report.attendance === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.attendance === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {report.attendance === 'present'
                          ? 'נוכחות מלאה'
                          : report.attendance === 'late'
                          ? 'איחור'
                          : 'חיסור'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          report.homework === 'done'
                            ? 'bg-blue-100 text-blue-800'
                            : report.homework === 'partial'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        ש"ב:{' '}
                        {report.homework === 'done'
                          ? 'הוכנו'
                          : report.homework === 'partial'
                          ? 'חלקי'
                          : 'לא הוכנו'}
                      </span>
                    </div>
                  </div>

                  {/* Note text */}
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {report.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Privacy compliance badge at bottom of file */}
      <div className="text-center py-2 text-xs text-slate-400">
        🔒 דף זה מוצג באופן מאובטח להורי התלמיד/ה {currentStudent.name} בלבד | מערכת עמ"ט Live
      </div>

      {/* Signing modal while inside student file */}
      {isSignerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8">
            <ParentCommitmentSigner
              initialStudent={currentStudent}
              onClose={() => setIsSignerModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
