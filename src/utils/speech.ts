// Voice Dictation (הכתבה קולית) using Web Speech API

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  lang: 'he-IL' | 'ar-IL' = 'he-IL',
  onTranscript: (text: string, isFinal: boolean) => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
): { start: () => void; stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;

  try {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return null;

    const recognition = new SpeechClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      if (text) {
        onTranscript(text, !!finalTranscript);
      }
    };

    if (onEnd) {
      recognition.onend = onEnd;
    }

    if (onError) {
      recognition.onerror = onError;
    }

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Speech recognition start failed or already active:', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          console.warn('Speech recognition stop:', e);
        }
      },
    };
  } catch (e) {
    console.error('Speech recognition error:', e);
    return null;
  }
}
