#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
usage='사용법: sh dev.sh [all|blog|devgoraebap|accounts|productivity|server]'
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
  devgoraebap)
    prepare_web
    cd "$root/web"
    exec pnpm dev:devgoraebap
    ;;
  accounts)
    prepare_web
    cd "$root/web"
    exec npx --yes concurrently@10.0.5 -k \
      -n server,accounts \
      -c blue,magenta \
      "cd ../server && $gradle $gradle_args" \
      'node ../scripts/wait-for-server.mjs && pnpm dev:accounts'
    ;;
  productivity)
    prepare_web
    cd "$root/web"
    exec npx --yes concurrently@10.0.5 -k \
      -n server,productivity \
      -c blue,yellow \
      "cd ../server && $gradle $gradle_args" \
      'node ../scripts/wait-for-server.mjs && pnpm dev:productivity'
    ;;
  server)
    cd "$root/server"
    exec $gradle $gradle_args
    ;;
  all)
    prepare_web
    cd "$root/web"
    exec npx --yes concurrently@10.0.5 -k \
      -n server,accounts,productivity \
      -c blue,magenta,yellow \
      "cd ../server && $gradle $gradle_args" \
      'node ../scripts/wait-for-server.mjs && pnpm dev:accounts' \
      'node ../scripts/wait-for-server.mjs && pnpm dev:productivity'
    ;;
  *)
    echo "$usage" >&2
    exit 2
    ;;
esac
