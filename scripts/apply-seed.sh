#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BUNDLE="$ROOT/d1-seed/bundle.json"
SQL="$ROOT/d1-seed/seed.sql"

if [[ ! -f "$BUNDLE" ]]; then
  echo "找不到 $BUNDLE，請先執行：node scripts/build-d1-data.mjs"
  exit 1
fi

export PATH="${ROOT}/.tools/node/bin:${PATH}"
NODE="${ROOT}/.tools/node/bin/node"
[[ -x "$NODE" ]] || NODE="$(command -v node)"

"$NODE" <<'NODE'
const fs = require("fs");
const bundle = JSON.parse(fs.readFileSync("d1-seed/bundle.json", "utf8"));
const esc = (s) => String(s).replace(/'/g, "''");
let sql = "DELETE FROM questions;\nDELETE FROM app_meta;\n";
sql += `INSERT INTO app_meta (key, value) VALUES ('content_version', '${esc(bundle.contentVersion)}');\n`;
for (const row of bundle.questions) {
  sql += `INSERT INTO questions (id, pool, kind, topic, subject_code, section, payload_json) VALUES ('${esc(row.id)}', '${esc(row.pool)}', '${esc(row.kind)}', '${esc(row.topic)}', '${esc(row.subject_code)}', '${esc(row.section)}', '${esc(JSON.stringify(row.payload))}');\n`;
}
fs.writeFileSync("d1-seed/seed.sql", sql);
console.log(`已產生 seed.sql（${bundle.questions.length} 題）`);
NODE

echo "套用 seed 至 D1 remote…"
npx --yes wrangler d1 execute osh-quiz-db --remote --file="$SQL"
