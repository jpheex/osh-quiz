let voicesReady = false;
let zhVoice = null;
let primed = false;

function pickChineseVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  zhVoice =
    voices.find((v) => v.lang === "zh-TW") ||
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang.startsWith("zh")) ||
    null;
  voicesReady = true;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  pickChineseVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickChineseVoice);
}

export function isNarrationSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopNarration() {
  if (!isNarrationSupported()) return;
  window.speechSynthesis.cancel();
}

// iOS / iPadOS Safari 規定：語音必須在使用者手勢當下「同步」首次觸發，
// 否則之後（經過動畫延遲）呼叫 speak 都會被靜音。
// 在點擊事件中呼叫此函式以解鎖語音引擎。
export function primeNarration() {
  if (!isNarrationSupported() || primed) return;
  primed = true;
  if (!voicesReady) pickChineseVoice();
  try {
    window.speechSynthesis.cancel();
    const warmup = new SpeechSynthesisUtterance("\u3002");
    warmup.volume = 0;
    warmup.rate = 2;
    if (zhVoice) warmup.voice = zhVoice;
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.resume();
  } catch {
    /* 忽略解鎖失敗 */
  }
}

export function speakText(text) {
  if (!isNarrationSupported()) {
    return Promise.resolve();
  }

  stopNarration();
  if (!voicesReady) pickChineseVoice();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-TW";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    if (zhVoice) utterance.voice = zhVoice;

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    utterance.onend = done;
    utterance.onerror = done;

    window.speechSynthesis.speak(utterance);
    // iOS Safari 有時 speak 後停在暫停狀態，需手動 resume。
    try {
      window.speechSynthesis.resume();
    } catch {
      /* 忽略 */
    }

    const maxMs = Math.min(20000, Math.max(3500, text.length * 180));
    setTimeout(done, maxMs);
  });
}

export async function speakCaseIntro(topic, caseItem, index, total) {
  const prefix = `現實案例，第 ${index + 1} 則，共 ${total} 則。`;
  await speakText(`${prefix}${caseItem.text}`);
}
