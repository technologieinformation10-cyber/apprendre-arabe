/* ============================================
   APP.JS - VERSION MOBILE CORRIGÉE
   Utilise la délégation d'événements + data-action
   pour que TOUS les boutons marchent sur mobile
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
        quizLocked: false,
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
        mcqLocked: false,
    },

    currentModule: null,
    busy: false, // empêche les double-taps
};

// ===== UTILITAIRES =====

function extractArabicLetters(word) {
    const stripped = word.replace(/[\u064B-\u065F\u0670\u0651]/g, '');
    return [...stripped];
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function randomPositive() {
    return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
}

function randomError() {
    return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
}

function showFeedback(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = 'feedback-area ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(function() {
        el.textContent = '';
        el.className = 'feedback-area';
    }, 3500);
}

function speakArabicWord(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.75;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

function playSuccessSound() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* silencieux */ }
}

function playErrorSound() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* silencieux */ }
}

function updateHomeStats() {
    document.getElementById('total-stars').textContent = state.totalStars;
    document.getElementById('total-words').textContent = state.totalWords;
    document.getElementById('total-streak').textContent = state.streak;
}

// ===== NAVIGATION =====

function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
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
    var arabic = document.getElementById(prefix + '-arabic');
    var btn = document.getElementById(prefix + '-toggle');
    if (!arabic || !btn) return;
    if (arabic.classList.contains('hidden')) {
        arabic.classList.remove('hidden');
        btn.textContent = '🙈 Masquer la traduction';
    } else {
        arabic.classList.add('hidden');
        btn.textContent = '👁️ Voir la traduction';
    }
}

// ===== SPEAK ARABIC =====
function speakArabicForModule(mod) {
    var word = '';
    switch (mod) {
        case 'asm':
            if (state.asm.words[state.asm.currentIndex])
                word = state.asm.words[state.asm.currentIndex].arabic;
            break;
        case 'gen':
            if (state.gen.words[state.gen.currentIndex])
                word = state.gen.words[state.gen.currentIndex].feminine;
            break;
        case 'tr':
            if (state.tr.words[state.tr.currentIndex])
                word = state.tr.words[state.tr.currentIndex].arabic;
            break;
    }
    if (word) speakArabicWord(word);
}

// ============================================
//  LETTRE TILES : AJOUTER / RETIRER
// ============================================

function toggleLetterTile(tile, module) {
    if (state.busy) return;
    var s = state[module];
    var dropzone = document.getElementById(module + '-dropzone');
    var pool = document.getElementById(module + '-letters');
    var placeholder = document.getElementById(module + '-placeholder');

    if (tile.classList.contains('in-dropzone')) {
        tile.classList.remove('in-dropzone');
        pool.appendChild(tile);
        var idx = s.dropzoneLetters.indexOf(tile);
        if (idx > -1) s.dropzoneLetters.splice(idx, 1);
    } else {
        tile.classList.add('in-dropzone');
        dropzone.appendChild(tile);
        s.dropzoneLetters.push(tile);
    }

    if (placeholder) {
        placeholder.style.display = s.dropzoneLetters.length > 0 ? 'none' : 'block';
    }
}

function createLetterTiles(container, letters, module) {
    container.innerHTML = '';
    var shuffled = shuffle(letters);
    for (var i = 0; i < shuffled.length; i++) {
        var tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = shuffled[i];
        tile.setAttribute('data-letter', shuffled[i]);
        tile.setAttribute('data-idx', i);
        tile.setAttribute('data-action', 'tile');
        tile.setAttribute('data-module', module);
        container.appendChild(tile);
    }
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

    var btns = document.querySelectorAll('.level-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    var activeBtn = document.getElementById('asm-lvl-' + level);
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('asm-level').textContent = 'Niveau ' + level;

    loadAssemblyLevel();
}

function loadAssemblyLevel() {
    var allWords = ASSEMBLY_WORDS[state.asm.level];
    state.asm.words = shuffle(allWords).slice(0, 5);
    loadAssemblyWord();
}

function loadAssemblyWord() {
    var s = state.asm;
    if (s.currentIndex >= s.words.length) {
        showVictory('asm');
        return;
    }

    var word = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('asm-french').textContent = word.emoji + ' ' + word.french;
    document.getElementById('asm-arabic').textContent = word.arabic;
    document.getElementById('asm-arabic').classList.add('hidden');
    document.getElementById('asm-toggle').textContent = '👁️ Voir la traduction';
    document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('asm-feedback').textContent = '';
    document.getElementById('asm-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('asm-progress').style.width = pct + '%';
    document.getElementById('asm-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    var dropzone = document.getElementById('asm-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="asm-placeholder">Appuie sur les lettres ici →</p>';
    dropzone.className = 'drop-zone';

    var letters = extractArabicLetters(word.arabic);
    var pool = document.getElementById('asm-letters');
    createLetterTiles(pool, letters, 'asm');
}

function checkAssembly() {
    if (state.busy) return;
    var s = state.asm;
    if (s.currentIndex >= s.words.length) return;

    var word = s.words[s.currentIndex];
    var correctLetters = extractArabicLetters(word.arabic);
    var userLetters = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) {
        userLetters.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    }
    var dropzone = document.getElementById('asm-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('asm-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        return;
    }

    var correct = true;
    for (var j = 0; j < correctLetters.length; j++) {
        if (userLetters[j] !== correctLetters[j]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        state.busy = true;
        dropzone.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) {
            s.dropzoneLetters[k].classList.add('correct-tile');
        }
        s.stars++;
        s.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
        showFeedback('asm-feedback', randomPositive(), 'success');
        playSuccessSound();
        speakArabicWord(word.arabic);

        setTimeout(function() {
            s.currentIndex++;
            state.busy = false;
            loadAssemblyWord();
        }, 1800);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        state.streak = 0;
        playErrorSound();

        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correctLetters.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correctLetters[m]) {
                (function(tile) {
                    tile.classList.add('wrong-tile');
                    setTimeout(function() { tile.classList.remove('wrong-tile'); }, 800);
                })(s.dropzoneLetters[m]);
            }
        }
        showFeedback('asm-feedback', randomError(), 'error');
    }
}

function giveHint(module) {
    var s = state[module];
    var correctLetters;

    switch (module) {
        case 'asm':
            if (!s.words[s.currentIndex]) return;
            correctLetters = extractArabicLetters(s.words[s.currentIndex].arabic);
            break;
        case 'gen':
            if (!s.words[s.currentIndex]) return;
            correctLetters = extractArabicLetters(s.words[s.currentIndex].feminine);
            break;
        case 'tr':
            if (!s.words[s.currentIndex]) return;
            correctLetters = extractArabicLetters(s.words[s.currentIndex].arabic);
            break;
        default: return;
    }

    var nextIndex = s.dropzoneLetters.length;
    if (nextIndex >= correctLetters.length) return;
    var nextLetter = correctLetters[nextIndex];

    var pool = document.getElementById(module + '-letters');
    var tiles = pool.querySelectorAll('.letter-tile:not(.in-dropzone)');

    for (var i = 0; i < tiles.length; i++) {
        tiles[i].classList.remove('hint-glow');
    }

    for (var j = 0; j < tiles.length; j++) {
        if (tiles[j].getAttribute('data-letter') === nextLetter) {
            tiles[j].classList.add('hint-glow');
            (function(t) {
                setTimeout(function() { t.classList.remove('hint-glow'); }, 2500);
            })(tiles[j]);
            break;
        }
    }

    // Montrer aussi la traduction
    var arabicEl = document.getElementById(module + '-arabic');
    if (arabicEl) arabicEl.classList.remove('hidden');
}

function skipWord(module) {
    if (state.busy) return;
    var s = state[module];
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
    state.lf.quizLocked = false;
    loadLetterForm();
}

function loadLetterForm() {
    var letter = ARABIC_LETTERS[state.lf.currentIndex];

    document.getElementById('lf-main-letter').textContent = letter.isolated;
    document.getElementById('lf-letter-name').textContent = letter.name;
    document.getElementById('lf-isolated').textContent = letter.isolated;
    document.getElementById('lf-initial').textContent = letter.initial;
    document.getElementById('lf-medial').textContent = letter.medial;
    document.getElementById('lf-final').textContent = letter.final;
    document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;

    // Exemples
    var examplesContainer = document.getElementById('lf-examples');
    examplesContainer.innerHTML = '';

    for (var i = 0; i < letter.examples.length; i++) {
        var ex = letter.examples[i];
        var div = document.createElement('div');
        div.className = 'word-example';
        div.setAttribute('data-action', 'speak-word');
        div.setAttribute('data-word', ex.word);

        var chars = Array.from(ex.word);
        var html = '';
        for (var c = 0; c < chars.length; c++) {
            if (c === ex.highlight) {
                html += '<span class="highlighted-letter">' + chars[c] + '</span>';
            } else {
                html += chars[c];
            }
        }
        div.innerHTML = html + '<br><small style="font-family:var(--font-main);font-size:0.7rem;color:var(--text-light)">' + ex.meaning + '</small>';
        examplesContainer.appendChild(div);
    }

    loadLetterQuiz();
}

function loadLetterQuiz() {
    state.lf.quizLocked = false;
    var letter = ARABIC_LETTERS[state.lf.currentIndex];
    var positions = ['début', 'milieu', 'fin', 'isolée'];
    var forms = [letter.initial, letter.medial, letter.final, letter.isolated];
    var randomPos = Math.floor(Math.random() * 4);

    var questionEl = document.getElementById('lf-quiz-question');
    questionEl.innerHTML = 'Quelle est la forme de <strong style="font-family:var(--font-arabic);font-size:1.4em;color:var(--primary)">' + letter.isolated + '</strong> en <strong>' + positions[randomPos] + '</strong> de mot ?';

    var correctForm = forms[randomPos];
    var allForms = forms.slice();

    // Créer des options uniques
    var uniqueOptions = [];
    for (var i = 0; i < allForms.length; i++) {
        if (uniqueOptions.indexOf(allForms[i]) === -1) {
            uniqueOptions.push(allForms[i]);
        }
    }
    // Compléter si besoin
    var attempts = 0;
    while (uniqueOptions.length < 4 && attempts < 50) {
        var rl = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        var rForms = [rl.initial, rl.medial, rl.final, rl.isolated];
        var rf = rForms[Math.floor(Math.random() * 4)];
        if (uniqueOptions.indexOf(rf) === -1) {
            uniqueOptions.push(rf);
        }
        attempts++;
    }

    var finalOptions = shuffle(uniqueOptions.slice(0, 4));
    // S'assurer que la bonne réponse est dedans
    var found = false;
    for (var j = 0; j < finalOptions.length; j++) {
        if (finalOptions[j] === correctForm) { found = true; break; }
    }
    if (!found) {
        finalOptions[Math.floor(Math.random() * finalOptions.length)] = correctForm;
    }

    var optionsEl = document.getElementById('lf-quiz-options');
    optionsEl.innerHTML = '';

    for (var k = 0; k < finalOptions.length; k++) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = finalOptions[k];
        btn.setAttribute('data-action', 'quiz-answer');
        btn.setAttribute('data-answer', finalOptions[k]);
        btn.setAttribute('data-correct', correctForm);
        optionsEl.appendChild(btn);
    }
}

function handleQuizAnswer(btn) {
    if (state.lf.quizLocked) return;
    state.lf.quizLocked = true;

    var answer = btn.getAttribute('data-answer');
    var correct = btn.getAttribute('data-correct');
    var optionsEl = document.getElementById('lf-quiz-options');

    if (answer === correct) {
        btn.classList.add('selected-correct');
        state.lf.stars++;
        state.totalStars++;
        state.streak++;
        document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;
        showFeedback('lf-feedback', randomPositive(), 'success');
        playSuccessSound();
    } else {
        btn.classList.add('selected-wrong');
        var allBtns = optionsEl.querySelectorAll('.quiz-option');
        for (var i = 0; i < allBtns.length; i++) {
            if (allBtns[i].getAttribute('data-answer') === correct) {
                allBtns[i].classList.add('selected-correct');
            }
        }
        state.streak = 0;
        showFeedback('lf-feedback', '❌ La bonne réponse est : ' + correct, 'error');
        playErrorSound();
    }

    setTimeout(function() {
        loadLetterQuiz();
    }, 2000);
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
    state.gen.words = shuffle(GENDER_WORDS.slice()).slice(0, 7);
    loadGenderWord();
}

function loadGenderWord() {
    var s = state.gen;
    if (s.currentIndex >= s.words.length) {
        showVictory('gen');
        return;
    }

    var word = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('gen-masculine').textContent = word.masculine;
    document.getElementById('gen-masc-french').textContent = word.mascFr;
    document.getElementById('gen-feminine').textContent = '?';
    document.getElementById('gen-fem-french').textContent = word.femFr;
    document.getElementById('gen-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('gen-feedback').textContent = '';
    document.getElementById('gen-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('gen-progress').style.width = pct + '%';
    document.getElementById('gen-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    var dropzone = document.getElementById('gen-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="gen-placeholder">Construis le féminin ici →</p>';
    dropzone.className = 'drop-zone';

    var letters = extractArabicLetters(word.feminine);
    var pool = document.getElementById('gen-letters');
    createLetterTiles(pool, letters, 'gen');
}

function checkGender() {
    if (state.busy) return;
    var s = state.gen;
    if (s.currentIndex >= s.words.length) return;

    var word = s.words[s.currentIndex];
    var correctLetters = extractArabicLetters(word.feminine);
    var userLetters = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) {
        userLetters.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    }
    var dropzone = document.getElementById('gen-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('gen-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        return;
    }

    var correct = true;
    for (var j = 0; j < correctLetters.length; j++) {
        if (userLetters[j] !== correctLetters[j]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        state.busy = true;
        dropzone.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) {
            s.dropzoneLetters[k].classList.add('correct-tile');
        }
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

        setTimeout(function() {
            s.currentIndex++;
            state.busy = false;
            loadGenderWord();
        }, 2000);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        state.streak = 0;
        playErrorSound();

        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correctLetters.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correctLetters[m]) {
                (function(tile) {
                    tile.classList.add('wrong-tile');
                    setTimeout(function() { tile.classList.remove('wrong-tile'); }, 800);
                })(s.dropzoneLetters[m]);
            }
        }
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
    state.tr.mcqLocked = false;
    state.tr.words = shuffle(TRANSLATION_WORDS.slice()).slice(0, 9);
    loadTranslationWord();
}

function setTranslationMode(mode) {
    state.tr.mode = mode;
    document.getElementById('tr-mode-mcq').classList.toggle('active', mode === 'mcq');
    document.getElementById('tr-mode-build').classList.toggle('active', mode === 'build');
    // Reset
    state.tr.currentIndex = 0;
    state.tr.correctCount = 0;
    state.tr.stars = 0;
    state.tr.dropzoneLetters = [];
    state.tr.words = shuffle(TRANSLATION_WORDS.slice()).slice(0, 9);
    document.getElementById('tr-stars').textContent = '⭐ 0';
    loadTranslationWord();
}

function loadTranslationWord() {
    var s = state.tr;
    if (s.currentIndex >= s.words.length) {
        showVictory('tr');
        return;
    }

    var word = s.words[s.currentIndex];
    s.dropzoneLetters = [];
    s.mcqLocked = false;

    document.getElementById('tr-french').textContent = word.french;
    document.getElementById('tr-image').textContent = word.emoji;
    document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('tr-feedback').textContent = '';
    document.getElementById('tr-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
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
    var optionsContainer = document.getElementById('tr-mcq-options');
    optionsContainer.innerHTML = '';

    var allArabic = [];
    for (var i = 0; i < TRANSLATION_WORDS.length; i++) {
        allArabic.push(TRANSLATION_WORDS[i].arabic);
    }

    var options = [word.arabic];
    var attempts = 0;
    while (options.length < 4 && attempts < 50) {
        var random = allArabic[Math.floor(Math.random() * allArabic.length)];
        if (options.indexOf(random) === -1) {
            options.push(random);
        }
        attempts++;
    }
    options = shuffle(options);

    for (var j = 0; j < options.length; j++) {
        var btn = document.createElement('button');
        btn.className = 'mcq-option';
        btn.textContent = options[j];
        btn.setAttribute('data-action', 'mcq-answer');
        btn.setAttribute('data-answer', options[j]);
        btn.setAttribute('data-correct', word.arabic);
        optionsContainer.appendChild(btn);
    }
}

function handleMCQAnswer(btn) {
    if (state.tr.mcqLocked) return;
    state.tr.mcqLocked = true;

    var chosen = btn.getAttribute('data-answer');
    var correct = btn.getAttribute('data-correct');
    var container = document.getElementById('tr-mcq-options');

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

        setTimeout(function() {
            state.tr.currentIndex++;
            loadTranslationWord();
        }, 1500);
    } else {
        btn.classList.add('wrong-choice');
        state.streak = 0;
        playErrorSound();

        var allBtns = container.querySelectorAll('.mcq-option');
        for (var i = 0; i < allBtns.length; i++) {
            if (allBtns[i].getAttribute('data-answer') === correct) {
                allBtns[i].classList.add('correct-choice');
            }
        }
        showFeedback('tr-feedback', '❌ La bonne réponse est : ' + correct, 'error');

        setTimeout(function() {
            state.tr.currentIndex++;
            loadTranslationWord();
        }, 2500);
    }
}

function loadBuildTranslation(word) {
    state.tr.dropzoneLetters = [];

    var dropzone = document.getElementById('tr-dropzone');
    dropzone.innerHTML = '<p class="drop-placeholder" id="tr-placeholder">Construis le mot ici →</p>';
    dropzone.className = 'drop-zone';

    var letters = extractArabicLetters(word.arabic);
    var pool = document.getElementById('tr-letters');
    createLetterTiles(pool, letters, 'tr');
}

function checkTranslation() {
    if (state.busy) return;
    var s = state.tr;
    if (s.currentIndex >= s.words.length) return;

    var word = s.words[s.currentIndex];
    var correctLetters = extractArabicLetters(word.arabic);
    var userLetters = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) {
        userLetters.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    }
    var dropzone = document.getElementById('tr-dropzone');

    if (userLetters.length !== correctLetters.length) {
        showFeedback('tr-feedback', randomError() + ' (Place toutes les lettres !)', 'error');
        playErrorSound();
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        return;
    }

    var correct = true;
    for (var j = 0; j < correctLetters.length; j++) {
        if (userLetters[j] !== correctLetters[j]) {
            correct = false;
            break;
        }
    }

    if (correct) {
        state.busy = true;
        dropzone.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) {
            s.dropzoneLetters[k].classList.add('correct-tile');
        }
        s.stars++;
        s.correctCount++;
        state.totalStars++;
        state.totalWords++;
        state.streak++;

        document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
        showFeedback('tr-feedback', randomPositive(), 'success');
        playSuccessSound();
        speakArabicWord(word.arabic);

        setTimeout(function() {
            s.currentIndex++;
            state.busy = false;
            loadTranslationWord();
        }, 1800);
    } else {
        dropzone.classList.add('wrong');
        setTimeout(function() { dropzone.classList.remove('wrong'); }, 600);
        state.streak = 0;
        playErrorSound();

        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correctLetters.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correctLetters[m]) {
                (function(tile) {
                    tile.classList.add('wrong-tile');
                    setTimeout(function() { tile.classList.remove('wrong-tile'); }, 800);
                })(s.dropzoneLetters[m]);
            }
        }
        showFeedback('tr-feedback', randomError(), 'error');
    }
}

// ============================================
//  VICTOIRE / MODAL
// ============================================

function showVictory(module) {
    var s = state[module];
    var total = s.words.length;
    var correct = s.correctCount;
    var pct = Math.round((correct / total) * 100);

    var starsEarned = 1;
    if (pct >= 80) starsEarned = 3;
    else if (pct >= 50) starsEarned = 2;

    var starStr = '';
    for (var i = 0; i < starsEarned; i++) starStr += '⭐';
    for (var j = starsEarned; j < 3; j++) starStr += '☆';

    document.getElementById('victory-stars').textContent = starStr;
    document.getElementById('victory-title').textContent = pct >= 80 ? '🎉 Excellent !' : pct >= 50 ? '👏 Bien joué !' : '💪 Continue !';
    document.getElementById('victory-message').textContent = 'Tu as obtenu ' + correct + '/' + total + ' bonnes réponses (' + pct + '%)';

    document.getElementById('victory-stats').innerHTML =
        '<div class="stat-item"><span class="stat-icon">✅</span><span class="stat-value">' + correct + '</span><span class="stat-label">Correct</span></div>' +
        '<div class="stat-item"><span class="stat-icon">⭐</span><span class="stat-value">' + s.stars + '</span><span class="stat-label">Étoiles</span></div>' +
        '<div class="stat-item"><span class="stat-icon">🔥</span><span class="stat-value">' + state.streak + '</span><span class="stat-label">Série</span></div>';

    document.getElementById('victory-modal').classList.add('show');
    createConfetti();

    var progressEl = document.getElementById(module + '-progress');
    if (progressEl) progressEl.style.width = '100%';
}

function createConfetti() {
    var container = document.getElementById('confetti-container');
    container.innerHTML = '';
    var colors = ['#6C63FF', '#FF6584', '#00C851', '#FFB347', '#FF4444', '#FFD700'];

    for (var i = 0; i < 40; i++) {
        var piece = document.createElement('div');
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
//  DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
//  → Résout TOUS les problèmes mobile
// ============================================

function findActionElement(el) {
    // Remonte le DOM pour trouver l'élément avec data-action
    var current = el;
    var maxDepth = 8;
    while (current && maxDepth > 0) {
        if (current.getAttribute && current.getAttribute('data-action')) {
            return current;
        }
        current = current.parentElement;
        maxDepth--;
    }
    return null;
}

function handleAction(e) {
    var target = findActionElement(e.target);
    if (!target) return;

    var action = target.getAttribute('data-action');

    // Empêcher le double-fire sur mobile (touchend + click)
    if (e.type === 'touchend') {
        e.preventDefault(); // empêche le click fantôme
    }

    switch (action) {

        // === NAVIGATION ===
        case 'module':
            startModule(target.getAttribute('data-module'));
            break;

        case 'home':
            goHome();
            break;

        case 'home-close':
            goHome();
            closeModal();
            break;

        case 'replay':
            replayModule();
            break;

        // === ASSEMBLAGE ===
        case 'asm-level':
            setAssemblyLevel(parseInt(target.getAttribute('data-level')));
            break;

        case 'check-asm':
            checkAssembly();
            break;

        // === GENDER ===
        case 'check-gen':
            checkGender();
            break;

        // === TRANSLATION ===
        case 'tr-mode':
            setTranslationMode(target.getAttribute('data-mode'));
            break;

        case 'check-tr':
            checkTranslation();
            break;

        case 'mcq-answer':
            handleMCQAnswer(target);
            break;

        // === QUIZ LETTER FORMS ===
        case 'quiz-answer':
            handleQuizAnswer(target);
            break;

        // === COMMUN ===
        case 'toggle':
            toggleTranslation(target.getAttribute('data-prefix'));
            break;

        case 'hint':
            giveHint(target.getAttribute('data-module'));
            break;

        case 'skip':
            skipWord(target.getAttribute('data-module'));
            break;

        case 'speak':
            speakArabicForModule(target.getAttribute('data-module'));
            break;

        case 'speak-word':
            speakArabicWord(target.getAttribute('data-word'));
            break;

        // === LETTER TILES ===
        case 'tile':
            toggleLetterTile(target, target.getAttribute('data-module'));
            break;

        // === LETTER NAVIGATOR ===
        case 'prev-letter':
            prevLetter();
            break;

        case 'next-letter':
            nextLetter();
            break;
    }
}

// ============================================
//  INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // Attacher les 2 types d'événements pour compatibilité maximale
    document.body.addEventListener('touchend', handleAction, { passive: false });
    document.body.addEventListener('click', function(e) {
        // Sur mobile, le touchend a déjà traité l'action
        // Sur desktop, le click fonctionne normalement
        // On vérifie qu'on n'est PAS sur un appareil tactile qui a déjà déclenché touchend
        if (!('ontouchstart' in window)) {
            handleAction(e);
        }
    }, false);

    // Fallback : certains mobiles hybrides
    // Si on détecte du touch, on utilise un flag
    var touchUsed = false;
    document.body.addEventListener('touchstart', function() {
        touchUsed = true;
    }, { passive: true });

    // Remplacement du click pour appareils hybrides
    document.body.addEventListener('click', function(e) {
        if (touchUsed) {
            // Déjà géré par touchend
            touchUsed = false;
            return;
        }
        handleAction(e);
    }, false);

    updateHomeStats();
    showScreen('home-screen');
});
