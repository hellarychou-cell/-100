#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Volumes/PS2000/成她"
TARGET_DIR="/Users/macbook/Documents/GitHub/-100"
COMMIT_MESSAGE="${1:-sync: update chengta100 from external drive}"

rsync -av --delete \
  --exclude ".git/" \
  --exclude ".git.bak/" \
  --exclude ".next/" \
  --exclude "node_modules/" \
  --exclude ".vercel/" \
  --exclude ".superpowers/" \
  --exclude "*.code-workspace" \
  --exclude ".DS_Store" \
  --exclude "._*" \
  "$SOURCE_DIR/" "$TARGET_DIR/"

cd "$TARGET_DIR"

REMOTE_URL="$(git remote get-url origin)"
if [[ "$REMOTE_URL" != "https://github.com/hellarychou-cell/-100.git" ]]; then
  echo "Unexpected origin remote: $REMOTE_URL"
  echo "Expected: https://github.com/hellarychou-cell/-100.git"
  exit 1
fi

WRONG_GITHUB_USER="$(git config --get credential.https://github.com.username || true)"
if [[ "$WRONG_GITHUB_USER" == "262933974" ]]; then
  echo "Removing stale GitHub credential username: $WRONG_GITHUB_USER"
  git config --unset credential.https://github.com.username
fi

git add .

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$COMMIT_MESSAGE"
git push origin main
