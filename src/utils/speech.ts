// Web Speech API Voice Readout Engine for Low-Literacy and Elderly Citizens
// Supports Marathi (mr-IN) and Indian English (en-IN / en-US) with automatic voice selection and fallback

export class SpeechEngine {
  private static isSpeaking = false;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static listeners: Set<(speaking: boolean) => void> = new Set();

  static subscribe(listener: (speaking: boolean) => void) {
    this.listeners.add(listener);
    listener(this.isSpeaking);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  static getIsSpeaking() {
    return this.isSpeaking;
  }

  static stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify(false);
  }

  static speak(text: string, lang: 'en' | 'mr' = 'en', onDone?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser environment.');
      onDone?.();
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown/special characters for clear phonetic articulation
    const cleanText = text
      .replace(/[#*`_\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      onDone?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = lang === 'mr' ? 0.92 : 0.95; // slightly slower cadence for clarity
    utterance.pitch = 1.0;

    // Pick best available voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang === 'mr') {
        const mrVoice = voices.find(v => v.lang.startsWith('mr') || v.name.toLowerCase().includes('marathi') || v.name.toLowerCase().includes('hindi') || v.lang.startsWith('hi'));
        if (mrVoice) utterance.voice = mrVoice;
      } else {
        const enVoice = voices.find(v => v.lang === 'en-IN' || v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      onDone?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.notify(false);
      onDone?.();
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
}
