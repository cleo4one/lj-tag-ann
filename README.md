# JIN AIR TAG Announcement Player — 20261004.17

Static mobile-first airport announcement player for the JIN AIR TAG branch.

Current build: **20261004.17** with 16 standard announcements plus Custom Announcement.

Gate numbers are spoken with deterministic Sino-Korean numerals for Korean TTS (for example, `7번` is spoken as `칠 번`) while the on-screen script remains numeric.

## Files

- `index.html` — application shell and English UI
- `styles.css` — bundled local styling; no Tailwind Play CDN
- `app.js` — rendering, TTS, translation, playback, persistence, wake lock, pull-to-refresh, and UI logic
- `data/announcements.js` — announcement wording and announcement-specific input rules
- `manifest.webmanifest` — PWA metadata
- `service-worker.js` — app-shell caching with network-first updates

## Android TTS progress/highlight

Some Android/Chromium TTS engines speak normally without reliable `SpeechSynthesisUtterance.boundary` callbacks. The player therefore uses a hybrid tracker:

- real `boundary`/`charIndex` data is authoritative whenever available;
- when boundary data is absent, a weighted timing model estimates the current position;
- completed speech segments calibrate the estimate for the current device/voice;
- on Android, additional synchronization anchors are allowed **only at real sentence endings**. The app no longer splits speech at arbitrary mid-sentence word boundaries, so display tracking does not intentionally sacrifice broadcast prosody.

Exact word-perfect highlighting cannot be guaranteed when the browser/TTS engine exposes no word timing.

## Voice selection

Voice selection is stored by `SpeechSynthesisVoice.voiceURI` when available, so voices that share the same human-readable name can still be selected independently. Legacy name-based preferences are migrated automatically.

Korean/English locale matching uses exact two-letter base tags (`ko`, `en`). If a device exposes no exact match, the app falls back to known three-letter bases (`kor`, `eng`) without reintroducing the old Konkani `kok_IN` false match.

## Announcement data safety

Announcement templates are linted at app startup. Unknown `{token}` placeholders are logged and playback for the affected announcement is blocked. Playback also performs a final unresolved-token check before speaking.

## Announcement 16 — Passenger Paging (General)

Announcement 16 has its own local ICN/PUS destination selection. It starts with the current header destination when the page is rendered, but changing the paging destination does **not** change or save the global destination used by the other announcements.

It also provides passenger-name conversion/repetition and CNTR / GATE / CNTR or GATE location choices.

## Name conversion

`A→가` uses the MyMemory web API and requires internet access. The app rejects quota/warning responses, times out after about 10 seconds, and never writes a MyMemory warning string into the passenger-name field.

## Pull to Refresh in iOS Home Screen mode

Normal Safari uses Safari's native pull-to-refresh. The installed iOS Home Screen app uses a custom gesture when `navigator.standalone === true`.

- Pull-to-refresh is disabled while an announcement is playing or paused.
- Gestures that start on form controls such as sliders, inputs, textareas, or selects are ignored so editing/settings interactions are not intercepted.

## Keep Screen Awake

The `Keep Awake` switch uses the Screen Wake Lock API and normally requires HTTPS. The preference is stored locally and the app attempts to reacquire the lock when the page becomes visible again.

## Offline/update behavior

Core UI and local-device TTS have no Tailwind, Google Fonts, or GitHub-asset dependency. The service worker uses network-first requests with cache revalidation and an offline cache fallback. New app-shell files are installed with cache reload semantics to reduce stale deployments.

## iPhone TTS voices

The app can only select voices exposed by Safari/WebKit through `speechSynthesis.getVoices()`. The page cannot force additional native iOS voices to appear. A third-party/cloud TTS engine would require an online provider and a secure backend/serverless proxy for credentials.
