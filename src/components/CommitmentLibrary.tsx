import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ParentCommitment } from '../types';
import { SCHOOL_INFO } from '../data/initialData';
import {
  FileSignature,
  Printer,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  KeyRound,
  Download,
  Share2,
  ExternalLink,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Phone,
  CreditCard,
  User,
  School,
  Edit2,
  Save,
} from 'lucide-react';

export const CommitmentLibrary: React.FC = () => {
  const {
    commitments,
    deleteCommitment,
    clearAllCommitments,
    students,
    adminSettings,
    updateAdminSettings,
  } = useApp();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [viewingCommitment, setViewingCommitment] = useState<ParentCommitment | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);
  const [isEditingMeetingCode, setIsEditingMeetingCode] = useState<boolean>(false);
  const [newMeetingCode, setNewMeetingCode] = useState<string>(
    adminSettings?.parentMeetingCode || '640615'
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Available classes
  const classesList = Array.from(new Set(students.map((s) => s.className))).sort();

  // Signed student IDs set
  const signedStudentIds = new Set(commitments.map((c) => c.studentId));

  // Filter students / commitments
  const filteredCommitments = commitments.filter((c) => {
    const matchesClass = selectedClass === 'all' || c.className === selectedClass;
    const matchesSearch =
      !searchQuery.trim() ||
      c.studentName.includes(searchQuery.trim()) ||
      c.parentName.includes(searchQuery.trim()) ||
      c.parentIdNumber.includes(searchQuery.trim());
    return matchesClass && matchesSearch;
  });

  const unsignedStudents = students.filter((s) => {
    const matchesClass = selectedClass === 'all' || s.className === selectedClass;
    const isUnsigned = !signedStudentIds.has(s.id);
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.includes(searchQuery.trim()) ||
      s.className.includes(searchQuery.trim());
    return matchesClass && isUnsigned && matchesSearch;
  });

  // Calculate statistics
  const totalStudents = students.length;
  const totalSigned = commitments.length;
  const signedPercentage = totalStudents > 0 ? Math.round((totalSigned / totalStudents) * 100) : 0;

  // Save updated meeting code
  const handleSaveMeetingCode = () => {
    if (!newMeetingCode.trim()) return;
    updateAdminSettings({ parentMeetingCode: newMeetingCode.trim() });
    setIsEditingMeetingCode(false);
  };

  // Copy meeting code
  const handleCopyCode = () => {
    const code = adminSettings?.parentMeetingCode || '640615';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy signing link
  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?meetingCode=${
      adminSettings?.parentMeetingCode || '640615'
    }`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Single commitment print
  const handlePrintSingle = (commitment: ParentCommitment) => {
    setViewingCommitment(commitment);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-6 font-['Rubik'] text-right">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-2xl shadow-inner border border-white/20">
              <FileSignature className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black">
                  ספריית התחייבויות הורים חתומות ✍️
                </h2>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold">
                  {commitments.length} מסמכים חתומים במאגר
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100 mt-1">
                צפייה בכל קובצי החתימות הדיגיטליות של ההורים, סינון לפי כיתה והדפסה רשמית עם חתימת ההורה.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBatchPrintOpen(true)}
              disabled={filteredCommitments.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>הדפסה מרוכזת של המסמכים ({filteredCommitments.length})</span>
            </button>

            {commitments.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('האם את/ה בטוח/ה שברצונך לאפס ולמחוק את כל כתבי ההתחייבות ממאגר הנתונים?')) {
                    clearAllCommitments();
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                title="מחיקת כל ההתחייבויות"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* COLLECTIVE MEETING CODE BANNER */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">קוד כניסה קולקטיבי למפגש הורים:</span>
              {isEditingMeetingCode ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newMeetingCode}
                    onChange={(e) => setNewMeetingCode(e.target.value)}
                    className="px-2 py-0.5 border-2 border-cyan-500 rounded-lg text-sm font-mono font-bold w-24 text-center"
                  />
                  <button
                    onClick={handleSaveMeetingCode}
                    className="p-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
                    title="שמור קוד"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingMeetingCode(false)}
                    className="p-1 rounded-lg bg-slate-200 text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-900 font-mono font-black text-sm rounded-lg border border-cyan-200">
                  {adminSettings?.parentMeetingCode || '640615'}
                </span>
              )}

              {!isEditingMeetingCode && (
                <button
                  onClick={() => setIsEditingMeetingCode(true)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                  title="ערוך קוד מפגש"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              הורים מקלידים קוד זה בפורטל ההורים לקבלת גישה מיידית לחתימה על כתב ההתחייבות.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'הקוד הועתק!' : 'העתק קוד'}</span>
          </button>

          <a
            href={`${import.meta.env.BASE_URL}assets/amat_commitment_form.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>קובץ מקור PDF</span>
          </a>
        </div>
      </section>

      {/* METRICS & FILTERS */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Signed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">סך הכל חתמו</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalSigned}</span>
            <span className="text-xs text-slate-500">מתוך {totalStudents} תלמידים</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${signedPercentage}%` }}
            />
          </div>
        </div>

        {/* Filter by class */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            סינון לפי כיתה:
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="all">כל הכיתות ({students.length} תלמידים)</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                כיתה {cls} ({students.filter((s) => s.className === cls).length} תלמידים)
              </option>
            ))}
          </select>
        </div>

        {/* Filter status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            סטטוס חתימה:
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-center">
            <button
              onClick={() => setFilterStatus('all')}
              className={`py-1 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilterStatus('signed')}
              className={`py-1 rounded-lg transition-all ${
                filterStatus === 'signed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
              }`}
            >
              חתמו ({commitments.length})
            </button>
            <button
              onClick={() => setFilterStatus('unsigned')}
              className={`py-1 rounded-lg transition-all ${
                filterStatus === 'unsigned' ? 'bg-amber-600 text-white shadow' : 'text-slate-600'
              }`}
            >
              טרם ({unsignedStudents.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">חיפוש חופשי:</label>
          <div className="relative">
            <input
              type="text"
              placeholder="שם תלמיד / שם הורה / ת.ז"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </section>

      {/* SIGNED COMMITMENTS GALLERY - "מופיעים כל קבצי החתימות של ההורים ממש אחד ליד השני" */}
      {filterStatus !== 'unsigned' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-amber-600" />
              <span>כרטיסיות התחייבות חתומות ({filteredCommitments.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              מוצגות כרטיסיות עם חתימה דיגיטלית מקורית
            </span>
          </div>

          {filteredCommitments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 space-y-2">
              <FileSignature className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-700">לא נמצאו התחייבויות חתומות תואמות</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                הורים יכולים לחתום בפורטל ההורים באמצעות קוד המפגש הקולקטיבי או הקוד האישי של התלמיד.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCommitments.map((commitment) => (
                <div
                  key={commitment.id}
                  className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-amber-400 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top status & class badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200">
                        כיתה {commitment.className}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        נחתם
                      </span>
                    </div>

                    {/* Student Name */}
                    <div className="mt-2.5">
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                        {commitment.studentName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        מחנכ/ת: {commitment.homeroomTeacher || 'צוות עמ"ט'}
                      </p>
                    </div>

                    {/* Parent details */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">הורה:</span>
                        <strong className="text-slate-900 font-bold">{commitment.parentName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">ת.ז:</span>
                        <span className="font-mono text-slate-800">{commitment.parentIdNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">טלפון:</span>
                        <span className="font-mono text-slate-800">{commitment.parentPhone}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                        <span>תאריך:</span>
                        <span>{new Date(commitment.timestamp).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>

                    {/* HANDWRITTEN DIGITAL SIGNATURE IMAGE DISPLAY */}
                    <div className="mt-3">
                      <span className="text-[10px] text-slate-400 block mb-1">
                        חתימה דיגיטלית של ההורה:
                      </span>
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2 flex items-center justify-center h-20 shadow-inner group-hover:bg-amber-50/30 transition-colors">
                        <img
                          src={commitment.signatureDataUrl}
                          alt={`חתימת ${commitment.parentName}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => setViewingCommitment(commitment)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="צפייה במסמך המלא"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>צפייה</span>
                    </button>

                    <button
                      onClick={() => handlePrintSingle(commitment)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                      title="הדפס מסמך חתום"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>הדפס</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`האם למחוק את כתב ההתחייבות של התלמיד/ה ${commitment.studentName}?`)) {
                          deleteCommitment(commitment.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="מחק התחייבות זו"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* UNSIGNED STUDENTS SECTION */}
      {filterStatus !== 'signed' && (
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>תלמידים שטרם חתמו על כתב התחייבות ({unsignedStudents.length})</span>
            </h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-bold">
              דרוש מעקב מחנכות
            </span>
          </div>

          {unsignedStudents.length === 0 ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800 font-bold text-sm">
              🎉 כל הכבוד! כל התלמידים בכיתות הנבחרות חתמו על כתב ההתחייבות.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-3">שם התלמיד/ה</th>
                      <th className="p-3">כיתה</th>
                      <th className="p-3">מחנכת הכיתה</th>
                      <th className="p-3">קוד סודי אישי</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unsignedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{student.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                            {student.className}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{student.homeroomTeacher}</td>
                        <td className="p-3 font-mono font-bold text-cyan-800">
                          {student.parentCode || 'לא הוגדר'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              const text = `שלום להורי התלמיד/ה ${student.name} (כיתה ${student.className}), אנא היכנסו לקישור הבא לחתימה דיגיטלית על כתב התחייבות עמ"ט: ${window.location.origin}${window.location.pathname} (קוד כניסה: ${student.parentCode || adminSettings?.parentMeetingCode || '640615'})`;
                              navigator.clipboard.writeText(text);
                              alert(`הודעת וואטסאפ הועתקה ללוח עבור ${student.name}!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>העתק תזכורת להורה</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* FULL LEGAL ARABIC DOCUMENT VIEW / PRINT MODAL (Matching User's Uploaded PDF) */}
      {viewingCommitment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal actions bar (hidden in print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  استمارة التعهّد الموقّعة - {viewingCommitment.studentName} ({viewingCommitment.className})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${import.meta.env.BASE_URL}assets/amat_commitment_form.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>קובץ PDF מקור</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>הדפסה / שמירה כ-PDF</span>
                </button>

                <button
                  onClick={() => setViewingCommitment(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Printable Legal Document Layout (Arabic verbatim from PDF) */}
            <div className="p-6 sm:p-10 space-y-6 text-slate-900 overflow-y-auto print:overflow-visible print:p-0 text-right font-['Rubik']">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  استمارة تعهّد والتزام الطالب ووليّ الأمر
                </h2>
                <div className="text-sm font-bold text-cyan-900 mt-1">
                  برنامج الاحتياط العلمي التكنولوجي (עמ״ט)
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {SCHOOL_INFO.nameArabic} • {SCHOOL_INFO.name} (رمز المؤسسة: {SCHOOL_INFO.institutionSymbol})
                </div>
              </div>

              {/* Header Info Table (Matching Page 1 of PDF) */}
              <div className="border-2 border-slate-900 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-900 border-b border-slate-900 bg-slate-50 p-2.5">
                  <div>
                    <span className="text-slate-500 font-bold block">اسم المدرسة:</span>
                    <strong className="text-slate-900">{SCHOOL_INFO.nameArabic}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">الصف:</span>
                    <strong className="text-slate-900">الصف {viewingCommitment.className}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-900 p-2.5">
                  <div>
                    <span className="text-slate-500 font-bold block">اسم الطالب/ة:</span>
                    <strong className="text-base font-black text-slate-950">{viewingCommitment.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">اسم وليّ الأمر:</span>
                    <strong className="text-base font-black text-slate-950">
                      {viewingCommitment.parentName}
                      <span className="text-xs font-normal text-slate-600 mr-2">
                        (هوية: {viewingCommitment.parentIdNumber} | هاتف: {viewingCommitment.parentPhone})
                      </span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed">
                <h4 className="font-black text-sm text-slate-950 border-r-4 border-cyan-700 pr-2">
                  أولاً: مقدمة وأهمية البرنامج
                </h4>
                <p>
                  إن برنامج الاحتياط العلمي التكنولوجي هو مسار تعليمي متميّز يهدف إلى تطوير قدرات الطلاب في مجالات العلوم والتكنولوجيا، وتعزيز مهارات التفكير والتحليل والإبداع، وإعدادهم لتحقيق التميّز والنجاح في المراحل التعليمية المستقبلية.
                </p>
                <p>
                  إن الطلاب الذين تم اختيارهم للمشاركة في هذا البرنامج هم من الطلاب المتميزين في طبقتهم، وقد تم اختيارهم بناءً على قدراتهم وإمكاناتهم التعليمية. لذلك، فإن المشاركة في البرنامج تُعدّ مسؤولية وامتيازاً في الوقت نفسه، وتتطلب المحافظة على مستوى التميّز والاستمرار في المسار حتى نهايته.
                </p>
                <p className="font-bold text-slate-900">
                  نؤكد أن البرنامج ليس مجرد ساعات تعليمية إضافية، بل هو مسار يتطلب جدية، ومثابرة، وانضباطاً، والتزاماً من الطالب ووليّ أمره.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed pt-2 border-t border-slate-200">
                <h4 className="font-black text-sm text-slate-950 border-r-4 border-cyan-700 pr-2">
                  ثانياً: الالتزامات التعليمية ومتطلبات البرنامج
                </h4>
                <p className="font-bold">نقرّ بأننا اطّلعنا على متطلبات البرنامج، ونوافق على الالتزام بما يلي:</p>
                <ul className="space-y-1 list-disc pr-4">
                  <li><strong>1. الاستمرارية في البرنامج:</strong> نلتزم بالاستمرار في البرنامج وعدم الانسحاب منه بمبادرة فردية من الطالب أو وليّ أمره، بعد اتخاذ قرار الانضمام والموافقة على شروط المشاركة. فالهدف هو مواصلة المسار التعليمي حتى نهايته وتحقيق أهدافه.</li>
                  <li><strong>2. الخروج من بعض الحصص الأساسية:</strong> نعلم أن الطالب قد يُطلب منه الخروج من بعض حصص المواد الأساسية من حين إلى آخر، وفقاً لاحتياجات البرنامج وتنظيم المدرسة، للمشاركة في الدروس والأنشطة التعليمية الخاصة بالبرنامج، مع الالتزام بمتابعة المواد التي فاتته.</li>
                  <li><strong>3. ساعات تعليم إضافية:</strong> نوافق على التزام الطالب بالبقاء في المدرسة حتى الحصة السابعة أو الثامنة عند الحاجة، حتى في الأيام التي ينتهي فيها الدوام المدرسي لبقية طلاب المدرسة.</li>
                  <li><strong>4. امتحانات إضافية:</strong> نقرّ وندرك أن الطالب سيُطلب منه التقدّم لامتحانات واختبارات إضافية خاصة بالبرنامج، إلى جانب الامتحانات الاعتيادية في المواد الدراسية المختلفة، وذلك بهدف تقييم مستوى تقدّمه ومدى اكتسابه للمهارات والمعارف المطلوبة.</li>
                  <li><strong>5. واجبات ومهام تعليمية إضافية:</strong> يلتزم الطالب بتنفيذ المهام والتكليفات التعليمية التي تُعطى له ضمن البرنامج، بما في ذلك: حل واجبات منزلية إضافية، إعداد مهام ومشاريع تعليمية، تحضير موضوعات ومواد دراسية مسبقاً، تقديم أعمال وتقارير فردية أو جماعية، والالتزام بمواعيد تسليم جميع المهام والأعمال المطلوبة.</li>
                  <li><strong>6. الالتزام بالحضور:</strong> نلتزم بالمواظبة على حضور جميع الدروس واللقاءات والأنشطة المرتبطة بالبرنامج، وعدم التغيب عنها دون مبرر.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed pt-2 border-t border-slate-200">
                <h4 className="font-black text-sm text-slate-950 border-r-4 border-cyan-700 pr-2">
                  ثالثاً: السلوك والانضباط – شرط أساسي للاستمرار في البرنامج
                </h4>
                <p>
                  نؤكد أن السلوك والانضباط هما من أهم شروط المشاركة في البرنامج، بل إنهما أساس النجاح والتميّز. إن اختيار الطالب للبرنامج لا يعتمد فقط على قدراته التحصيلية وتفوقه الدراسي، وإنما أيضاً على سلوكه، ومسؤوليته، واحترامه للأنظمة والقوانين المدرسية.
                </p>
                <ul className="space-y-0.5 list-decimal pr-4">
                  <li>احترام المعلمين وأعضاء الطاقم التربوي والإدارة وجميع العاملين في المدرسة.</li>
                  <li>الالتزام بقوانين المدرسة وأنظمتها وتعليماتها دون استثناء.</li>
                  <li>التحلي بالأخلاق الحميدة والاحترام المتبادل داخل الصف وخارجه.</li>
                  <li>المشاركة الإيجابية والفعّالة في الدروس والأنشطة.</li>
                  <li>تجنّب السلوكيات السلبية والمشاغبة التي تعيق سير العملية التعليمية.</li>
                  <li>إظهار الجدية والمسؤولية والانضباط خلال جميع ساعات الدوام، بما فيها الساعات الإضافية.</li>
                  <li>أن يكون الطالب قدوة حسنة لزملائه وممثلاً مشرّفاً لطلاب البرنامج.</li>
                </ul>
              </div>

              {/* Section 4 & 5 */}
              <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed pt-2 border-t border-slate-200">
                <h4 className="font-black text-sm text-slate-950 border-r-4 border-cyan-700 pr-2">
                  رابعاً: دور وليّ الأمر ومسؤوليته
                </h4>
                <p>
                  أتعهد بصفتي وليّ أمر الطالب بدعم ابني/ابنتي وتشجيعه على الاستمرار والمثابرة، ومتابعة تقدّمه التعليمي والسلوكي بصورة مستمرة، وتوفير البيئة المناسبة للدراسة، والحرص على حضور الساعات الإضافية، والتعاون التام مع المدرسة ومنسّق البرنامج، وعدم تشجيع الطالب على الانسحاب عند مواجهة الصعوبات بل دعمه لتجاوزها.
                </p>

                <h4 className="font-black text-sm text-slate-950 border-r-4 border-rose-700 pr-2 mt-2">
                  خامساً: الاستمرارية وعدم الانسحاب
                </h4>
                <p className="font-bold text-rose-950 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  نحن، الطالب ووليّ أمره، نتعهد بالالتزام بالاستمرار في البرنامج حتى نهاية المسار، وعدم اتخاذ قرار الانسحاب بشكل فردي أو متسرّع.
                </p>
              </div>

              {/* Section 6 & Signatures Box (Matching Page 3 of PDF) */}
              <div className="pt-4 border-t-2 border-slate-900 space-y-4">
                <div className="text-xs">
                  <h4 className="font-black text-sm text-slate-950 mb-1">
                    سادساً: الإقرار والموافقة النهائية
                  </h4>
                  <p className="text-slate-700">
                    نقرّ بأننا قرأنا جميع البنود المذكورة أعلاه، وفهمنا طبيعة البرنامج ومتطلباته التعليمية والسلوكية، ونلتزم ببذل كل جهد ممكن من أجل الاستمرار والنجاح وتحقيق أهداف البرنامج.
                  </p>
                </div>

                {/* Signatures Table matching PDF */}
                <div className="grid grid-cols-2 gap-4 border-2 border-slate-900 rounded-xl p-4 bg-slate-50/50">
                  {/* Left Box: Parent Original Handwritten Signature */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">توقيع وليّ الأمر:</span>
                      <strong className="text-slate-900 text-sm">{viewingCommitment.parentName}</strong>
                    </div>

                    <div className="bg-white border-2 border-slate-400 rounded-xl p-2.5 inline-block shadow-sm">
                      <span className="text-[10px] text-slate-400 block mb-1">التوقيع الرقمي الأصلي المعتمد:</span>
                      <img
                        src={viewingCommitment.signatureDataUrl}
                        alt="توقيع ولي الأمر"
                        className="h-20 max-w-[240px] object-contain"
                      />
                    </div>

                    <div className="text-[11px] text-slate-600">
                      رقم الهوية: <strong className="font-mono text-slate-900">{viewingCommitment.parentIdNumber}</strong>
                      <br />
                      رقم الهاتف: <strong className="font-mono text-slate-900">{viewingCommitment.parentPhone}</strong>
                    </div>
                  </div>

                  {/* Right Box: School & Coordinator Confirmation */}
                  <div className="flex flex-col justify-between text-xs space-y-3">
                    <div>
                      <span className="font-bold text-slate-700 block">توقيع الطالب/ة:</span>
                      <div className="border-b border-slate-400 pt-3 pb-1 text-slate-800 font-medium">
                        {viewingCommitment.studentName}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block">إدارة المدرسة ومنسّق البرنامج:</span>
                      <div className="p-2 border border-dashed border-slate-400 rounded-lg text-center mt-1">
                        <div className="font-bold text-slate-900">{SCHOOL_INFO.nameArabic}</div>
                        <div className="text-[10px] text-slate-500">
                          {SCHOOL_INFO.name} (رمز مؤسسة: {SCHOOL_INFO.institutionSymbol})
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold mt-1">
                          ✓ معتمد وموثق في السجل السحابي
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-300 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">التاريخ:</span>
                      <strong className="font-mono text-slate-900">
                        {viewingCommitment.date || new Date(viewingCommitment.timestamp).toISOString().split('T')[0]}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PRINT MODAL */}
      {isBatchPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-right font-['Rubik']">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  طباعة مجمّعة لاستمارات التعهّد ({filteredCommitments.length} استمارة)
                </h3>
                <p className="text-xs text-slate-500">
                  ستُطبع كل استمارة في صفحة منفصلة مع التوقيع الرقمي الأصلي لولي الأمر لتجهيز الملفات الورقية.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكل / حفظ كـ PDF مجمّع</span>
                </button>

                <button
                  onClick={() => setIsBatchPrintOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Document list preview */}
            <div className="space-y-8">
              {filteredCommitments.map((c, index) => (
                <div
                  key={c.id}
                  className="p-6 border-2 border-slate-300 rounded-2xl bg-white space-y-4 print:border-none print:p-0 print:break-after-page text-right"
                  style={{ pageBreakAfter: 'always' }}
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-500">
                      استمارة {index + 1} من {filteredCommitments.length}
                    </span>
                    <span className="text-xs font-bold text-cyan-800">
                      {c.studentName} (الصف {c.className})
                    </span>
                  </div>

                  <div className="text-center">
                    <h4 className="text-base font-black text-slate-900">
                      استمارة تعهّد والتزام الطالب ووليّ الأمر
                    </h4>
                    <div className="text-xs text-slate-600">
                      برنامج الاحتياط العلمي التكنولوجي (עמ״ט) • {SCHOOL_INFO.nameArabic}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>الطالب/ة: <strong>{c.studentName}</strong></div>
                    <div>الصف: <strong>{c.className}</strong></div>
                    <div>وليّ الأمر: <strong>{c.parentName}</strong> (هوية {c.parentIdNumber})</div>
                    <div>هاتف: <strong>{c.parentPhone}</strong></div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-600">
                      تاريخ التوقيع: <strong>{c.date || new Date(c.timestamp).toLocaleDateString('he-IL')}</strong>
                    </div>
                    <div className="p-1 border border-slate-300 rounded bg-white">
                      <img
                        src={c.signatureDataUrl}
                        alt="توقيع"
                        className="h-12 max-w-[160px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
