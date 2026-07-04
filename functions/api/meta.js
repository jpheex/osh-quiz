import { poolStats } from "../lib/exam-engine.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let usedQuestionIds = [];
  try {
    usedQuestionIds = JSON.parse(url.searchParams.get("usedIds") || "[]");
  } catch {
    usedQuestionIds = [];
  }

  const all = await loadAllQuestions(env.DB);
  const stats = poolStats(all, new Set(usedQuestionIds.map(String)));
  const meta =
    (await env.DB.prepare("SELECT value FROM app_meta WHERE key = 'content_version'").first()) ||
    {};

  return json({
    ...stats,
    contentVersion: meta.value || null,
    mcCount: all.filter((q) => q.kind === "mc").length,
    msCount: all.filter((q) => q.kind === "ms").length,
  });
}
