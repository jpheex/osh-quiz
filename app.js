import { isNarrationSupported, stopNarration, speakText, speakCaseIntro, primeNarration } from "./narration.js?v=20260704q";
import {
  formatUserId,
  getUserId,
  mergeProgress,
  pullFromCloud,
  pushToCloud,
  resetCloud,
} from "./sync-client.js?v=20260704q";
import { fetchExamQuestions, fetchPoolMeta } from "./exam-client.js?v=20260704q";

// 甲級學科測驗：60 單選（1 分）＋ 20 複選（2 分）＝ 100 分，60 分及格
const PASS_SCORE = 60;
const MAX_SCORE = 100;
const MC_COUNT = 60;
const MS_COUNT = 20;
const MC_POINTS = 1;
const MS_POINTS = 2;
const TOTAL_QUESTIONS = MC_COUNT + MS_COUNT;
const DEFAULT_GOAL = 10;

const STORAGE_KEY = "oshManagerQuizProgress_v1";
const SESSION_STORAGE_KEY = "oshManagerQuizSession_v2";
const APP_VERSION = "20260704q";

// 每個階段的「最短停留時間」（毫秒）。實際停留＝語音播完 與 此值 取較長者，
// 確保即使語音很快結束或不支援，畫面也會停留夠久讓使用者看清楚。
const RECAP_MIN_MS = {
  verdict: 1800,
  compareCorrect: 2600,
  compareWrong: 4200,
  caseIntro: 4000,
  hotspot: 5000,
  memory: 4500,
  betweenCases: 900,
};

const el = {
  dashboard: document.querySelector("#dashboard"),
  quizPanel: document.querySelector("#quizPanel"),
  resultPanel: document.querySelector("#resultPanel"),
  goalCount: document.querySelector("#goalCount"),
  passCount: document.querySelector("#passCount"),
  attemptCount: document.querySelector("#attemptCount"),
  progressFill: document.querySelector("#progressFill"),
  progressText: document.querySelector("#progressText"),
  history: document.querySelector("#history"),
  examFormat: document.querySelector("#examFormat"),
  startBtn: document.querySelector("#startBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  refreshBtn: document.querySelector("#refreshBtn"),
  appVersion: document.querySelector("#appVersion"),
  syncStatus: document.querySelector("#syncStatus"),
  syncUserId: document.querySelector("#syncUserId"),
  roundLabel: document.querySelector("#roundLabel"),
  questionMeta: document.querySelector("#questionMeta"),
  liveCorrect: document.querySelector("#liveCorrect"),
  questionProgress: document.querySelector("#questionProgress"),
  questionTopic: document.querySelector("#questionTopic"),
  questionText: document.querySelector("#questionText"),
  answerArea: document.querySelector("#answerArea"),
  feedbackBox: document.querySelector("#feedbackBox"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  submitBtn: document.querySelector("#submitBtn"),
  resultTitle: document.querySelector("#resultTitle"),
  resultScore: document.querySelector("#resultScore"),
  resultMessage: document.querySelector("#resultMessage"),
  reviewList: document.querySelector("#reviewList"),
  continueBtn: document.querySelector("#continueBtn"),
  recapOverlay: document.querySelector("#recapOverlay"),
  recapStage: document.querySelector("#recapStage"),
  recapProgress: document.querySelector("#recapProgress"),
  recapSkipBtn: document.querySelector("#recapSkipBtn"),
  recapDoneActions: document.querySelector("#recapDoneActions"),
  recapCloseBtn: document.querySelector("#recapCloseBtn"),
  recapNextBtn: document.querySelector("#recapNextBtn"),
};

let state = loadState();
let session = null;
let recapToken = 0;
let recapResolve = null;
let cloudSyncTimer = null;
let cloudSyncPromise = null;
let poolMeta = { poolTotal: null, remainCount: null };

function defaultState() {
  return {
    goalPasses: DEFAULT_GOAL,
    passCount: 0,
    attemptCount: 0,
    history: [],
    completed: false,
    usedQuestionIds: [],
    updatedAt: null,
  };
}

function touchStateUpdatedAt() {
  state.updatedAt = new Date().toISOString();
}

function updateSyncUI(statusText, detailText) {
  if (el.syncStatus) el.syncStatus.textContent = statusText;
  if (el.syncUserId) el.syncUserId.textContent = detailText || `同步 ID：${formatUserId(getUserId())}`;
}

el.appVersion.textContent = `目前版本：${APP_VERSION}`;
updateSyncUI("連線 D1 中…", `同步 ID：${formatUserId(getUserId())}`);

function scheduleCloudSync() {
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    cloudSyncPromise = syncToCloud().finally(() => {
      cloudSyncPromise = null;
    });
  }, 500);
}

async function syncToCloud() {
  try {
    updateSyncUI("同步中…");
    await pushToCloud({
      progress: state,
      session: session ? { ...session, recapOpen: false } : null,
      appVersion: APP_VERSION,
    });
    updateSyncUI("已同步至 D1", `同步 ID：${formatUserId(getUserId())}`);
  } catch {
    updateSyncUI("離線模式（本機暫存）", `同步 ID：${formatUserId(getUserId())}`);
  }
}

async function initCloudSync() {
  updateSyncUI("連線 D1 中…", `同步 ID：${formatUserId(getUserId())}`);
  try {
    const remote = await pullFromCloud();
    state = mergeProgress(state, remote.progress);
    if (remote.session) {
      const restored = loadSavedSessionFromData(remote.session);
      if (restored) session = restored;
    }
    touchStateUpdatedAt();
    saveState();
    if (session) saveSessionSnapshot();
    const hadRemote = Boolean(remote.progress || remote.session);
    if (hadRemote) {
      await pushToCloud({
        progress: state,
        session: session ? { ...session, recapOpen: false } : null,
        appVersion: APP_VERSION,
      });
    }
    updateSyncUI("已同步至 D1", `同步 ID：${formatUserId(getUserId())}`);
  } catch {
    updateSyncUI("離線模式（本機暫存）", `同步 ID：${formatUserId(getUserId())}`);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    if (!Array.isArray(loaded.usedQuestionIds)) loaded.usedQuestionIds = [];
    return loaded;
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    touchStateUpdatedAt();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 儲存空間不足等情況 */
  }
}

function loadSavedSessionFromData(data) {
  try {
    if (!Array.isArray(data?.questions) || data.questions.length !== TOTAL_QUESTIONS) return null;
    if (!Array.isArray(data.answers) || data.answers.length !== TOTAL_QUESTIONS) return null;
    if (!Array.isArray(data.revealed) || data.revealed.length !== TOTAL_QUESTIONS) return null;
    return { ...data, recapOpen: false };
  } catch {
    return null;
  }
}

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return loadSavedSessionFromData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveSessionSnapshot() {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...session, recapOpen: false })
    );
  } catch {
    /* 忽略 */
  }
}

function clearSavedSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function persistAll() {
  saveState();
  saveSessionSnapshot();
  scheduleCloudSync();
}

async function refreshPoolMeta() {
  try {
    poolMeta = await fetchPoolMeta(state.usedQuestionIds || []);
    if (poolMeta.mode === "local") {
      updateSyncUI("離線模式（本機暫存）", `題庫 ${poolMeta.poolTotal ?? "—"} 題｜同步 ID：${formatUserId(getUserId())}`);
    }
  } catch {
    poolMeta = { poolTotal: null, remainCount: null };
  }
}

function markQuestionsUsed(ids) {
  state.usedQuestionIds = [...new Set([...(state.usedQuestionIds || []), ...ids])];
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// 朗讀一段文字，並確保畫面至少停留 minMs；語音較長時以語音為準。
async function narrateAndHold(text, minMs) {
  const started = Date.now();
  await speakText(text);
  const elapsed = Date.now() - started;
  if (elapsed < minMs) {
    await delay(minMs - elapsed);
  }
}

// 朗讀案例概述，並確保最短停留時間。
async function narrateCaseIntroAndHold(topic, caseItem, index, total, minMs) {
  const prefix = `現實案例，第 ${index + 1} 則，共 ${total} 則。`;
  await narrateAndHold(`${prefix}${caseItem.text}`, minMs);
}

function clearAppStorage() {
  localStorage.removeItem(STORAGE_KEY);
  clearSavedSession();
  try {
    sessionStorage.clear();
  } catch {
    /* 忽略 */
  }
}

function refreshToLatest() {
  if (
    !confirm(
      "將重新載入最新版程式。\n\n練習進度與未完成測驗會保留。"
    )
  ) {
    return;
  }
  stopNarration();
  persistAll();
  try {
    sessionStorage.clear();
  } catch {
    /* 忽略 */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("reload", String(Date.now()));
  url.hash = "";
  window.location.replace(url.toString());
}

function renderExamFormat() {
  const msScore = MS_COUNT * MS_POINTS;
  const mcScore = MC_COUNT * MC_POINTS;
  el.examFormat.innerHTML = `
    <h3 class="exam-format-title">本輪題型配額（對齊 22000 甲安學科）</h3>
    <ul class="exam-format-list">
      <li><strong>共同科目 90006～90009</strong>｜16 題（各 3 單選 + 1 複選）｜16 分</li>
      <li><strong>專業科目 22000</strong>｜64 題（48 單選 + 16 複選）｜84 分</li>
      <li><strong>單選 ${MC_COUNT} 題</strong>｜每題 ${MC_POINTS} 分｜小計 ${mcScore} 分</li>
      <li><strong>複選 ${MS_COUNT} 題</strong>｜每題 ${MS_POINTS} 分（須全對）｜小計 ${msScore} 分</li>
    </ul>
    <p class="hint exam-format-note">命題依據：勞動部技能檢定中心題庫（22000 甲安、90006～90009 共同科目）。115 年修法／新增法令及重大職災衍生法令加強出題。每輪向伺服器抽 80 題，已出題 ID 記錄於 D1／本機。</p>
  `;
}

function renderDashboard() {
  el.appVersion.textContent = `目前版本：${APP_VERSION}`;
  el.goalCount.textContent = String(state.goalPasses);
  el.passCount.textContent = String(state.passCount);
  el.attemptCount.textContent = String(state.attemptCount);

  const poolTotal = poolMeta.poolTotal ?? "—";
  const remainCount = poolMeta.remainCount ?? "—";

  const pct = Math.min(100, (state.passCount / state.goalPasses) * 100);
  el.progressFill.style.width = `${pct}%`;

  if (state.completed) {
    el.progressText.textContent = `恭喜！已完成 ${state.goalPasses} 次及格目標。題庫剩餘未出題 ${remainCount} 題。`;
    el.startBtn.textContent = "再練一輪（選用）";
  } else {
    el.progressText.textContent = `尚需及格 ${Math.max(0, state.goalPasses - state.passCount)} 次（滿分 ${MAX_SCORE}，${PASS_SCORE} 分及格）｜題庫剩餘 ${remainCount} 題未出`;
    el.startBtn.textContent = "開始新一輪學科測驗（80 題）";
  }

  renderExamFormat();

  el.history.innerHTML = state.history.length
    ? state.history
        .slice()
        .reverse()
        .map(
          (item) => `
        <div class="history-item ${item.passed ? "pass" : "fail"}">
          <span>第 ${item.attempt} 次｜${item.score} / ${item.maxScore ?? MAX_SCORE} 分｜單選 ${item.mcCorrect ?? "—"}/${MC_COUNT}・複選 ${item.msCorrect ?? "—"}/${MS_COUNT}</span>
          <span>${item.passed ? "及格" : "不及格"}</span>
        </div>
      `
        )
        .join("")
    : `<p class="hint">尚無測驗紀錄</p>`;
}

async function startSession() {
  primeNarration();
  const saved = loadSavedSession();
  if (saved) {
    const resume = confirm(
      `尚有第 ${saved.attemptNo} 次測驗未完成（已作答 ${saved.revealed.filter(Boolean).length} 題）。\n\n按「確定」繼續作答，按「取消」則放棄並開始全新測驗。`
    );
    if (resume) {
      session = saved;
      showPanel("quiz");
      renderQuestion();
      persistAll();
      return;
    }
    clearSavedSession();
  }

  const prevLabel = el.startBtn.textContent;
  el.startBtn.disabled = true;
  el.startBtn.textContent = "向伺服器抽題中…";

  let examData;
  try {
    examData = await fetchExamQuestions(state.usedQuestionIds || []);
  } catch (err) {
    alert(`無法取得題目。\n\n${err.message || err}\n\n請確認網路正常，或重新整理頁面後再試。`);
    el.startBtn.disabled = false;
    el.startBtn.textContent = prevLabel;
    return;
  }

  el.startBtn.disabled = false;
  el.startBtn.textContent = prevLabel;

  if (examData.resetBank) {
    state.usedQuestionIds = [];
    alert(
      "題庫可抽題目已不足一輪完整測驗，已自動重新循環。\n\n先前出過的題目紀錄已清除，避免無題可抽。"
    );
  }

  state.attemptCount += 1;
  markQuestionsUsed(examData.questionIds || examData.questions.map((q) => q.id));

  session = {
    attemptNo: state.attemptCount,
    questions: examData.questions,
    answers: Array(TOTAL_QUESTIONS).fill(null),
    revealed: Array(TOTAL_QUESTIONS).fill(false),
    index: 0,
    reviewed: false,
    recapOpen: false,
  };
  persistAll();
  await refreshPoolMeta();
  showPanel("quiz");
  renderQuestion();
}

function showPanel(name) {
  el.dashboard.classList.toggle("hidden", name !== "dashboard");
  el.quizPanel.classList.toggle("hidden", name !== "quiz");
  el.resultPanel.classList.toggle("hidden", name !== "result");
}

function currentQuestion() {
  return session.questions[session.index];
}

function questionPoints(q) {
  return q.kind === "ms" ? MS_POINTS : MC_POINTS;
}

function questionLabel(q) {
  if (q.kind === "ms") {
    return `複選題 ${q.no - MC_COUNT} / ${MS_COUNT}（每題 ${MS_POINTS} 分）`;
  }
  return `單選題 ${q.no} / ${MC_COUNT}（每題 ${MC_POINTS} 分）`;
}

function questionTags(q) {
  const tags = [];
  if (q.trap) tags.push("陷阱題");
  if (q.law2026) tags.push("115年修法");
  if (q.disaster2026) tags.push("115年職災");
  if (q.numeric) tags.push("數值題");
  if (q.topic === "共同科目") tags.push("共同科目");
  return tags.length ? `｜${tags.join("、")}` : "";
}

function sameAnswerSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function isAnswerCorrect(q, userAnswer) {
  if (q.kind === "ms") return sameAnswerSet(userAnswer, q.answer);
  if (q.kind === "tf") return userAnswer === q.answer;
  return userAnswer === q.answer;
}

function computeScore(questions, answers, revealed) {
  return questions.reduce((sum, q, idx) => {
    if (!revealed?.[idx]) return sum;
    const user = answers[idx];
    if (user === null) return sum;
    return sum + (isAnswerCorrect(q, user) ? questionPoints(q) : 0);
  }, 0);
}

function scoreBreakdown(questions, answers, revealed) {
  let mcCorrect = 0;
  let msCorrect = 0;
  questions.forEach((q, idx) => {
    if (!revealed?.[idx]) return;
    const user = answers[idx];
    if (user === null || !isAnswerCorrect(q, user)) return;
    if (q.kind === "ms") msCorrect += 1;
    else mcCorrect += 1;
  });
  return { mcCorrect, msCorrect };
}

function currentScore() {
  return computeScore(session.questions, session.answers, session.revealed);
}

function userAnswerLabel(q, userAnswer) {
  if (q.kind === "tf") return userAnswer ? "是" : "否";
  if (q.kind === "ms") {
    if (!Array.isArray(userAnswer) || userAnswer.length === 0) return "（未作答）";
    return userAnswer
      .slice()
      .sort((a, b) => a - b)
      .map((i) => `${String.fromCharCode(65 + i)}. ${q.options[i]}`)
      .join("、");
  }
  return `${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}`;
}

function correctAnswerLabel(q) {
  if (q.kind === "tf") return q.answer ? "是" : "否";
  if (q.kind === "ms") {
    return q.answer
      .slice()
      .sort((a, b) => a - b)
      .map((i) => `${String.fromCharCode(65 + i)}. ${q.options[i]}`)
      .join("、");
  }
  return `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`;
}

function setRecapProgress(pct) {
  el.recapProgress.style.width = `${pct}%`;
}

function renderRecapVerdict(correct) {
  el.recapStage.innerHTML = `
    <div class="recap-step recap-verdict ${correct ? "correct" : "wrong"}">
      <div class="icon">${correct ? "✓" : "✗"}</div>
      <h3>${correct ? "答對了！" : "答錯了！"}</h3>
      <p>${correct ? "繼續保持，接下來複習重點。" : "別氣餒，我們一起對照正解與案例。"}</p>
    </div>
  `;
}

function renderRecapCompare(q, userAnswer, correct) {
  const userText = userAnswerLabel(q, userAnswer);
  const correctText = correctAnswerLabel(q);

  if (correct) {
    el.recapStage.innerHTML = `
      <div class="recap-step recap-compare">
        <div class="recap-answer-card yours correct only">
          <div class="label">你的答案（正確）</div>
          <div class="value">${userText}</div>
        </div>
      </div>
    `;
    return;
  }

  el.recapStage.innerHTML = `
    <div class="recap-step recap-compare">
      <div class="recap-answer-card yours wrong">
        <div class="label">你的答案</div>
        <div class="value">${userText}</div>
      </div>
      <div class="recap-arrow">↓</div>
      <div class="recap-answer-card truth">
        <div class="label">正確解答</div>
        <div class="value">${correctText}</div>
      </div>
    </div>
  `;
}

function renderRecapCaseSlide(q, caseItem, index, total) {
  const dots = Array.from({ length: total }, (_, i) => {
    const active = i === index ? "active" : "";
    return `<span class="case-dot ${active}"></span>`;
  }).join("");

  const voiceHint = isNarrationSupported() ? "語音講解中…" : "此瀏覽器不支援語音，請閱讀文字";

  const boxes = (caseItem.hotspots || [])
    .map(
      (h, i) => `
        <div class="hotspot-box ${h.type}" data-hotspot="${i}"
             style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%;">
          <span class="hotspot-tag">${h.type === "good" ? "✓ " : "⚠ "}${h.label}</span>
        </div>`
    )
    .join("");

  el.recapStage.innerHTML = `
    <div class="recap-step recap-cases">
      <h4>📋 現實案例（${q.topic}）</h4>
      <div class="case-slide">
        <div class="case-photo-wrap">
          <div class="case-zoom-layer">
            <img class="case-photo" src="${caseItem.image}" alt="職業災害案例照片" loading="eager" />
            ${boxes}
          </div>
          <span class="case-badge">案例 ${index + 1} / ${total}</span>
          <div class="case-photo-fallback hidden">圖片載入失敗，請確認網路或重新整理</div>
          <div class="case-caption hidden"><span class="dot"></span><span class="caption-text"></span></div>
        </div>
        ${caseItem.credit ? `<p class="case-credit">照片來源：${caseItem.credit}</p>` : ""}
        <div class="case-voice-bar ${isNarrationSupported() ? "speaking" : "muted"}">
          <span class="voice-pulse" aria-hidden="true">🔊</span>
          <span class="voice-label">${voiceHint}</span>
          <button type="button" class="case-replay-btn" data-replay="1">重播語音</button>
        </div>
        <p class="case-text">${caseItem.text}</p>
        <div class="case-dots">${dots}</div>
      </div>
    </div>
  `;

  const photoEl = el.recapStage.querySelector(".case-photo");
  const fallbackEl = el.recapStage.querySelector(".case-photo-fallback");
  if (photoEl && fallbackEl) {
    photoEl.addEventListener("error", () => {
      photoEl.style.visibility = "hidden";
      fallbackEl.classList.remove("hidden");
    });
  }

  const replayBtn = el.recapStage.querySelector("[data-replay]");
  if (replayBtn) {
    replayBtn.addEventListener("click", async () => {
      primeNarration();
      focusHotspot(null, null);
      await speakCaseIntro(q.topic, caseItem, index, total);
      const hotspots = caseItem.hotspots || [];
      for (let h = 0; h < hotspots.length; h += 1) {
        const region = hotspots[h];
        focusHotspot(region, h);
        const lead = region.type === "good" ? "正確示範，" : "缺失部位，";
        const reg = region.regulation || caseItem.regulation || q.source;
        await speakText(`${lead}${region.label}。${region.detail}法規依據：${reg}。`);
      }
      focusHotspot(null, null);
    });
  }
}

function focusHotspot(region, hotspotIndex) {
  const layer = el.recapStage.querySelector(".case-zoom-layer");
  const caption = el.recapStage.querySelector(".case-caption");
  if (!layer) return;

  const boxes = layer.querySelectorAll(".hotspot-box");
  boxes.forEach((box, i) => {
    box.classList.toggle("active", i === hotspotIndex);
    box.classList.toggle("dimmed", hotspotIndex !== null && i !== hotspotIndex);
  });

  if (!region) {
    layer.style.transformOrigin = "50% 50%";
    layer.style.transform = "scale(1)";
    if (caption) caption.classList.add("hidden");
    return;
  }

  const cx = region.x + region.w / 2;
  const cy = region.y + region.h / 2;
  const spread = Math.max(region.w, region.h);
  const scale = Math.min(2.8, Math.max(1.6, 62 / spread));

  layer.style.transformOrigin = `${cx}% ${cy}%`;
  layer.style.transform = `scale(${scale})`;

  if (caption) {
    caption.classList.remove("hidden", "good", "bad");
    caption.classList.add(region.type === "good" ? "good" : "bad");
    const reg = region.regulation ? `｜${region.regulation}` : "";
    caption.querySelector(".caption-text").textContent =
      `${region.type === "good" ? "正確示範：" : "缺失重點："}${region.label}${reg}`;
  }
}

async function playCaseRecap(q, token) {
  const cases = q.cases.slice(0, 3);
  for (let i = 0; i < cases.length; i += 1) {
    if (token !== recapToken) return;

    const caseItem = cases[i];
    renderRecapCaseSlide(q, caseItem, i, cases.length);

    // 1) 全覽：先看整張照片並朗讀案例（至少停留 caseIntro 毫秒）
    focusHotspot(null, null);
    await narrateCaseIntroAndHold(q.topic, caseItem, i, cases.length, RECAP_MIN_MS.caseIntro);
    if (token !== recapToken) return;

    // 2) 逐一放大並框選每個缺失／正確部位，同步語音講解（每處至少停留 hotspot 毫秒）
    const hotspots = caseItem.hotspots || [];
    for (let h = 0; h < hotspots.length; h += 1) {
      if (token !== recapToken) return;
      const region = hotspots[h];
      focusHotspot(region, h);
      await delay(700);
      if (token !== recapToken) return;
      const lead = region.type === "good" ? "正確示範，" : "缺失部位，";
      const reg = region.regulation || caseItem.regulation || q.source;
      await narrateAndHold(`${lead}${region.label}。${region.detail}法規依據：${reg}。`, RECAP_MIN_MS.hotspot);
      if (token !== recapToken) return;
    }

    // 3) 回到全覽後，幻燈片切換至下一則
    focusHotspot(null, null);
    await delay(RECAP_MIN_MS.betweenCases);
  }
}

function renderRecapMemory(q) {
  el.recapStage.innerHTML = `
    <div class="recap-step recap-memory">
      <h4>🧠 記憶錨點</h4>
      <p class="explain">${q.explain}</p>
      <p class="source">法規出處：${q.source}</p>
    </div>
  `;
}

function showRecapDoneButtons() {
  el.recapSkipBtn.classList.add("hidden");
  el.recapDoneActions.classList.remove("hidden");
  const isLast = session.index === session.questions.length - 1;
  el.recapNextBtn.textContent = isLast ? "前往交卷" : "下一步";
}

function hideRecapDoneButtons() {
  el.recapSkipBtn.classList.remove("hidden");
  el.recapDoneActions.classList.add("hidden");
}

function finishRecap(action) {
  recapToken += 1;
  stopNarration();
  session.recapOpen = false;
  el.recapOverlay.classList.add("hidden");
  el.quizPanel.classList.remove("quiz-panel-blocked");
  hideRecapDoneButtons();
  setRecapProgress(0);
  if (recapResolve) {
    recapResolve(action);
    recapResolve = null;
  }
}

async function playRecap(q, userAnswer) {
  const token = ++recapToken;
  const correct = isAnswerCorrect(q, userAnswer);

  session.recapOpen = true;
  el.recapOverlay.classList.remove("hidden");
  el.quizPanel.classList.add("quiz-panel-blocked");
  hideRecapDoneButtons();

  setRecapProgress(8);
  renderRecapVerdict(correct);
  await narrateAndHold(
    correct ? "答對了！" : "答錯了！我們一起看看正確答案與現實案例。",
    RECAP_MIN_MS.verdict
  );
  if (token !== recapToken) return;

  setRecapProgress(30);
  renderRecapCompare(q, userAnswer, correct);
  const compareSpeech = correct
    ? `你的答案正確，${correctAnswerLabel(q)}。`
    : `你選的是 ${userAnswerLabel(q, userAnswer)}，正確答案是 ${correctAnswerLabel(q)}。`;
  await narrateAndHold(
    compareSpeech,
    correct ? RECAP_MIN_MS.compareCorrect : RECAP_MIN_MS.compareWrong
  );
  if (token !== recapToken) return;

  setRecapProgress(62);
  await playCaseRecap(q, token);
  if (token !== recapToken) return;

  setRecapProgress(88);
  renderRecapMemory(q);
  await narrateAndHold(`記憶錨點。${q.explain}。法規出處：${q.source}`, RECAP_MIN_MS.memory);
  if (token !== recapToken) return;
  setRecapProgress(100);
  showRecapDoneButtons();

  return new Promise((resolve) => {
    recapResolve = resolve;
  });
}

function renderFeedback(q, userAnswer) {
  const correct = isAnswerCorrect(q, userAnswer);
  el.feedbackBox.classList.remove("hidden", "ok", "bad");
  el.feedbackBox.classList.add(correct ? "ok" : "bad");
  el.feedbackBox.innerHTML = `
    <strong class="title">${correct ? "答對了！" : "答錯了！"}</strong>
    ${correct ? "" : `<p>正確答案：<strong>${correctAnswerLabel(q)}</strong></p>`}
    <p>解析：${q.explain}</p>
    <p class="source">法規出處：${q.source}</p>
  `;
}

function renderQuestion() {
  const q = currentQuestion();
  const total = session.questions.length;
  const idx = session.index;
  const userAnswer = session.answers[idx];
  const revealed = session.revealed[idx];

  el.roundLabel.textContent = `第 ${session.attemptNo} 次測驗`;
  const section =
    q.kind === "ms"
      ? `｜複選區（第 ${MC_COUNT + 1}～${TOTAL_QUESTIONS} 題）`
      : `｜單選區（第 1～${MC_COUNT} 題）`;
  el.questionMeta.textContent = `第 ${idx + 1} / ${total} 題｜${questionLabel(q)}${section}${questionTags(q)}`;
  el.questionTopic.textContent = q.topic;
  el.questionText.textContent = q.text;
  el.liveCorrect.textContent = `${currentScore()} / ${MAX_SCORE}`;
  el.questionProgress.style.width = `${((idx + 1) / total) * 100}%`;

  el.prevBtn.disabled = idx === 0 || session.recapOpen;
  el.nextBtn.classList.toggle("hidden", idx === total - 1);
  el.submitBtn.classList.toggle("hidden", idx !== total - 1);
  el.nextBtn.disabled = session.recapOpen;
  el.submitBtn.disabled = session.recapOpen;

  el.answerArea.innerHTML = "";
  el.answerArea.classList.remove("answers-ms");
  el.feedbackBox.classList.add("hidden");
  el.feedbackBox.innerHTML = "";

  if (q.kind === "tf") {
    ["是", "否"].forEach((label, valueIdx) => {
      const value = valueIdx === 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.textContent = label;
      if (revealed) {
        btn.disabled = true;
        if (value === q.answer) btn.classList.add("correct");
        else if (value === userAnswer) btn.classList.add("wrong");
      } else if (userAnswer === value) {
        btn.classList.add("selected");
      }
      if (!revealed && !session.recapOpen) btn.addEventListener("click", () => selectAnswer(value));
      el.answerArea.appendChild(btn);
    });
  } else if (q.kind === "ms") {
    el.answerArea.classList.add("answers-ms");
    const selected = Array.isArray(userAnswer) ? userAnswer : [];
    q.options.forEach((opt, optIdx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn answer-ms";
      const mark = revealed
        ? q.answer.includes(optIdx)
          ? "✓ "
          : selected.includes(optIdx)
            ? "✗ "
            : "○ "
        : selected.includes(optIdx)
          ? "☑ "
          : "☐ ";
      btn.textContent = `${mark}${String.fromCharCode(65 + optIdx)}. ${opt}`;
      if (revealed) {
        btn.disabled = true;
        if (q.answer.includes(optIdx)) btn.classList.add("correct");
        else if (selected.includes(optIdx)) btn.classList.add("wrong");
      } else if (selected.includes(optIdx)) {
        btn.classList.add("selected");
      }
      if (!revealed && !session.recapOpen) {
        btn.addEventListener("click", () => toggleMsOption(optIdx));
      }
      el.answerArea.appendChild(btn);
    });
    if (!revealed && !session.recapOpen) {
      const confirmWrap = document.createElement("div");
      confirmWrap.className = "ms-confirm-wrap";
      const hint = document.createElement("p");
      hint.className = "hint ms-hint";
      hint.textContent = "複選題須「全部正確選項都選到、且不可多選錯項」才得分（與學科測驗相同）。";
      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "primary ms-confirm-btn";
      confirmBtn.textContent = "確認作答";
      confirmBtn.addEventListener("click", confirmMsAnswer);
      confirmWrap.append(hint, confirmBtn);
      el.answerArea.appendChild(confirmWrap);
    }
  } else {
    q.options.forEach((opt, optIdx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.textContent = `${String.fromCharCode(65 + optIdx)}. ${opt}`;
      if (revealed) {
        btn.disabled = true;
        if (optIdx === q.answer) btn.classList.add("correct");
        else if (optIdx === userAnswer) btn.classList.add("wrong");
      } else if (userAnswer === optIdx) {
        btn.classList.add("selected");
      }
      if (!revealed && !session.recapOpen) btn.addEventListener("click", () => selectAnswer(optIdx));
      el.answerArea.appendChild(btn);
    });
  }

  if (revealed && userAnswer !== null && !session.recapOpen) {
    if (q.kind !== "ms" || Array.isArray(userAnswer)) {
      renderFeedback(q, userAnswer);
    }
  }
}

function toggleMsOption(optIdx) {
  if (session.revealed[session.index] || session.recapOpen) return;
  let current = session.answers[session.index];
  if (!Array.isArray(current)) current = [];
  session.answers[session.index] = current.includes(optIdx)
    ? current.filter((i) => i !== optIdx)
    : [...current, optIdx].sort((a, b) => a - b);
  persistAll();
  renderQuestion();
}

async function confirmMsAnswer() {
  if (session.revealed[session.index] || session.recapOpen) return;
  const selected = session.answers[session.index];
  if (!Array.isArray(selected) || selected.length === 0) {
    alert("請至少選擇一項。");
    return;
  }
  primeNarration();
  session.revealed[session.index] = true;
  persistAll();
  const q = currentQuestion();
  renderQuestion();
  const action = await playRecap(q, selected);
  renderQuestion();
  if (action === "next" && session.index < session.questions.length - 1) {
    session.index += 1;
    renderQuestion();
  }
  persistAll();
}

async function selectAnswer(value) {
  if (session.revealed[session.index] || session.recapOpen) return;
  // 必須在使用者點擊當下同步解鎖語音（iPad Safari 限制）
  primeNarration();
  session.answers[session.index] = value;
  session.revealed[session.index] = true;
  persistAll();
  const q = currentQuestion();
  renderQuestion();
  const action = await playRecap(q, value);
  renderQuestion();
  if (action === "next" && session.index < session.questions.length - 1) {
    session.index += 1;
    renderQuestion();
  }
  persistAll();
}

function goNext() {
  if (session.recapOpen) return;
  const q = currentQuestion();
  if (!session.revealed[session.index]) {
    if (q.kind === "ms" && Array.isArray(session.answers[session.index]) && session.answers[session.index].length > 0) {
      alert("複選題請按「確認作答」完成本題。");
    } else {
      alert("請先選擇答案。");
    }
    return;
  }
  if (session.index < session.questions.length - 1) {
    session.index += 1;
    renderQuestion();
  }
  persistAll();
}

function goPrev() {
  if (session.recapOpen) return;
  if (session.index > 0) {
    session.index -= 1;
    renderQuestion();
  }
  persistAll();
}

function submitSession() {
  if (session.recapOpen) return;
  const unrevealed = session.revealed.findIndex((revealed) => !revealed);
  if (unrevealed !== -1) {
    alert(`還有未作答題目（第 ${unrevealed + 1} 題），請完成後再交卷。`);
    session.index = unrevealed;
    renderQuestion();
    return;
  }

  const score = computeScore(session.questions, session.answers, session.revealed);
  const { mcCorrect, msCorrect } = scoreBreakdown(
    session.questions,
    session.answers,
    session.revealed
  );
  const passed = score >= PASS_SCORE;

  state.history.push({
    attempt: session.attemptNo,
    score,
    maxScore: MAX_SCORE,
    mcCorrect,
    msCorrect,
    passed,
    at: new Date().toISOString(),
  });

  if (passed) {
    state.passCount += 1;
  } else {
    state.goalPasses += 1;
  }

  if (state.passCount >= state.goalPasses) {
    state.completed = true;
  }

  const finished = session;
  session = null;
  clearSavedSession();
  saveState();
  scheduleCloudSync();
  showResult(score, mcCorrect, msCorrect, passed, finished);
}

function showResult(score, mcCorrect, msCorrect, passed, finishedSession) {
  showPanel("result");
  el.resultTitle.textContent = passed ? "本次學科測驗及格" : "本次學科測驗不及格";
  el.resultScore.textContent = `${score} / ${MAX_SCORE} 分`;
  el.resultScore.style.color = passed ? "var(--ok)" : "var(--bad)";

  const breakdown = `單選 ${mcCorrect}/${MC_COUNT} 題（${MC_POINTS} 分/題）・複選 ${msCorrect}/${MS_COUNT} 題（${MS_POINTS} 分/題，須全對）`;

  if (passed) {
    if (state.completed) {
      el.resultMessage.textContent = `已達成 ${state.goalPasses} 次及格目標，可以停格。${breakdown}`;
    } else {
      el.resultMessage.textContent = `及格！目前進度 ${state.passCount} / ${state.goalPasses} 次。${breakdown}`;
    }
  } else {
    el.resultMessage.textContent = `未達 ${PASS_SCORE} 分。目標及格次數已增加至 ${state.goalPasses} 次。${breakdown}`;
  }

  const wrongItems = finishedSession.questions
    .map((q, idx) => ({ q, idx, user: finishedSession.answers[idx] }))
    .filter(({ q, user }) => user !== null && !isAnswerCorrect(q, user))
    .slice(0, 12);

  el.reviewList.innerHTML = wrongItems.length
    ? wrongItems
        .map(({ q, user }) => {
          const userText = userAnswerLabel(q, user);
          const correctText = correctAnswerLabel(q);
          const caseText = q.cases
            .slice(0, 2)
            .map((item) => item.text)
            .join("；");
          return `
          <div class="review-item">
            <strong>${q.topic}</strong>｜${q.text}<br />
            你的答案：${userText}｜正解：${correctText}<br />
            解析：${q.explain}<br />
            法規出處：${q.source}<br />
            現實案例：${caseText}
          </div>
        `;
        })
        .join("")
    : `<p class="hint">全部答對，表現優秀！</p>`;
}

function resetAll() {
  if (!confirm("確定重置所有練習進度？（含未完成測驗，雲端 D1 也會清空）")) return;
  finishRecap("close");
  state = defaultState();
  session = null;
  clearSavedSession();
  saveState();
  resetCloud().catch(() => {});
  renderDashboard();
  showPanel("dashboard");
}

el.startBtn.addEventListener("click", startSession);
el.resetBtn.addEventListener("click", resetAll);
el.refreshBtn.addEventListener("click", refreshToLatest);
el.prevBtn.addEventListener("click", goPrev);
el.nextBtn.addEventListener("click", goNext);
el.submitBtn.addEventListener("click", submitSession);
el.continueBtn.addEventListener("click", () => {
  session = null;
  clearSavedSession();
  renderDashboard();
  showPanel("dashboard");
});
el.recapCloseBtn.addEventListener("click", () => finishRecap("close"));
el.recapNextBtn.addEventListener("click", () => finishRecap("next"));
el.recapSkipBtn.addEventListener("click", () => finishRecap("close"));

window.addEventListener("pagehide", persistAll);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") persistAll();
});

async function bootApp() {
  await initCloudSync();
  await refreshPoolMeta();
  renderDashboard();
  const saved = session || loadSavedSession();
  if (saved) {
    session = saved;
    showPanel("quiz");
    renderQuestion();
    return;
  }
  showPanel("dashboard");
}

bootApp();
