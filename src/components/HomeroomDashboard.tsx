import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentReport } from '../types';
import { getWhatsAppShareUrl, copyMessageToClipboard } from '../utils/whatsapp';
import {
  Bell,
  Radio,
  Sparkles,
  AlertTriangle,
  MessageCircle,
  Copy,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  Volume2,
  Check,
  Search,
} from 'lucide-react';

export const HomeroomDashboard: React.FC = () => {
  const {
    students,
    reports,
    selectedHomeroomClass,
    setSelectedHomeroomClass,
    toggleAddressed,
    soundOn,
    testSound,
    session,
  } = useApp();

  const isHomeroomLocked = session?.role === 'homeroom' && !!session.homeroomClass;
  const effectiveClass = isHomeroomLocked ? session.homeroomClass : selectedHomeroomClass;

  // Auto-lock selectedHomeroomClass if homeroom teacher is logged in
  React.useEffect(() => {
    if (isHomeroomLocked && session?.homeroomClass && selectedHomeroomClass !== session.homeroomClass) {
      setSelectedHomeroomClass(session.homeroomClass);
    }
  }, [isHomeroomLocked, session, selectedHomeroomClass, setSelectedHomeroomClass]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'discipline' | 'excellence'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  // All classes in the school
  const allClasses = Array.from(new Set(students.map((s) => s.className))).sort();

  // Find homeroom teacher name for selected class
  const classStudent = students.find((s) => s.className === effectiveClass);
  const currentHomeroomTeacher =
    isHomeroomLocked && session?.name
      ? session.name
      : classStudent?.homeroomTeacher || 'צוות מחנכות';

  const normalizeClass = (cls?: string) => (cls || '').replace(/['"`״\s]/g, '').trim().toLowerCase();

  // Filter reports by selected class or homeroom educator name
  const classReports = reports.filter((r) => {
    if (effectiveClass === 'all') return true;

    // 1. Direct or normalized class comparison (e.g. ז'1 vs ז1 vs ז 1)
    if (
      r.className === effectiveClass ||
      normalizeClass(r.className) === normalizeClass(effectiveClass)
    ) {
      return true;
    }

    // 2. Homeroom teacher name match (if logged in as homeroom)
    if (session?.role === 'homeroom' && session?.name && r.homeroomTeacher) {
      const cleanSessionName = session.name.replace(/['"`״\s]/g, '').trim();
      const cleanReportName = r.homeroomTeacher.replace(/['"`״\s]/g, '').trim();
      if (
        cleanReportName === cleanSessionName ||
        cleanReportName.includes(cleanSessionName) ||
        cleanSessionName.includes(cleanReportName)
      ) {
        return true;
      }
    }

    // 3. Dual role teacher matching
    if (session?.isDualRole && session?.homeroomClass) {
      if (normalizeClass(r.className) === normalizeClass(session.homeroomClass)) {
        return true;
      }
    }

    return false;
  });

  // Filter by sub-category
  const filteredReports = classReports.filter((r) => {
    if (activeFilter === 'pending' && r.addressedByHomeroom) return false;
    if (activeFilter === 'discipline' && (r.behavior === 'normal' || r.behavior === 'excellence')) return false;
    if (activeFilter === 'excellence' && r.behavior !== 'excellence') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchTeacher = r.teacherName.toLowerCase().includes(q);
      const matchSubject = r.subject.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      if (!matchName && !matchTeacher && !matchSubject && !matchDesc) return false;
    }
    return true;
  });

  // Count summaries
  const pendingCount = classReports.filter((r) => !r.addressedByHomeroom && r.behavior !== 'normal').length;
  const excellenceCount = classReports.filter((r) => r.behavior === 'excellence').length;
  const disciplineCount = classReports.filter(
    (r) => r.behavior !== 'normal' && r.behavior !== 'excellence'
  ).length;

  const handleCopy = async (report: IncidentReport) => {
    const success = await copyMessageToClipboard(report);
    if (success) {
      setCopiedReportId(report.id);
      setTimeout(() => setCopiedReportId(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Educator Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                שידור חי מחובר
              </span>
              <span className="text-xs text-indigo-200">
                סנכרון מיידי עם 6 מורי עמ"ט
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-['Rubik'] tracking-tight">
              לוח מחנכות בזמן אמת (Real-Time)
            </h2>
            <p className="text-sm text-slate-300">
              {selectedHomeroomClass === 'all' ? (
                <span>צפייה בכלל כיתות חטיבת הביניים ב' אבו סנאן</span>
              ) : (
                <span>
                  מחנכת כיתה <strong className="text-cyan-300">{selectedHomeroomClass}</strong>:{' '}
                  <strong className="text-white">{currentHomeroomTeacher}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Sound & Alert Testing */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center gap-2 px-3 py-1 text-xs">
              <Volume2 className={`w-4 h-4 ${soundOn ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-slate-300">
                צלצול אוטומטי (Audio Chime):{' '}
                <strong className={soundOn ? 'text-emerald-400' : 'text-rose-400'}>
                  {soundOn ? 'מופעל' : 'כבוי'}
                </strong>
              </span>
            </div>
            {soundOn && (
              <button
                type="button"
                onClick={testSound}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                בדיקת צליל פעמון 🔔
              </button>
            )}
          </div>
        </div>

        {/* Class Filter Bar */}
        <div className="mt-6 pt-5 border-t border-white/10">
          {isHomeroomLocked ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  {session?.homeroomClass}
                </span>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>לוח הדיווחים לכיתה {session?.homeroomClass} בלבד</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      אימות קוד סודי {session?.code}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-200">
                    מחנכת הכיתה: <strong>{session?.name}</strong> | הצגת דיווחים ואירועים לכיתה זו בלבד
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300">
                  סה״כ {students.filter((s) => s.className === session?.homeroomClass).length} תלמידי עמ"ט בכיתתך
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  בחר כיתת מחנכת לצפייה ישירה:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1">
                <button
                  onClick={() => setSelectedHomeroomClass('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    selectedHomeroomClass === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  כל הכיתות ({students.length} תלמידים)
                </button>
                {allClasses.map((cls) => {
                  const count = students.filter((s) => s.className === cls).length;
                  const pendingInClass = reports.filter(
                    (r) => r.className === cls && !r.addressedByHomeroom && r.behavior !== 'normal'
                  ).length;

                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedHomeroomClass(cls)}
                      className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        selectedHomeroomClass === cls
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>כיתה {cls}</span>
                      <span className="text-[11px] opacity-75">({count})</span>
                      {pendingInClass > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping ml-0.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-semibold">תלמידי עמ"ט במסלול</p>
            <p className="text-2xl font-black text-slate-900 font-['Rubik']">
              {selectedHomeroomClass === 'all'
                ? students.length
                : students.filter((s) => s.className === selectedHomeroomClass).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-semibold">אירועים ממתינים לטיפול</p>
            <p className="text-2xl font-black text-rose-600 font-['Rubik']">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-semibold">ציונים לשבח והצטיינות</p>
            <p className="text-2xl font-black text-amber-600 font-['Rubik']">{excellenceCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 font-semibold">סה״כ דיווחים מתועדים</p>
            <p className="text-2xl font-black text-slate-900 font-['Rubik']">{classReports.length}</p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            כל הדיווחים ({classReports.length})
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 ${
              activeFilter === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            ממתינים לטיפול ({pendingCount})
          </button>

          <button
            onClick={() => setActiveFilter('discipline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeFilter === 'discipline'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            אירועי משמעת ({disciplineCount})
          </button>

          <button
            onClick={() => setActiveFilter('excellence')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 ${
              activeFilter === 'excellence'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            ציונים לשבח ({excellenceCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, מורה, מקצוע..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Reports Feed */}
      <section className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {classReports.length > 0
                ? `קיימים ${classReports.length} דיווחים בכיתה ${effectiveClass}, אך אינם מתאימים לסינון הפעיל`
                : `טרם נקלטו דיווחים עבור כיתה ${effectiveClass}`}
            </h3>
            <div className="text-xs text-slate-500 max-w-md mx-auto">
              {classReports.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                >
                  הצג את כל {classReports.length} הדיווחים של כיתה זו 📋
                </button>
              ) : reports.length > 0 ? (
                <span>
                  במערכת קיימים סך הכל <strong>{reports.length} דיווחים</strong> בכיתות אחרות. כאשר מורה ידווח על תלמיד מכיתה {effectiveClass}, הדיווח יופיע כאן אוטומטית בזמן אמת.
                </span>
              ) : (
                <span>יומן המורים טרם כולל דיווחים שמורים.</span>
              )}
            </div>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExcellence = report.behavior === 'excellence';
            const isDisciplinary =
              report.behavior !== 'normal' && report.behavior !== 'excellence';
            const whatsappUrl = getWhatsAppShareUrl(report);
            const isCopied = copiedReportId === report.id;

            return (
              <div
                key={report.id}
                className={`rounded-2xl transition-all border p-5 shadow-sm ${
                  isExcellence
                    ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border-amber-300'
                    : isDisciplinary
                    ? report.addressedByHomeroom
                      ? 'bg-white border-slate-200 opacity-90'
                      : 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30 border-rose-300 ring-2 ring-rose-400/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Header Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isExcellence
                          ? 'bg-amber-100 text-amber-700'
                          : isDisciplinary
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isExcellence ? (
                        <Sparkles className="w-5 h-5 text-amber-600" />
                      ) : isDisciplinary ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">
                          {report.studentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                          כיתה {report.className}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          מקצוע: <strong className="text-slate-900">{report.subject}</strong>
                        </span>
                        <span className="text-xs text-slate-500">
                          מורה מדווח: <strong className="text-slate-700">{report.teacherName}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {report.date} | שעה {report.lessonPeriod}
                        </span>
                        <span>•</span>
                        <span>מחנכת: {report.homeroomTeacher}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    {report.addressedByHomeroom ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        טופל ע"י המחנכת
                      </span>
                    ) : (
                      isDisciplinary && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 animate-pulse">
                          ממתין לטיפול מחנכת
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Status Badges: Attendance & HW */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      report.attendance === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : report.attendance === 'late'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    נוכחות:{' '}
                    {report.attendance === 'present'
                      ? 'נוכח/ת'
                      : report.attendance === 'late'
                      ? 'איחר/ה'
                      : 'חיסור מהשיעור'}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      report.homework === 'done'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : report.homework === 'partial'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    שיעורי בית:{' '}
                    {report.homework === 'done'
                      ? 'הכין/ה'
                      : report.homework === 'partial'
                      ? 'הכין/ה חלקית'
                      : 'לא הכין/ה'}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      isExcellence
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isDisciplinary
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    התנהגות:{' '}
                    {isExcellence
                      ? 'ציון לשבח / מצוינות 🌟'
                      : report.behavior === 'phone'
                      ? 'שימוש בטלפון נייד 📱'
                      : report.behavior === 'disruption'
                      ? 'הפרעה לשיעור ⚠️'
                      : report.behavior === 'defiance'
                      ? 'אי-ציות / חוצפה 🛑'
                      : report.behavior === 'equipment'
                      ? 'ציוד מעבדה 🔬'
                      : 'תקין'}
                  </span>
                </div>

                {/* THE COMPLETE EXACT FREE-TEXT TYPED BY TEACHER (Crucial Requirement) */}
                <div
                  className={`mt-3.5 p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                    isExcellence
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950 font-medium'
                      : isDisciplinary
                      ? 'bg-rose-50/50 border-rose-200 text-rose-950 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                    <span>טקסט הדיווח המלא של המורה ({report.teacherName}):</span>
                  </div>
                  <p className="whitespace-pre-wrap">{report.description}</p>
                </div>

                {/* Homeroom Action Buttons */}
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 flex-wrap">
                  {/* WhatsApp Quick Action Button (Requirements: opens wa.me link with polished message) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                      title="פתיחת וואטסאפ עם נוסח הודעה רשמי ומדויק להורי התלמיד"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>הוצאת הודעה רשמית להורי התלמיד בוואטסאפ 📱</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      title="העתק את נוסח ההודעה ללוח"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">הועתק ללוח!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>העתק נוסח</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Toggle handled state */}
                  <button
                    type="button"
                    onClick={() => toggleAddressed(report.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      report.addressedByHomeroom
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        report.addressedByHomeroom ? 'text-slate-400' : 'text-emerald-600'
                      }`}
                    />
                    <span>
                      {report.addressedByHomeroom
                        ? 'בטל סימון טיפול'
                        : 'סמן כאירוע שטופל ע"י המחנכת'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
