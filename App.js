/* ============================================
   APP.JS - Logique complète de l'application
   ============================================ */

// ===== ÉTAT GLOBAL =====
const state = {
    totalStars: 0,
    totalWords: 0,
    streak: 0,

    asm: {
        level: 1,
        currentIndex: 0,
        words: [],
        stars: 0,
        dropzoneLetters: [],
        correctCount: 0,
    },

    lf: {
        currentIndex: 0,
        stars: 0,
    },

    gen: {
        currentIndex: 0,
        words: [],
        stars: 0,
        dropzoneLetters: [],
        correctCount: 0,
    },

    tr: {
        mode: 'mcq',
        currentIndex: 0,
        words: [],
        stars: 0,
        dropzoneLetters: [],
        correctCount: 0,
    },

    currentModule: null,
};

// ===== UTILITAIRES =====

/** Extraire les lettres arabes d'un mot (sans diacritiques de liaison) */
function extractArabicLetters(word) {
    // Supprime les diacritiques (tashkeel) pour obtenir les lettres de base
    const stripped = word.replace(/[\u064B-\u065F\u0670]/g, '');
    return [...stripped];
}

/** Mélanger un tableau (Fisher-Yates) */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Message positif aléatoire */
function randomPositive() {
    return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
}

/** Message d'erreur aléatoire */
function randomError() {
    return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
}

/** Afficher un feedback */
function showFeedback(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = 'feedback-area ' + type;
    // Auto-clear après 3s
    setTimeout(() => {
        el.textContent = '';
        el.className = 'feedback-area';
    }, 3500);
}

/** Synthèse vocale arabe */
function speakArabicWord(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

/** Jouer un son de succès */
function playSuccessSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

/** Jouer un son d'erreur */
function playErrorSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

/** Mettre à jour les stats globales sur l'écran d'accueil */
function updateHomeStats() {
    document.getElementById('total-stars').textContent = state.totalStars;
    document.getElementById('total-words').textContent = state.totalWords;
    document.getElementById('total-streak').textContent = state.streak;
}

// ===== NAVIGATION =====

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}

function goHome() {
    updateHomeStats();
    showScreen('home-screen');
    state.currentModule = null;
}

function startModule(moduleName) {
    state.currentModule = moduleName;
    switch (moduleName) {
        case 'assembly':
            initAssembly();
            showScreen('assembly-screen');
            break;
        case 'letterforms':
            initLetterForms();
            showScreen('letterforms-screen');
            break;
        case 'gender':
            initGender();
            showScreen('gender-screen');
            break;
        case 'translation':
            initTranslation();
            showScreen('translation-screen');
            break;
    }
}

// ===== TOGGLE TRADUCTION =====
function toggleTranslation(prefix) {
    const arabic = document.getElementById(prefix + '-arabic');
    const btn = document.getElementById(prefix + '-toggle');
    if (arabic.classList.contains('hidden')) {
        arabic.classList.remove('hidden');
        btn.textContent = '🙈 Masquer la traduction';
    } else {
        arabic.classList.add('hidden');
        btn.textContent = '👁️ Voir la traduction';
    }
}

// ===== SPEAK ARABIC =====
function speakArabic(module) {
    let word = '';
    switch (module) {
        case 'asm':
            word = state.asm.words[state.asm.currentIndex]?.arabic || '';
            break;
        case 'gen':
            word = state.gen.words[state.gen.currentIndex]?.feminine || '';
            break;
        case 'tr':
            word = state.tr.words[state.tr.currentIndex]?.arabic || '';
            break;
    }
    if (word) speakArabicWord(word);
}

// ============================================
//  MODULE 1 : ASSEMBLAGE DE LETTRES
// ============================================

function initAssembly() {
    state.asm.currentIndex = 0;
    state.asm.correctCount = 0;
    state.asm.stars = 0;
    state.asm.dropzoneLetters = [];
    loadAssemblyLevel();
}

function setAssemblyLevel(level) {
    state.asm.level = level;
    state.asm.currentIndex = 0;
    state.asm.correctCount = 0;
    state.asm.stars = 0;
    state.asm.dropzoneLetters = [];

    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('asm-lvl-' + level).classList.add('active');
    document.getElementById('asm-level').textContent = 'Niveau ' + level;

    loadAssemblyLevel();
}

function loadAssemblyLevel() {
    const allWords = ASSEMBLY_WORDS[state.asm.level];
    state.asm.words = shuffle(allWords).slice(0, 5);
    loadAssemblyWord();
}

function loadAssemblyWord() {
    const s = state.asm;
    if (s.currentIndex >= s.words.length) {
        showVictory('asm');
        return;
    }

    const word = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    // UI
    document.getElementById('asm-french').textContent = word.emoji + ' ' + word.french;
    document.getElementById('asm-arabic').textContent = word.arabic;
    document.getElementById('asm-arabic').classList.add('hidden');
    document.getElementById('asm-toggle').textContent = '👁️ Voir la traduction';
    document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('asm-feedback').textContent = '';
    document.getElementById('asm-feedback').className = 'feedback-area';

    // Progress
    const pct = ((s.currentIndex) / s.words.length) * 100;
    document.getElementById('asm-progress').style.width = pct + '%';
    document.getElementById('asm-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    // Dropzone
    const dropzone = document.getElementById('asm-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="asm-placeholder">Glisse les lettres ici →</p>';
    dropzone.className = 'drop-zone';

    // Letters
    const letters = extractArabicLetters(word.arabic);
    const shuffled = shuffle(letters);
    const pool = document.getElementById('asm-letters');
    pool.innerHTML = '';

    shuffled.forEach((letter, i) => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.letter = letter;
        tile.dataset.index = i;
        tile.addEventListener('click', () => toggleLetterAssembly(tile, 'asm'));
        pool.appendChild(tile);
    });
}

function toggleLetterAssembly(tile, module) {
    const s = state[module];
    const dropzone = document.getElementById(module + '-dropzone');
    const pool = document.getElementById(module + '-letters');
    const placeholder = document.getElementById(module + '-placeholder');

    if (tile.classList.contains('in-dropzone')) {
        // Retirer du dropzone
        tile.classList.remove('in-dropzone');
        pool.appendChild(tile);
        s.dropzoneLetters = s.dropzoneLetters.filter(t => t !== tile);
    } else {
        // Ajouter au dropzone
        tile.classList.add('in-dropzone');
        dropzone.appendChild(tile);
        s.dropzoneLetters.push(tile);
    }

    // Gérer le placeholder
    if (placeholder) {
        placeholder.style.display = s.dropzoneLetters.length > 0 ? 'none' : 'block';
    }
}

function checkAssembly() {
    const s = state.asm;
    if (s.currentIndex >= s.words.length) return;

    const word = s.words[s.currentIndex];
    const correctLetters = extractArabicLetters(word.arabic);
    const userLetters = s.dropzoneLetters.map(t => t.dataset.letter);

    const dropzone = document.getElementById('asm-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('asm-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        return;
    }

    // Comparer
    let correct = true;
    for (let i = 0; i < correctLetters.length; i++) {
        if (userLetters[i] !== correctLetters[i]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        dropzone.classList.add('correct');
        s.dropzoneLetters.forEach(t => t.classList.add('correct-tile'));
        s.stars++;
        s.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
        showFeedback('asm-feedback', randomPositive(), 'success');
        playSuccessSound();
        speakArabicWord(word.arabic);

        setTimeout(() => {
            s.currentIndex++;
            loadAssemblyWord();
        }, 1800);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        state.streak = 0;
        playErrorSound();

        // Montrer quelles lettres sont mal placées
        s.dropzoneLetters.forEach((tile, i) => {
            if (i < correctLetters.length && tile.dataset.letter !== correctLetters[i]) {
                tile.classList.add('wrong-tile');
                setTimeout(() => tile.classList.remove('wrong-tile'), 800);
            }
        });

        showFeedback('asm-feedback', randomError(), 'error');
    }
}

function giveHint(module) {
    const s = state[module];
    let correctLetters;
    let dropzoneLetters = s.dropzoneLetters;

    switch (module) {
        case 'asm':
            correctLetters = extractArabicLetters(s.words[s.currentIndex].arabic);
            break;
        case 'gen':
            correctLetters = extractArabicLetters(s.words[s.currentIndex].feminine);
            break;
        case 'tr':
            correctLetters = extractArabicLetters(s.words[s.currentIndex].arabic);
            break;
        default:
            return;
    }

    // Trouver la prochaine lettre correcte à placer
    const nextIndex = dropzoneLetters.length;
    if (nextIndex >= correctLetters.length) return;

    const nextLetter = correctLetters[nextIndex];

    // Trouver la tuile correspondante dans le pool
    const pool = document.getElementById(module + '-letters');
    const tiles = pool.querySelectorAll('.letter-tile:not(.in-dropzone)');

    tiles.forEach(t => t.classList.remove('hint-glow'));

    for (const tile of tiles) {
        if (tile.dataset.letter === nextLetter) {
            tile.classList.add('hint-glow');
            setTimeout(() => tile.classList.remove('hint-glow'), 2000);
            break;
        }
    }

    // On montre aussi la traduction
    const arabicEl = document.getElementById(module + '-arabic');
    if (arabicEl) arabicEl.classList.remove('hidden');
}

function skipWord(module) {
    const s = state[module];
    state.streak = 0;
    s.currentIndex++;

    switch (module) {
        case 'asm': loadAssemblyWord(); break;
        case 'gen': loadGenderWord(); break;
        case 'tr': loadTranslationWord(); break;
    }
}

// ============================================
//  MODULE 2 : FORMES DES LETTRES
// ============================================

function initLetterForms() {
    state.lf.currentIndex = 0;
    state.lf.stars = 0;
    loadLetterForm();
}

function loadLetterForm() {
    const letter = ARABIC_LETTERS[state.lf.currentIndex];

    document.getElementById('lf-main-letter').textContent = letter.isolated;
    document.getElementById('lf-letter-name').textContent = letter.name;
    document.getElementById('lf-isolated').textContent = letter.isolated;
    document.getElementById('lf-initial').textContent = letter.initial;
    document.getElementById('lf-medial').textContent = letter.medial;
    document.getElementById('lf-final').textContent = letter.final;
    document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;

    // Exemples
    const examplesContainer = document.getElementById('lf-examples');
    examplesContainer.innerHTML = '';

    letter.examples.forEach(ex => {
        const div = document.createElement('div');
        div.className = 'word-example';

        // Mettre en surbrillance la lettre à la position donnée
        const chars = [...ex.word];
        let html = '';
        chars.forEach((c, i) => {
            if (i === ex.highlight) {
                html += '<span class="highlighted-letter">' + c + '</span>';
            } else {
                html += c;
            }
        });
        div.innerHTML = html + '<br><small style="font-family:var(--font-main);font-size:0.7rem;color:var(--text-light)">' + ex.meaning + '</small>';
        div.addEventListener('click', () => speakArabicWord(ex.word));
        examplesContainer.appendChild(div);
    });

    // Quiz
    loadLetterQuiz();
}

function loadLetterQuiz() {
    const letter = ARABIC_LETTERS[state.lf.currentIndex];
    const positions = ['début', 'milieu', 'fin', 'isolée'];
    const forms = [letter.initial, letter.medial, letter.final, letter.isolated];
    const randomPos = Math.floor(Math.random() * 4);

    const questionEl = document.getElementById('lf-quiz-question');
    questionEl.innerHTML = 'Quelle est la forme de <strong style="font-family:var(--font-arabic);font-size:1.5em;color:var(--primary)">' + letter.isolated + '</strong> en <strong>' + positions[randomPos] + '</strong> de mot ?';

    const correctForm = forms[randomPos];
    const allForms = [...forms];
    const shuffledOptions = shuffle(allForms);

    // S'assurer qu'il n'y a pas de doublons visuels
    const uniqueOptions = [...new Set(shuffledOptions)];
    while (uniqueOptions.length < 4) {
        // Ajouter des lettres d'autres lettres si nécessaire
        const randomLetter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        const randomForm = [randomLetter.initial, randomLetter.medial, randomLetter.final, randomLetter.isolated][Math.floor(Math.random() * 4)];
        if (!uniqueOptions.includes(randomForm)) {
            uniqueOptions.push(randomForm);
        }
    }

    const finalOptions = shuffle(uniqueOptions.slice(0, 4));
    // S'assurer que la bonne réponse est incluse
    if (!finalOptions.includes(correctForm)) {
        finalOptions[Math.floor(Math.random() * 4)] = correctForm;
    }

    const optionsEl = document.getElementById('lf-quiz-options');
    optionsEl.innerHTML = '';

    finalOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.addEventListener('click', () => {
            // Désactiver tous les boutons
            optionsEl.querySelectorAll('.quiz-option').forEach(b => {
                b.style.pointerEvents = 'none';
            });

            if (option === correctForm) {
                btn.classList.add('selected-correct');
                state.lf.stars++;
                state.totalStars++;
                state.streak++;
                document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;
                showFeedback('lf-feedback', randomPositive(), 'success');
                playSuccessSound();
            } else {
                btn.classList.add('selected-wrong');
                // Montrer la bonne réponse
                optionsEl.querySelectorAll('.quiz-option').forEach(b => {
                    if (b.textContent === correctForm) b.classList.add('selected-correct');
                });
                state.streak = 0;
                showFeedback('lf-feedback', '❌ La bonne réponse est : ' + correctForm, 'error');
                playErrorSound();
            }

            // Recharger le quiz après un délai
            setTimeout(() => {
                optionsEl.querySelectorAll('.quiz-option').forEach(b => {
                    b.style.pointerEvents = 'auto';
                });
                loadLetterQuiz();
            }, 2000);
        });
        optionsEl.appendChild(btn);
    });
}

function prevLetter() {
    state.lf.currentIndex = (state.lf.currentIndex - 1 + ARABIC_LETTERS.length) % ARABIC_LETTERS.length;
    loadLetterForm();
}

function nextLetter() {
    state.lf.currentIndex = (state.lf.currentIndex + 1) % ARABIC_LETTERS.length;
    loadLetterForm();
}

// ============================================
//  MODULE 3 : MASCULIN / FÉMININ
// ============================================

function initGender() {
    state.gen.currentIndex = 0;
    state.gen.correctCount = 0;
    state.gen.stars = 0;
    state.gen.dropzoneLetters = [];
    state.gen.words = shuffle([...GENDER_WORDS]).slice(0, 7);
    loadGenderWord();
}

function loadGenderWord() {
    const s = state.gen;
    if (s.currentIndex >= s.words.length) {
        showVictory('gen');
        return;
    }

    const word = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('gen-masculine').textContent = word.masculine;
    document.getElementById('gen-masc-french').textContent = word.mascFr;
    document.getElementById('gen-feminine').textContent = '?';
    document.getElementById('gen-fem-french').textContent = word.femFr;
    document.getElementById('gen-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('gen-feedback').textContent = '';
    document.getElementById('gen-feedback').className = 'feedback-area';

    // Progress
    const pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('gen-progress').style.width = pct + '%';
    document.getElementById('gen-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    // Dropzone
    const dropzone = document.getElementById('gen-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="gen-placeholder">Construis le féminin ici →</p>';
    dropzone.className = 'drop-zone';

    // Letters
    const letters = extractArabicLetters(word.feminine);
    const shuffled = shuffle(letters);
    const pool = document.getElementById('gen-letters');
    pool.innerHTML = '';

    shuffled.forEach((letter, i) => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.letter = letter;
        tile.dataset.index = i;
        tile.addEventListener('click', () => toggleLetterAssembly(tile, 'gen'));
        pool.appendChild(tile);
    });
}

function checkGender() {
    const s = state.gen;
    if (s.currentIndex >= s.words.length) return;

    const word = s.words[s.currentIndex];
    const correctLetters = extractArabicLetters(word.feminine);
    const userLetters = s.dropzoneLetters.map(t => t.dataset.letter);
    const dropzone = document.getElementById('gen-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('gen-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        return;
    }

    let correct = true;
    for (let i = 0; i < correctLetters.length; i++) {
        if (userLetters[i] !== correctLetters[i]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        dropzone.classList.add('correct');
        s.dropzoneLetters.forEach(t => t.classList.add('correct-tile'));
        s.stars++;
        s.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('gen-stars').textContent = '⭐ ' + s.stars;
        document.getElementById('gen-feminine').textContent = word.feminine;
        showFeedback('gen-feedback', randomPositive() + ' ' + word.masculine + ' → ' + word.feminine, 'success');
        playSuccessSound();
        speakArabicWord(word.feminine);

        setTimeout(() => {
            s.currentIndex++;
            loadGenderWord();
        }, 2000);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        state.streak = 0;
        playErrorSound();

        s.dropzoneLetters.forEach((tile, i) => {
            if (i < correctLetters.length && tile.dataset.letter !== correctLetters[i]) {
                tile.classList.add('wrong-tile');
                setTimeout(() => tile.classList.remove('wrong-tile'), 800);
            }
        });

        showFeedback('gen-feedback', randomError(), 'error');
    }
}

// ============================================
//  MODULE 4 : TRADUCTION FR → AR
// ============================================

function initTranslation() {
    state.tr.currentIndex = 0;
    state.tr.correctCount = 0;
    state.tr.stars = 0;
    state.tr.dropzoneLetters = [];
    state.tr.words = shuffle([...TRANSLATION_WORDS]).slice(0, 9);
    loadTranslationWord();
}

function setTranslationMode(mode) {
    state.tr.mode = mode;
    document.getElementById('tr-mode-mcq').classList.toggle('active', mode === 'mcq');
    document.getElementById('tr-mode-build').classList.toggle('active', mode === 'build');
    loadTranslationWord();
}

function loadTranslationWord() {
    const s = state.tr;
    if (s.currentIndex >= s.words.length) {
        showVictory('tr');
        return;
    }

    const word = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('tr-french').textContent = word.french;
    document.getElementById('tr-image').textContent = word.emoji;
    document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('tr-feedback').textContent = '';
    document.getElementById('tr-feedback').className = 'feedback-area';

    // Progress
    const pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('tr-progress').style.width = pct + '%';
    document.getElementById('tr-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    if (s.mode === 'mcq') {
        document.getElementById('tr-mcq-section').classList.remove('hidden');
        document.getElementById('tr-build-section').classList.add('hidden');
        loadMCQ(word);
    } else {
        document.getElementById('tr-mcq-section').classList.add('hidden');
        document.getElementById('tr-build-section').classList.remove('hidden');
        loadBuildTranslation(word);
    }
}

function loadMCQ(word) {
    const optionsContainer = document.getElementById('tr-mcq-options');
    optionsContainer.innerHTML = '';

    // Créer 4 options dont la bonne réponse
    const allArabic = TRANSLATION_WORDS.map(w => w.arabic);
    let options = [word.arabic];

    while (options.length < 4) {
        const random = allArabic[Math.floor(Math.random() * allArabic.length)];
        if (!options.includes(random)) {
            options.push(random);
        }
    }

    options = shuffle(options);

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'mcq-option';
        btn.textContent = option;
        btn.addEventListener('click', () => handleMCQChoice(btn, option, word.arabic));
        optionsContainer.appendChild(btn);
    });
}

function handleMCQChoice(btn, chosen, correct) {
    const container = document.getElementById('tr-mcq-options');
    container.querySelectorAll('.mcq-option').forEach(b => {
        b.style.pointerEvents = 'none';
    });

    if (chosen === correct) {
        btn.classList.add('correct-choice');
        state.tr.stars++;
        state.tr.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('tr-stars').textContent = '⭐ ' + state.tr.stars;
        showFeedback('tr-feedback', randomPositive(), 'success');
        playSuccessSound();
        speakArabicWord(correct);

        setTimeout(() => {
            state.tr.currentIndex++;
            loadTranslationWord();
        }, 1500);
    } else {
        btn.classList.add('wrong-choice');
        state.streak = 0;
        playErrorSound();

        // Montrer la bonne réponse
        container.querySelectorAll('.mcq-option').forEach(b => {
            if (b.textContent === correct) b.classList.add('correct-choice');
        });

        showFeedback('tr-feedback', '❌ La bonne réponse est : ' + correct, 'error');

        setTimeout(() => {
            state.tr.currentIndex++;
            loadTranslationWord();
        }, 2500);
    }
}

function loadBuildTranslation(word) {
    state.tr.dropzoneLetters = [];

    const dropzone = document.getElementById('tr-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="tr-placeholder">Construis le mot ici →</p>';
    dropzone.className = 'drop-zone';

    const letters = extractArabicLetters(word.arabic);
    const shuffled = shuffle(letters);
    const pool = document.getElementById('tr-letters');
    pool.innerHTML = '';

    shuffled.forEach((letter, i) => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.letter = letter;
        tile.dataset.index = i;
        tile.addEventListener('click', () => toggleLetterAssembly(tile, 'tr'));
        pool.appendChild(tile);
    });
}

function checkTranslation() {
    const s = state.tr;
    if (s.currentIndex >= s.words.length) return;

    const word = s.words[s.currentIndex];
    const correctLetters = extractArabicLetters(word.arabic);
    const userLetters = s.dropzoneLetters.map(t => t.dataset.letter);
    const dropzone = document.getElementById('tr-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('tr-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        return;
    }

    let correct = true;
    for (let i = 0; i < correctLetters.length; i++) {
        if (userLetters[i] !== correctLetters[i]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        dropzone.classList.add('correct');
        s.dropzoneLetters.forEach(t => t.classList.add('correct-tile'));
        s.stars++;
        s.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
        showFeedback('tr-feedback', randomPositive(), 'success');
        playSuccessSound();
        speakArabicWord(word.arabic);

        setTimeout(() => {
            s.currentIndex++;
            loadTranslationWord();
        }, 1800);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(() => dropzone.classList.remove('wrong'), 600);
        state.streak = 0;
        playErrorSound();

        s.dropzoneLetters.forEach((tile, i) => {
            if (i < correctLetters.length && tile.dataset.letter !== correctLetters[i]) {
                tile.classList.add('wrong-tile');
                setTimeout(() => tile.classList.remove('wrong-tile'), 800);
            }
        });

        showFeedback('tr-feedback', randomError(), 'error');
    }
}

// ============================================
//  VICTOIRE / MODAL
// ============================================

function showVictory(module) {
    const s = state[module];
    const total = s.words.length;
    const correct = s.correctCount;
    const pct = Math.round((correct / total) * 100);

    let starsEarned = 1;
    if (pct >= 80) starsEarned = 3;
    else if (pct >= 50) starsEarned = 2;

    const starStr = '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
    document.getElementById('victory-stars').textContent = starStr;

    document.getElementById('victory-title').textContent = pct >= 80 ? '🎉 Excellent !' : pct >= 50 ? '👏 Bien joué !' : '💪 Continue !';
    document.getElementById('victory-message').textContent = `Tu as obtenu ${correct}/${total} bonnes réponses (${pct}%)`;

    document.getElementById('victory-stats').innerHTML = `
        <div class="stat-item">
            <span class="stat-icon">✅</span>
            <span class="stat-value">${correct}</span>
            <span class="stat-label">Correct</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">${s.stars}</span>
            <span class="stat-label">Étoiles</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">${state.streak}</span>
            <span class="stat-label">Série max</span>
        </div>
    `;

    // Afficher le modal
    const modal = document.getElementById('victory-modal');
    modal.classList.add('show');

    // Confetti
    createConfetti();

    // Mettre à jour la barre de progression à 100%
    const progressId = module + '-progress';
    const progressEl = document.getElementById(progressId);
    if (progressEl) progressEl.style.width = '100%';
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#6C63FF', '#FF6584', '#00C851', '#FFB347', '#FF4444', '#FFD700'];

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 1 + 's';
        piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
        piece.style.width = (Math.random() * 8 + 5) + 'px';
        piece.style.height = (Math.random() * 8 + 5) + 'px';
        container.appendChild(piece);
    }
}

function closeModal() {
    document.getElementById('victory-modal').classList.remove('show');
}

function replayModule() {
    closeModal();
    if (state.currentModule) {
        startModule(state.currentModule);
    }
}

// ============================================
//  INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateHomeStats();
    showScreen('home-screen');
});