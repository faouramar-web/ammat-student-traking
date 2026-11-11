// Web Audio API Audio Chime synthesizer (Zero external file dependencies)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  const saved = localStorage.getItem('amat_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  localStorage.setItem('amat_sound_enabled', enabled ? 'true' : 'false');
}

export function playChime(type: 'alert' | 'excellence' | 'info' = 'alert') {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'alert') {
      // Distinct educational alert chime (D5 -> A5 -> F#5)
      const notes = [
        { freq: 587.33, start: 0.0, duration: 0.15 },
        { freq: 880.00, start: 0.15, duration: 0.25 },
        { freq: 739.99, start: 0.35, duration: 0.4 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.start);

        gain.gain.setValueAtTime(0.001, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.3, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.05);
      });
    } else if (type === 'excellence') {
      // Joyous celebration major chord (C5 -> E5 -> G5 -> C6 chime)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const start = idx * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + 0.65);
      });
    } else {
      // Subtle gentle notification beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('Audio playback error (browser user-gesture constraint):', err);
  }
}
