## 2024-05-18 - Making Scrollable Areas Focusable
**Learning:** In React/Tauri applications where a custom scrollable container (`overflow-y: auto`) is used to display content (like a Markdown viewer), it is crucial to make the container itself focusable using `tabIndex={0}` and add a clear `:focus-visible` state. Without this, keyboard users cannot scroll the content if there are no interactive elements inside it. Assigning it a `role="region"` and an `aria-label` also ensures screen readers announce the area correctly.
**Action:** Always verify if a container with `overflow: auto/scroll` needs to be in the tab order for keyboard navigation, and style its `:focus-visible` state cleanly to match the design system.

## 2024-10-24 - Esc key shortcut for modal/dialog closing
**Learning:** Adding a keyboard shortcut (like `Esc`) to close an application or dialog significantly improves keyboard accessibility and power-user experience. However, when displaying a visual hint for the shortcut (e.g., `<kbd>Esc</kbd>`), it is crucial to update the `aria-label` on the corresponding interactive element (e.g., the Confirm button) to explicitly mention the shortcut (e.g., "확인 (Esc 눌러서 닫기)") so screen reader users are equally informed. Also, when writing the `useEffect` listener for the shortcut, any dependencies used inside the callback (like `handleClose` or Tauri's `invoke`) must be carefully managed to avoid stale closures or ESLint `react-hooks/exhaustive-deps` warnings; moving the `invoke` directly into the effect is often a cleaner pattern.
**Action:** When adding keyboard shortcuts for a specific action, always pair it with an updated `aria-label` on the primary button for that action, and ensure hook dependencies are perfectly clean.

## 2024-11-20 - Accessible loading states for Mermaid diagrams
**Learning:** When asynchronously generating complex components like Mermaid diagrams, intermediate loading states (showing raw chart code) can confuse screen readers. Additionally, replacing weak pseudo-random id generation (`Math.random()`) with `crypto.randomUUID()` ensures robust collision-free execution for tools like mermaid renderer.
**Action:** Always wrap dynamically rendered async diagram containers with `role="figure"`, an appropriate `aria-label`, and `aria-busy={!loaded}`. Most importantly, apply `aria-hidden="true"` to the raw code fallback during loading to ensure screen readers do not announce the unparsed syntax.
## 2024-05-18 - [Tauri App Asynchronous UI States]
**Learning:** Desktop application users expect immediate visual feedback when triggering system actions (like closing an app window). A lack of visual state change when clicking "Confirm" creates ambiguity about whether the action was registered, especially when Tauri IPC commands have slight asynchronous delays.
**Action:** When implementing desktop app interactions involving IPC, always provide intermediate loading states (e.g., changing button text to "닫는 중..." and disabling the button) to prevent duplicate actions and assure the user the system is responding.

## 2024-04-04 - External Link UX Enhancement
**Learning:** Found that `<ReactMarkdown>` intercepts link rendering but standard Markdown links in desktop apps (like Tauri) can inadvertently replace the UI content with external sites without a way back. Users might get stuck. By providing explicit `target="_blank"` and visual hints via `lucide-react` icons and `:focus-visible`, we prevent navigation traps and improve accessibility.
**Action:** When adding links in desktop contexts, intercept them to ensure they break out safely.

## 2024-11-25 - Scrollable content containers accessibility
**Learning:** Any HTML element that is styled to be horizontally or vertically scrollable (like `<pre>` code blocks or `.mermaid-wrapper` using `overflow: auto`) must have `tabIndex={0}` if its content can exceed the viewport. Otherwise, keyboard-only users have no way to focus the container and scroll the content using arrow keys.
**Action:** When creating components that can contain wide content (like Markdown viewers, code blocks, or data tables) with `overflow-x: auto`, always add `tabIndex={0}`, an appropriate `role` (like `region` or `figure`), an `aria-label`, and clear `:focus-visible` styles to ensure it can be scrolled by keyboard navigation.
