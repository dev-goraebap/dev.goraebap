#!/bin/sh
set -eu

# 로컬 개발 실행. blog는 서버 없이 혼자 뜨고, sso는 서버(API)와 함께 뜬다.
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
usage='사용법: sh dev.sh [all|blog|sso|server]'
mode=${1:-all}
if [ "$#" -gt 1 ]; then
  echo "$usage" >&2
  exit 2
fi

export SERVER_PORT=${SERVER_PORT:-8080}
export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}
export DEV_API_TARGET=${DEV_API_TARGET:-"http://localhost:$SERVER_PORT"}

gradle_args='bootRun --console=plain'
case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) gradle='gradlew.bat' ;;
  *) gradle='sh ./gradlew' ;;
esac

prepare_web() {
  if [ ! -d "$root/web/node_modules" ]; then
    echo 'web에서 pnpm install을 먼저 실행하세요.' >&2
    exit 1
  fi
}

case "$mode" in
  blog)
    prepare_web
    cd "$root/web"
    exec pnpm dev:blog
    ;;
  sso)
    prepare_web
    cd "$root/web"
    exec npx --yes concurrently@10.0.5 -k \
      -n server,sso \
      -c blue,magenta \
      "cd ../server && $gradle $gradle_args" \
      'node ../scripts/wait-for-server.mjs && pnpm dev:sso'
    ;;
  server)
    cd "$root/server"
    exec $gradle $gradle_args
    ;;
  all)
    prepare_web
    cd "$root/web"
    exec npx --yes concurrently@10.0.5 -k \
      -n server,sso,blog \
      -c blue,magenta,green \
      "cd ../server && $gradle $gradle_args" \
      'node ../scripts/wait-for-server.mjs && pnpm dev:sso' \
      'pnpm dev:blog'
    ;;
  *)
    echo "$usage" >&2
    exit 2
    ;;
esac
