if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    let voices = [];
    let isUnlocked = false;
    let keepAliveInterval = null;
    let currentUtterances = [];
    let activePlayerUI = null;

    const ICONS = {
        PLAY: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6.3 4.99C5.57 4.54 4.5 5.09 4.5 5.95v8.11c0 .86 1.07 1.4 1.8.95l6.93-4.05a1.14 1.14 0 0 0 0-1.9L6.3 4.99z"></path></svg>`,
        PAUSE: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>`,
        STOP: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 5h10v10H5V5z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>`,
        PREVIEW: `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        RESET: `<svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 4.5V8.5H17.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.34 14.57A8 8 0 1 1 20.5 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="12" y="15.5" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="currentColor">1</text></svg>`
    };
    
    const airportNames = { ICN: '인천', PUS: '부산' };
    
    // Element Caching
    const header = document.getElementById('controls-header');
    const mainContent = document.querySelector('main');
    const refreshIndicator = document.getElementById('refresh-indicator');
    const voiceSelectKo = document.getElementById('voice-select-ko');
    const voiceSelectEn = document.getElementById('voice-select-en');
    const rateInput = document.getElementById('rate');
    const rateValue = document.getElementById('rate-value');
    const pitchInput = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitch-value');
    const flightSelect = document.getElementById('flight-select');
    const destSelect = document.getElementById('dest-select');
    const modal = document.getElementById('alert-modal');
    const modalText = document.getElementById('modal-text');
    const modalClose = document.getElementById('modal-close');
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const startBtnText = document.getElementById('start-btn-text');
    const startLoader = document.getElementById('start-loader');
    const customTextarea = document.getElementById('text-to-read');
    const customTextDisplay = document.getElementById('custom-text-display');

    function showModal(message) {
        modalText.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function wakeUpSpeechSynth() {
        if (isUnlocked && !synth.speaking) {
            console.log("Waking up Speech Synthesis engine...");
            synth.cancel();
            const silentUtterance = new SpeechSynthesisUtterance(" ");
            silentUtterance.volume = 0;
            synth.speak(silentUtterance);
        }
    }

    function initializeApp() {
        loadVoices().then(() => {
            isUnlocked = true;
            startOverlay.classList.add('hidden');
            
            if (keepAliveInterval) clearInterval(keepAliveInterval);
            keepAliveInterval = setInterval(wakeUpSpeechSynth, 10000);

        }).catch(err => {
            console.error(err);
            showModal("Failed to load voices. Please refresh the page.");
            startBtn.disabled = false;
            startLoader.style.display = 'none';
            startBtnText.textContent = 'Retry';
        });

        const unlockUtterance = new SpeechSynthesisUtterance(' ');
        unlockUtterance.volume = 0;
        synth.speak(unlockUtterance);
    }

    function loadVoices() {
        return new Promise((resolve, reject) => {
            let voiceLoadAttempt = 0;
            const maxAttempts = 100;
            const tryToGetVoices = () => {
                voices = synth.getVoices().sort((a, b) => a.name.localeCompare(b.name));
                if (voices.length > 0) {
                    populateVoiceList();
                    resolve();
                } else {
                    voiceLoadAttempt++;
                    if (voiceLoadAttempt < maxAttempts) {
                        setTimeout(tryToGetVoices, 100);
                    } else {
                        reject(new Error("Voice loading timed out."));
                    }
                }
            };
            if (synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = tryToGetVoices;
            }
            tryToGetVoices();
        });
    }
    
    function initializeStaticUI() {
        document.querySelectorAll('.btn-play-pause').forEach(btn => btn.innerHTML = ICONS.PLAY);
        document.querySelectorAll('.btn-stop').forEach(btn => btn.innerHTML = ICONS.STOP);
        document.getElementById('preview-ko-voice').innerHTML = ICONS.PREVIEW;
        document.getElementById('preview-en-voice').innerHTML = ICONS.PREVIEW;
        document.getElementById('preview-rate').innerHTML = ICONS.PREVIEW;
        document.getElementById('preview-pitch').innerHTML = ICONS.PREVIEW;
        document.getElementById('reset-rate').innerHTML = ICONS.RESET;
        document.getElementById('reset-pitch').innerHTML = ICONS.RESET;
    }

    function updateMainContentPadding() {
        const headerHeight = header.offsetHeight;
        mainContent.style.paddingTop = `${headerHeight + 16}px`;
    }

    function populateVoiceList() {
        const savedKoVoice = localStorage.getItem('tts-ko-voice');
        const savedEnVoice = localStorage.getItem('tts-en-voice');
        const savedFlight = localStorage.getItem('tts-flight');
        const savedDest = localStorage.getItem('tts-dest');
        
        voiceSelectKo.innerHTML = '';
        voiceSelectEn.innerHTML = '';

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name}`;
            option.value = voice.name;
            if (voice.lang.toLowerCase().includes('ko')) {
                voiceSelectKo.appendChild(option);
            } else if (voice.lang.toLowerCase().includes('en')) {
                voiceSelectEn.appendChild(option);
            }
        });

        if (savedKoVoice && voices.some(v => v.name === savedKoVoice)) voiceSelectKo.value = savedKoVoice;
        if (savedEnVoice && voices.some(v => v.name === savedEnVoice)) voiceSelectEn.value = savedEnVoice;
        if (savedFlight) flightSelect.value = savedFlight;
        if (savedDest) destSelect.value = savedDest;

        if (voiceSelectEn.options.length === 0 && voiceSelectKo.options.length > 0) {
            showModal("No English voices were found. Please check your device's Text-to-Speech (TTS) settings. Ensure Google TTS is your preferred engine and that English language data is installed.");
        }
    }

    function resetAllPlayers() {
        document.querySelectorAll('.player-controls').forEach(p => {
            const playerUI = {
                playPauseBtn: p.querySelector('.btn-play-pause'),
                progressBar: p.querySelector('.progress-bar-fill'),
            };
            resetSinglePlayerUI(playerUI);
        });
        activePlayerUI = null;
        currentUtterances = [];
    }

    function resetSinglePlayerUI(playerUI) {
        if (!playerUI || !playerUI.playPauseBtn) return;
        
        playerUI.playPauseBtn.innerHTML = ICONS.PLAY;
        playerUI.playPauseBtn.setAttribute('aria-label', 'Play');
        if(playerUI.progressBar) playerUI.progressBar.style.width = '0%';
        
        const parentContainer = playerUI.playPauseBtn.closest('.broadcast-content, #custom-input-section');
        if (!parentContainer) return;

        if (parentContainer.id === 'custom-input-section') {
            customTextDisplay.style.display = 'none';
            customTextDisplay.innerHTML = '';
            customTextarea.style.display = 'block';
        }

        const textElement = parentContainer.querySelector('.script-text');
        if (textElement && textElement.dataset.originalHtml) {
            textElement.innerHTML = textElement.dataset.originalHtml;
        }

        if (parentContainer.querySelector('.script-input-area')) {
            const scriptInputArea = parentContainer.querySelector('.script-input-area');
            const combinedTextElement = parentContainer.querySelector('.script-text-combined');
            
            if (scriptInputArea) scriptInputArea.style.display = 'block';
            if (combinedTextElement) {
                combinedTextElement.style.display = 'none';
                combinedTextElement.innerHTML = '';
            }
        }
    }

    function formatFlightNumberForReading(flightNumber) {
        if (!flightNumber) return '';

        const alphaMap = {
            A:'에이', B:'비', C:'씨', D:'디', E:'이', F:'에프', G:'지', H:'에이치', I:'아이',
            J:'제이', K:'케이', L:'엘', M:'엠', N:'엔', O:'오', P:'피', Q:'큐', R:'알',
            S:'에스', T:'티', U:'유', V:'브이', W:'더블유', X:'엑스', Y:'와이', Z:'제트'
        };
        const digitMap = {
            '0':'공', '1':'일', '2':'이', '3':'삼', '4':'사', '5':'오', '6':'육', '7':'칠', '8':'팔', '9':'구'
        };

        const letters = (flightNumber.match(/[A-Za-z]+/g) || []).join('');
        const numbers = (flightNumber.match(/\d+/g) || []).join('');

        let result = '';
        if (letters) {
            result += letters.split('').map(char => alphaMap[char.toUpperCase()]).join('');
        }
        if (letters && numbers) {
            result += ', ';
        }
        if (numbers) {
            result += numbers.split('').map(char => digitMap[char]).join(', ');
        }
        return result;
    }

    function parseTextToSegments(text) {
        const segments = [];
        if (!text || text.trim() === '') {
            return segments;
        }

        const isEnglishChar = (char) => (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
        const isKoreanChar = (char) => char >= '가' && char <= '힣';

        let currentText = '';
        let currentLang = null;
        let currentStartIndex = 0;

        function pushSegment() {
            if (currentText) {
                if (!currentLang && /^\d+$/.test(currentText.trim())) {
                    currentLang = 'ko';
                }
                segments.push({ text: currentText, lang: currentLang, startIndex: currentStartIndex });
            }
        }

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let lang = null;

            if (isEnglishChar(char)) {
                lang = 'en';
            } else if (isKoreanChar(char)) {
                lang = 'ko';
            }

            if (currentText === '' || currentLang === null) {
                currentText += char;
                currentLang = lang;
                currentStartIndex = i;
            } else if (lang === currentLang || lang === null) {
                currentText += char;
            } else { 
                if (/^\d+$/.test(currentText.trim()) && lang === 'ko') {
                    currentText += char;
                    currentLang = 'ko';
                } else {
                    pushSegment();
                    currentText = char;
                    currentLang = lang;
                    currentStartIndex = i;
                }
            }
        }
        pushSegment();

        return segments;
    }
    
    function ensureAudioIsReady(callback) {
        if (synth.speaking) {
            synth.cancel();
            setTimeout(callback, 50);
            return;
        }
        const testUtterance = new SpeechSynthesisUtterance(" ");
        testUtterance.volume = 0;
        testUtterance.onend = callback;
        testUtterance.onerror = (e) => {
            console.error("Audio readiness test failed:", e);
            callback(); 
        };
        synth.speak(testUtterance);
    }

    function speak(textToRead, playerUI) {
        ensureAudioIsReady(() => {
            activePlayerUI = playerUI;
            
            const segments = parseTextToSegments(textToRead);
            const totalLength = textToRead.length;
            currentUtterances = [];

            if (segments.length === 0) return;

            const koVoice = voices.find(v => v.name === voiceSelectKo.value);
            const enVoice = voices.find(v => v.name === voiceSelectEn.value);

            const needsKoVoice = segments.some(s => s.lang === 'ko');
            const needsEnVoice = segments.some(s => s.lang === 'en');

            if (needsKoVoice && !koVoice) {
                showModal(`Could not find a Korean voice. Please select another voice in the settings.`);
                resetAllPlayers();
                return;
            }
            if (needsEnVoice && !enVoice) {
                showModal(`Could not find an English voice. Please select another voice in the settings.`);
                resetAllPlayers();
                return;
            }

            segments.forEach((segment, index) => {
                const utterThis = new SpeechSynthesisUtterance(segment.text);
                currentUtterances.push(utterThis);
                
                utterThis.voice = segment.lang === 'ko' ? koVoice : enVoice;
                utterThis.pitch = pitchInput.value;
                utterThis.rate = rateInput.value;

                if (index === 0) {
                    utterThis.onstart = () => { 
                        if(activePlayerUI) {
                            activePlayerUI.playPauseBtn.innerHTML = ICONS.PAUSE; 
                            activePlayerUI.playPauseBtn.setAttribute('aria-label', 'Pause');
                        }
                    };
                }
                
                utterThis.onboundary = (event) => {
                    if (!activePlayerUI || !activePlayerUI.textElement) return;
                    
                    const globalCharIndex = segment.startIndex + event.charIndex;
                    const progress = (globalCharIndex / totalLength) * 100;
                    activePlayerUI.progressBar.style.width = `${progress}%`;
                    
                    const targetElement = activePlayerUI.textElement;
                    if (targetElement.tagName !== 'TEXTAREA') {
                        let startPoint = globalCharIndex;
                        let endPoint = textToRead.indexOf(' ', startPoint);
                        if (endPoint === -1) endPoint = textToRead.length;

                        const highlightedText = textToRead.substring(0, startPoint) +
                            `<span class="highlight">${textToRead.substring(startPoint, endPoint)}</span>` +
                            textToRead.substring(endPoint);
                        targetElement.innerHTML = highlightedText;
                    }
                };
                
                if (index === segments.length - 1) {
                    utterThis.onend = () => {
                        setTimeout(resetAllPlayers, 50);
                    };
                }

                synth.speak(utterThis);
            });
        });
    }

    function speakPreview(text, voiceName) {
        ensureAudioIsReady(() => {
            if (synth.speaking) {
                synth.cancel();
            }
            const voice = voices.find(v => v.name === voiceName);
            if (voice) {
                const utterThis = new SpeechSynthesisUtterance(text);
                utterThis.voice = voice;
                utterThis.rate = rateInput.value;
                utterThis.pitch = pitchInput.value;
                synth.speak(utterThis);
            } else {
                showModal("The selected preview voice is not available. Please choose another voice.");
            }
        });
    }

    function initializeEventListeners() {
        modalClose.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        window.addEventListener('resize', updateMainContentPadding);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                wakeUpSpeechSynth();
            }
        });

        startBtn.addEventListener('click', () => {
            startBtn.disabled = true;
            startLoader.style.display = 'block';
            startBtnText.textContent = 'Loading voices...';
            initializeApp();
        });

        rateInput.addEventListener('input', () => { rateValue.textContent = rateInput.value; });
        pitchInput.addEventListener('input', () => { pitchValue.textContent = pitchInput.value; });
        voiceSelectKo.addEventListener('change', () => localStorage.setItem('tts-ko-voice', voiceSelectKo.value));
        voiceSelectEn.addEventListener('change', () => localStorage.setItem('tts-en-voice', voiceSelectEn.value));
        flightSelect.addEventListener('change', () => localStorage.setItem('tts-flight', flightSelect.value));
        destSelect.addEventListener('change', () => localStorage.setItem('tts-dest', destSelect.value));

        document.querySelectorAll('.broadcast-title').forEach(clickedTitle => {
            clickedTitle.addEventListener('click', () => {
                if (synth.speaking) {
                    synth.cancel();
                    resetAllPlayers();
                }
                const isAlreadyActive = clickedTitle.classList.contains('active');
                
                document.querySelectorAll('.broadcast-title').forEach(title => {
                    title.classList.remove('active');
                });

                if (!isAlreadyActive) {
                    clickedTitle.classList.add('active');
                }
            });
        });

        document.querySelectorAll('.player-controls').forEach(player => {
            const playPauseBtn = player.querySelector('.btn-play-pause');
            const stopBtn = player.querySelector('.btn-stop');
            const progressBar = player.querySelector('.progress-bar-fill');
            
            if (playPauseBtn && stopBtn) {
                const playerUI = { playPauseBtn, stopBtn, progressBar };

                playPauseBtn.addEventListener('click', () => {
                    if (synth.speaking && currentUtterances.length > 0 && activePlayerUI === playerUI) {
                        if (synth.paused) {
                            synth.resume();
                            playerUI.playPauseBtn.innerHTML = ICONS.PAUSE;
                            playerUI.playPauseBtn.setAttribute('aria-label', 'Pause');
                        } else {
                            synth.pause();
                            playerUI.playPauseBtn.innerHTML = ICONS.PLAY;
                            playerUI.playPauseBtn.setAttribute('aria-label', 'Play');
                        }
                    } else {
                        if (synth.speaking) synth.cancel();
                        resetAllPlayers();

                        let textToRead = '';
                        const parentContainer = player.closest('.broadcast-content, #custom-input-section');
                        const flightNumberRaw = flightSelect.value;
                        const flightNumberFormatted = formatFlightNumberForReading(flightNumberRaw);
                        const destinationCode = destSelect.value;
                        const destinationName = airportNames[destinationCode] || destinationCode;
                        
                        if (parentContainer.id === 'custom-input-section') {
                            textToRead = customTextarea.value;
                            if (!textToRead.trim()) {
                                showModal("Please enter an announcement.");
                                return;
                            }
                            customTextarea.style.display = 'none';
                            customTextDisplay.textContent = textToRead;
                            customTextDisplay.style.display = 'block';
                            playerUI.textElement = customTextDisplay;

                        } else {
                            const broadcastItem = parentContainer.closest('.broadcast-item');
                            if (broadcastItem && broadcastItem.querySelector('.script-input-area')) {
                                if (broadcastItem.id === 'broadcast-9') {
                                    const part1 = parentContainer.querySelector('.script-text-part1').textContent;
                                    const namePart = parentContainer.querySelector('.name-input').value;
                                    const part2 = parentContainer.querySelector('.script-text-part2').textContent;
                                    const gatePart = parentContainer.querySelector('.gate-input').value;
                                    const part3 = parentContainer.querySelector('.script-text-part3').textContent;
                                    
                                    if (!namePart.trim() || !gatePart.trim()) {
                                        showModal("Please enter both name and gate number.");
                                        return;
                                    }
                                    
                                    const nameRepeatContainer = parentContainer.querySelector('.name-input').closest('.name-input-container');
                                    const gateRepeatContainer = parentContainer.querySelector('.gate-input').closest('.name-input-container');

                                    const nameRepeatCount = parseInt(nameRepeatContainer.dataset.repeatCount, 10) || 1;
                                    const gateRepeatCount = parseInt(gateRepeatContainer.dataset.repeatCount, 10) || 1;

                                    const repeatedName = Array(nameRepeatCount).fill(namePart).join(', ');
                                    const repeatedGate = Array(gateRepeatCount).fill(gatePart + '번').join(', ');
                                    
                                    textToRead = `${part1} ${repeatedName}, ${part2} ${repeatedGate} ${part3.substring(1).trim()}`;

                                } else if (broadcastItem.id === 'broadcast-10') {
                                    const part1 = parentContainer.querySelector('.script-text-part1').textContent;
                                    const floor = parentContainer.querySelector('.floor-input').value;
                                    const gate = parentContainer.querySelector('.gate-input').value;
                                    const part2 = parentContainer.querySelector('.script-text-part2').textContent;
                                    if (!floor.trim() || !gate.trim()) {
                                        showModal("Please enter both floor and gate numbers.");
                                        return;
                                    }
                                    const repeatContainer = parentContainer.querySelector('.name-input-container');
                                    const repeatCount = parseInt(repeatContainer.dataset.repeatCount, 10) || 1;
                                    const locationString = `${floor}층 ${gate}번`;
                                    const repeatedLocation = Array(repeatCount).fill(locationString).join(', ');
                                    textToRead = `${part1} ${repeatedLocation}으로 변경되었습니다. ${part2.replace('{gate}', gate)}`;

                                } else if (broadcastItem.id === 'broadcast-14' || broadcastItem.id === 'broadcast-15') {
                                    const part1 = parentContainer.querySelector('.script-text-part1').textContent;
                                    const hour = parentContainer.querySelector('.hour-input').value;
                                    const minute = parentContainer.querySelector('.minute-input').value;
                                    const part2 = parentContainer.querySelector('.script-text-part2').textContent;
                                    if (!hour.trim() || !minute.trim()) {
                                        showModal("Please enter both hour and minute.");
                                        return;
                                    }
                                    const repeatContainer = parentContainer.querySelector('.name-input-container');
                                    const repeatCount = parseInt(repeatContainer.dataset.repeatCount, 10) || 1;
                                    const timeString = `${hour}시 ${minute}분`;
                                    const repeatedTime = Array(repeatCount).fill(timeString).join(', ');
                                    textToRead = `${part1} ${repeatedTime} 경 입니다. ${part2}`;
                                    
                                } else { 
                                    const part1 = parentContainer.querySelector('.script-text-part1').textContent;
                                    const namePart = parentContainer.querySelector('.name-input').value;
                                    const part2 = parentContainer.querySelector('.script-text-part2').textContent;
                                    if (!namePart.trim()) {
                                        showModal("The input field is empty.");
                                        return;
                                    }
                                    
                                    const repeatContainer = parentContainer.querySelector('.name-input-container');
                                    const repeatCount = parseInt(repeatContainer.dataset.repeatCount, 10) || 1;
                                    
                                    if (broadcastItem.id === 'broadcast-2' || broadcastItem.id === 'broadcast-3') {
                                        const repeatedPart = Array(repeatCount).fill(namePart).join(', ');
                                        textToRead = part1 + " " + repeatedPart + ", " + part2;
                                    } else { 
                                        const repeatedPart = Array(repeatCount).fill(namePart + '번').join(', ');
                                        textToRead = part1 + " " + repeatedPart + " " + part2.substring(1).trim();
                                    }
                                }
                                
                                const scriptInputArea = parentContainer.querySelector('.script-input-area');
                                const combinedTextElement = parentContainer.querySelector('.script-text-combined');
                                playerUI.textElement = combinedTextElement;
                                
                                scriptInputArea.style.display = 'none';
                                combinedTextElement.style.display = 'block';

                            } else {
                                const textElement = parentContainer.querySelector('.script-text');
                                if (textElement) {
                                    textToRead = textElement.textContent;
                                    playerUI.textElement = textElement;
                                }
                            }
                        }
                        
                        textToRead = textToRead
                            .replace(/{flightNumber}/g, flightNumberFormatted) 
                            .replace(/{destination}/g, destinationName);
                        
                        if (playerUI.textElement) {
                            playerUI.textElement.textContent = textToRead;
                        }

                        if (textToRead.trim()) {
                            speak(textToRead, playerUI);
                        }
                    }
                });

                stopBtn.addEventListener('click', () => {
                    if (synth.speaking) synth.cancel();
                    resetAllPlayers();
                });
            }
        });
        
        document.querySelectorAll('.broadcast-item').forEach(item => {
            const repeatContainers = item.querySelectorAll('.name-input-container[data-repeat-count]');
            repeatContainers.forEach(container => {
                const minusBtn = container.querySelector('.btn-repeat-minus');
                const plusBtn = container.querySelector('.btn-repeat-plus');
                const countDisplay = container.querySelector('.repeat-count');

                if(minusBtn && plusBtn && countDisplay) {
                    minusBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let count = parseInt(container.dataset.repeatCount, 10);
                        if (count > 1) {
                            count--;
                            container.dataset.repeatCount = count;
                            countDisplay.textContent = count;
                        }
                    });

                    plusBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let count = parseInt(container.dataset.repeatCount, 10);
                        count++;
                        container.dataset.repeatCount = count;
                        countDisplay.textContent = count;
                    });
                }
            });
        });

        document.querySelectorAll('.btn-translate').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const container = e.target.closest('.name-input-container');
                const nameInput = container.querySelector('.name-input');
                const loader = container.querySelector('.loader');
                const nameToTranslate = nameInput.value.trim();

                if (!nameToTranslate) {
                    showModal("Please enter a name to translate.");
                    return;
                }

                btn.disabled = true;
                loader.style.display = 'inline-block';

                const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(nameToTranslate)}&langpair=en|ko`;

                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        throw new Error(`API server error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.responseData && result.responseData.translatedText) {
                        nameInput.value = result.responseData.translatedText;
                    } else {
                        throw new Error("Could not find translated text in API response.");
                    }

                } catch (error) {
                    console.error("Translation Error:", error);
                    showModal(`Name translation failed. (Reason: ${error.message})`);
                } finally {
                    btn.disabled = false;
                    loader.style.display = 'none';
                }
            });
        });

        document.getElementById('preview-ko-voice').addEventListener('click', () => speakPreview('안녕하세요. 한국어 음성입니다.', voiceSelectKo.value));
        document.getElementById('preview-en-voice').addEventListener('click', () => speakPreview('Hello, this is an English voice.', voiceSelectEn.value));
        document.getElementById('preview-rate').addEventListener('click', () => speakPreview('Testing the speed.', voiceSelectEn.value));
        document.getElementById('preview-pitch').addEventListener('click', () => speakPreview('Testing the pitch.', voiceSelectEn.value));

        document.getElementById('reset-rate').addEventListener('click', () => {
            rateInput.value = 1;
            rateValue.textContent = '1';
        });
        document.getElementById('reset-pitch').addEventListener('click', () => {
            pitchInput.value = 1;
            pitchValue.textContent = '1';
        });

        // Pull to refresh logic
        let touchStartY = 0;
        let pullDistance = 0;
        const PULL_THRESHOLD = 80;

        document.body.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0 && e.target.closest('main, header')) {
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.body.addEventListener('touchmove', (e) => {
            if (touchStartY === 0) return;

            const currentY = e.touches[0].clientY;
            pullDistance = currentY - touchStartY;

            if (pullDistance > 0) {
                const scale = Math.min(1, pullDistance / PULL_THRESHOLD);
                refreshIndicator.style.opacity = scale;
                refreshIndicator.style.transform = `translateX(-50%) scale(${scale})`;
            }
        }, { passive: true });

        document.body.addEventListener('touchend', () => {
            if (pullDistance > PULL_THRESHOLD) {
                refreshIndicator.style.opacity = 0;
                refreshIndicator.style.transform = 'translateX(-50%) scale(0)';
                window.location.reload();
            } else if (pullDistance > 0) {
                refreshIndicator.style.opacity = 0;
                refreshIndicator.style.transform = 'translateX(-50%) scale(0)';
            }
            touchStartY = 0;
            pullDistance = 0;
        });
    }

    function initializeTooltipListeners() {
        const koInfoBtn = document.getElementById('ko-voice-info-btn');
        const enInfoBtn = document.getElementById('en-voice-info-btn');
        const koTooltip = document.getElementById('ko-voice-tooltip');
        const enTooltip = document.getElementById('en-voice-tooltip');

        koInfoBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            koTooltip.classList.toggle('hidden');
            enTooltip.classList.add('hidden');
            document.querySelectorAll('.en-translation-tooltip').forEach(t => t.classList.add('hidden'));
        });

        enInfoBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            enTooltip.classList.toggle('hidden');
            koTooltip.classList.add('hidden');
            document.querySelectorAll('.en-translation-tooltip').forEach(t => t.classList.add('hidden'));
        });

        document.querySelectorAll('.en-tooltip-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                document.querySelectorAll('#ko-voice-tooltip, #en-voice-tooltip, .en-translation-tooltip').forEach(t => {
                    if (t !== btn.nextElementSibling) {
                        t.classList.add('hidden');
                    }
                });
                const tooltip = btn.nextElementSibling;
                tooltip.classList.toggle('hidden');
            });
        });

        window.addEventListener('click', () => {
            document.querySelectorAll('#ko-voice-tooltip, #en-voice-tooltip, .en-translation-tooltip').forEach(t => {
                t.classList.add('hidden');
            });
        });
    }

    // Initial setup on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        initializeStaticUI();
        updateMainContentPadding();
        initializeEventListeners();
        initializeTooltipListeners();
    });

} else {
    // Fallback for unsupported browsers
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    startBtn.disabled = true;
    startBtn.textContent = 'Not Supported';
    document.querySelector('#start-overlay p').textContent = 'Sorry, your browser does not support the Web Speech API required for this application.';
}

