/** 對齊技能檢定：22000 甲安專業 + 90006～90009 共同科目 */
export const JOB_CLASS = "22000";
export const COMMON_SUBJECTS = ["90006", "90007", "90008", "90009"];

const REGULATION_TOPICS = new Set([
  "職業安全衛生法",
  "法規",
  "115年修法",
  "115年職災",
  "115年職災法令",
]);

const MANAGEMENT_TOPICS = new Set([
  "管理計畫",
  "OSH管理系統",
  "風險評估",
  "職業災害調查",
  "教育訓練",
]);

const PROFESSIONAL_TOPICS = new Set([
  "墜落災害",
  "感電災害",
  "火災爆炸",
  "化學品管理",
  "機械安全",
  "個人防護具",
  "作業環境",
  "專業課程",
  "學科題型",
  "術科題型",
]);

const COMMON_TOPIC_TO_CODE = {
  職業安全衛生: "90006",
  工作倫理: "90007",
  環境保護: "90008",
  節能減碳: "90009",
  共同科目: "90006",
};

export function classifyQuestion(q) {
  if (q.subjectCode) {
    return {
      subject_code: q.subjectCode,
      section: q.section || (COMMON_SUBJECTS.includes(q.subjectCode) ? "common" : q.section),
    };
  }

  if (q.topic && COMMON_TOPIC_TO_CODE[q.topic]) {
    return { subject_code: COMMON_TOPIC_TO_CODE[q.topic], section: "common" };
  }

  if (q.law2026 || q.topic === "115年修法") {
    return { subject_code: JOB_CLASS, section: "regulation" };
  }

  if (q.disaster2026 || q.topic === "115年職災" || q.topic === "115年職災法令") {
    return { subject_code: JOB_CLASS, section: "regulation" };
  }

  if (REGULATION_TOPICS.has(q.topic)) {
    return { subject_code: JOB_CLASS, section: "regulation" };
  }

  if (MANAGEMENT_TOPICS.has(q.topic)) {
    return { subject_code: JOB_CLASS, section: "management" };
  }

  if (PROFESSIONAL_TOPICS.has(q.topic)) {
    return { subject_code: JOB_CLASS, section: "professional" };
  }

  return { subject_code: JOB_CLASS, section: "professional" };
}
