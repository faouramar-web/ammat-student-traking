import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAllToExcel } from '../utils/excel';
import { SCHOOL_INFO } from '../data/initialData';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Search,
  Sparkles,
  AlertTriangle,
  Award,
  Filter,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

export const PedagogicalFile: React.FC = () => {
  const { students, teachers, reports, session, adminSettings, setCurrentRole } = useApp();

  const isAllowed =
    session?.role === 'admin' ||
    (session?.role === 'homeroom' && adminSettings.allowHomeroomPedagogicalAccess);

  // If user is not authorized
  if (!isAllowed) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-5 max-w-lg mx-auto shadow-xl my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 font-['Rubik']">
            גישה מוגבלת למנהל המערכת
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            על פי הנחיות בית הספר, תיק תלמיד וישיבות פדגוגיות מורשה לצפייה ישירה <strong>למנהל המערכת בלבד</strong> באמצעות קוד אישי מאובטח.
          </p>
          <p className="text-xs text-slate-500">
            מנהל המערכת יכול לאפשר הרשאת צפייה למחנכות בכל עת דרך לשונית <em>"קודים סודיים והרשאות"</em> בפאנל הניהול.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentRole('admin')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            כניסת מנהל מערכת
          </button>
          <button
            type="button"
            onClick={() => setCurrentRole('parent')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
          >
            חזרה לפורטל
          </button>
        </div>
      </div>
    );
  }

  // If homeroom has permission, limit to students of their class
  const accessibleStudents =
    session?.role === 'homeroom' && session?.homeroomClass
      ? students.filter((s) => s.className === session.homeroomClass)
      : students;

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    accessibleStudents[0]?.id || ''
  );
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Filter students for the selector
  const filteredStudents = accessibleStudents.filter((s) => {
    if (selectedGradeFilter !== 'all' && s.grade !== selectedGradeFilter) return false;
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentStudent =
    accessibleStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0] || accessibleStudents[0];

  const studentReports = reports.filter((r) => r.studentId === currentStudent?.id);

  // Subject breakdowns
  const subjects = ['מתמטיקה', 'מדעי המחשב', 'פיזיקה'] as const;
  const subjectStats = subjects.map((subj) => {
    const subReports = studentReports.filter((r) => r.subject === subj);
    const total = subReports.length;
    const present = subReports.filter((r) => r.attendance === 'present').length;
    const hwDone = subReports.filter((r) => r.homework === 'done').length;
    const excellence = subReports.filter((r) => r.behavior === 'excellence').length;
    const discipline = subReports.filter(
      (r) => r.behavior !== 'normal' && r.behavior !== 'excellence'
    ).length;

    return {
      subject: subj,
      total,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 100,
      hwRate: total > 0 ? Math.round((hwDone / total) * 100) : 100,
      excellence,
      discipline,
      reports: subReports,
    };
  });

  const totalReports = studentReports.length;
  const totalExcellence = studentReports.filter((r) => r.behavior === 'excellence').length;
  const totalDiscipline = studentReports.filter(
    (r) => r.behavior !== 'normal' && r.behavior !== 'excellence'
  ).length;
  const totalPresent = studentReports.filter((r) => r.attendance === 'present').length;
  const overallAttendance =
    totalReports > 0 ? Math.round((totalPresent / totalReports) * 100) : 100;

  // Determine pedagogical status
  let pedagogicalStatus = 'תפקוד תקין במסלול עמ"ט';
  let statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
  if (totalExcellence >= 2 && totalDiscipline === 0) {
    pedagogicalStatus = 'תלמיד/ה מצטיין/ת עתודה מדעית ⭐';
    statusColor = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (totalDiscipline >= 2 || overallAttendance < 80) {
    pedagogicalStatus = 'נדרש מעקב פדגוגי ושיחת בירור ⚠️';
    statusColor = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportAllToExcel(students, teachers, reports);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-['Rubik']">
                תיק תלמיד וישיבות פדגוגיות - עמ"ט
              </h2>
              <p className="text-xs text-slate-700">
                ריכוז נתונים מקיף לקראת ישיבות פדגוגיות, ציוני תעודה וקביעת תוכנית התערבות
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>הדפס דוח פדגוגי (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ייצוא כל הנתונים ל-Excel</span>
          </button>
        </div>
      </section>

      {/* Student Selector Row (Hidden in print) */}
      <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg print:hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Grade filter */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-cyan-400 mx-1" />
              {['all', 'ז', 'ח', 'ט'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeFilter(g)}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    selectedGradeFilter === g
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {g === 'all' ? 'כל השכבות' : `שכבה ${g}'`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="איתור תלמיד לפי שם או כיתה..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Student Dropdown Selector */}
          <div className="w-full md:w-72">
            <select
              value={currentStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.className} - מחנכת: {s.homeroomTeacher})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* The Printable Official Pedagogical Card */}
      {currentStudent && (
        <article aria-label="תיק פדגוגי מודפס" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-6 print:p-0 print:border-none print:shadow-none">
          {/* Official Document Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
              <div>
                <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
                  מדינת ישראל - משרד החינוך | מסלול מצוינות עמ"ט
                </span>
                <h1 className="text-2xl font-black text-slate-900 font-['Rubik'] mt-0.5">
                  תיק תלמיד מרוכז לישיבה פדגוגית
                </h1>
                <p className="text-xs text-slate-700 mt-1">
                  {SCHOOL_INFO.name} ({SCHOOL_INFO.nameArabic}) | סמל מוסד:{' '}
                  {SCHOOL_INFO.institutionSymbol} | שנת לימודים: {SCHOOL_INFO.academicYear}
                </p>
              </div>

              {/* Status Stamp */}
              <div
                className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-center shadow-sm ${statusColor}`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-75">סטטוס פדגוגי</div>
                <div>{pedagogicalStatus}</div>
              </div>
            </div>

            {/* Student Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4 mt-4 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-600 block">שם התלמיד/ה:</span>
                <strong className="text-slate-900 text-sm font-bold">{currentStudent.name}</strong>
              </div>
              <div>
                <span className="text-slate-600 block">מסלול לימודים:</span>
                <strong className="text-blue-900 font-bold text-sm">עתודה מדעית (עמ"ט)</strong>
              </div>
              <div>
                <span className="text-slate-600 block">כיתת אם / שכבה:</span>
                <strong className="text-slate-900 text-sm">
                  כיתה {currentStudent.className} (שכבה {currentStudent.grade}')
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">מחנכת הכיתה:</span>
                <strong className="text-slate-900 text-sm">{currentStudent.homeroomTeacher}</strong>
              </div>
            </div>
          </div>

          {/* Overall Key Performance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
              <span className="text-xs text-blue-700 font-semibold block">שיעור נוכחות כללי</span>
              <span className="text-2xl font-black text-blue-900 font-['Rubik']">
                {overallAttendance}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-xs text-emerald-700 font-semibold block">סה״כ שיעורי עמ"ט</span>
              <span className="text-2xl font-black text-emerald-900 font-['Rubik']">
                {totalReports}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
              <span className="text-xs text-amber-700 font-semibold block">ציונים לשבח</span>
              <span className="text-2xl font-black text-amber-900 font-['Rubik']">
                {totalExcellence} ⭐
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
              <span className="text-xs text-rose-700 font-semibold block">אירועי משמעת</span>
              <span className="text-2xl font-black text-rose-900 font-['Rubik']">
                {totalDiscipline}
              </span>
            </div>
          </div>

          {/* Subject by Subject Pedagogical Analysis */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-['Rubik'] border-b pb-2">
              פילוח הישגים ומשמעת לפי תחומי דעת (3 מקצועות עמ"ט)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjectStats.map((item) => (
                <div
                  key={item.subject}
                  className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 text-sm">{item.subject}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.total} שיעורים
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">נוכחות:</span>
                      <strong className="text-slate-800">{item.presentRate}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">הכנת שיעורי בית:</span>
                      <strong className="text-slate-800">{item.hwRate}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">ציונים לשבח:</span>
                      <strong className="text-amber-600">{item.excellence}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">הערות משמעת:</span>
                      <strong className={item.discipline > 0 ? 'text-rose-600' : 'text-slate-800'}>
                        {item.discipline}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Incident Log with Full Teacher Descriptions */}
          <div className="space-y-3 pt-3">
            <h3 className="text-base font-bold text-slate-900 font-['Rubik'] border-b pb-2">
              פירוט אירועים ודיווחים מלא מפי מורי עמ"ט
            </h3>

            {studentReports.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                לא נרשמו דיווחים חריגים עבור תלמיד/ה זה/זו.
              </p>
            ) : (
              <div className="space-y-2.5">
                {studentReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-xl border border-slate-200 text-xs bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 text-slate-600">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{report.subject}</strong>
                        <span>•</span>
                        <span>מורה: {report.teacherName}</span>
                        <span>•</span>
                        <span>{report.date} (שעה {report.lessonPeriod})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          report.behavior === 'excellence'
                            ? 'bg-amber-100 text-amber-800'
                            : report.behavior !== 'normal'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {report.behavior === 'excellence'
                          ? 'ציון לשבח ⭐'
                          : report.behavior !== 'normal'
                          ? 'אירוע משמעתי ⚠️'
                          : 'תקין'}
                      </span>
                    </div>

                    <div className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pt-1">
                      {report.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signatures for Pedagogical Committee */}
          <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <p className="font-bold text-slate-800 mt-2">חתימת מחנכת הכיתה</p>
              <p className="text-[11px] text-slate-500">{currentStudent.homeroomTeacher}</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <p className="font-bold text-slate-800 mt-2">חתימת רכז/ת עמ"ט</p>
              <p className="text-[11px] text-slate-500">צוות עתודה מדעית</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <p className="font-bold text-slate-800 mt-2">חתימת הנהלת בית הספר</p>
              <p className="text-[11px] text-slate-500">{SCHOOL_INFO.name}</p>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};
