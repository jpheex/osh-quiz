import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { MULTIPLE_CHOICE_POOL } from "../questions.js";
import { MULTIPLE_SELECT_POOL } from "../questions-multiselect.js";
import { NUMERIC_MC_POOL, NUMERIC_MS_POOL } from "../questions-numeric.js";
import { DISASTER2026_MC_POOL, DISASTER2026_MS_POOL } from "../questions-disaster2026.js";
import { LAW2026_EXTRA_MC_POOL, LAW2026_EXTRA_MS_POOL } from "../questions-law2026-extra.js";
import {
  COMMON_90006_MC,
  COMMON_90006_MS,
  COMMON_90007_MC,
  COMMON_90007_MS,
  COMMON_90008_MC,
  COMMON_90008_MS,
  COMMON_90009_MC,
  COMMON_90009_MS,
} from "../questions-common-subjects.js";
import {
  DISASTER_LAW_MC_POOL,
  DISASTER_LAW_MS_POOL,
} from "../questions-disaster-law-derived.js";
import { resolveSource } from "../sources.js";
import { enrichCases } from "./lib/enrich-cases.mjs";
import { classifyQuestion } from "./official-taxonomy.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "d1-seed");
const CONTENT_VERSION = "20260704s";

const POOLS = [
  { pool: "common_90006", kind: "mc", items: COMMON_90006_MC },
  { pool: "common_90006_ms", kind: "ms", items: COMMON_90006_MS },
  { pool: "common_90007", kind: "mc", items: COMMON_90007_MC },
  { pool: "common_90007_ms", kind: "ms", items: COMMON_90007_MS },
  { pool: "common_90008", kind: "mc", items: COMMON_90008_MC },
  { pool: "common_90008_ms", kind: "ms", items: COMMON_90008_MS },
  { pool: "common_90009", kind: "mc", items: COMMON_90009_MC },
  { pool: "common_90009_ms", kind: "ms", items: COMMON_90009_MS },
  { pool: "mc_choice", kind: "mc", items: MULTIPLE_CHOICE_POOL },
  { pool: "mc_numeric", kind: "mc", items: NUMERIC_MC_POOL },
  { pool: "mc_disaster2026", kind: "mc", items: DISASTER2026_MC_POOL },
  { pool: "mc_law2026", kind: "mc", items: LAW2026_EXTRA_MC_POOL },
  { pool: "mc_disaster_law", kind: "mc", items: DISASTER_LAW_MC_POOL },
  { pool: "ms_multiselect", kind: "ms", items: MULTIPLE_SELECT_POOL },
  { pool: "ms_numeric", kind: "ms", items: NUMERIC_MS_POOL },
  { pool: "ms_disaster2026", kind: "ms", items: DISASTER2026_MS_POOL },
  { pool: "ms_law2026", kind: "ms", items: LAW2026_EXTRA_MS_POOL },
  { pool: "ms_disaster_law", kind: "ms", items: DISASTER_LAW_MS_POOL },
];

function enrichQuestion(q, pool, index, kind) {
  const id = q.id || `${pool}-${String(index + 1).padStart(4, "0")}`;
  const base = { ...q, id };
  const { subject_code, section } = classifyQuestion(base);
  const payload = {
    ...base,
    subject_code,
    section,
    source: resolveSource(base),
    cases: enrichCases(base),
  };
  return {
    id,
    pool,
    kind,
    topic: base.topic || "",
    subject_code,
    section,
    payload,
  };
}

const questions = [];
for (const { pool, kind, items } of POOLS) {
  items.forEach((q, index) => {
    questions.push(enrichQuestion(q, pool, index, kind));
  });
}

const summary = {
  total: questions.length,
  bySubject: {},
  law2026: questions.filter((q) => q.payload.law2026).length,
  disaster2026: questions.filter((q) => q.payload.disaster2026).length,
};

for (const q of questions) {
  summary.bySubject[q.subject_code] = (summary.bySubject[q.subject_code] || 0) + 1;
}

const bundle = { contentVersion: CONTENT_VERSION, questions, summary };

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "bundle.json"), JSON.stringify(bundle, null, 0));

const DATA_OUT = join(ROOT, "data");
mkdirSync(DATA_OUT, { recursive: true });
writeFileSync(join(DATA_OUT, "questions-bundle.json"), JSON.stringify(bundle, null, 0));

console.log(`已產生 ${questions.length} 題 → d1-seed/bundle.json、data/questions-bundle.json`);
console.log(summary);
