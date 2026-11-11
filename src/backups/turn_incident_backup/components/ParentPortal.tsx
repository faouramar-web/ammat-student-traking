import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SCHOOL_INFO } from '../data/initialData';
import {
  UserCheck,
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
} from 'lucide-react';

export const ParentPortal: React.FC = () => {
  const { students, reports, parentStudentId, setParentStudentId } = useApp();

  const [inputId, setInputId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find logged in student
  const currentStudent = students.find((s) => s.id === parentStudentId);

  // Student specific reports
  const studentReports = reports.filter((r) => r.studentId === parentStudentId);

  // Attendance metrics
  const totalReports = studentReports.length;
  const presentCount = studentReports.filter((r) => r.attendance === 'present').length;
  const lateCount = studentReports.filter((r) => r.attendance === 'late').length;
  const absentCount = studentReports.filter((r) => r.attendance === 'absent').length;
  const attendanceRate = totalReports > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalReports) * 100) : 100;

  // Homework metrics
  const hwDoneCount = studentReports.filter((r) => r.homework === 'done').length;
  const hwRate = totalReports > 0 ? Math.round((hwDoneCount / totalReports) * 100) : 100;

  // Excellence awards
  const excellenceReports = studentReports.filter((r) => r.behavior === 'excellence');
  const disciplineReports = studentReports.filter(
    (r) => r.behavior !== 'normal' && r.behavior !== 'excellence'
  );

  const [selectedStudentForLogin, setSelectedStudentForLogin] = useState<string>('');
  const [selectedClassForLogin, setSelectedClassForLogin] = useState<string>('all');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // If dropdown selected
    if (selectedStudentForLogin) {
      setParentStudentId(selectedStudentForLogin);
      return;
    }

    const cleanInput = inputId.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMsg('נא לבחור תלמיד/ה מהרשימה או להקליד את שם התלמיד/ה');
      return;
    }

    // Try finding by name or ID
    const found = students.find(
      (s) =>
        s.name.toLowerCase().includes(cleanInput) ||
        s.id.toLowerCase() === cleanInput
    );

    if (found) {
      setParentStudentId(found.id);
    } else {
      setErrorMsg(`לא נמצא תלמיד/ה בשם "${inputId}". נא לבחור ישירות מתיבת הבחירה.`);
    }
  };

  const handleQuickLogin = (id: string) => {
    setParentStudentId(id);
    setErrorMsg('');
  };

  const handleLogout = () => {
    setParentStudentId(null);
    setInputId('');
    setSelectedStudentForLogin('');
  };

  const availableClasses = Array.from(new Set(students.map((s) => s.className))).sort();
  const studentsInSelectedClass = students.filter(
    (s) => selectedClassForLogin === 'all' || s.className === selectedClassForLogin
  );

  // If not logged in: Show student name login card
  if (!currentStudent) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30 mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold border border-cyan-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            כניסה מהירה ומאובטחת ללא צורך בתעודת זהות או טלפון
          </span>

          <h2 className="text-2xl font-black text-slate-900 font-['Rubik'] mt-1">
            פורטל הורים ותלמידים - עמ"ט
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-md mx-auto">
            מעקב נוכחות, דיווחי מורים בזמן אמת, שיעורי בית ותעודות הצטיינות במסלול עתודה מדעית טכנולוגית.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-right">
            {/* Filter by class to narrow down */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. בחר כיתה:
                </label>
                <select
                  value={selectedClassForLogin}
                  onChange={(e) => {
                    setSelectedClassForLogin(e.target.value);
                    setSelectedStudentForLogin('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="all">כל הכיתות ({students.length} תלמידים)</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      כיתה {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. בחר את שם התלמיד/ה:
                </label>
                <select
                  value={selectedStudentForLogin}
                  onChange={(e) => {
                    setSelectedStudentForLogin(e.target.value);
                    setInputId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- בחר שם תלמיד/ה מהרשימה --</option>
                  {studentsInSelectedClass.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Free text search option */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                או הקלד/י ישירות את שם התלמיד/ה:
              </label>
              <input
                type="text"
                placeholder="למשל: אמירה שאמי, עדי משלב, וג'די ח'יר..."
                value={inputId}
                onChange={(e) => {
                  setInputId(e.target.value);
                  setSelectedStudentForLogin('');
                }}
                className="w-full text-right text-sm bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-slate-900 font-medium focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              כניסה מאובטחת לפורטל
            </button>
          </form>

          {/* Quick Demo Selector for instant testing */}
          {students.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-right">
              <p className="text-xs font-bold text-slate-700 mb-2">
                כניסה מהירה מתלמידי עמ"ט:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {students.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQuickLogin(s.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-right transition-colors"
                  >
                    <div className="font-bold text-slate-800">{s.name}</div>
                    <div className="text-[11px] text-slate-600">כיתה {s.className} (מחנכת: {s.homeroomTeacher})</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
                  שלום, {currentStudent.name}
                </h2>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                  כיתה {currentStudent.className}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  מסלול עמ"ט
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>כיתת אם: <strong className="text-cyan-300">{currentStudent.className}</strong></span>
                <span>•</span>
                <span>מחנכת הכיתה: <strong className="text-white">{currentStudent.homeroomTeacher}</strong></span>
                <span>•</span>
                <span>{SCHOOL_INFO.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start md:self-center flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתקות</span>
          </button>
        </div>
      </section>

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

      {/* Complete Historical Activity Log for Student */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
              יומן מעקב פדגוגי ודיווחים בשיעורי עמ"ט
            </h3>
            <p className="text-xs text-slate-700">
              שקיפות מלאה של כלל שיעורי המתמטיקה, מדעי המחשב והפיזיקה
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
                        ש"ב: {report.homework === 'done' ? 'הוכנו' : report.homework === 'partial' ? 'חלקי' : 'לא הוכנו'}
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
    </div>
  );
};
