# Claude Code용 스킬 사본은 커밋하지 않고 시작 훅이 만든다

원본은 `.agents/skills/`만 커밋하고, Claude Code가 읽는 `.claude/skills/`는 gitignore한 뒤 SessionStart 훅의 한 줄 `npx -y skills@1.7.2 add ./.agents/skills --skill "*" -a claude-code --copy -y`가 만듭니다. Codex·Cursor·Antigravity·Gemini CLI 등은 `.agents/skills/`를 바로 읽으므로 사본이 필요한 쪽은 Claude Code뿐입니다. 원본에서 지운 스킬·파일이 로컬 사본에 남을 수 있지만, 커밋에 섞이지 않고 라우터가 가리키지 않으면 읽히지 않습니다.

## 검토한 안

- **사본도 커밋**: 같은 파일이 두 벌이고 갱신 diff가 두 배가 됩니다.
- **심볼릭 링크 커밋**: Windows에서 개발자 모드와 `core.symlinks=true`가 없으면 링크가 글자 파일로 받아져 깨집니다.
- **동기화 스크립트를 프로젝트마다 설치**: 스크립트를 고쳐도 이미 받은 프로젝트에는 퍼지지 않습니다.
