#!/usr/bin/env bash
# goraebap.xyz를 홈서버에 배포한다. 저장소 루트에서 실행한다.
#
#   deploy/blog.sh            main을 빌드해 배포
#   deploy/blog.sh <ref>      브랜치나 커밋을 빌드해 배포
#   deploy/blog.sh --rollback 바로 전 배포로 되돌림
#
# 지금 작업 폴더와 상관없이 <ref>를 임시 worktree에 꺼내 빌드한다. 서버에는 releases/<시각-커밋>에 풀고
# current 링크를 바꾼다. 최근 5개만 남긴다.
set -euo pipefail

SERVER="${DEPLOY_SERVER:-dev-goraebap@220.80.109.248}"
PORT="${DEPLOY_PORT:-23022}"
SITE='~/sites/goraebap.xyz'
remote() { ssh -p "$PORT" "$SERVER" "$@"; }

if [ "${1:-}" = "--rollback" ]; then
  remote "set -e; cd $SITE; now=\$(readlink current); prev=\$(ls -1 releases | sort | grep -v \"^\${now#releases/}\$\" | tail -1);
    [ -n \"\$prev\" ] || { echo '되돌릴 배포가 없습니다'; exit 1; };
    ln -sfn releases/\$prev current.tmp && mv -T current.tmp current; echo \"current -> releases/\$prev\""
  exit 0
fi

REF="${1:-main}"
SHA=$(git rev-parse --short "$REF")
ID="$(date +%Y%m%d-%H%M%S)-$SHA"
WORK=$(mktemp -d)
trap 'git worktree remove --force "$WORK" >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

echo "빌드: $REF ($SHA)"
git worktree add --detach "$WORK" "$REF" >/dev/null
if [ -f "$WORK/client/package.json" ]; then
  (cd "$WORK/client" && npm ci --no-audit --no-fund >/dev/null && npm run blog:build >/dev/null)
  DIST="$WORK/client/apps/blog/dist"
else
  # client/로 옮기기 전의 구조(apps/site). main이 아직 이 구조다.
  (cd "$WORK" && npm ci --no-audit --no-fund >/dev/null && npm ci --prefix apps/site --no-audit --no-fund >/dev/null && npm run site:build >/dev/null)
  DIST="$WORK/apps/site/dist"
fi
[ -f "$DIST/index.html" ] || { echo "빌드 결과에 index.html이 없습니다"; exit 1; }

echo "올리기: releases/$ID"
tar -C "$DIST" -czf - . | remote "set -e; mkdir -p $SITE/releases/$ID; tar -xzf - -C $SITE/releases/$ID;
  cd $SITE; ln -sfn releases/$ID current.tmp && mv -T current.tmp current;
  ls -1 releases | sort | head -n -5 | while read old; do rm -rf \"releases/\$old\"; done;
  echo \"current -> \$(readlink current)\""
