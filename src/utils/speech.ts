/**
 * Web Speech API utility for English Text-to-Speech
 */

export function speakEnglish(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Trình duyệt không hỗ trợ Web Speech API.');
    return false;
  }

  try {
    // Dừng mọi giọng đọc đang phát trước đó
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) return false;

    // Chuẩn hóa văn bản cần đọc
    const cleanText = text.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.92; // Tốc độ đĩnh đạc, rõ từng âm tiết
    utterance.pitch = 1.0;

    // Lựa chọn giọng tiếng Anh tốt nhất hiện có
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferredVoice =
        voices.find((v) => v.lang === 'en-US' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en-GB')) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error('Lỗi khi phát âm Text-to-Speech:', error);
    if (onEnd) onEnd();
    return false;
  }
}
