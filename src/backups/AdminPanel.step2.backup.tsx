import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Teacher, Grade, Subject, LessonPeriodConfig, HomeroomTeacherInfo } from '../types';
import { SCHOOL_INFO } from '../data/initialData';
import { exportAllToExcel } from '../utils/excel';
import { PedagogicalFile } from './PedagogicalFile';
import { BehaviorReportsGenerator } from './BehaviorReportsGenerator';
import { ExcelManager } from './ExcelManager';
import {
  ShieldAlert,
  Users,
  Clock,
  FileText,
  KeyRound,
  Database,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Check,
  Printer,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertTriangle,
  School,
  Sparkles,
  Copy,
  Eye,
  EyeOff,
  Shuffle,
  Share2,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    session,
    teachers,
    updateTeacher,
    deleteTeacher,
    students,
    reports,
    homeroomTeachers,
    updateHomeroomTeachers,
    adminSettings,
    updateAdminSettings,
    updateSchoolPeriods,
    clearEntireDatabase,
    clearAllReports,
    resetToDefaultData,
    regenerateAllCodes,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'teachers' | 'periods' | 'reports_lists' | 'pedagogical' | 'behavior' | 'database' | 'codes' | 'resets'
  >('teachers');

  // Teacher edit modal state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isNewTeacherModalOpen, setIsNewTeacherModalOpen] = useState<boolean>(false);
  const [newTeacherData, setNewTeacherData] = useState<Teacher>({
    id: `t_${Date.now()}`,
    name: '',
    subjects: ['מתמטיקה'],
    grades: ['ז'],
    roleDescription: '',
    teacherCode: `${Math.floor(7010 + Math.random() * 80)}`,
    isHomeroom: false,
    homeroomClass: "ז'1",
    homeroomCode: '8001',
  });

  // Homeroom teacher edit modal state
  const [editingHomeroom, setEditingHomeroom] = useState<HomeroomTeacherInfo | null>(null);
  const [isNewHomeroomModalOpen, setIsNewHomeroomModalOpen] = useState<boolean>(false);
  const [newHomeroomData, setNewHomeroomData] = useState<HomeroomTeacherInfo>({
    className: "ז'1",
    teacherName: '',
    code: `${Math.floor(8001 + Math.random() * 80)}`,
    phone: '',
    notes: '',
  });

  // Periods configuration state
  const [periods, setPeriods] = useState<LessonPeriodConfig[]>(
    adminSettings.schoolPeriods || []
  );
  const [periodsSaveSuccess, setPeriodsSaveSuccess] = useState<boolean>(false);

  // Grade lists report filter: ז' / ח' / ט'
  const [selectedReportGrade, setSelectedReportGrade] = useState<Grade>('ח');

  // Admin password change state
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<boolean>(false);
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // If user is not admin
  if (session?.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-sm my-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-['Rubik']">
          אזור מנהל מערכת מוגן
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          כניסה לאזור זה מורשית אך ורק למנהל המערכת באמצעות קוד מנהל מאומת.
        </p>
      </div>
    );
  }

  // Handle Periods update
  const handlePeriodChange = (index: number, field: keyof LessonPeriodConfig, value: string | number) => {
    setPeriods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSavePeriods = () => {
    updateSchoolPeriods(periods);
    setPeriodsSaveSuccess(true);
    setTimeout(() => setPeriodsSaveSuccess(false), 2500);
  };

  const handleAddPeriod = () => {
    const nextPeriodNum = periods.length + 1;
    const newPeriod: LessonPeriodConfig = {
      period: nextPeriodNum,
      startTime: '15:00',
      endTime: '15:45',
      name: `שיעור ${nextPeriodNum}`,
    };
    const nextList = [...periods, newPeriod];
    setPeriods(nextList);
    updateSchoolPeriods(nextList);
  };

  const handleDeletePeriod = (index: number) => {
    if (confirm('האם למחוק שעת שיעור זו?')) {
      const nextList = periods.filter((_, i) => i !== index);
      setPeriods(nextList);
      updateSchoolPeriods(nextList);
    }
  };

  // Handle Teacher Save
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher(editingTeacher);
      setEditingTeacher(null);
    }
  };

  // Handle New Teacher Submit
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherData.name.trim()) return;
    updateTeacher({
      ...newTeacherData,
      id: `t_${Date.now()}`,
    });
    setIsNewTeacherModalOpen(false);
    setNewTeacherData({
      id: `t_${Date.now()}`,
      name: '',
      subjects: ['מתמטיקה'],
      grades: ['ז'],
      roleDescription: '',
      teacherCode: `${Math.floor(7010 + Math.random() * 80)}`,
      isHomeroom: false,
      homeroomClass: "ז'1",
      homeroomCode: '8001',
    });
  };

  // Handle Homeroom Save & Delete
  const handleSaveHomeroomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomeroom) return;
    const exists = homeroomTeachers.some((h) => h.className === editingHomeroom.className);
    const updated = exists
      ? homeroomTeachers.map((h) => (h.className === editingHomeroom.className ? editingHomeroom : h))
      : [...homeroomTeachers, editingHomeroom];
    updateHomeroomTeachers(updated);
    setEditingHomeroom(null);
  };

  const handleCreateHomeroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeroomData.teacherName.trim()) return;
    const filtered = homeroomTeachers.filter((h) => h.className !== newHomeroomData.className);
    updateHomeroomTeachers([...filtered, newHomeroomData]);
    setIsNewHomeroomModalOpen(false);
    setNewHomeroomData({
      className: "ז'1",
      teacherName: '',
      code: `${Math.floor(8001 + Math.random() * 80)}`,
      phone: '',
      notes: '',
    });
  };

  const handleDeleteHomeroom = (className: string) => {
    if (confirm(`האם למחוק את מחנכת כיתה ${className}?`)) {
      updateHomeroomTeachers(homeroomTeachers.filter((h) => h.className !== className));
    }
  };

  // Filter students for Grade Lists report
  const reportStudents = students.filter((s) => s.grade === selectedReportGrade);
  const classesInGrade = Array.from(new Set(reportStudents.map((s) => s.className))).sort();

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                פאנל ניהול והגדרות מערכת עמ"ט
              </span>
              <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                מנהל מערכת מחובר
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-['Rubik'] tracking-tight">
              ניהול בית ספרי - מנהל/ת המערכת
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              עריכת שמות ותפקידי מורים, קביעת שעות שיעורים בבית הספר, הפקת דוחות עמ"ט וניהול הרשאות
            </p>
          </div>

          {/* Quick status */}
          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
            <div className="text-right">
              <div className="text-xs font-bold text-white">הרשאת תיק תלמיד למחנכות:</div>
              <div className="text-[11px] text-slate-400">
                {adminSettings.allowHomeroomPedagogicalAccess ? (
                  <span className="text-emerald-400 font-bold">פעילה (מחנכות מורשות לצפות)</span>
                ) : (
                  <span className="text-rose-400 font-bold">נעולה (למנהל בלבד)</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAdminSettings({
                  allowHomeroomPedagogicalAccess: !adminSettings.allowHomeroomPedagogicalAccess,
                })
              }
              className={`p-2 rounded-xl transition-all ${
                adminSettings.allowHomeroomPedagogicalAccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="לחץ לשינוי הרשאת גישה למחנכות"
            >
              {adminSettings.allowHomeroomPedagogicalAccess ? (
                <Unlock className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Executive Quick Hubs Banner - Visible & impossible to miss */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              מרכזי שליטה ופעולות ניהול מהירות (לחץ למעבר מיידי):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. מרכז איפוסים ומחיקות */}
            <button
              type="button"
              onClick={() => setActiveTab('resets')}
              className={`p-3.5 rounded-2xl border text-right transition-all transform hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
                activeTab === 'resets'
                  ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500/50'
                  : 'bg-slate-800/90 border-rose-500/40 hover:border-rose-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  איפוס ומחיקה
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors font-['Rubik']">
                מרכז איפוסים ומחיקות
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                מחיקה מוחלטת למאגר ריק (0 נתונים), מחיקת דיווחים ושחזור
              </p>
            </button>

            {/* 2. מתן והגרלת קודים סודיים */}
            <button
              type="button"
              onClick={() => setActiveTab('codes')}
              className={`p-3.5 rounded-2xl border text-right transition-all transform hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
                activeTab === 'codes'
                  ? 'bg-cyan-950/90 border-cyan-400 ring-2 ring-cyan-500/50'
                  : 'bg-slate-800/90 border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  הגרלה לכל מורה
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-['Rubik']">
                מתן והגרלת קודים לצוות
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                כפתור 🎲 הגרל סיסמה ליד כל מורה ומחנכת, שמירה ושיתוף
              </p>
            </button>

            {/* 3. עריכת מורי עמ"ט ותפקידים */}
            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={`p-3.5 rounded-2xl border text-right transition-all transform hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-500/50'
                  : 'bg-slate-800/90 border-slate-700 hover:border-indigo-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {teachers.length} מורי עמ"ט
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors font-['Rubik']">
                עריכת מורים ותפקידים
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                שינוי שמות המורים, תחומי הדעת (מתמטיקה/מחשבים/פיזיקה) ושכבות
              </p>
            </button>

            {/* 4. דוחות עמ"ט ז', ח', ט' */}
            <button
              type="button"
              onClick={() => setActiveTab('reports_lists')}
              className={`p-3.5 rounded-2xl border text-right transition-all transform hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
                activeTab === 'reports_lists'
                  ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800/90 border-slate-700 hover:border-emerald-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  דוחות להנהלה
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors font-['Rubik']">
                דוחות רשימות עמ"ט
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                הפקת רשימות תלמידים מסודרות לפי כיתות ומחנכות לשכבות ז', ח', ט'
              </p>
            </button>
          </div>
        </div>

        {/* Tab Navigation inside Admin Panel */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>עריכת מורים ותפקידים ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('periods')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'periods'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>שעות שיעורים בבית הספר ({periods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports_lists')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'reports_lists'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>דוחות רשימות עמ"ט להנהלה (ז', ח', ט')</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'codes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>קודים סודיים והרשאות</span>
          </button>

          <button
            onClick={() => setActiveTab('pedagogical')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'pedagogical'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>תיק תלמיד מרוכז</span>
          </button>

          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'behavior'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>דוחות התנהגות מרוכזים</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>מסד נתונים (ייבוא/מחיקה)</span>
          </button>

          <button
            onClick={() => setActiveTab('resets')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'resets'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-rose-950/60 text-rose-300 hover:text-white hover:bg-rose-900/60 border border-rose-500/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>מרכז איפוסים ומחיקות</span>
          </button>
        </div>
      </section>

      {/* TAB 1: עריכת מורים ותפקידים */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {/* Card 1: מורי עמ"ט */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <Users className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
                    עריכת שמות מורים ותפקידי מורי עמ"ט
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  שינוי שמות המורים, תחומי הדעת (מתמטיקה / מדעי המחשב / פיזיקה), שכבות הלימוד והקודים הסודיים
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewTeacherModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מורה עמ"ט חדש</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-4">שם המורה</th>
                    <th className="py-3 px-4">תחומי דעת עמ"ט</th>
                    <th className="py-3 px-4">שכבות לימוד</th>
                    <th className="py-3 px-4">תיאור תפקיד</th>
                    <th className="py-3 px-3">קוד סודי אישי</th>
                    <th className="py-3 px-3">תפקיד מחנכת</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {teachers.map((teacher, idx) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {teacher.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {teacher.subjects.map((sub) => (
                            <span
                              key={sub}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {teacher.grades.map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]"
                            >
                              שכבה {g}'
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {teacher.roleDescription}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                          {teacher.teacherCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {teacher.isHomeroom ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            מחנכת {teacher.homeroomClass} (קוד {teacher.homeroomCode})
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(teacher)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="ערוך מורה"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`האם למחוק את המורה ${teacher.name}?`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="מחק מורה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Card 2: מחנכות הכיתה (חטיבת הביניים ב' אבו סנאן) */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <School className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
                    מחנכות הכיתה - הרשאות כניסה והוצאת הודעות להורים
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  כל מחנכת רואה אך ורק את כיתת האם שלה בזמן אמת, והיא הגורם הבלעדי המוסמך להוציא הודעה רשמית להורי התלמיד
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewHomeroomModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מחנכת כיתה חדשה</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-4">כיתת אם</th>
                    <th className="py-3 px-4">שם המחנכת</th>
                    <th className="py-3 px-3">קוד סודי אישי</th>
                    <th className="py-3 px-4">הרשאת מערכת</th>
                    <th className="py-3 px-3 text-center">הודעת וואטסאפ למחנכת</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {homeroomTeachers.map((h, idx) => {
                    const isCopied = copiedId === `hr_tab1_${h.className}`;
                    return (
                      <tr key={h.className} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                            כיתה {h.className}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          {h.teacherName}
                          {h.notes && (
                            <span className="block text-[11px] font-normal text-slate-500">
                              {h.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300">
                              {h.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const randomCode = `${Math.floor(8001 + Math.random() * 90)}`;
                                const updated = homeroomTeachers.map((item) =>
                                  item.className === h.className ? { ...item, code: randomCode } : item
                                );
                                updateHomeroomTeachers(updated);
                                setCopiedId(`rand_${h.className}`);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="p-1 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                              title="🎲 הגרל קוד חדש למחנכת"
                            >
                              <Shuffle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            צפייה בדיווחים בזמן אמת + שליחה להורים
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `שלום למחנכת ${h.teacherName} (כיתה ${h.className}),\nהקוד הסודי שלך לכניסה למערכת עמ״ט Live של חטיבת הביניים ב׳ אבו סנאן הוא: *${h.code}*\n\nכניסה למערכת: ${window.location.origin}`;
                              navigator.clipboard.writeText(msg);
                              setCopiedId(`hr_tab1_${h.className}`);
                              setTimeout(() => setCopiedId(null), 2500);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
                            title="העתק הודעה מנוסחת לוואטסאפ למחנכת"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>הועתק!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>📱 העתק למחנכת</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingHomeroom(h)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="ערוך מחנכת"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHomeroom(h.className)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="מחק מחנכת"
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
          </section>
        </div>
      )}

      {/* TAB 2: עריכת שעות שיעורים בבית הספר */}
      {activeTab === 'periods' && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
                עריכת שעות שיעורים וצלצולים בבית הספר
              </h3>
              <p className="text-xs text-slate-600">
                קביעת שעות התחלה וסיום מדויקות עבור כל שעת שיעור. השינויים משתקפים מיד ביומן המורים
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPeriod}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף שעת שיעור</span>
              </button>

              <button
                type="button"
                onClick={handleSavePeriods}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>שמור שינויי שעות</span>
              </button>
            </div>
          </div>

          {periodsSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>שעות השיעורים עודכנו בהצלחה במערכת!</span>
            </div>
          )}

          <div className="space-y-3">
            {periods.map((item, index) => (
              <div
                key={item.period}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center font-mono text-sm shrink-0">
                    {item.period}
                  </div>
                  <div className="flex-1 sm:w-48">
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                      תיאור / שם השיעור:
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handlePeriodChange(index, 'name', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                      התחלה:
                    </label>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <span className="text-slate-400 mt-4">-</span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                      סיום:
                    </label>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleDeletePeriod(index)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="מחק שיעור"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: הפקת כל מיני דוחות להנהלה ולמחנכות (עמ"ט ז', ח', ט') */}
      {activeTab === 'reports_lists' && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
                הפקת דוחות רשימות עמ"ט להנהלה ולמחנכות
              </h3>
              <p className="text-xs text-slate-600">
                רשימות תלמידים מלאות לפי שכבות ז', ח', ט' – מסודרות בעברית RTL לפי כיתות אם ומחנכות
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>הדפס דוח שכבה (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => exportAllToExcel(students, teachers, [])}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ייצא לאקסל</span>
              </button>
            </div>
          </div>

          {/* Grade Selector Bar */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
            {(['ז', 'ח', 'ט'] as Grade[]).map((g) => {
              const count = students.filter((s) => s.grade === g).length;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedReportGrade(g)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    selectedReportGrade === g
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  רשימת עמ"ט שכבה {g}' ({count} תלמידים)
                </button>
              );
            })}
          </div>

          {/* Printable Official Grade Report Card */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 space-y-6">
            <div className="text-center pb-4 border-b border-slate-300">
              <h2 className="text-xl font-black text-slate-900 font-['Rubik']">
                רשימת תלמידי עתודה מדעית טכנולוגית (עמ"ט) - שכבה {selectedReportGrade}'
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {SCHOOL_INFO.name} ({SCHOOL_INFO.nameArabic}) | שנת הלימודים {SCHOOL_INFO.academicYear} | סה״כ: {reportStudents.length} תלמידים
              </p>
            </div>

            {/* Breakdown by class in this grade */}
            {classesInGrade.map((cls) => {
              const studentsInThisClass = reportStudents.filter((s) => s.className === cls);
              const homeroomName = studentsInThisClass[0]?.homeroomTeacher || 'צוות מחנכות';

              return (
                <div key={cls} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between text-xs font-bold border-b border-slate-200">
                    <span className="text-blue-900">כיתת אם: {cls}</span>
                    <span className="text-slate-700">מחנכת הכיתה: {homeroomName}</span>
                    <span className="text-slate-500 font-mono">({studentsInThisClass.length} תלמידי עמ"ט)</span>
                  </div>

                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 w-10">#</th>
                        <th className="py-2.5 px-4">שם התלמיד / الطالب</th>
                        <th className="py-2.5 px-4">שכבה</th>
                        <th className="py-2.5 px-4">כיתה</th>
                        <th className="py-2.5 px-4">מחנכת הכיתה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsInThisClass.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-4 font-bold text-slate-900">{student.name}</td>
                          <td className="py-2 px-4">שכבה {student.grade}'</td>
                          <td className="py-2 px-4">{student.className}</td>
                          <td className="py-2 px-4 text-slate-700">{student.homeroomTeacher}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: קודים סודיים והרשאות צוות */}
      {activeTab === 'codes' && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
                    מרכז מתן והגרלת קודים סודיים לצוות (מנהל המערכת)
                  </h3>
                  <p className="text-xs text-slate-600">
                    מנהל המערכת בלבד קובע ומגריל סיסמאות למורים ולמחנכות. לחץ "🎲 הגרל סיסמה" ליד כל איש צוות או הזן ידנית ושמור.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (confirm('האם להגריל קודים חדשים לכל מורי עמ"ט ולכל המחנכות בבת אחת?')) {
                    regenerateAllCodes();
                    setCopiedId('all_regen');
                    setTimeout(() => setCopiedId(null), 3000);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>🎲 הגרל קודים לכל הצוות</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const teacherLines = teachers
                    .map((t) => `• מורה: ${t.name} (${t.subjects.join('/')}, שכבות ${t.grades.join(',')}) - קוד: ${t.teacherCode}${t.isHomeroom ? ` | קוד מחנכת ${t.homeroomClass}: ${t.homeroomCode || t.teacherCode}` : ''}`)
                    .join('\n');
                  const homeroomLines = homeroomTeachers
                    .map((h) => `• מחנכת כיתה ${h.className} (${h.teacherName}) - קוד: ${h.code}`)
                    .join('\n');
                  const fullText = `📋 רשימת קודים סודיים - מערכת עמ"ט Live (חט"ב ב' אבו סנאן)\n\nמורי עמ"ט:\n${teacherLines}\n\nמחנכות כיתה:\n${homeroomLines}\n\nקישור לכניסה: ${window.location.origin}`;
                  navigator.clipboard.writeText(fullText);
                  setCopiedId('bulk_copy');
                  setTimeout(() => setCopiedId(null), 3000);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {copiedId === 'bulk_copy' ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>✓ הרשימה הועתקה!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>📋 העתק רשימה לוואטסאפ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>הדפס דף קודים</span>
              </button>
            </div>
          </div>

          {copiedId === 'all_regen' && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCheck className="w-4 h-4 text-blue-600" />
              <span>הקודים הסודיים לכל המורים והמחנכות הוגרלו ונשמרו בהצלחה במסד הנתונים!</span>
            </div>
          )}

          {/* Admin Password Setting - SECURE / MASKED */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>סיסמת מנהל המערכת (מאובטחת):</span>
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-900 font-medium">סיסמה נוכחית:</span>
                <span className="font-mono text-sm font-bold bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 text-slate-800">
                  {showAdminPassword ? adminSettings.adminPassword : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                  title={showAdminPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="הקלד סיסמת מנהל חדשה..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPassword.trim()) {
                    updateAdminSettings({ adminPassword: newPassword.trim() });
                    setPasswordChangeSuccess(true);
                    setNewPassword('');
                    setTimeout(() => setPasswordChangeSuccess(false), 2500);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                שמור סיסמה
              </button>
            </div>
          </div>

          {passwordChangeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              סיסמת מנהל המערכת עודכנה בהצלחה!
            </div>
          )}

          {/* Permissions Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                הרשאת צפייה בתיק תלמיד עבור מחנכות הכיתה
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                כאשר כבוי – רק מנהל המערכת יכול לצפות בתיק התלמיד. הדלקת המתג תאפשר למחנכות לצפות בתיק תלמידי כיתתן.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateAdminSettings({
                  allowHomeroomPedagogicalAccess: !adminSettings.allowHomeroomPedagogicalAccess,
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                adminSettings.allowHomeroomPedagogicalAccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              {adminSettings.allowHomeroomPedagogicalAccess ? '✓ מורשה למחנכות' : '✗ חסום למחנכות (מנהל בלבד)'}
            </button>
          </div>

          {/* Teacher Codes Grid with "🎲 הגרל סיסמה" per teacher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-['Rubik'] flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>קודי גישה למורי עמ"ט (מתן סיסמה והגרלה מול כל מורה):</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  כל מורה רואה אך ורק את השכבות שהוא מלמד. ניתן להגריל סיסמה בלחיצה או להקליד ידנית.
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                {teachers.length} מורים
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {teachers.map((t) => {
                const isCopied = copiedId === `t_${t.id}`;
                const isDual = t.isHomeroom && t.homeroomClass;

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-bold">{t.name}</strong>
                          {isDual && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                              תפקיד כפול: מורה + מחנכת {t.homeroomClass}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          מקצועות: <strong className="text-slate-700">{t.subjects.join(', ')}</strong> | שכבות:{' '}
                          <strong className="text-blue-700">{t.grades.join(', ')}'</strong>
                        </p>
                      </div>
                    </div>

                    {/* Teacher Code Row */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>קוד כניסה כמורה עמ"ט:</span>
                        <span className="text-blue-600 font-mono">{t.teacherCode}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={t.teacherCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateTeacher({ ...t, teacherCode: val });
                          }}
                          className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />

                        {/* Randomize Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const randomCode = `${Math.floor(1000 + Math.random() * 9000)}`;
                            updateTeacher({ ...t, teacherCode: randomCode });
                            setCopiedId(`rand_${t.id}`);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                          title="הגרל סיסמה אקראית חדשה"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>🎲 הגרל סיסמה</span>
                        </button>

                        {/* Copy for WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `שלום ${t.name},\nהקוד הסודי שלך לכניסה למערכת עמ״ט Live של חטיבת הביניים ב׳ אבו סנאן הוא: *${t.teacherCode}*\nתחומי דעת: ${t.subjects.join(', ')} | שכבות הוראה: ${t.grades.join(', ')}'\n\nכניסה למערכת: ${window.location.origin}`;
                            navigator.clipboard.writeText(msg);
                            setCopiedId(`t_${t.id}`);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                          title="העתק הודעה מנוסחת לוואטסאפ למורה"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>הועתק!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתק למורה</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dual Role: Homeroom credentials for this teacher (e.g. Rabia Khatib) */}
                    {isDual && (
                      <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                          <span>קוד נוסף כמחנכת כיתה {t.homeroomClass}:</span>
                          <span className="text-purple-700 font-mono">{t.homeroomCode || t.teacherCode}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={t.homeroomCode || ''}
                            placeholder={t.teacherCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateTeacher({ ...t, homeroomCode: val });
                              if (t.homeroomClass) {
                                updateHomeroomTeachers(
                                  homeroomTeachers.map((h) =>
                                    h.className === t.homeroomClass ? { ...h, code: val } : h
                                  )
                                );
                              }
                            }}
                            className="w-24 bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const randomCode = `${Math.floor(1000 + Math.random() * 9000)}`;
                              updateTeacher({ ...t, homeroomCode: randomCode });
                              if (t.homeroomClass) {
                                updateHomeroomTeachers(
                                  homeroomTeachers.map((h) =>
                                    h.className === t.homeroomClass ? { ...h, code: randomCode } : h
                                  )
                                );
                              }
                              setCopiedId(`rand_hr_${t.id}`);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                            title="הגרל קוד מחנכת"
                          >
                            <Shuffle className="w-3.5 h-3.5" />
                            <span>🎲 הגרל קוד מחנכת</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const code = t.homeroomCode || t.teacherCode;
                              const msg = `שלום ${t.name},\nהקוד הסודי שלך כמחנכת כיתה ${t.homeroomClass} במערכת עמ״ט Live של חטיבת הביניים ב׳ אבו סנאן הוא: *${code}*\n\nכניסה למערכת: ${window.location.origin}`;
                              navigator.clipboard.writeText(msg);
                              setCopiedId(`thr_${t.id}`);
                              setTimeout(() => setCopiedId(null), 2500);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                          >
                            {copiedId === `thr_${t.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>הועתק!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>העתק למחנכת</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Homeroom Codes Grid with "🎲 הגרל סיסמה" per homeroom */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-['Rubik'] flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>קודי גישה למחנכות הכיתה (מתן סיסמה והגרלה מול כל כיתה):</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  כל מחנכת רואה אך ורק את התלמידים והדיווחים של כיתת האם שלה. ניתן לערוך את שם המחנכת ולהגריל קוד.
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                {homeroomTeachers.length} כיתות
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {homeroomTeachers.map((h) => {
                const isCopied = copiedId === `h_${h.className}`;

                return (
                  <div
                    key={h.className}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-emerald-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        כיתה {h.className}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {h.code}
                      </span>
                    </div>

                    {/* Homeroom Teacher Name Edit */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">שם המחנכת:</label>
                      <input
                        type="text"
                        value={h.teacherName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = homeroomTeachers.map((item) =>
                            item.className === h.className ? { ...item, teacherName: val } : item
                          );
                          updateHomeroomTeachers(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Homeroom Code Row */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">קוד סודי לכיתה:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={h.code}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = homeroomTeachers.map((item) =>
                              item.className === h.className ? { ...item, code: val } : item
                            );
                            updateHomeroomTeachers(updated);
                          }}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                        />

                        {/* Randomize Homeroom Code */}
                        <button
                          type="button"
                          onClick={() => {
                            const randomCode = `${Math.floor(1000 + Math.random() * 9000)}`;
                            const updated = homeroomTeachers.map((item) =>
                              item.className === h.className ? { ...item, code: randomCode } : item
                            );
                            updateHomeroomTeachers(updated);
                            setCopiedId(`rand_h_${h.className}`);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          title="הגרל סיסמה לכיתה"
                        >
                          <Shuffle className="w-3 h-3" />
                          <span>🎲 הגרל</span>
                        </button>

                        {/* Copy for WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `שלום ${h.teacherName},\nהקוד הסודי שלך כמחנכת כיתה ${h.className} במערכת עמ״ט Live של חטיבת הביניים ב׳ אבו סנאן הוא: *${h.code}*\n\nכניסה למערכת: ${window.location.origin}`;
                            navigator.clipboard.writeText(msg);
                            setCopiedId(`h_${h.className}`);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          title="העתק הודעה לוואטסאפ"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>הועתק!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>העתק</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: תיק תלמיד (מוגן למנהל) */}
      {activeTab === 'pedagogical' && (
        <section className="space-y-4">
          <PedagogicalFile />
        </section>
      )}

      {/* TAB 6: דוחות התנהגות (מוגן למנהל) */}
      {activeTab === 'behavior' && (
        <section className="space-y-4">
          <BehaviorReportsGenerator />
        </section>
      )}

      {/* TAB 7: מסד נתונים (מוגן למנהל) */}
      {activeTab === 'database' && (
        <section className="space-y-4">
          <ExcelManager />
        </section>
      )}

      {/* TAB 8: מרכז איפוסים ומחיקות של מנהל המערכת */}
      {activeTab === 'resets' && (
        <section className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white rounded-3xl p-6 shadow-xl border border-rose-500/30">
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-black font-['Rubik'] text-white">
                  מרכז איפוסים ומחיקות של מנהל המערכת
                </h3>
                <p className="text-xs text-rose-200">
                  פעולות ניהול מרוכזות: מחיקה מוחלטת של המאגר, איפוס דיווחים, מתן קודים חדשים ואיפוס סיסמת מנהל
                </p>
              </div>
            </div>

            {/* Current Database Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[11px]">תלמידי עמ"ט במסד:</span>
                <strong className="text-lg text-white font-mono">{students.length}</strong>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[11px]">מורי עמ"ט:</span>
                <strong className="text-lg text-cyan-400 font-mono">{teachers.length}</strong>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[11px]">מחנכות כיתה:</span>
                <strong className="text-lg text-indigo-400 font-mono">{homeroomTeachers.length}</strong>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[11px]">דיווחי שיעור והתנהגות:</span>
                <strong className="text-lg text-amber-400 font-mono">{reports.length}</strong>
              </div>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: מחיקה מוחלטת של כל מסד הנתונים */}
            <div className="bg-white rounded-3xl p-5 border-2 border-rose-200 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-black text-base font-['Rubik']">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>מחיקה מוחלטת של כל מסד הנתונים (מאגר ריק לגמרי)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  פעולה זו מוחקת את <strong>כל התלמידים, המורים, המחנכות והדיווחים</strong> ומותירה את האפליקציה עם מאגר ריק לחלוטין (0 נתונים).
                  מתאים במיוחד כאשר מעוניינים להעלות קובץ אקסל חדש מאפס לקראת שנת לימודים או סמסטר חדש.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        'אזהרה חמורה!\nהאם את/ה בטוח/ה שברצונך למחוק את כל מסד הנתונים?\nכל התלמידים, המורים והדיווחים יימחקו לצמיתות והמאגר יישאר ריק לגמרי.'
                      )
                    ) {
                      clearEntireDatabase();
                      alert('מסד הנתונים נמחק בהצלחה! המאגר ריק לגמרי כעת (0 תלמידים, 0 מורים, 0 דיווחים).');
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>מחיקה מוחלטת – השארת מאגר ריק לגמרי (0 רשומות)</span>
                </button>
              </div>
            </div>

            {/* Card 2: מחיקת כל הדיווחים בלבד */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-black text-base font-['Rubik']">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>מחיקת כל דיווחי השיעורים וההתנהגות בלבד</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  פעולה זו מאפסת את <strong>כל {reports.length} דיווחי הנוכחות, שיעורי הבית ואירועי המשמעת/הצטיינות</strong>,
                  תוך <strong>שמירה מלאה</strong> על רשימות תלמידי עמ"ט, המורים והמחנכות.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`האם למחוק את כל ${reports.length} הדיווחים במערכת? פעולה זו אינה מוחקת תלמידים ומורים.`)) {
                      clearAllReports();
                      alert('כל הדיווחים נמחקו בהצלחה! יומני המורים ולוח המחנכות אופסו.');
                    }
                  }}
                  disabled={reports.length === 0}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>מחק את כל הדיווחים בלבד ({reports.length})</span>
                </button>
              </div>
            </div>

            {/* Card 3: מתן קודים סודיים ואיפוס קודים לצוות */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-black text-base font-['Rubik']">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <span>מתן קודים ואיפוס קודים סודיים לכל הצוות</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  הפקת סדרת קודים סודיים חדשה ומסודרת עבור כל מורי עמ"ט (החל מ-7001) ועבור כל מחנכות הכיתה (החל מ-8001).
                  לאחר הלחיצה יחודשו הקודים ותוכל/י לראותם בלשונית "קודים סודיים".
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    regenerateAllCodes();
                    alert('הופקו קודים סודיים חדשים בהצלחה לכל המורים והמחנכות!');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>הפקת קודים סודיים חדשים לכל הצוות</span>
                </button>
              </div>
            </div>

            {/* Card 4: איפוס ושינוי סיסמת מנהל מערכת */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base font-['Rubik']">
                  <Lock className="w-5 h-5 text-cyan-600" />
                  <span>איפוס ושינוי סיסמת מנהל מערכת</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  הסיסמה הנוכחית של מנהל המערכת: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">{showAdminPassword ? adminSettings.adminPassword : '••••••••'}</span>
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="mr-2 text-cyan-700 hover:text-cyan-600 text-xs font-semibold"
                  >
                    {showAdminPassword ? '(הסתר)' : '(הצג)'}
                  </button>
                  . באפשרותך לקבוע סיסמה חדשה או לאפס לברירת המחדל.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="password"
                    placeholder="הקלד סיסמת מנהל חדשה..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPassword.trim()) {
                        updateAdminSettings({ adminPassword: newPassword.trim() });
                        setNewPassword('');
                        alert('סיסמת מנהל המערכת שונתה בהצלחה!');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    שמור סיסמה
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    updateAdminSettings({ adminPassword: '160525' });
                    alert('סיסמת המנהל אופסה בהצלחה לברירת המחדל');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  איפוס סיסמת מנהל לברירת המחדל
                </button>
              </div>
            </div>

            {/* Card 5: שחזור מסד נתונים לברירת מחדל של בית הספר */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 md:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-base font-['Rubik']">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>שחזור נתוני דוגמה מקוריים של בית הספר (חט״ב ב׳ אבו סנאן)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  אם מחקת את המאגר או ביצעת ניסיונות בדיקה, כפתור זה משחזר באופן מיידי את כל 6 מורי עמ"ט המקוריים, המחנכות, תלמידי עמ"ט של שכבות ז', ח', ט' ודיווחי דוגמה של חטיבת הביניים ב' אבו סנאן.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('האם לשחזר את נתוני ברירת המחדל של חטיבת הביניים ב׳ אבו סנאן?')) {
                      resetToDefaultData();
                      alert('נתוני ברירת המחדל של בית הספר שוחזרו בהצלחה!');
                    }
                  }}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>שחזור נתוני ברירת מחדל של בית הספר</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
              עריכת פרטי מורה עמ"ט: {editingTeacher.name}
            </h3>

            <form onSubmit={handleSaveTeacherEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם המורה:</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">קוד סודי אישי לכניסה:</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.teacherCode}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, teacherCode: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תיאור תפקיד:</label>
                <input
                  type="text"
                  value={editingTeacher.roleDescription}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, roleDescription: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Grades selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">שכבות לימוד מורשות:</label>
                <div className="flex items-center gap-2">
                  {(['ז', 'ח', 'ט'] as Grade[]).map((g) => {
                    const isChecked = editingTeacher.grades.includes(g);
                    return (
                      <label
                        key={g}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold ${
                          isChecked
                            ? 'bg-blue-50 border-blue-400 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingTeacher({
                                ...editingTeacher,
                                grades: [...editingTeacher.grades, g],
                              });
                            } else {
                              if (editingTeacher.grades.length > 1) {
                                setEditingTeacher({
                                  ...editingTeacher,
                                  grades: editingTeacher.grades.filter((item) => item !== g),
                                });
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <span>שכבה {g}'</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dual Role (Also Homeroom Teacher) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!editingTeacher.isHomeroom}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        isHomeroom: e.target.checked,
                        homeroomClass: e.target.checked ? editingTeacher.homeroomClass || "ז'1" : undefined,
                        homeroomCode: e.target.checked ? editingTeacher.homeroomCode || '8001' : undefined,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>מורה זו/זה משמש/ת גם כמחנכת כיתה (תפקיד כפול)</span>
                </label>

                {editingTeacher.isHomeroom && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        כיתת אם:
                      </label>
                      <input
                        type="text"
                        placeholder="למשל: ז'1"
                        value={editingTeacher.homeroomClass || ''}
                        onChange={(e) =>
                          setEditingTeacher({
                            ...editingTeacher,
                            homeroomClass: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        קוד מחנכת:
                      </label>
                      <input
                        type="text"
                        placeholder="למשל: 8001"
                        value={editingTeacher.homeroomCode || ''}
                        onChange={(e) =>
                          setEditingTeacher({
                            ...editingTeacher,
                            homeroomCode: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  שמור שינויים
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Teacher Modal */}
      {isNewTeacherModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right">
            <h3 className="text-lg font-bold text-slate-900 font-['Rubik']">
              הוספת מורה עמ"ט חדש
            </h3>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם המורה:</label>
                <input
                  type="text"
                  required
                  placeholder="למשל: ראבעה חטיב"
                  value={newTeacherData.name}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">קוד סודי אישי לכניסה:</label>
                <input
                  type="text"
                  required
                  value={newTeacherData.teacherCode}
                  onChange={(e) =>
                    setNewTeacherData({ ...newTeacherData, teacherCode: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תיאור תפקיד:</label>
                <input
                  type="text"
                  placeholder="למשל: מורה למתמטיקה מואצת שכבה ז'"
                  value={newTeacherData.roleDescription}
                  onChange={(e) =>
                    setNewTeacherData({ ...newTeacherData, roleDescription: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  הוסף מורה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
