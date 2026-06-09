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

git add .

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$COMMIT_MESSAGE"
git push origin main
