# Changelog

## 20261004.17

- Gate-number pronunciation is now deterministic in Korean TTS: numeric counters such as `7번` are converted only for speech to `칠 번` (and similarly `1번` → `일 번`, `8번` → `팔 번`, `10번` → `십 번`).
- The visible announcement text remains numeric (`7번`), while the speech string uses the explicit Sino-Korean reading.
- This also covers hard-coded gate references such as Gate 7 in Announcement 11, preventing Android TTS from choosing context-dependent native-Korean readings such as `일곱 번`.


## 20261004.16

- Prioritized Android broadcast audio quality over display-only tracking: Android tracking segmentation now occurs only at true sentence endings, never arbitrary mid-sentence word boundaries.
- Retained the weighted/adaptive progress fallback and real `boundary` priority to keep Android highlighting reasonably accurate without choppy speech.
- Added startup announcement-template linting and playback blocking for unknown/unresolved `{token}` placeholders.
- Made Announcement 16 destination local to that card so paging ICN/PUS changes cannot accidentally change the global destination for later operational broadcasts.
- Hardened MyMemory name conversion: 10-second timeout, quota/warning/status checks, and protection against writing warning text into the passenger-name field.
- Voice selection now uses `voiceURI` when available and distinguishes duplicate same-name voices; legacy name-based saved preferences still migrate.
- Added `kor`/`eng` locale fallback only when exact `ko`/`en` voices are absent.
- Fixed Custom Announcement replay during the 450 ms post-finish UI window.
- Pull-to-refresh no longer activates while speech is playing/paused and ignores gestures on form controls such as sliders, inputs, textareas, and selects.
- Avoids unnecessary `speechSynthesis.cancel()` while idle and adds a short guard after real cancellation before starting the next utterance.
- Repeat +/- targets are at least 24 CSS px wide.
- Service-worker network fetches request revalidation (`cache: no-cache`) and app-shell installation uses reload semantics to reduce stale deployments.
- Existing Korean announcement wording and English Reference scripts are unchanged.

## 20261004.14

- Fixed Android/Chromium voice filtering so language matching uses exact BCP-47 base tags. `Konkani India (kok_IN)` is no longer incorrectly listed as a Korean voice; `ko`, `ko-KR`, and `ko_KR` remain valid Korean tags.
- Added a hybrid speech-progress tracker for Android/Google TTS engines that do not emit reliable `SpeechSynthesisUtterance.boundary` events.
  - Real boundary `charIndex` remains authoritative whenever the browser provides it.
  - If boundary events stop arriving, an adaptive time-based fallback advances the progress bar and current-word highlight.
  - The fallback pauses/resumes with TTS playback and learns approximate per-language timing from completed segments for later announcements.
  - A backup start path covers engines that omit the utterance `start` event as well.
- Announcement text, English references, inputs, repetition rules, codeshare data, and UI layout are unchanged from 20261004.13.

## 20261004.13
- Reworked iOS Home Screen pull-to-refresh after the previous gesture failed on real-device testing.
- Custom pull-to-refresh now targets iOS standalone mode specifically via `navigator.standalone`.
- Removed the previous TTS-unlocked requirement and interactive-control exclusion, so a pull can start anywhere at the top of the page, including before pressing Start.
- Gesture tracking now binds to `window`, uses touch `screenY`, and also detects iOS standalone rubber-band overscroll via negative `window.scrollY`.
- Refresh detection no longer depends on `preventDefault()` succeeding; both direct touch distance and native overscroll distance can arm the refresh.
- Existing announcement scripts and TTS behavior are unchanged.

## 20261004.12
- Added a custom pull-to-refresh gesture for installed/standalone Home Screen web-app mode.
- Safari browser tabs continue using Safari's native pull-to-refresh; the custom gesture activates only in standalone mode.
- Added a compact `Pull to refresh` / `Release to refresh` / `Refreshing…` indicator below the sticky header.
- Refresh triggers only when the page is already at the top and the downward pull crosses the threshold.
- Interactive controls are excluded from gesture start to avoid accidental refreshes while adjusting settings or editing inputs.
- No announcement scripts or TTS behavior changed.

## 20261004.11
- Changed Announcement 16 UI field label from `Location` to `Proceed to`.
- Announcement scripts, English Reference, location options, and TTS behavior are unchanged.

## 20261004.10

- Rewrote all `Show English Reference` scripts as natural airport PA announcements rather than literal Korean translations.
- Standardized common PA phraseology such as final boarding calls, passenger paging, gate-change announcements, pre-boarding invitations, and delay updates.
- Added an English reference for Announcement 12 while leaving Announcement 13's operational English broadcast unchanged.
- Improved English codeshare wording to `LJ044, also operating as Korean Air flight KE5768`.
- Korean announcement templates, inputs, repetition rules, and Korean TTS behavior remain unchanged.

## 20261004.9

- Increased the effective passenger-name textarea height for Announcements 2, 3, 9, and 16.
- Name textareas now stretch to match the full height of the adjacent `Repeats` + `A→가` controls, keeping the lower edges aligned.
- No announcement text or TTS logic changed.

## 20261004.8

- Added a compact Custom Announcement `✕ Clear` action with one-step `↶ Undo`.
- Replaced the long visible name-conversion label with `A→가` and moved it below the matching repeat control.
- Shortened Announcement 10 gate input label to `New gate`.
- Combined Announcement 14/15 hour and minute inputs under one `Est. boarding time` label with a visual colon separator.
- No operational announcement wording or TTS templates were changed.

## 20261004.7

- Removed the duplicate `TTS SETTINGS` heading and kept a single `Voice Engine Settings` title.
- Compressed Korean/English voice selectors and Speed/Pitch controls into one row each.
- Unified Announcements 5–9 under the same boarding accent color.
- Redesigned repeat controls with external labels aligned to normal input labels.
- Reduced repeat-control width so linked passenger-name/gate/time inputs receive substantially more horizontal space.

## 20261004.6

- Compact codeshare label: `(KE5768)` instead of a separate `CS` line.
- Removed card summary subtitles and voice helper text.
- Simplified duplicate Standard Announcements / Custom Announcement headings.
- Grouped linked input fields and repeat controls into compact rows.
- Standardized visible/PWA branding to `JIN AIR`.
- Restored project URL and creator credit in the footer.

## 20261004.5

- Moved the `Keep Awake` control into the top header next to the branch branding.
- Changed the top-left brand label from `JINAIR` to `JIN AIR`.
- Added a persistent `Codeshare` toggle next to the flight selector.
- LJ044 now displays `CS KE5768` when Codeshare is enabled; LJ046 remains unchanged.
- Korean flight-number placeholders automatically include `공동운항 대한항공 KE5768` for LJ044 when Codeshare is enabled, including pronunciation-optimized TTS text.
- English references also include the Korean Air codeshare flight where applicable.
- Added a data-level `codeshares` mapping so future codeshare flights can be maintained without editing announcement templates.

## 20261004.4

- Added Announcement 16: **Passenger Paging (General)**.
- Added per-announcement ICN/PUS destination buttons synchronized with the top destination selector.
- Added passenger-name input, MyMemory name conversion, and independent name repeat control (default: 2).
- Added location buttons: **CNTR**, **GATE**, and **CNTR or GATE**; spoken Korean values are **카운터**, **탑승구**, and **카운터나 탑승구**. Default location is **GATE**.
- Added a dynamic English reference for Announcement 16.
- Added reusable data-driven `destination` and `choice` input types for future announcements.
- Existing Announcements 1–15 remain unchanged.

## 20261004.3

- Converted all application UI text to English while preserving announcement scripts in their original operational language.
- Removed the KO/EN detected-voice count indicator from the Voice Engine Settings header.
- Simplified destination buttons to `ICN` and `PUS` only; Korean airport names are still retained internally for Korean announcement generation.
- Added a **Keep Screen Awake** option using the Screen Wake Lock API.
  - Preference is stored locally.
  - The lock is requested after the app is started.
  - The app attempts to reacquire it when returning to the visible page.
  - Unsupported/insecure environments show the option as unavailable.
- Added English UI labels, validation messages, playback controls, guide text, translation controls, and modal messages.
- Kept Korean pronunciation logic and Korean TTS preview speech unchanged because those are speech behavior rather than UI language.
- Updated the service-worker cache version to `lj-tag-ann-v20261004-3`.

## 20261004.2

- Added category icons and accent colors to announcement headers.
- Opening an announcement aligns its header below the sticky flight/destination header.
- Disabled page zoom/pinch zoom for the operational mobile UI.
- Shortened the settings title.

## 20261004.1

- Initial rebuilt production-oriented version using external announcement data, local CSS, improved TTS segmentation, persistence, PWA support, and restored production announcement wording.
