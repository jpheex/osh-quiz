export const MC_COUNT = 60;
export const MS_COUNT = 20;
export const TOTAL_QUESTIONS = MC_COUNT + MS_COUNT;
export const JOB_CLASS = "22000";
export const COMMON_SUBJECTS = ["90006", "90007", "90008", "90009"];

export const COMMON_MC_PER_SUBJECT = 3;
export const COMMON_MS_PER_SUBJECT = 1;

export const PRO_MC_COUNT = MC_COUNT - COMMON_SUBJECTS.length * COMMON_MC_PER_SUBJECT;
export const PRO_MS_COUNT = MS_COUNT - COMMON_SUBJECTS.length * COMMON_MS_PER_SUBJECT;

const PRO_SECTION_WEIGHTS = {
  regulation: { mc: 0.4, ms: 0.35 },
  management: { mc: 0.25, ms: 0.2 },
  professional: { mc: 0.35, ms: 0.45 },
};

const LAW2026_BOOST = 0.45;
const DISASTER2026_BOOST = 0.4;
const PENALTY_MAX_PER_EXAM = 2;
const FINE_AMOUNT_MAX_PER_EXAM = 1;

export function questionId(q) {
  return q.id || `${q.topic}::${q.text}`;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isFineAmountQuestion(q) {
  if (q.fineAmount === false) return false;
  if (q.fineAmount) return true;
  const blob = `${q.text} ${q.explain}`;
  return /(\d+\s*萬元|\d+\s*萬(?!\分))/.test(blob) || /罰鍰.*多少|罰鍰.*幾/.test(blob);
}

function isPenaltyQuestion(q) {
  if (q.penalty === false) return false;
  if (q.penalty || q.fineAmount) return true;
  if (isFineAmountQuestion(q)) return true;
  const blob = `${q.text} ${q.explain}`;
  if (/不利處分|解僱/.test(blob)) return false;
  return /罰則|罰鍰|罰金|開罰/.test(blob);
}

function withinPenaltyBudget(q, examStats) {
  if (isFineAmountQuestion(q) && examStats.fineAmount >= FINE_AMOUNT_MAX_PER_EXAM) return false;
  if (isPenaltyQuestion(q) && examStats.penalty >= PENALTY_MAX_PER_EXAM) return false;
  return true;
}

function recordPenaltyPick(q, examStats) {
  if (isFineAmountQuestion(q)) examStats.fineAmount += 1;
  if (isPenaltyQuestion(q)) examStats.penalty += 1;
}

function pickFromPool(pool, count, pickedSet, usedIdSet, examStats, prefer) {
  if (count <= 0) return [];
  let available = pool.filter(
    (q) =>
      !usedIdSet.has(questionId(q)) &&
      !pickedSet.has(q) &&
      withinPenaltyBudget(q, examStats)
  );
  const picked = [];

  const take = (subset, n) => {
    if (n <= 0) return;
    let got = 0;
    for (const q of shuffle(subset)) {
      if (got >= n || picked.length >= count) break;
      if (pickedSet.has(q)) continue;
      picked.push(q);
      pickedSet.add(q);
      recordPenaltyPick(q, examStats);
      got += 1;
    }
  };

  if (prefer?.law2026) {
    take(
      available.filter((q) => q.law2026),
      Math.round(count * LAW2026_BOOST)
    );
  }
  if (prefer?.disaster2026) {
    take(
      available.filter((q) => q.disaster2026),
      Math.round(count * DISASTER2026_BOOST)
    );
  }

  available = available.filter((q) => !pickedSet.has(q));
  take(available, count - picked.length);
  return picked.slice(0, count);
}

function filterQuestions(all, { kind, subjectCode, section }) {
  return all.filter(
    (q) =>
      q.kind === kind &&
      (!subjectCode || q.subject_code === subjectCode) &&
      (!section || q.section === section)
  );
}

function sampleProfessional(all, kind, count, pickedSet, usedIdSet, examStats) {
  const picked = [];
  for (const [section, weights] of Object.entries(PRO_SECTION_WEIGHTS)) {
    const n = Math.round(count * weights[kind === "mc" ? "mc" : "ms"]);
    const pool = filterQuestions(all, { kind, subjectCode: JOB_CLASS, section });
    const prefer = section === "regulation" ? { law2026: true, disaster2026: true } : {};
    picked.push(...pickFromPool(pool, n, pickedSet, usedIdSet, examStats, prefer));
  }
  if (picked.length < count) {
    const pool = filterQuestions(all, { kind, subjectCode: JOB_CLASS });
    picked.push(
      ...pickFromPool(pool, count - picked.length, pickedSet, usedIdSet, examStats, {
        law2026: true,
        disaster2026: true,
      })
    );
  }
  return shuffle(picked.slice(0, count));
}

export function countAvailable(all, usedIdSet) {
  const mcAvail = filterQuestions(all, { kind: "mc" }).filter((q) => !usedIdSet.has(questionId(q)))
    .length;
  const msAvail = filterQuestions(all, { kind: "ms" }).filter((q) => !usedIdSet.has(questionId(q)))
    .length;
  return { mcAvail, msAvail };
}

export function ensureQuestionBank(all, usedIdSet) {
  const { mcAvail, msAvail } = countAvailable(all, usedIdSet);
  if (mcAvail >= MC_COUNT && msAvail >= MS_COUNT) {
    return { usedIdSet, reset: false };
  }
  return { usedIdSet: new Set(), reset: true };
}

export function poolStats(all, usedIdSet) {
  const poolTotal = new Set(all.map(questionId)).size;
  const usedCount = [...usedIdSet].filter((id) => all.some((q) => questionId(q) === id)).length;
  return {
    poolTotal,
    remainCount: Math.max(0, poolTotal - usedCount),
    jobClass: JOB_CLASS,
    commonSubjects: COMMON_SUBJECTS,
  };
}

export function sampleQuestions(all, usedIdSet) {
  const pickedSet = new Set();
  const examStats = { penalty: 0, fineAmount: 0 };
  const mc = [];
  const ms = [];

  for (const code of COMMON_SUBJECTS) {
    mc.push(
      ...pickFromPool(
        filterQuestions(all, { kind: "mc", subjectCode: code, section: "common" }),
        COMMON_MC_PER_SUBJECT,
        pickedSet,
        usedIdSet,
        examStats,
        code === "90006" ? { law2026: true } : {}
      )
    );
    ms.push(
      ...pickFromPool(
        filterQuestions(all, { kind: "ms", subjectCode: code, section: "common" }),
        COMMON_MS_PER_SUBJECT,
        pickedSet,
        usedIdSet,
        examStats,
        {}
      )
    );
  }

  mc.push(...sampleProfessional(all, "mc", PRO_MC_COUNT, pickedSet, usedIdSet, examStats));
  ms.push(...sampleProfessional(all, "ms", PRO_MS_COUNT, pickedSet, usedIdSet, examStats));

  const mcOrdered = shuffle(mc).map((q, index) => ({ ...q, kind: "mc", no: index + 1 }));
  const msOrdered = shuffle(ms).map((q, index) => ({
    ...q,
    kind: "ms",
    no: MC_COUNT + index + 1,
  }));

  return [...mcOrdered, ...msOrdered];
}
