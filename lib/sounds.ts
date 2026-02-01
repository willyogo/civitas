type SoundType = 'click' | 'hover' | 'success' | 'beacon' | 'claim' | 'alert';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

function createOscillator(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1
): void {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playChord(frequencies: number[], duration: number, volume: number = 0.05): void {
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      createOscillator(freq, duration, 'sine', volume);
    }, index * 30);
  });
}

export function playSound(type: SoundType): void {
  if (!audioContext) return;

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  switch (type) {
    case 'click':
      createOscillator(800, 0.05, 'sine', 0.05);
      break;

    case 'hover':
      createOscillator(600, 0.03, 'sine', 0.02);
      break;

    case 'success':
      playChord([523.25, 659.25, 783.99], 0.3, 0.08);
      break;

    case 'beacon':
      createOscillator(440, 0.1, 'sine', 0.1);
      setTimeout(() => createOscillator(554.37, 0.1, 'sine', 0.1), 100);
      setTimeout(() => createOscillator(659.25, 0.2, 'sine', 0.08), 200);
      break;

    case 'claim':
      playChord([261.63, 329.63, 392, 523.25], 0.5, 0.1);
      break;

    case 'alert':
      createOscillator(880, 0.1, 'square', 0.05);
      setTimeout(() => createOscillator(880, 0.1, 'square', 0.05), 150);
      break;
  }
}

let ambientInterval: NodeJS.Timeout | null = null;
let isAmbientPlaying = false;

export function startAmbientSound(): void {
  if (isAmbientPlaying || !audioContext) return;

  isAmbientPlaying = true;

  const playAmbientNote = () => {
    if (!isAmbientPlaying) return;

    const notes = [196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
    const randomNote = notes[Math.floor(Math.random() * notes.length)];

    createOscillator(randomNote, 2, 'sine', 0.015);

    if (Math.random() > 0.7) {
      setTimeout(() => {
        const harmonic = notes[Math.floor(Math.random() * notes.length)];
        createOscillator(harmonic, 1.5, 'sine', 0.01);
      }, 500);
    }
  };

  playAmbientNote();
  ambientInterval = setInterval(playAmbientNote, 4000 + Math.random() * 3000);
}

export function stopAmbientSound(): void {
  isAmbientPlaying = false;
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
}

export function isAmbientActive(): boolean {
  return isAmbientPlaying;
}
