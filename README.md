# JIN AIR TAG Announcement Player — 20261004.13

Static mobile-first airport announcement player for the JIN AIR TAG branch.

Current build: **20261004.13** with 16 standard announcements plus Custom Announcement.

## Files

- `index.html` — application shell and English UI
- `styles.css` — bundled local styling; no Tailwind Play CDN
- `app.js` — rendering, TTS, translation, playback, persistence, wake lock, and UI logic
- `data/announcements.js` — announcement wording and announcement-specific input rules
- `manifest.webmanifest` — PWA metadata
- `service-worker.js` — app-shell caching with network-first updates

## Announcement content

Operational announcement scripts remain in `data/announcements.js`. The Korean/English announcement wording is intentionally separate from the English application UI.

## Pull to Refresh in Home Screen App

Safari provides its own pull-to-refresh gesture in a normal browser tab. On iPhone/iPad Home Screen web apps, the app enables a custom pull-to-refresh gesture only when `navigator.standalone === true`. From the very top of the page, drag downward until `Release to refresh` appears, then release. The gesture can begin anywhere at the top of the page and does not require the TTS Start screen to have been dismissed. Detection uses both finger travel and iOS standalone rubber-band overscroll (`window.scrollY < 0`) so it does not depend on one WebKit overscroll behavior.

## Keep Screen Awake

The **Keep Screen Awake** switch uses the Screen Wake Lock API. It requires browser support and a secure context (normally HTTPS). When enabled, the preference is saved locally and the app attempts to reacquire the lock when the page becomes visible again.

## iPhone TTS voices

The app can only select voices that Safari/WebKit exposes through `speechSynthesis.getVoices()`. iPhone Safari may expose a limited subset of installed voices. The webpage cannot create or force additional native iOS voices. Adding third-party/cloud TTS would require a separate online TTS provider and a secure backend/serverless proxy for credentials.

## External dependency

Core UI and local device TTS do not require Tailwind, Google Fonts, or GitHub assets. The optional passenger-name translation feature uses the MyMemory web API and therefore requires internet access.


## Announcement 16 — Passenger Paging (General)

Announcement 16 supports:

- Destination buttons: ICN / PUS (synchronized with the top destination control)
- Passenger name input with optional Convert Name to Korean
- Independent name repeat count, default 2
- Location buttons: CNTR / GATE / CNTR or GATE
- Spoken Korean location mapping: 카운터 / 탑승구 / 카운터나 탑승구
- Default location: GATE
- Dynamic English reference


## 20261004.5 — header and codeshare controls

- The top-left brand now reads `JIN AIR`.
- `Keep Awake` has moved from Voice Engine Settings into the top header.
- A compact `Codeshare` toggle sits next to the flight selector.
- With Codeshare enabled, LJ044 shows `(KE5768)` beneath the primary flight number. LJ046 stays unchanged because no codeshare is configured for it.
- Korean templates that use `{flightNumber}` automatically expand LJ044 to `LJ044편, 공동운항 대한항공 KE5768편` in display text, while TTS receives pronunciation-optimized Korean.
- English references render LJ044 as `LJ044 (Korean Air codeshare KE5768)` when the option is enabled.
- The Codeshare preference is saved locally and remains enabled while switching flights; it only affects flights that have a configured codeshare mapping.


## 20261004.6 UI density update

- Codeshare sub-label is shown as `(KE5768)` without the `CS` prefix.
- Removed secondary announcement summaries and inline voice helper text.
- Removed duplicate Standard/Custom section headings.
- Input controls and their repeat controls are grouped into compact rows using derived announcement rules.
- Footer now uses the official `JIN AIR` spelling and includes the project URL and original creator credit.

## 20261004.7 settings and form alignment update

- Removed the duplicate `TTS SETTINGS` eyebrow; the section now uses one `Voice Engine Settings` heading.
- Korean Voice, English Voice, Speed, and Pitch each use a compact single-row layout.
- Announcements 5–9 now share the same boarding-category accent color.
- Repeat controls use the same external label placement as their paired input fields.
- Repeat controls are intentionally narrow so passenger-name, gate, floor, and time inputs receive most of the available width.



## 20261004.9 compact input refinements

- Custom Announcement now has a one-tap `✕ Clear` action with a one-step `↶ Undo` recovery.
- Name conversion is displayed as compact `A→가` and placed under the associated repeat control.
- Announcement 10 uses the shorter `New gate` label.
- Announcements 14 and 15 render Hour/Minute as one `Est. boarding time` control with an `HH : MM` visual layout.

## 20261004.9 passenger-name row alignment

- Passenger-name textareas in Announcements 2, 3, 9, and 16 now stretch vertically to align with the adjacent `Repeats` + `A→가` stack.
- No announcement wording, input semantics, repetition rules, or TTS behavior changed.


## 20261004.11 English PA reference rewrite

- Rewrote all available `Show English Reference` scripts in natural airport public-address English rather than line-by-line Korean translation.
- Added an English reference to Announcement 12 (Korean power-bank safety announcement).
- Announcement 13 remains unchanged because it is itself the operational English power-bank announcement, so a duplicate English reference is not added.
- Codeshare wording in English references now reads naturally as `LJ044, also operating as Korean Air flight KE5768`.
- Korean operational scripts and Korean TTS behavior are unchanged.
