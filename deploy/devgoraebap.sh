#!/usr/bin/env bash
# dev.goraebap.xyz를 홈서버에 배포한다. 저장소 루트에서 실행한다.
#
#   deploy/devgoraebap.sh            main을 빌드해 배포
#   deploy/devgoraebap.sh <ref>      브랜치나 커밋을 빌드해 배포
#   deploy/devgoraebap.sh --local    현재 작업 트리를 그대로 빌드해 배포
#   deploy/devgoraebap.sh --rollback 바로 전 배포로 되돌림
#
# 기본 모드에서는 작업 폴더와 상관없이 <ref>를 임시 worktree에 꺼내 빌드한다.
# 서버에는 releases/<시각-커밋>에 풀고 current 링크를 바꾼다. 최근 5개만 남긴다.
set -euo pipefail

ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  . "$ENV_FILE"
fi
SERVER="${DEPLOY_SERVER:?deploy/.env에 DEPLOY_SERVER를 설정하세요}"
PORT="${DEPLOY_PORT:?deploy/.env에 DEPLOY_PORT를 설정하세요}"
SITE='~/sites/dev.goraebap.xyz'
remote() { ssh -p "$PORT" "$SERVER" "$@"; }

if [ "${1:-}" = "--rollback" ]; then
  remote "set -e; cd $SITE; now=\$(readlink current); prev=\$(ls -1 releases | sort | grep -v \"^\${now#releases/}\$\" | tail -1);
    [ -n \"\$prev\" ] || { echo '되돌릴 배포가 없습니다'; exit 1; };
    ln -sfn releases/\$prev current.tmp && mv -T current.tmp current; echo \"current -> releases/\$prev\""
  exit 0
fi

if [ "${1:-}" = "--local" ]; then
  SHA="$(git rev-parse --short HEAD)-local"
  ID="$(date +%Y%m%d-%H%M%S)-$SHA"
  echo "로컬 빌드: $SHA"
  pnpm --dir web --filter @goraebap/devgoraebap typecheck
  pnpm --dir web --filter @goraebap/devgoraebap build
  DIST="web/apps/devgoraebap/dist"
else
  REF="${1:-main}"
  SHA=$(git rev-parse --short "$REF")
  ID="$(date +%Y%m%d-%H%M%S)-$SHA"
  WORK=$(mktemp -d)
  trap 'git worktree remove --force "$WORK" >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

  echo "빌드: $REF ($SHA)"
  git worktree add --detach "$WORK" "$REF" >/dev/null
  (cd "$WORK/web" && pnpm install --frozen-lockfile >/dev/null && pnpm --filter @goraebap/devgoraebap build >/dev/null)
  DIST="$WORK/web/apps/devgoraebap/dist"
fi

[ -f "$DIST/index.html" ] || { echo "빌드 결과에 index.html이 없습니다"; exit 1; }

echo "올리기: releases/$ID"
tar -C "$DIST" --exclude='./brand-drafts' --exclude='brand-drafts' -czf - . | remote "set -e; mkdir -p $SITE/releases/$ID; tar -xzf - -C $SITE/releases/$ID;
  cd $SITE; ln -sfn releases/$ID current.tmp && mv -T current.tmp current;
  ls -1 releases | sort | head -n -5 | while read old; do rm -rf \"releases/\$old\"; done;
  echo \"current -> \$(readlink current)\""
