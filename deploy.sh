#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
TOOLS="$ROOT/.tools"
GH="$TOOLS/gh/bin/gh"
REPO_NAME="${1:-osh-quiz}"

ensure_gh() {
  if command -v gh >/dev/null 2>&1; then
    GH="$(command -v gh)"
    return
  fi
  if [[ -x "$GH" ]]; then
    return
  fi
  echo "下載 GitHub CLI…"
  mkdir -p "$TOOLS"
  tmp="$(mktemp -d)"
  curl -fsSL \
    "https://github.com/cli/cli/releases/download/v2.69.0/gh_2.69.0_macOS_arm64.zip" \
    -o "$tmp/gh.zip"
  unzip -q "$tmp/gh.zip" -d "$tmp"
  rm -rf "$TOOLS/gh"
  mv "$tmp/gh_2.69.0_macOS_arm64" "$TOOLS/gh"
  rm -rf "$tmp"
}

ensure_gh

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "尚未登入 GitHub。請在終端機執行："
  echo "  $GH auth login"
  echo "完成後再執行："
  echo "  bash deploy.sh"
  exit 1
fi

if [[ ! -d .git ]]; then
  git init -b main
fi

if ! git config user.email >/dev/null 2>&1; then
  git config user.email "$("$GH" api user -q .email)"
fi
if ! git config user.name >/dev/null 2>&1; then
  git config user.name "$("$GH" api user -q .login)"
fi

git add -A
git diff --cached --quiet && git diff --quiet || git commit -m "$(cat <<'EOF'
Deploy 甲級職安學科練習 App 至 GitHub Pages。

EOF
)"

OWNER="$("$GH" api user -q .login)"
REMOTE="https://github.com/${OWNER}/${REPO_NAME}.git"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

if "$GH" repo view "${OWNER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "遠端 repo 已存在：${OWNER}/${REPO_NAME}"
else
  "$GH" repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

git push -u origin main

"$GH" api \
  -X PUT \
  "repos/${OWNER}/${REPO_NAME}/pages" \
  -f build_type=workflow \
  -f source[branch]=main \
  -f source[path]=/ >/dev/null 2>&1 || true

echo ""
echo "已推送至 https://github.com/${OWNER}/${REPO_NAME}"
echo "GitHub Pages 建置中，約 1～2 分鐘後可開："
echo "  https://${OWNER}.github.io/${REPO_NAME}/"
