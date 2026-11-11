import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  importExcelFile,
  downloadTemplateExcel,
  exportAllToExcel,
} from '../utils/excel';
import { Student, Grade } from '../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  FileDown,
  Trash2,
  Users,
  GraduationCap,
  Layers,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

export const ExcelManager: React.FC = () => {
  const {
    students,
    teachers,
    homeroomTeachers,
    updateHomeroomTeachers,
    reports,
    updateStudents,
    updateTeachers,
    addStudent,
    deleteStudent,
    clearAllReports,
    clearEntireDatabase,
    resetToDefaultData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    studentCount: number;
    teacherCount: number;
    homeroomCount: number;
    sheetsFound: string[];
    errors: string[];
  } | null>(null);

  // Modals
  const [isClearDbModalOpen, setIsClearDbModalOpen] = useState<boolean>(false);
  const [isClearReportsModalOpen, setIsClearReportsModalOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newStudent, setNewStudent] = useState<Student>({
    id: '',
    name: '',
    grade: 'ח',
    className: "ח'1",
    homeroomTeacher: 'מייסון ח\'יר',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportSummary(null);

    try {
      const result = await importExcelFile(file);
      updateStudents(result.students);
      if (result.teachers.length > 0) {
        updateTeachers(result.teachers);
      }
      if (result.homeroomTeachers && result.homeroomTeachers.length > 0) {
        updateHomeroomTeachers(result.homeroomTeachers);
      }
      setImportSummary(result.summary);
    } catch (err) {
      alert('שגיאה בעת קריאת קובץ האקסל. אנא ודא שהקובץ תקין ובפורמט xlsx.');
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmClearDatabase = () => {
    clearEntireDatabase();
    setIsClearDbModalOpen(false);
    setImportSummary(null);
  };

  const handleConfirmClearReports = () => {
    clearAllReports();
    setIsClearReportsModalOpen(false);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      alert('נא למלא שם תלמיד/ה');
      return;
    }

    const studentToSave: Student = {
      ...newStudent,
      id: newStudent.id.trim() || `std_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    addStudent(studentToSave);
    setIsModalOpen(false);
    setNewStudent({
      id: '',
      name: '',
      grade: 'ח',
      className: "ח'1",
      homeroomTeacher: 'מייסון ח\'יר',
    });
  };

  const filteredStudents = students.filter((s) => {
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.homeroomTeacher.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Banner and Main Action Buttons */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Rubik']">
                  ניהול מסד הנתונים וייבוא אקסל (XLSX)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  טעינה, מחיקה וייצוא של מסד הנתונים: רשימת תלמידי עמ"ט, מחנכות, מורים ותחומי דעת
                </p>
              </div>
            </div>
          </div>

          {/* Core Action Buttons requested by user */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. כפתור העלאת מסד נתונים חדש */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'טוען קובץ...' : 'העלאת מסד נתונים חדש (xlsx)'}</span>
            </button>

            {/* 2. כפתור מחיקת מסד הנתונים המלא (הכל הכל) */}
            <button
              type="button"
              onClick={() => setIsClearDbModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/20"
              title="מחיקת כל התלמידים, המורים, המחנכות, המקצועות והדיווחים"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>מחיקת מסד הנתונים (הכל)</span>
            </button>

            {/* 3. כפתור מחיקת דיווחים בכל מועד */}
            <button
              type="button"
              onClick={() => setIsClearReportsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs sm:text-sm transition-colors"
              title="מחיקת כל יומן הדיווחים תוך שמירה על רשימת התלמידים והמורים"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>מחיקת דיווחים בכל מועד ({reports.length})</span>
            </button>

            {/* 4. הורדת תבנית לפי הפורמט של המשתמש */}
            <button
              type="button"
              onClick={downloadTemplateExcel}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors border border-slate-200"
              title="הורדת תבנית 5 הגליונות המותאמת"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>הורד תבנית לפי הפורמט</span>
            </button>

            {/* 5. ייצוא נתונים נוכחיים */}
            <button
              type="button"
              onClick={() => exportAllToExcel(students, teachers, reports)}
              disabled={students.length === 0}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>ייצוא נתונים לאקסל</span>
            </button>
          </div>
        </div>

        {/* User File Format Guide Display */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>מבנה גליונות קובץ הנתונים (מותאם בדיוק לפורמט שלך):</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 font-mono font-bold text-emerald-800 shadow-2xs">
              1. מחנכות
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 font-mono font-bold text-blue-800 shadow-2xs">
              2. רשימת מורים ומקצועות
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 font-mono font-bold text-purple-800 shadow-2xs">
              3. עמ"ט ז 2027
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 font-mono font-bold text-cyan-800 shadow-2xs">
              4. עמ"ט ח 2027
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 font-mono font-bold text-indigo-800 shadow-2xs">
              5. עמ"ט ט-2027
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            * המערכת מזהה אוטומטית את כל 5 הגליונות, מקשרת כל תלמיד/ה לפי כיתת האם למחנכת הרלוונטית מגליון "מחנכות", ומעדכנת את ששת מורי עמ"ט ומקצועותיהם.
          </p>
        </div>

        {/* Import summary notification */}
        {importSummary && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-950">
              <p className="font-bold text-sm">הייבוא הושלם בהצלחה מתוך קובץ האקסל!</p>
              <p className="mt-1">
                נטענו <strong>{importSummary.studentCount}</strong> תלמידים ו-<strong>{importSummary.teacherCount}</strong> מורי עמ"ט.
              </p>
              <p className="text-emerald-800 mt-0.5">
                גליונות שזוהו: {importSummary.sheetsFound.join(' | ')}
              </p>
            </div>
          </div>
        )}

        {/* Tabs Bar & Quick Database Status */}
        <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>תלמידי עמ"ט במסד ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>מורי עמ"ט ותחומי דעת ({teachers.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'students' && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף תלמיד ידנית</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('האם לטעון את נתוני ברירת המחדל של חטיבת הביניים ב\' אבו סנאן (23 תלמידים ומורים)?')) {
                  resetToDefaultData();
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="שחזור נתוני ברירת מחדל"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>טען נתוני דוגמה אבו סנאן</span>
            </button>
          </div>
        </div>
      </section>

      {/* Empty Database State Notice */}
      {students.length === 0 && teachers.length === 0 && (
        <div className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-rose-900 font-['Rubik']">
            מסד הנתונים ריק לחלוטין
          </h3>
          <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto">
            כל הנתונים נמחקו בהצלחה. כעת באפשרותך ללחוץ על <strong>"העלאת מסד נתונים חדש"</strong> כדי לטעון את קובץ האקסל שהכנת, או ללחוץ על "טען נתוני דוגמה אבו סנאן".
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25"
            >
              העלאת קובץ הנתונים שהכנת (xlsx)
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'students' && students.length > 0 && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 ml-1">סינון לפי שכבה:</span>
              {['all', 'ז', 'ח', 'ט'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'all' ? 'הכל' : `שכבה ${g}'`}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או כיתה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">שם התלמיד / الطالب</th>
                    <th className="py-3 px-4">שכבה</th>
                    <th className="py-3 px-4">כיתת אם</th>
                    <th className="py-3 px-4">שם המחנכת</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{student.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                          שכבה {student.grade}'
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {student.homeroomTeacher}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`האם למחוק את התלמיד/ה ${student.name}?`)) {
                              deleteStudent(student.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="מחק תלמיד"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teachers View */}
      {activeTab === 'teachers' && teachers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-lg font-['Rubik'] shadow-md shadow-blue-500/20">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{teacher.name}</h3>
                  <p className="text-xs text-slate-500">{teacher.roleDescription}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">תחומי דעת עמ"ט:</span>
                  <div className="flex items-center gap-1">
                    {teacher.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold border border-cyan-200"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">שכבות לימוד:</span>
                  <span className="font-bold text-slate-800">
                    {teacher.grades.map((g) => `שכבה ${g}'`).join(', ')}
                  </span>
                </div>

                {teacher.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">טלפון:</span>
                    <span className="font-mono text-slate-700">{teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Clear ENTIRE Database (הכל הכל) */}
      {isClearDbModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 font-['Rubik']">
                מחיקת כל מסד הנתונים (הכל הכל)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                אתה עומד למחוק את כל מסד הנתונים: רשימת כל {students.length} תלמידי עמ"ט, {teachers.length} מורים, מחנכות הכיתה וכל {reports.length} הדיווחים!
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs leading-relaxed">
              ⚠️ <strong>שים לב:</strong> פעולה זו מאפסת לחלוטין את המערכת לקראת העלאת קובץ נתונים חדש. הפעולה אינה ניתנת לביטול.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearDbModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleConfirmClearDatabase}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25"
              >
                כן, מחק את כל מסד הנתונים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Clear Reports at Any Time */}
      {isClearReportsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 font-['Rubik']">
                מחיקת דיווחים ביומן
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                האם למחוק את כל {reports.length} הדיווחים הקיימים?
                <br />
                (רשימת התלמידים, המורים והכיתות יישארו ללא פגע).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearReportsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleConfirmClearReports}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                מחק את כל הדיווחים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
              הוספת תלמיד/ה חדש/ה למסלול עמ"ט
            </h3>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  שם מלא (עברית / ערבית):
                </label>
                <input
                  type="text"
                  required
                  placeholder="למשל: סמיר עבד (سمير عبد)"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">שכבה:</label>
                  <select
                    value={newStudent.grade}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, grade: e.target.value as Grade })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ז">שכבה ז'</option>
                    <option value="ח">שכבה ח'</option>
                    <option value="ט">שכבה ט'</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">כיתת אם:</label>
                  <input
                    type="text"
                    required
                    placeholder="למשל: ח'1, ח'3"
                    value={newStudent.className}
                    onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">שם מחנכת הכיתה:</label>
                <input
                  type="text"
                  required
                  placeholder="למשל: מייסון ח'יר"
                  value={newStudent.homeroomTeacher}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, homeroomTeacher: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  שמור תלמיד
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
