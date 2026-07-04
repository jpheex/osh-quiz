import {
  ensureQuestionBank,
  sampleQuestions,
} from "../../lib/exam-engine.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function bad(message, status = 400) {
  return json({ error: message }, status);
}

async function loadAllQuestions(db) {
  const rows = await db
    .prepare(
      "SELECT id, kind, subject_code, section, payload_json FROM questions"
    )
    .all();
  return (rows.results || []).map((row) => ({
    ...JSON.parse(row.payload_json),
    id: row.id,
    kind: row.kind,
    subject_code: row.subject_code,
    section: row.section,
  }));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const usedQuestionIds = Array.isArray(body.usedQuestionIds) ? body.usedQuestionIds : [];
  let usedIdSet = new Set(usedQuestionIds.map(String));

  const all = await loadAllQuestions(env.DB);
  if (!all.length) {
    return bad("題庫尚未匯入 D1，請先執行 seed", 503);
  }

  const bank = ensureQuestionBank(all, usedIdSet);
  if (bank.reset) usedIdSet = bank.usedIdSet;

  const questions = sampleQuestions(all, usedIdSet);
  const questionIds = questions.map((q) => q.id);

  return json({
    questions,
    questionIds,
    resetBank: bank.reset,
    examStructure: {
      common: 16,
      professional: 64,
      jobClass: "22000",
    },
  });
}
