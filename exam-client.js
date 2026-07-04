import {
  ensureQuestionBank,
  poolStats,
  sampleQuestions,
} from "./lib/exam-engine.js";

const API_EXAM_START = "/api/exam/start";
const API_META = "/api/meta";
const BUNDLE_URL = "./data/questions-bundle.json?v=20260704q";

let cachedAll = null;

async function loadLocalPool() {
  if (cachedAll) return cachedAll;
  const res = await fetch(BUNDLE_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`本地題庫載入失敗（HTTP ${res.status}）`);
  }
  const bundle = await res.json();
  cachedAll = (bundle.questions || []).map((row) => ({
    ...row.payload,
    id: row.id,
    kind: row.kind,
    subject_code: row.subject_code,
    section: row.section,
  }));
  if (!cachedAll.length) {
    throw new Error("本地題庫為空");
  }
  return cachedAll;
}

function sampleLocalExam(usedQuestionIds = []) {
  const all = cachedAll;
  let usedIdSet = new Set(usedQuestionIds.map(String));
  const bank = ensureQuestionBank(all, usedIdSet);
  if (bank.reset) usedIdSet = bank.usedIdSet;
  const questions = sampleQuestions(all, usedIdSet);
  return {
    questions,
    questionIds: questions.map((q) => q.id),
    resetBank: bank.reset,
    examStructure: { common: 16, professional: 64, jobClass: "22000" },
    mode: "local",
  };
}

async function fetchLocalMeta(usedQuestionIds = []) {
  const all = await loadLocalPool();
  const stats = poolStats(all, new Set(usedQuestionIds.map(String)));
  return {
    ...stats,
    contentVersion: "20260704q",
    mcCount: all.filter((q) => q.kind === "mc").length,
    msCount: all.filter((q) => q.kind === "ms").length,
    mode: "local",
  };
}

export async function fetchExamQuestions(usedQuestionIds = []) {
  try {
    const res = await fetch(API_EXAM_START, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usedQuestionIds }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ...data, mode: "cloud" };
    }
  } catch {
    /* 改用本地題庫 */
  }

  await loadLocalPool();
  return sampleLocalExam(usedQuestionIds);
}

export async function fetchPoolMeta(usedQuestionIds = []) {
  try {
    const qs = encodeURIComponent(JSON.stringify(usedQuestionIds));
    const res = await fetch(`${API_META}?usedIds=${qs}`);
    if (res.ok) {
      const data = await res.json();
      return { ...data, mode: "cloud" };
    }
  } catch {
    /* 改用本地題庫 */
  }

  return fetchLocalMeta(usedQuestionIds);
}
