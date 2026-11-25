# 이슈 트래커: GitHub

이 저장소의 이슈와 명세는 GitHub Issues(`dev-goraebap/dev.goraebap`)에 둡니다. 모든 작업은 `gh` CLI로 합니다. `gitea` 원격은 미러이므로 이슈를 남기지 않습니다.

## 사용법

- **이슈 만들기**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc으로 넘깁니다.
- **이슈 읽기**: `gh issue view <번호> --json number,title,body,labels,comments`.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`에 필요한 `--label`, `--state` 필터를 붙입니다.
- **하위 이슈로 잇기**: `gh issue create --parent <부모> ...`로 만들거나, 만든 뒤 `gh issue edit <부모> --add-sub-issue <자식>`으로 잇습니다(`gh` 2.94 이상). 그보다 낮은 `gh`에서는 `gh api --method POST repos/<owner>/<repo>/issues/<부모>/sub_issues -F sub_issue_id=<자식 데이터베이스 id>`를 씁니다(id는 아래 **막힘**과 같은 데이터베이스 id). 하위 이슈를 쓸 수 없으면 자식 본문 맨 위에 `Part of #<부모>`를 적습니다.
- **댓글 달기**: `gh issue comment <번호> --body "..."`.
- **라벨 붙이기·떼기**: `gh issue edit <번호> --add-label "..."` / `--remove-label "..."`.
- **닫기**: `gh issue close <번호> --comment "..."`.

저장소는 `git remote -v`에서 정해지며, 클론 안에서 실행하면 `gh`가 알아서 찾습니다.

## PR을 triage 대상으로 보기

**PR을 요청 창구로 봄: no.** _(외부 PR을 기능 요청으로 다루려면 `yes`로 바꿉니다. `/triage`가 이 값을 읽습니다.)_

`yes`이면 PR도 이슈와 같은 라벨과 상태를 거치며 `gh pr` 명령을 씁니다.

- **PR 읽기**: `gh pr view <번호> --comments`, 변경은 `gh pr diff <번호>`.
- **triage할 외부 PR 목록**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **댓글·라벨·닫기**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub는 이슈와 PR이 번호를 함께 쓰므로 `#42`만으로는 어느 쪽인지 모릅니다. `gh pr view 42`로 확인하고, 없으면 `gh issue view 42`를 봅니다.

## 스킬이 "이슈 트래커에 올리라"고 할 때

GitHub 이슈를 만듭니다.

## 스킬이 "관련 티켓을 가져오라"고 할 때

위 **이슈 읽기**대로 읽습니다.

## 길찾기 운영

`/wayfinder`가 씁니다. **지도**는 이슈 하나이고, 그 **자식** 이슈가 티켓입니다.

- **지도**: `wayfinder:map` 라벨을 단 이슈 하나에 Notes / Decisions-so-far / Fog 본문을 둡니다. `gh issue create --label wayfinder:map`.
- **자식 티켓**: GitHub 하위 이슈로 지도에 잇습니다(**하위 이슈로 잇기** 참고). 하위 이슈를 쓸 수 없으면 지도 본문의 작업 목록에 넣고 자식 본문 맨 위에 `Part of #<지도>`를 적습니다. 라벨은 `wayfinder:<유형>`(`research`/`prototype`/`grilling`/`task`)입니다. 맡으면 작업하는 개발자에게 배정합니다.
- **막힘**: GitHub **기본 이슈 의존 관계**가 원본이며 화면에도 보입니다. `gh api --method POST repos/<owner>/<repo>/issues/<자식>/dependencies/blocked_by -F issue_id=<막는 이슈 데이터베이스 id>`로 잇습니다. 데이터베이스 id는 `gh api repos/<owner>/<repo>/issues/<n> --jq .id`로 얻으며 `#번호`나 `node_id`가 아닙니다. GitHub는 `issue_dependencies_summary.blocked_by`(열린 막는 이슈 수)를 알려 주며, 이것이 실제 관문입니다. 의존 관계를 쓸 수 없으면 자식 본문 맨 위에 `Blocked by: #<n>, #<n>`을 적습니다. 막는 이슈가 모두 닫히면 풀립니다.
- **다음 일 찾기**: 지도의 열린 자식(`gh issue list --state open`, 지도의 하위 이슈·작업 목록 범위)에서 열린 막는 이슈가 있거나(`issue_dependencies_summary.blocked_by > 0`, 또는 `Blocked by` 줄에 열린 이슈) 담당자가 있는 것을 뺍니다. 지도 순서로 첫 번째를 고릅니다.
- **맡기**: `gh issue edit <n> --add-assignee @me`를 세션의 첫 쓰기로 합니다.
- **풀기**: `gh issue comment <n> --body "<답>"` 후 `gh issue close <n>`을 하고, 지도의 Decisions-so-far에 요지와 링크를 덧붙입니다.
