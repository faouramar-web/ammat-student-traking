import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ParentCommitment } from '../types';
import { SCHOOL_INFO } from '../data/initialData';
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Printer,
  AlertCircle,
  FileText,
  User,
  Phone,
  CreditCard,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  Award,
  Globe,
} from 'lucide-react';

interface ParentCommitmentSignerProps {
  initialStudent?: Student | null;
  onClose?: () => void;
  onSuccess?: (commitment: ParentCommitment) => void;
}

export const ParentCommitmentSigner: React.FC<ParentCommitmentSignerProps> = ({
  initialStudent,
  onClose,
  onSuccess,
}) => {
  const { students, commitments, addCommitment, adminSettings } = useApp();

  // Language state (default Arabic as requested by user's uploaded official PDF, with Hebrew toggle)
  const [docLang, setDocLang] = useState<'ar' | 'he'>('ar');

  // Selected student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudent ? initialStudent.id : ''
  );
  const [classFilter, setClassFilter] = useState<string>('all');

  // Form fields
  const [parentName, setParentName] = useState<string>('');
  const [parentIdNumber, setParentIdNumber] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [studentSignature, setStudentSignature] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(true);

  // Auto today's date
  const todayFormatted = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const todayIso = new Date().toISOString().split('T')[0];

  // Canvas ref for handwritten signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<ParentCommitment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // The active student object
  const activeStudent = students.find((s) => s.id === selectedStudentId);

  // Check if already signed
  const existingCommitment = commitments.find(
    (c) => c.studentId === selectedStudentId
  );

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a'; // dark ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [submitSuccess, selectedStudentId]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
    setErrorMessage('');
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('touches' in e) {
      e.preventDefault();
    }

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit commitment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!activeStudent) {
      setErrorMessage(docLang === 'ar' ? 'الرجاء اختيار اسم الطالب/ة من القائمة' : 'נא לבחור תלמיד/ה מהרשימה');
      return;
    }

    if (!parentName.trim()) {
      setErrorMessage(docLang === 'ar' ? 'الرجاء إدخال اسم وليّ الأمر الكامل' : 'נא להזין שם מלא של ההורה החותם');
      return;
    }

    if (!parentIdNumber.trim() || parentIdNumber.trim().length < 8) {
      setErrorMessage(docLang === 'ar' ? 'الرجاء إدخال رقم هوية ولي الأمر صحيح (8 أو 9 أرقام)' : 'נא להזין מספר תעודת זהות תקין (8 או 9 ספרות)');
      return;
    }

    if (!parentPhone.trim() || parentPhone.trim().length < 9) {
      setErrorMessage(docLang === 'ar' ? 'الرجاء إدخال رقم هاتف للتواصل' : 'נא להזין מספר טלפון נייד ליצירת קשר');
      return;
    }

    if (!agreed) {
      setErrorMessage(docLang === 'ar' ? 'يجب الموافقة على بنود استمارة التعهّد' : 'יש לאשר את סעיפי כתב ההתחייבות');
      return;
    }

    if (!hasSignature || !canvasRef.current) {
      setErrorMessage(docLang === 'ar' ? 'الرجاء التوقيع رقمياً في مربع التوقيع' : 'נא לחתום דיגיטלית בתיבת החתימה');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');

      const commitment: ParentCommitment = {
        id: `com_${activeStudent.id}_${Date.now()}`,
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        className: activeStudent.className,
        homeroomTeacher: activeStudent.homeroomTeacher || '',
        parentName: parentName.trim(),
        parentIdNumber: parentIdNumber.trim(),
        parentPhone: parentPhone.trim(),
        date: todayIso,
        timestamp: new Date().toISOString(),
        signatureDataUrl,
        academicYear: SCHOOL_INFO.academicYear,
        documentTitle: 'استمارة تعهّد والتزام الطالب ووليّ الأمر - برنامج الاحتياط العلمي التكنولوجي (עמ״ט)',
        agreedToTerms: true,
        notes: notes.trim() || (studentSignature.trim() ? `اسم الطالب الموقع: ${studentSignature.trim()}` : undefined),
      };

      const success = await addCommitment(commitment);
      if (success) {
        setSubmitSuccess(commitment);
        if (onSuccess) onSuccess(commitment);
      } else {
        setErrorMessage('حدث خطأ أثناء حفظ استمارة التعهّد. الرجاء المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Error saving parent commitment:', err);
      setErrorMessage('حدث خطأ أثناء حفظ التعهّد في النظام');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    return classFilter === 'all' || s.className === classFilter;
  });

  const availableClasses = Array.from(new Set(students.map((s) => s.className))).sort();

  // SUCCESS SCREEN
  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 font-['Rubik'] text-right animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-400 p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            تم استلام وتوثيق استمارة التعهّد بنجاح في قاعدة بيانات المدرسة
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            شكراً جزيلاً! تم توقيع وحفظ استمارة التعهّد والالتزام
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-lg mx-auto">
            تم تسجيل توقيع وليّ الأمر <strong>{submitSuccess.parentName}</strong> للطالب/ة{' '}
            <strong>{submitSuccess.studentName}</strong> (الصف {submitSuccess.className}) في السجل
            الرسمي لـ {SCHOOL_INFO.nameArabic}.
          </p>

          {/* Mini receipt summary */}
          <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-right max-w-md mx-auto space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">اسم الطالب/ة:</span>
              <span className="font-bold text-slate-900">{submitSuccess.studentName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">الصف والمربي/ة:</span>
              <span className="font-bold text-slate-900">
                {submitSuccess.className} ({submitSuccess.homeroomTeacher || 'مربي الصف'})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">وليّ الأمر الموقع:</span>
              <span className="font-bold text-slate-900">
                {submitSuccess.parentName} (هوية {submitSuccess.parentIdNumber})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">تاريخ التوقيع:</span>
              <span className="font-bold text-slate-900">{todayFormatted}</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-500 block mb-1">التوقيع الرقمي الأصلي المحفوظ:</span>
              <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block shadow-sm">
                <img
                  src={submitSuccess.signatureDataUrl}
                  alt="توقيع ولي الأمر"
                  className="h-14 max-w-[200px] object-contain mx-auto"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة نسخة / حفظ كـ PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow flex items-center gap-2 transition-all cursor-pointer"
              >
                العودة لبوابة أولياء الأمور
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 font-['Rubik'] text-right">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* TOP BANNER / LETTERHEAD */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 ring-4 ring-white/10">
              <FileSignature className="w-8 h-8" />
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold border border-cyan-400/30">
                  {SCHOOL_INFO.nameArabic}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold border border-amber-400/30">
                  رمز المدرسة: {SCHOOL_INFO.institutionSymbol}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
                  السنة الدراسية {SCHOOL_INFO.academicYear}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                استمارة تعهّد والتزام الطالب ووليّ الأمر
              </h1>
              <p className="text-xs sm:text-sm text-cyan-100/90 mt-1 font-medium">
                برنامج الاحتياط العلمي التكنولوجي (עמ״ט STEM) • {SCHOOL_INFO.nameArabic}
              </p>
            </div>

            {/* Language toggle */}
            <div className="self-center sm:self-start flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold border border-white/10">
              <button
                type="button"
                onClick={() => setDocLang('ar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'ar' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setDocLang('he')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'he' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                עברית
              </button>
            </div>
          </div>
        </div>

        {/* ALREADY SIGNED BANNER */}
        {existingCommitment && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  تم توقيع استمارة التعهّد لهذا الطالب سابقاً!
                </p>
                <p className="text-xs text-emerald-700">
                  تم التوقيع بواسطة {existingCommitment.parentName} بتاريخ{' '}
                  {new Date(existingCommitment.timestamp).toLocaleDateString('he-IL')}. تعبئة الاستمارة مجدداً ستُحدّث التوقيع.
                </p>
              </div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-emerald-300">
              <img
                src={existingCommitment.signatureDataUrl}
                alt="التوقيع الحالي"
                className="h-8 max-w-[100px] object-contain"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* STEP 1: STUDENT SELECTION */}
          <section className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                1
              </span>
              بيانات الطالب/ة في برنامج عتودة (עמ״ט)
            </h2>

            {initialStudent ? (
              <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {initialStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{initialStudent.name}</h3>
                    <p className="text-xs text-slate-600">
                      الصف: <span className="font-bold text-cyan-800">{initialStudent.className}</span> • مربي/ة الصف: {initialStudent.homeroomTeacher || 'طاقم عتودة'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200">
                  مسار عتودة מדעית טכנולוגית (עמ"ט)
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تصفية حسب الصف:
                    </label>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                      <option value="all">جميع صفوف عتودة ({students.length} طالب/ة)</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          الصف {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اختيار اسم الطالب/ة من القائمة: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border-2 border-cyan-500 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
                    >
                      <option value="">-- اختر اسم الطالب/ة --</option>
                      {filteredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (الصف {s.className})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeStudent && (
                  <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex items-center justify-between">
                    <span>
                      الطالب/ة: <strong>{activeStudent.name}</strong> • الصف: <strong>{activeStudent.className}</strong>
                    </span>
                    <span>المربي/ة: {activeStudent.homeroomTeacher || 'طاقم عتودة'}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STEP 2: OFFICIAL TEXT (THE 6 SECTIONS VERBATIM FROM USER'S PDF) */}
          <section className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                  2
                </span>
                نص وثيقة التعهّد والالتزام الكاملة (كما في استمارة المدرسة الرسمية)
              </h2>

              <div className="flex items-center">
                <a
                  href={`${import.meta.env.BASE_URL}assets/amat_commitment_form.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                  title={docLang === 'ar' ? 'فتح وثيقة الـ PDF الأصلية في نافذة منفصلة' : 'פתיחת קובץ ה-PDF המקורי בחלון נפרד'}
                >
                  <FileText className="w-4 h-4 text-cyan-100" />
                  <span>
                    {docLang === 'ar'
                      ? 'عرض ملف الـ PDF الأصلي (3 صفحات) - نافذة منفصلة'
                      : 'פתיחת קובץ ה-PDF המקורי (3 עמודים) בחלון נפרד'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
                </a>
              </div>
            </div>

            {/* VERBATIM TEXT ACCORDING TO UPLOADED PDF */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 max-h-[460px] overflow-y-auto shadow-inner">
              {docLang === 'ar' ? (
                <>
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      استمارة تعهّد والتزام الطالب ووليّ الأمر
                    </h3>
                    <p className="text-xs font-bold text-cyan-800">
                      برنامج الاحتياط العلمي التكنولوجي (עמ״ט)
                    </p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      اسم المدرسة: {SCHOOL_INFO.nameArabic} | رمز المؤسسة: {SCHOOL_INFO.institutionSymbol}
                    </div>
                  </div>

                  {/* Section 1 */}
                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-cyan-950">
                      أولاً: مقدمة وأهمية البرنامج
                    </h4>
                    <p className="text-slate-700">
                      إن برنامج الاحتياط العلمي التكنولوجي هو مسار تعليمي متميّز يهدف إلى تطوير قدرات الطلاب في مجالات العلوم والتكنولوجيا، وتعزيز مهارات التفكير والتحليل والإبداع، وإعدادهم لتحقيق التميّز والنجاح في المراحل التعليمية المستقبلية.
                    </p>
                    <p className="text-slate-700 mt-1.5">
                      إن الطلاب الذين تم اختيارهم للمشاركة في هذا البرنامج هم من الطلاب المتميزين في طبقتهم، وقد تم اختيارهم بناءً على قدراتهم وإمكاناتهم التعليمية. لذلك، فإن المشاركة في البرنامج تُعدّ مسؤولية وامتيازًا في الوقت نفسه، وتتطلب المحافظة على مستوى التميّز والاستمرار في المسار حتى نهايته.
                    </p>
                    <p className="text-slate-900 font-bold mt-1.5">
                      نؤكد أن البرنامج ليس مجرد ساعات تعليمية إضافية، بل هو مسار يتطلب جدية، ومثابرة، وانضباطًا، والتزامًا من الطالب ووليّ أمره.
                    </p>
                  </div>

                  {/* Section 2 */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-cyan-950">
                      ثانياً: الالتزامات التعليمية ومتطلبات البرنامج
                    </h4>
                    <p className="font-bold text-slate-800 mb-1">
                      نقرّ بأننا اطّلعنا على متطلبات البرنامج، ونوافق على الالتزام بما يلي:
                    </p>
                    <ul className="space-y-1.5 list-disc pr-5 text-slate-700">
                      <li>
                        <strong>1. الاستمرارية في البرنامج:</strong> نلتزم بالاستمرار في البرنامج وعدم الانسحاب منه بمبادرة فردية من الطالب أو وليّ أمره، بعد اتخاذ قرار الانضمام والموافقة على شروط المشاركة. فالهدف هو مواصلة المسار التعليمي حتى نهايته وتحقيق أهدافه.
                      </li>
                      <li>
                        <strong>2. الخروج من بعض الحصص الأساسية:</strong> نعلم أن الطالب قد يُطلب منه الخروج من بعض حصص المواد الأساسية من حين إلى آخر، وفقًا لاحتياجات البرنامج وتنظيم المدرسة، للمشاركة في الدروس والأنشطة التعليمية الخاصة بالبرنامج، مع الالتزام بمتابعة المواد التي فاتته.
                      </li>
                      <li>
                        <strong>3. ساعات تعليم إضافية:</strong> نوافق على التزام الطالب بالبقاء في المدرسة حتى الحصة السابعة أو الثامنة عند الحاجة، حتى في الأيام التي ينتهي فيها الدوام المدرسي لبقية طلاب المدرسة.
                      </li>
                      <li>
                        <strong>4. امتحانات إضافية:</strong> نقرّ وندرك أن الطالب سيُطلب منه التقدّم لامتحانات واختبارات إضافية خاصة بالبرنامج، إلى جانب الامتحانات الاعتيادية في المواد الدراسية المختلفة، وذلك بهدف تقييم مستوى تقدّمه ومدى اكتسابه للمهارات والمعارف المطلوبة.
                      </li>
                      <li>
                        <strong>5. واجبات ومهام تعليمية إضافية:</strong> يلتزم الطالب بتنفيذ المهام والتكليفات التعليمية التي تُعطى له ضمن البرنامج، بما في ذلك: حل واجبات منزلية إضافية، إعداد مهام ومشاريع تعليمية، تحضير موضوعات ومواد دراسية مسبقاً، تقديم أعمال وتقارير فردية أو جماعية، والالتزام بمواعيد تسليم جميع المهام والأعمال المطلوبة.
                      </li>
                      <li>
                        <strong>6. الالتزام بالحضور:</strong> نلتزم بالمواظبة على حضور جميع الدروس واللقاءات والأنشطة المرتبطة بالبرنامج، وعدم التغيب عنها دون مبرر.
                      </li>
                    </ul>
                  </div>

                  {/* Section 3 */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-cyan-950">
                      ثالثاً: السلوك والانضباط – شرط أساسي للاستمرار في البرنامج
                    </h4>
                    <p className="text-slate-700">
                      نؤكد أن السلوك والانضباط هما من أهم شروط المشاركة في البرنامج، بل إنهما أساس النجاح والتميّز. إن اختيار الطالب للبرنامج لا يعتمد فقط على قدراته التحصيلية وتفوقه الدراسي، وإنما أيضاً على سلوكه، ومسؤوليته، واحترامه للأنظمة والقوانين المدرسية.
                    </p>
                    <ul className="space-y-1 list-decimal pr-5 text-slate-700 mt-1.5">
                      <li>احترام المعلمين وأعضاء الطاقم التربوي والإدارة وجميع العاملين في المدرسة.</li>
                      <li>الالتزام بقوانين المدرسة وأنظمتها وتعليماتها دون استثناء.</li>
                      <li>التحلي بالأخلاق الحميدة والاحترام المتبادل داخل الصف وخارجه.</li>
                      <li>المشاركة الإيجابية والفعّالة في الدروس والأنشطة.</li>
                      <li>تجنّب السلوكيات السلبية والمشاغبة التي تعيق سير العملية التعليمية.</li>
                      <li>إظهار الجدية والمسؤولية والانضباط خلال جميع ساعات الدوام، بما فيها الساعات الإضافية.</li>
                      <li>أن يكون الطالب قدوة حسنة لزملائه وممثلاً مشرّفاً لطلاب البرنامج.</li>
                    </ul>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 mt-2 text-amber-900 font-bold text-xs">
                      نؤكد أن التفوق الدراسي وحده لا يكفي للمشاركة في هذا المسار؛ فالطالب المتميز يجب أن يكون متميزاً في تحصيله، وسلوكه، وانضباطه، وتحمله للمسؤولية.
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-cyan-950">
                      رابعاً: دور وليّ الأمر ومسؤوليته
                    </h4>
                    <p className="font-bold text-slate-800">أتعهد بصفتي وليّ أمر الطالب بما يلي:</p>
                    <ul className="space-y-1 list-decimal pr-5 text-slate-700 mt-1">
                      <li>دعم ابني/ابنتي وتشجيعه على الاستمرار والمثابرة.</li>
                      <li>متابعة تقدّمه التعليمي والسلوكي بصورة مستمرة.</li>
                      <li>توفير البيئة المناسبة للدراسة وإنجاز الواجبات والمهام.</li>
                      <li>الحرص على حضور الطالب والتزامه بالساعات التعليمية الإضافية.</li>
                      <li>التعاون مع المدرسة ومنسّق البرنامج في كل ما يتعلق بتقدم الطالب.</li>
                      <li>تعزيز قيم الاحترام والانضباط والمسؤولية لدى ابني/ابنتي.</li>
                      <li>عدم تشجيع الطالب على الانسحاب عند مواجهة الصعوبات، بل دعمه ومساعدته على تجاوزها.</li>
                    </ul>
                  </div>

                  {/* Section 5 */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-rose-900">
                      خامساً: الاستمرارية وعدم الانسحاب
                    </h4>
                    <p className="text-slate-700">
                      نودّ التأكيد على أن المدرسة شهدت في سنوات سابقة حالات بدأ فيها طلاب البرنامج رحلتهم في الصف السابع، ثم قرر بعضهم الانسحاب عند الوصول إلى الصف الثامن، بمبادرتهم وبموافقة أولياء أمورهم. إن هذه الظاهرة تؤثر على استمرارية المسار وعلى تحقيق الأهداف التي وُضع البرنامج من أجلها.
                    </p>
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 mt-1.5 text-rose-950 font-bold text-xs">
                      لذلك، نؤكد أن الانضمام إلى البرنامج هو قرار جدي ومدروس، وليس تجربة مؤقتة. نحن، الطالب ووليّ أمره، نتعهد بالالتزام بالاستمرار في البرنامج حتى نهاية المسار، وعدم اتخاذ قرار الانسحاب بشكل فردي أو متسرّع.
                    </div>
                  </div>

                  {/* Section 6 */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-sm mb-1.5 text-cyan-950">
                      سادساً: الإقرار والموافقة النهائية
                    </h4>
                    <p className="text-slate-700">
                      نقرّ بأننا قرأنا جميع البنود المذكورة أعلاه، وفهمنا طبيعة البرنامج ومتطلباته التعليمية والسلوكية، وندرك أن المشاركة فيه تتطلب جهداً إضافياً، ووقتاً، وانضباطاً، والتزاماً مستمراً من الطالب والأسرة.
                    </p>
                    <p className="text-slate-900 font-bold mt-1">
                      نؤكد أن اختيار ابننا/ابنتنا لهذا البرنامج هو فرصة مهمة ومسؤولية نعتز بها، ونلتزم ببذل كل جهد ممكن من أجل الاستمرار والنجاح وتحقيق أهداف البرنامج.
                    </p>
                  </div>
                </>
              ) : (
                /* Hebrew Version */
                <>
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      כתב התחייבות והסכמת הורים ותלמיד - תכנית עמ"ט
                    </h3>
                    <p className="text-xs font-bold text-cyan-800">
                      עתודה מדעית טכנולוגית (STEM) • {SCHOOL_INFO.name}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-1">
                      1. התמדה ואי-עזיבה באמצע שנת הלימודים:
                    </h4>
                    <p className="text-slate-700">
                      אנו מתחייבים כי התלמיד/ה ישלים/תשלים את שנת הלימודים המלאה במסלול עמ"ט ולא יפרוש/תפרוש מיוזמתו/ה, למעט במקרים חריגים באישור מנהל בית הספר.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-1">
                      2. מצוינות לימודית ושעות תגבור:
                    </h4>
                    <p className="text-slate-700">
                      התחייבות להכנת כל שיעורי הבית והמטלות, השתתפות במבחנים, עמידה ברף הציונים הגבוה, והתייצבות לכל שעות התגבור מעבר לשעות הלימוד הרגילות.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-sm mb-1">
                      3. משמעת ודרך ארץ:
                    </h4>
                    <p className="text-slate-700">
                      התנהגות מופתית ההולמת תלמידי מצוינות המייצגים את חטיבת הביניים ב' אבו סנאן.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* STEP 3: PARENT & SIGNATURE DETAILS FORM */}
          <section className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                3
              </span>
              بيانات وليّ الأمر الموقّع على التعهّد
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-600" />
                  اسم وليّ الأمر الكامل: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="مثال: سمير خوري / خليل نجار"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                  رقم هوية وليّ الأمر: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={parentIdNumber}
                  onChange={(e) => setParentIdNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9 أرقام"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-600" />
                  رقم الهاتف للتواصل: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="050-XXXXXXX"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  تاريخ التوقيع (تلقائي):
                </label>
                <input
                  type="text"
                  readOnly
                  value={todayFormatted}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الطالب/ة الموقّع أو ملاحظات (اختياري):
                </label>
                <input
                  type="text"
                  value={studentSignature}
                  onChange={(e) => setStudentSignature(e.target.value)}
                  placeholder="اسم الطالب/ة كتوقيع إضافي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border-2 border-slate-200 hover:border-cyan-400 cursor-pointer transition-colors shadow-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="w-5 h-5 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 shrink-0"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  نقرّ بأننا قرأنا جميع بنود استمارة التعهّد والالتزام الستة المذكورة أعلاه، ونوافق على الالتزام بها كاملاً باسمنا وباسم ابننا/ابنتنا طيلة السنة الدراسية {SCHOOL_INFO.academicYear}.
                </span>
              </label>
            </div>
          </section>

          {/* STEP 4: INTERACTIVE DIGITAL SIGNATURE PAD */}
          <section className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                  4
                </span>
                توقيع وليّ الأمر الرقمي (بالإصبع على شاشة اللمس أو بالماوس) <span className="text-rose-500">*</span>
              </h2>

              <button
                type="button"
                onClick={clearSignature}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                مسح التوقيع وإعادة المحاولة
              </button>
            </div>

            <div className="relative border-2 border-dashed border-cyan-500 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="w-full h-44 cursor-crosshair block"
              />

              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm">
                  <FileSignature className="w-8 h-8 text-cyan-400 mb-1 animate-pulse" />
                  <span className="font-bold text-slate-600">الرجاء التوقيع هنا بالإصبع أو بالماوس</span>
                  <span className="text-[11px] text-slate-400">توقيع وليّ الأمر الملزم قانونياً</span>
                </div>
              )}

              <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-white/95 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                {hasSignature ? '✓ تم تسجيل التوقيع' : 'في انتظار التوقيع'}
              </div>
            </div>
          </section>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-center gap-2 font-bold animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUBMISSION BUTTON */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              * سيتم حفظ استمارة التعهّد وتوقيعك في السجل السحابي للمدرسة وإرسالها مباشرة لمدير المוסد للطباعة والحفظ.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-cyan-600 text-white font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ الحفظ في قاعدة بيانات المدرسة...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  <span>حفظ وإرسال استمارة التعهّد الموقّعة ✍️</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
