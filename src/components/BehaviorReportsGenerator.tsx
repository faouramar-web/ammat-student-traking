import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportBehaviorReportToExcel } from '../utils/excel';
import { getWhatsAppShareUrl } from '../utils/whatsapp';
import { SCHOOL_INFO } from '../data/initialData';
import { IncidentReport, Subject } from '../types';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Trash2,
  Search,
  Filter,
  Sparkles,
  AlertTriangle,
  MessageCircle,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const BehaviorReportsGenerator: React.FC = () => {
  const { students, reports, deleteReport, deleteReports, clearAllReports } = useApp();

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedBehaviorType, setSelectedBehaviorType] = useState<'all' | 'discipline' | 'excellence'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected report IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Deletion modals
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [isDeleteFilteredModalOpen, setIsDeleteFilteredModalOpen] = useState<boolean>(false);

  // Available classes in system
  const allClasses = Array.from(new Set(students.map((s) => s.className))).sort();

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedClass !== 'all' && r.className !== selectedClass) return false;
    if (selectedSubject !== 'all' && r.subject !== selectedSubject) return false;

    if (selectedBehaviorType === 'discipline' && (r.behavior === 'normal' || r.behavior === 'excellence')) {
      return false;
    }
    if (selectedBehaviorType === 'excellence' && r.behavior !== 'excellence') {
      return false;
    }

    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchStudent = r.studentName.toLowerCase().includes(q);
      const matchTeacher = r.teacherName.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchClass = r.className.toLowerCase().includes(q);
      if (!matchStudent && !matchTeacher && !matchDesc && !matchClass) return false;
    }

    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredReports.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`האם למחוק ${selectedIds.length} דיווחים שנבחרו?`)) {
      deleteReports(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleConfirmClearAll = () => {
    clearAllReports();
    setIsDeleteAllModalOpen(false);
    setSelectedIds([]);
  };

  const handleConfirmDeleteFiltered = () => {
    const idsToDelete = filteredReports.map((r) => r.id);
    deleteReports(idsToDelete);
    setIsDeleteFilteredModalOpen(false);
    setSelectedIds([]);
  };

  const handleExportExcel = () => {
    exportBehaviorReportToExcel(filteredReports, {
      className: selectedClass !== 'all' ? selectedClass : undefined,
      subject: selectedSubject !== 'all' ? selectedSubject : undefined,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions Bar */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-['Rubik']">
                  הפקת דוחות התנהגות - עתודה מדעית טכנולוגית (עמ"ט)
                </h2>
                <p className="text-xs text-slate-600">
                  סינון לפי כיתות ומקצועות עמ"ט, הצגת תיאור האירוע המדויק, שיוך מורה מדווח וייצוא מרוכז
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredReports.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ייצוא דוח התנהגות לאקסל (xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredReports.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>הדפסה / שמירה כ-PDF</span>
            </button>

            {/* Clear reports at any time button (User Requirement) */}
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors"
              title="מחיקת כל הדיווחים בכל מועד"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>מחיקת דיווחים בכל מועד</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {/* Class Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              כיתת אם / כיתה
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">כל הכיתות ({students.length} תלמידים)</option>
              {allClasses.map((cls) => (
                <option key={cls} value={cls}>
                  כיתה {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מקצוע לימוד עמ"ט
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">כל 3 מקצועות עמ"ט</option>
              <option value="מתמטיקה">📐 מתמטיקה מואצת</option>
              <option value="מדעי המחשב">💻 מדעי המחשב וסייבר</option>
              <option value="פיזיקה">🔬 פיזיקה ומדעי החלל</option>
            </select>
          </div>

          {/* Behavior Type Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              סוג דיווח
            </label>
            <select
              value={selectedBehaviorType}
              onChange={(e) =>
                setSelectedBehaviorType(e.target.value as 'all' | 'discipline' | 'excellence')
              }
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">כל הדיווחים</option>
              <option value="discipline">אירועי משמעת והפרעה בלבד ⚠️</option>
              <option value="excellence">ציונים לשבח ומצוינות בלבד ⭐</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מתאריך
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              עד תאריך
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Free search & batch actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש לפי שם תלמיד, מורה, או מילות מפתח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <span className="text-xs text-slate-500">
              נמצאו <strong>{filteredReports.length}</strong> דיווחים
            </span>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>מחק {selectedIds.length} שנבחרו</span>
              </button>
            )}

            {filteredReports.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteFilteredModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="מחק את כל הדיווחים שמופיעים כרגע בסינון"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>מחק דיווחים מסוננים ({filteredReports.length})</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Printable Report Header (Visible only when printing) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-right">
        <h1 className="text-xl font-black text-slate-900">
          דוח התנהגות ואירועי שיעור - עתודה מדעית טכנולוגית (עמ"ט)
        </h1>
        <p className="text-xs text-slate-700 mt-0.5">
          {SCHOOL_INFO.name} ({SCHOOL_INFO.nameArabic}) | סמל מוסד: {SCHOOL_INFO.institutionSymbol} | {SCHOOL_INFO.academicYear}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          סינון דוח: כיתה: {selectedClass === 'all' ? 'כל הכיתות' : selectedClass} | מקצוע: {selectedSubject === 'all' ? 'כל המקצועות' : selectedSubject} | תאריך הפקה: {new Date().toLocaleDateString('he-IL')}
        </p>
      </div>

      {/* Main Behavior Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-800">אין דיווחים התואמים את הסינון שנבחר</p>
            <p className="text-xs text-slate-500 mt-1">
              באפשרותך לשנות את אפשרויות הסינון או להזין דיווחים חדשים ביומן המורה.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 print:hidden w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredReports.length &&
                        filteredReports.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-3 w-8 text-center">#</th>
                  <th className="py-3 px-4 font-black text-slate-900">שם התלמיד</th>
                  <th className="py-3 px-3 font-black text-slate-900">כיתה</th>
                  <th className="py-3 px-3 font-black text-slate-900">תאריך האירוע</th>
                  <th className="py-3 px-5 font-black text-slate-900 min-w-[260px]">האירוע</th>
                  <th className="py-3 px-4 font-black text-slate-900">מי דיווח</th>
                  <th className="py-3 px-3 font-black text-slate-900">מקצוע עמ"ט</th>
                  <th className="py-3 px-3 print:hidden text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredReports.map((report, idx) => {
                  const isExcellence = report.behavior === 'excellence';
                  const isDisciplinary =
                    report.behavior !== 'normal' && report.behavior !== 'excellence';
                  const isSelected = selectedIds.includes(report.id);
                  const whatsappUrl = getWhatsAppShareUrl(report);

                  return (
                    <tr
                      key={report.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70'
                          : isExcellence
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : isDisciplinary
                          ? 'hover:bg-rose-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="py-3 px-3 print:hidden text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(report.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Number */}
                      <td className="py-3 px-3 text-slate-400 font-mono text-center">
                        {idx + 1}
                      </td>

                      {/* 1. שם התלמיד */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {report.studentName}
                        </div>
                      </td>

                      {/* 2. כיתה */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
                          {report.className}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          מחנכת: {report.homeroomTeacher}
                        </div>
                      </td>

                      {/* 3. תאריך האירוע */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono">
                          {report.date}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          שיעור {report.lessonPeriod}
                        </div>
                      </td>

                      {/* 4. האירוע (הטקסט המלא ופירוט המורה) */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isExcellence
                                ? 'bg-amber-100 text-amber-800'
                                : isDisciplinary
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isExcellence
                              ? 'ציון לשבח / מצוינות ⭐'
                              : report.behavior === 'phone'
                              ? 'שימוש בטלפון 📱'
                              : report.behavior === 'disruption'
                              ? 'הפרעה לשיעור ⚠️'
                              : report.behavior === 'defiance'
                              ? 'אי-ציות / חוצפה 🛑'
                              : report.behavior === 'equipment'
                              ? 'ציוד מעבדה 🔬'
                              : 'תקין'}
                          </span>

                          {report.attendance !== 'present' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                              {report.attendance === 'late' ? 'איחור' : 'חיסור'}
                            </span>
                          )}
                        </div>

                        {/* Complete Incident Text */}
                        <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                          {report.description}
                        </p>
                      </td>

                      {/* 5. מי דיווח */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {report.teacherName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          מורה עמ"ט
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {report.subject}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 print:hidden text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* WhatsApp sharing */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="שיתוף מיידי בוואטסאפ עם ההורה"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Delete single report */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('האם למחוק דיווח זה?')) {
                                deleteReport(report.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="מחק דיווח זה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Delete All Reports at any time */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 font-['Rubik']">
                מחיקת כל הדיווחים במערכת
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                פעולה זו תמחק את כל {reports.length} הדיווחים הקיימים ביומן (רשימות התלמידים, המורים והכיתות יישמרו ללא שינוי).
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              ⚠️ שים לב: מחיקת הדיווחים הינה בלתי הפיכה. מומלץ לייצא דוח לאקסל לפני המחיקה.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                כן, מחק את כל הדיווחים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Filtered Reports */}
      {isDeleteFilteredModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 font-['Rubik']">
                מחיקת {filteredReports.length} דיווחים מסוננים
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                האם למחוק את כל הדיווחים המוצגים כרגע בסינון הנוכחי?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteFilteredModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteFiltered}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                כן, מחק דיווחים אלה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
