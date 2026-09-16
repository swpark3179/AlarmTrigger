# AlarmTrigger

지정한 알람 내용을 마크다운으로 렌더링해 화면 맨 앞에 띄워 주는 Windows용 알람 표시 프로그램입니다.
외부 스케줄러(예: Windows 작업 스케줄러)가 알람 ID를 인자로 넘겨 실행하면,
`%USERPROFILE%\.alarm` 폴더의 알람 정보를 읽어 항상 위에 뜨는 창으로 보여 줍니다.

- Tauri 2 + React + TypeScript
- 설치가 필요 없는 Windows 단일 실행 파일(.exe)
- GFM 표, 코드 블록 복사 버튼, Mermaid 다이어그램 지원

## 사용법

### 1단계. 다운로드 후 파일명을 `Trigger.exe`로 변경

[Releases](https://github.com/swpark3179/AlarmTrigger/releases) 페이지에서 `alarm-trigger-standalone.exe`를 내려받은 뒤,
**반드시 파일명을 `Trigger.exe`로 변경**합니다.

```text
alarm-trigger-standalone.exe   →   Trigger.exe
```

> 스케줄러 등록 명령과 이 문서의 모든 예시는 실행 파일 이름이 `Trigger.exe`라고 가정합니다.

### 2단계. 실행 파일 배치

`Trigger.exe`를 원하는 폴더에 둡니다. 알람 데이터 폴더와 같은 곳에 두면 관리가 편합니다.

```text
C:\Users\<사용자>\.alarm\Trigger.exe
```

### 3단계. 알람 데이터 폴더 준비

홈 폴더(`%USERPROFILE%`) 아래에 `.alarm` 폴더를 만듭니다. 프로그램은 이 폴더만 읽습니다.

```text
%USERPROFILE%\.alarm\
├── Trigger.exe        (2단계에서 배치한 실행 파일)
├── alarms.json        (알람 목록 - 창 제목을 여기서 가져옵니다)
└── <알람ID>.md        (알람별 본문 마크다운)
```

### 4단계. `alarms.json` 작성

```json
[
  {
    "id": "morning_meeting",
    "title": "아침 회의",
    "repeat_type": "Daily",
    "enabled": true
  },
  {
    "id": "medicine",
    "title": "약 먹기",
    "repeat_type": "None",
    "enabled": true
  }
]
```

| 필드 | 설명 |
| --- | --- |
| `id` | 알람 식별자. 실행 인자 및 본문 파일 이름(`<id>.md`)으로 쓰입니다. **영문·숫자·`-`·`_`만 사용**하세요. |
| `title` | 알람 창 상단에 표시할 제목. 일치하는 `id`가 없으면 `제목없음`으로 표시됩니다. |
| `repeat_type` | 반복 종류. `"None"` 또는 `null`이면 1회성 알람입니다. |
| `enabled` | 알람 사용 여부. |

> 1회성 알람(`repeat_type`이 `"None"` 또는 `null`)은 창이 뜬 뒤 `alarms.json`의 해당 항목이
> 자동으로 `"enabled": false`로 바뀝니다.

### 5단계. 알람 본문 작성

`.alarm` 폴더에 `<알람ID>.md` 파일을 만듭니다. 위 예시라면 `morning_meeting.md`입니다.

```markdown
# 아침 회의 준비

- [ ] 어제 진행 상황 정리
- [ ] 공유할 지표 확인

| 항목 | 담당 |
| --- | --- |
| 배포 일정 | 홍길동 |
```

표, 코드 블록(복사 버튼 제공), Mermaid 다이어그램(`mermaid` 코드 블록)을 사용할 수 있습니다.
`<알람ID>.md`가 없으면 제목만 있는 창이 열립니다.

### 6단계. 실행

명령 프롬프트나 스케줄러에서 알람 ID를 인자로 넘겨 실행합니다.

```bat
%USERPROFILE%\.alarm\Trigger.exe morning_meeting
```

창은 **ESC 키** 또는 **확인 버튼**으로 닫습니다.

### 7단계. (선택) 작업 스케줄러 등록

매일 정해진 시각에 띄우려면 Windows 작업 스케줄러에 등록합니다.

```bat
schtasks /create /tn "AlarmTrigger - morning_meeting" /tr "\"%USERPROFILE%\.alarm\Trigger.exe\" morning_meeting" /sc daily /st 09:00
```

## 문제 해결

### `WebView2Loader.dll이(가) 없어 코드 실행을 진행할 수 없습니다.`

v1.0.8 이하 릴리스는 MinGW(GNU) 툴체인으로 빌드되어 WebView2 로더를 외부 DLL(`WebView2Loader.dll`)로
동적 참조했기 때문에, 실행 파일 하나만 내려받으면 이 오류가 발생합니다.

**v1.0.8 이후 릴리스의 `alarm-trigger-standalone.exe`를 내려받아 다시 사용하세요.**
MSVC 툴체인으로 빌드되어 WebView2 로더가 실행 파일 안에 정적으로 포함되므로 별도 DLL이 필요 없습니다.

### 그 밖의 실행 오류

| 증상 | 해결 |
| --- | --- |
| WebView2 런타임 관련 오류로 창이 뜨지 않음 | [Microsoft Edge WebView2 런타임](https://developer.microsoft.com/microsoft-edge/webview2/)을 설치하세요. Windows 10·11에는 대부분 기본 포함되어 있습니다. |
| `VCRUNTIME140.dll을 찾을 수 없습니다` | [Microsoft Visual C++ 재배포 가능 패키지(x64)](https://aka.ms/vs/17/release/vc_redist.x64.exe)를 설치하세요. |
| SmartScreen 경고 창 | 서명되지 않은 실행 파일이라 나타납니다. `추가 정보` → `실행`을 선택하세요. |
| 제목이 `제목없음`으로 표시됨 | `alarms.json`의 `id`와 실행 인자가 일치하는지 확인하세요. |
| 본문이 비어 있음 | `.alarm` 폴더에 `<알람ID>.md`가 있는지, 알람 ID에 영문·숫자·`-`·`_` 외의 문자가 없는지 확인하세요. |

## 개발

### 요구 사항

- Node.js 24 이상
- Rust (stable)
- Windows: [MSVC 빌드 도구](https://visualstudio.microsoft.com/visual-cpp-build-tools/), WebView2 런타임

### 명령어

```bash
npm install          # 의존성 설치
npm run tauri dev    # 개발 모드 실행
npm test             # 프런트엔드 테스트 (vitest)
cargo test --manifest-path src-tauri/Cargo.toml   # Rust 테스트
npm run tauri build -- --target x86_64-pc-windows-msvc --no-bundle   # 단일 exe 빌드
```

개발 모드는 알람 ID 인자 없이 실행되므로 창 제목이 `제목없음`으로 표시됩니다.
특정 알람 데이터를 확인하려면 빌드한 실행 파일에 알람 ID를 인자로 넘겨 실행하세요.

### 릴리스

`v*` 태그를 푸시하거나 `Release` 워크플로를 수동 실행하면
`.github/workflows/release.yml`이 `windows-latest`에서 `x86_64-pc-windows-msvc` 타깃으로 빌드하고,
`WebView2Loader.dll` 동적 의존성이 없는지 검증한 뒤 `alarm-trigger-standalone.exe`를 릴리스에 첨부합니다.

### 권장 IDE 설정

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
