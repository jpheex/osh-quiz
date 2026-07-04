#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
TOOLS="$ROOT/.tools"
NODE="$TOOLS/node/bin/node"
NPX="$TOOLS/node/bin/npx"
PROJECT_NAME="${1:-osh-quiz}"
DB_NAME="osh-quiz-db"

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    NODE="$(command -v node)"
    NPX="$(command -v npx)"
    return
  fi
  if [[ -x "$NODE" ]]; then
    NPX="$TOOLS/node/bin/npx"
    return
  fi
  echo "下載 Node.js…"
  mkdir -p "$TOOLS"
  tmp="$(mktemp -d)"
  curl -fsSL "https://nodejs.org/dist/v22.16.0/node-v22.16.0-darwin-arm64.tar.gz" -o "$tmp/node.tgz"
  tar -xzf "$tmp/node.tgz" -C "$tmp"
  rm -rf "$TOOLS/node"
  mv "$tmp/node-v22.16.0-darwin-arm64" "$TOOLS/node"
  rm -rf "$tmp"
  NPX="$TOOLS/node/bin/npx"
}

ensure_wrangler() {
  if ! "$NPX" --yes wrangler --version >/dev/null 2>&1; then
    echo "準備 Wrangler…"
  fi
}

ensure_node
ensure_wrangler

export PATH="$(dirname "$NODE"):$PATH"

if ! "$NPX" --yes wrangler whoami >/dev/null 2>&1; then
  echo "尚未登入 Cloudflare。請執行："
  echo "  $NPX --yes wrangler login"
  echo "完成後再執行："
  echo "  bash deploy-cloudflare.sh"
  exit 1
fi

if ! grep -q 'database_id = "[^0]' wrangler.toml; then
  echo "建立 D1 資料庫 ${DB_NAME}…"
  create_out="$("$NPX" --yes wrangler d1 create "$DB_NAME" 2>&1)"
  echo "$create_out"
  db_id="$(echo "$create_out" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | head -1)"
  if [[ -z "$db_id" ]]; then
    db_id="$("$NPX" --yes wrangler d1 list --json | "$NODE" -e '
      const rows = JSON.parse(require("fs").readFileSync(0,"utf8"));
      const hit = rows.find(r => r.name === process.argv[1]);
      if (!hit) process.exit(1);
      process.stdout.write(hit.uuid);
    ' "$DB_NAME")"
  fi
  sed -i '' "s/database_id = \".*\"/database_id = \"$db_id\"/" wrangler.toml
fi

echo "套用 D1 migrations…"
"$NPX" --yes wrangler d1 migrations apply "$DB_NAME" --remote

echo "建置並匯入題庫…"
"$NODE" scripts/build-d1-data.mjs
export PATH="$(dirname "$NODE"):$PATH"
bash scripts/apply-seed.sh

echo "部署 Cloudflare Pages + Functions…"
"$NPX" --yes wrangler pages deploy . --project-name="$PROJECT_NAME" --commit-dirty=true

echo ""
echo "完成。請到 Cloudflare Dashboard → Workers & Pages → ${PROJECT_NAME}"
echo "確認自訂網域或 pages.dev 網址，並在該網址使用 App（/api/sync 才會生效）。"
echo "同步 ID 會顯示在 App 進度板，換裝置時可沿用同一組 ID。"
