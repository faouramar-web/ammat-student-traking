import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KeyRound,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    loginWithCode,
    session,
    logout,
    setCurrentRole,
    isLoginModalOpen,
    setIsLoginModalOpen,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isLoginModalOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    setIsLoginModalOpen(false);
  };

  const [code, setCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false); // masked by default for strict security
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim()) {
      setErrorMsg('נא להזין קוד סודי במקלדת שעל המסך או במקלדת הרגילה');
      return;
    }

    const result = loginWithCode(code);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        handleClose();
        setCode('');
        setSuccessMsg('');
      }, 700);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    setCode((prev) => (prev.length < 10 ? prev + val : prev));
  };

  const handleKeypadBackspace = () => {
    setErrorMsg('');
    setCode((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setErrorMsg('');
    setCode('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-right relative overflow-hidden my-auto border border-slate-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="סגור חלון"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-50 text-cyan-800 text-[11px] font-bold border border-cyan-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            כניסה מאובטחת לצוות עמ"ט
          </span>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Rubik']">
            הקשת קוד סודי
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
            הקישו את הקוד האישי שלכם במקלדת המסך או במקלדת המחשב
          </p>
        </div>

        {/* Current Session Indicator */}
        {session && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="text-slate-600">מחובר: </span>
              <strong className="text-blue-900 font-bold">{session.name}</strong>
              <span className="text-blue-700 mr-1 text-[11px]">
                ({session.role === 'admin' ? '👑 מנהל' : session.role === 'teacher' ? '👨‍🏫 מורה' : '👩‍🏫 מחנכת'})
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap"
            >
              יציאה מחשבון
            </button>
          </div>
        )}

        {/* Code Input Display */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center text-3xl font-mono font-black tracking-widest bg-slate-50 border-2 border-slate-300 focus:border-cyan-500 rounded-2xl py-2.5 px-10 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all shadow-inner placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 transition-colors"
              title={showPassword ? 'הסתר ספרות' : 'הצג ספרות'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-shake">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* On-Screen Touch Numeric Keypad */}
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
            <span>מקלדת מקשים על המסך:</span>
            <span className="text-[10px] text-slate-400">0-9</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(String(digit))}
                className="h-12 rounded-xl bg-white hover:bg-cyan-500 hover:text-white active:bg-cyan-600 text-slate-800 text-xl font-bold font-mono transition-all shadow-sm flex items-center justify-center border border-slate-200 hover:border-cyan-500 transform active:scale-95 cursor-pointer"
              >
                {digit}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleKeypadClear}
              className="h-12 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white active:bg-rose-600 text-rose-700 text-xs font-bold transition-all shadow-sm flex items-center justify-center border border-rose-200 transform active:scale-95 cursor-pointer"
              title="נקה הכל"
            >
              נקה ✕
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-xl bg-white hover:bg-cyan-500 hover:text-white active:bg-cyan-600 text-slate-800 text-xl font-bold font-mono transition-all shadow-sm flex items-center justify-center border border-slate-200 hover:border-cyan-500 transform active:scale-95 cursor-pointer"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="h-12 rounded-xl bg-amber-50 hover:bg-amber-500 hover:text-white active:bg-amber-600 text-amber-800 text-xs font-bold transition-all shadow-sm flex items-center justify-center border border-amber-200 transform active:scale-95 cursor-pointer"
              title="מחק ספרה אחרונה"
            >
              מחק ⌫
            </button>
          </div>

          {/* Enter / Submit Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:from-blue-700 active:to-cyan-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span>אימות קוד וכניסה למערכת</span>
          </button>
        </div>

        {/* Parent Portal Direct Link */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => {
              handleClose();
              setCurrentRole('parent');
            }}
            className="text-[11px] text-cyan-600 hover:text-cyan-800 font-bold hover:underline"
          >
            מעבר לפורטל הורים ותלמידים (ללא צורך בקוד) ←
          </button>
        </div>
      </div>
    </div>
  );
};
