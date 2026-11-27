#!/bin/sh
set -eu

# 로컬 개발 실행. blog(5175)와 프레임워크별 데모 앱(react-tanstack-demo:5176, angular-demo:5177)을 띄운다.
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
usage='사용법: sh dev.sh [all|blog|react-demo|angular-demo]'
mode=${1:-all}
if [ "$#" -gt 1 ]; then
  echo "$usage" >&2
  exit 2
fi

prepare_web() {
  if [ ! -d "$root/web/node_modules" ]; then
    echo 'web에서 pnpm install을 먼저 실행하세요.' >&2
    exit 1
  fi
}

prepare_web
cd "$root/web"

case "$mode" in
  blog)
    exec pnpm dev:blog
    ;;
  react-demo)
    exec pnpm dev:react-demo
    ;;
  angular-demo)
    exec pnpm dev:angular-demo
    ;;
  all)
    exec npx --yes concurrently@10.0.5 -k \
      -n blog,react-demo,angular-demo \
      -c green,cyan,magenta \
      'pnpm dev:blog' \
      'pnpm dev:react-demo' \
      'pnpm dev:angular-demo'
    ;;
  *)
    echo "$usage" >&2
    exit 2
    ;;
esac
