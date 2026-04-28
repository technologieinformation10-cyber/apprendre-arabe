/* ============================================
   APP.JS - VERSION FINALE COMPLÈTE
   ============================================ */

var state = {
    totalStars: 0, totalWords: 0, streak: 0,
    asm: { level:1, currentIndex:0, words:[], stars:0, dropzoneLetters:[], correctCount:0 },
    lf:  { currentIndex:0, stars:0, quizLocked:false },
    gen: { currentIndex:0, words:[], stars:0, dropzoneLetters:[], correctCount:0 },
    tr:  { mode:'mcq', currentIndex:0, words:[], stars:0, dropzoneLetters:[], correctCount:0, mcqLocked:false },
    currentModule: null, busy: false
};

function extractLetters(word) {
    return Array.from(word.replace(/[\u064B-\u065F\u0670\u0651]/g, ''));
}

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function showFeedback(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'feedback-area ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(function() { el.textContent = ''; el.className = 'feedback-area'; }, 3500);
}

function speakWord(text) {
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(text);
            u.lang = 'ar-SA'; u.rate = 0.75;
            window.speechSynthesis.speak(u);
        }
    } catch(e) {}
}

function playSuccess() {
    try {
        var c = new (window.AudioContext || window.webkitAudioContext)();
        var o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.setValueAtTime(523, c.currentTime);
        o.frequency.setValueAtTime(659, c.currentTime + 0.1);
        o.frequency.setValueAtTime(784, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
        o.start(c.currentTime); o.stop(c.currentTime + 0.4);
    } catch(e) {}
}

function playError() {
    try {
        var c = new (window.AudioContext || window.webkitAudioContext)();
        var o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination); o.type = 'square';
        o.frequency.setValueAtTime(200, c.currentTime);
        o.frequency.setValueAtTime(150, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3);
        o.start(c.currentTime); o.stop(c.currentTime + 0.3);
    } catch(e) {}
}

function updateHomeStats() {
    document.getElementById('total-stars').textContent = state.totalStars;
    document.getElementById('total-words').textContent = state.totalWords;
    document.getElementById('total-streak').textContent = state.streak;
}

/* ===== NAVIGATION ===== */

function showScreen(id) {
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}

function goHome() {
    updateHomeStats();
    showScreen('home-screen');
    state.currentModule = null;
}

function startModule(name) {
    state.currentModule = name;
    if (name === 'assembly')    { initAssembly();    showScreen('assembly-screen'); }
    if (name === 'letterforms') { initLetterForms();  showScreen('letterforms-screen'); }
    if (name === 'gender')      { initGender();       showScreen('gender-screen'); }
    if (name === 'translation') { initTranslation();  showScreen('translation-screen'); }
}

/* ===== TILE CLICK : déplacer lettre ===== */

function moveTile(tile, mod) {
    if (state.busy) return;
    var s = state[mod];
    var dropzone = document.getElementById(mod + '-dropzone');
    var pool = document.getElementById(mod + '-letters');
    var placeholder = document.getElementById(mod + '-placeholder');

    if (tile.classList.contains('in-dropzone')) {
        // Retirer du dropzone → remettre dans le pool
        tile.classList.remove('in-dropzone');
        pool.appendChild(tile);
        var idx = -1;
        for (var i = 0; i < s.dropzoneLetters.length; i++) {
            if (s.dropzoneLetters[i] === tile) { idx = i; break; }
        }
        if (idx > -1) s.dropzoneLetters.splice(idx, 1);
    } else {
        // Ajouter au dropzone
        tile.classList.add('in-dropzone');
        dropzone.appendChild(tile);
        s.dropzoneLetters.push(tile);
    }

    if (placeholder) {
        placeholder.style.display = s.dropzoneLetters.length > 0 ? 'none' : 'block';
    }
}

function buildTiles(container, letters, mod) {
    container.innerHTML = '';
    var mixed = shuffle(letters);
    for (var i = 0; i < mixed.length; i++) {
        var d = document.createElement('div');
        d.className = 'letter-tile';
        d.textContent = mixed[i];
        d.setAttribute('data-letter', mixed[i]);
        d.setAttribute('data-action', 'tile');
        d.setAttribute('data-module', mod);
        container.appendChild(d);
    }
}

/* ===== MODULE 1 : ASSEMBLAGE ===== */

function initAssembly() {
    var s = state.asm;
    s.currentIndex = 0; s.correctCount = 0; s.stars = 0; s.dropzoneLetters = [];
    s.words = shuffle(ASSEMBLY_WORDS[s.level]).slice(0, 5);
    loadAsmWord();
}

function setAsmLevel(lv) {
    state.asm.level = lv;
    var btns = document.querySelectorAll('.level-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    var b = document.getElementById('asm-lvl-' + lv);
    if (b) b.classList.add('active');
    document.getElementById('asm-level').textContent = 'Niveau ' + lv;
    initAssembly();
}

function loadAsmWord() {
    var s = state.asm;
    if (s.currentIndex >= s.words.length) { showVictory('asm'); return; }
    var w = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('asm-french').textContent = w.emoji + ' ' + w.french;
    document.getElementById('asm-arabic').textContent = w.arabic;
    document.getElementById('asm-arabic').classList.add('hidden');
    document.getElementById('asm-toggle').textContent = '👁️ Voir la traduction';
    document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('asm-feedback').textContent = '';
    document.getElementById('asm-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('asm-progress').style.width = pct + '%';
    document.getElementById('asm-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    var dz = document.getElementById('asm-dropzone');
    dz.innerHTML = '<p class="drop-placeholder" id="asm-placeholder">Appuie sur les lettres ici →</p>';
    dz.className = 'drop-zone';

    buildTiles(document.getElementById('asm-letters'), extractLetters(w.arabic), 'asm');
}

function checkAsm() {
    if (state.busy) return;
    var s = state.asm;
    if (s.currentIndex >= s.words.length) return;
    var w = s.words[s.currentIndex];
    var correct = extractLetters(w.arabic);
    var user = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) {
        user.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    }
    var dz = document.getElementById('asm-dropzone');

    if (user.length !== correct.length) {
        showFeedback('asm-feedback', '📝 Place toutes les lettres !', 'error');
        playError(); dz.classList.add('wrong');
        setTimeout(function() { dz.classList.remove('wrong'); }, 600);
        return;
    }

    var ok = true;
    for (var j = 0; j < correct.length; j++) {
        if (user[j] !== correct[j]) { ok = false; break; }
    }

    if (ok) {
        state.busy = true;
        dz.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) s.dropzoneLetters[k].classList.add('correct-tile');
        s.stars++; s.correctCount++; state.totalStars++; state.totalWords++; state.streak++;
        document.getElementById('asm-stars').textContent = '⭐ ' + s.stars;
        showFeedback('asm-feedback', POSITIVE_MESSAGES[Math.floor(Math.random()*POSITIVE_MESSAGES.length)], 'success');
        playSuccess(); speakWord(w.arabic);
        setTimeout(function() { s.currentIndex++; state.busy = false; loadAsmWord(); }, 1800);
    } else {
        dz.classList.add('wrong');
        setTimeout(function() { dz.classList.remove('wrong'); }, 600);
        state.streak = 0; playError();
        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correct.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correct[m]) {
                (function(t) { t.classList.add('wrong-tile'); setTimeout(function(){ t.classList.remove('wrong-tile'); }, 800); })(s.dropzoneLetters[m]);
            }
        }
        showFeedback('asm-feedback', ERROR_MESSAGES[Math.floor(Math.random()*ERROR_MESSAGES.length)], 'error');
    }
}

function giveHint(mod) {
    var s = state[mod];
    var correct;
    if (mod === 'asm' && s.words[s.currentIndex]) correct = extractLetters(s.words[s.currentIndex].arabic);
    else if (mod === 'gen' && s.words[s.currentIndex]) correct = extractLetters(s.words[s.currentIndex].feminine);
    else if (mod === 'tr' && s.words[s.currentIndex]) correct = extractLetters(s.words[s.currentIndex].arabic);
    else return;

    var ni = s.dropzoneLetters.length;
    if (ni >= correct.length) return;
    var need = correct[ni];

    var pool = document.getElementById(mod + '-letters');
    var tiles = pool.querySelectorAll('.letter-tile:not(.in-dropzone)');
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.remove('hint-glow');
    for (var j = 0; j < tiles.length; j++) {
        if (tiles[j].getAttribute('data-letter') === need) {
            tiles[j].classList.add('hint-glow');
            (function(t) { setTimeout(function(){ t.classList.remove('hint-glow'); }, 2500); })(tiles[j]);
            break;
        }
    }
    var ar = document.getElementById(mod + '-arabic');
    if (ar) ar.classList.remove('hidden');
}

function skipWord(mod) {
    if (state.busy) return;
    state[mod].currentIndex++; state.streak = 0;
    if (mod === 'asm') loadAsmWord();
    if (mod === 'gen') loadGenWord();
    if (mod === 'tr')  loadTrWord();
}/* ===== MODULE 2 : FORMES DES LETTRES ===== */

function initLetterForms() {
    state.lf.currentIndex = 0; state.lf.stars = 0; state.lf.quizLocked = false;
    loadLetter();
}

function loadLetter() {
    var lt = ARABIC_LETTERS[state.lf.currentIndex];
    document.getElementById('lf-main-letter').textContent = lt.isolated;
    document.getElementById('lf-letter-name').textContent = lt.name;
    document.getElementById('lf-isolated').textContent = lt.isolated;
    document.getElementById('lf-initial').textContent = lt.initial;
    document.getElementById('lf-medial').textContent = lt.medial;
    document.getElementById('lf-final').textContent = lt.final;
    document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;

    var ex = document.getElementById('lf-examples');
    ex.innerHTML = '';
    for (var i = 0; i < lt.examples.length; i++) {
        var e = lt.examples[i];
        var d = document.createElement('div');
        d.className = 'word-example';
        d.setAttribute('data-action', 'speak-word');
        d.setAttribute('data-word', e.word);
        var chars = Array.from(e.word), html = '';
        for (var c = 0; c < chars.length; c++) {
            html += (c === e.highlight) ? '<span class="highlighted-letter">' + chars[c] + '</span>' : chars[c];
        }
        d.innerHTML = html + '<br><small style="font-family:Nunito,sans-serif;font-size:0.7rem;color:#7C7AA0">' + e.meaning + '</small>';
        ex.appendChild(d);
    }
    loadQuiz();
}

function loadQuiz() {
    state.lf.quizLocked = false;
    var lt = ARABIC_LETTERS[state.lf.currentIndex];
    var posNames = ['début', 'milieu', 'fin', 'isolée'];
    var forms = [lt.initial, lt.medial, lt.final, lt.isolated];
    var ri = Math.floor(Math.random() * 4);

    document.getElementById('lf-quiz-question').innerHTML =
        'Forme de <strong style="font-family:Amiri,serif;font-size:1.4em;color:#6C63FF">' +
        lt.isolated + '</strong> en <strong>' + posNames[ri] + '</strong> ?';

    var correctForm = forms[ri];
    var opts = [];
    for (var i = 0; i < forms.length; i++) {
        if (opts.indexOf(forms[i]) === -1) opts.push(forms[i]);
    }
    var att = 0;
    while (opts.length < 4 && att < 30) {
        var rl = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        var rf = [rl.initial, rl.medial, rl.final, rl.isolated][Math.floor(Math.random() * 4)];
        if (opts.indexOf(rf) === -1) opts.push(rf);
        att++;
    }
    opts = shuffle(opts).slice(0, 4);
    var found = false;
    for (var j = 0; j < opts.length; j++) { if (opts[j] === correctForm) found = true; }
    if (!found) opts[Math.floor(Math.random() * opts.length)] = correctForm;

    var cont = document.getElementById('lf-quiz-options');
    cont.innerHTML = '';
    for (var k = 0; k < opts.length; k++) {
        var b = document.createElement('div');
        b.className = 'quiz-option';
        b.textContent = opts[k];
        b.setAttribute('data-action', 'quiz-answer');
        b.setAttribute('data-answer', opts[k]);
        b.setAttribute('data-correct', correctForm);
        cont.appendChild(b);
    }
}

function handleQuiz(btn) {
    if (state.lf.quizLocked) return;
    state.lf.quizLocked = true;
    var ans = btn.getAttribute('data-answer');
    var cor = btn.getAttribute('data-correct');
    if (ans === cor) {
        btn.classList.add('selected-correct');
        state.lf.stars++; state.totalStars++; state.streak++;
        document.getElementById('lf-stars').textContent = '⭐ ' + state.lf.stars;
        showFeedback('lf-feedback', '🎉 Bravo !', 'success'); playSuccess();
    } else {
        btn.classList.add('selected-wrong'); state.streak = 0; playError();
        var all = document.getElementById('lf-quiz-options').querySelectorAll('.quiz-option');
        for (var i = 0; i < all.length; i++) {
            if (all[i].getAttribute('data-answer') === cor) all[i].classList.add('selected-correct');
        }
        showFeedback('lf-feedback', '❌ Réponse : ' + cor, 'error');
    }
    setTimeout(loadQuiz, 2000);
}

/* ===== MODULE 3 : MASCULIN / FÉMININ ===== */

function initGender() {
    var s = state.gen;
    s.currentIndex = 0; s.correctCount = 0; s.stars = 0; s.dropzoneLetters = [];
    s.words = shuffle(GENDER_WORDS.slice()).slice(0, 7);
    loadGenWord();
}

function loadGenWord() {
    var s = state.gen;
    if (s.currentIndex >= s.words.length) { showVictory('gen'); return; }
    var w = s.words[s.currentIndex];
    s.dropzoneLetters = [];

    document.getElementById('gen-masculine').textContent = w.masculine;
    document.getElementById('gen-masc-french').textContent = w.mascFr;
    document.getElementById('gen-feminine').textContent = '?';
    document.getElementById('gen-fem-french').textContent = w.femFr;
    document.getElementById('gen-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('gen-feedback').textContent = '';
    document.getElementById('gen-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('gen-progress').style.width = pct + '%';
    document.getElementById('gen-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    var dz = document.getElementById('gen-dropzone');
    dz.innerHTML = '<p class="drop-placeholder" id="gen-placeholder">Construis le féminin ici →</p>';
    dz.className = 'drop-zone';

    buildTiles(document.getElementById('gen-letters'), extractLetters(w.feminine), 'gen');
}

function checkGen() {
    if (state.busy) return;
    var s = state.gen;
    if (s.currentIndex >= s.words.length) return;
    var w = s.words[s.currentIndex];
    var correct = extractLetters(w.feminine);
    var user = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) user.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    var dz = document.getElementById('gen-dropzone');

    if (user.length !== correct.length) {
        showFeedback('gen-feedback', '📝 Place toutes les lettres !', 'error');
        playError(); dz.classList.add('wrong');
        setTimeout(function(){ dz.classList.remove('wrong'); }, 600);
        return;
    }

    var ok = true;
    for (var j = 0; j < correct.length; j++) { if (user[j] !== correct[j]) { ok = false; break; } }

    if (ok) {
        state.busy = true; dz.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) s.dropzoneLetters[k].classList.add('correct-tile');
        s.stars++; s.correctCount++; state.totalStars++; state.totalWords++; state.streak++;
        document.getElementById('gen-stars').textContent = '⭐ ' + s.stars;
        document.getElementById('gen-feminine').textContent = w.feminine;
        showFeedback('gen-feedback', '🎉 ' + w.masculine + ' → ' + w.feminine, 'success');
        playSuccess(); speakWord(w.feminine);
        setTimeout(function(){ s.currentIndex++; state.busy = false; loadGenWord(); }, 2000);
    } else {
        dz.classList.add('wrong');
        setTimeout(function(){ dz.classList.remove('wrong'); }, 600);
        state.streak = 0; playError();
        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correct.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correct[m]) {
                (function(t){ t.classList.add('wrong-tile'); setTimeout(function(){ t.classList.remove('wrong-tile'); }, 800); })(s.dropzoneLetters[m]);
            }
        }
        showFeedback('gen-feedback', ERROR_MESSAGES[Math.floor(Math.random()*ERROR_MESSAGES.length)], 'error');
    }
}

/* ===== MODULE 4 : TRADUCTION ===== */

function initTranslation() {
    var s = state.tr;
    s.currentIndex = 0; s.correctCount = 0; s.stars = 0; s.dropzoneLetters = []; s.mcqLocked = false;
    s.words = shuffle(TRANSLATION_WORDS.slice()).slice(0, 9);
    loadTrWord();
}

function setTrMode(mode) {
    state.tr.mode = mode;
    document.getElementById('tr-mode-mcq').classList.toggle('active', mode === 'mcq');
    document.getElementById('tr-mode-build').classList.toggle('active', mode === 'build');
    state.tr.currentIndex = 0; state.tr.correctCount = 0; state.tr.stars = 0;
    state.tr.words = shuffle(TRANSLATION_WORDS.slice()).slice(0, 9);
    document.getElementById('tr-stars').textContent = '⭐ 0';
    loadTrWord();
}

function loadTrWord() {
    var s = state.tr;
    if (s.currentIndex >= s.words.length) { showVictory('tr'); return; }
    var w = s.words[s.currentIndex];
    s.dropzoneLetters = []; s.mcqLocked = false;

    document.getElementById('tr-french').textContent = w.french;
    document.getElementById('tr-image').textContent = w.emoji;
    document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
    document.getElementById('tr-feedback').textContent = '';
    document.getElementById('tr-feedback').className = 'feedback-area';

    var pct = (s.currentIndex / s.words.length) * 100;
    document.getElementById('tr-progress').style.width = pct + '%';
    document.getElementById('tr-progress-text').textContent = (s.currentIndex + 1) + ' / ' + s.words.length;

    if (s.mode === 'mcq') {
        document.getElementById('tr-mcq-section').classList.remove('hidden');
        document.getElementById('tr-build-section').classList.add('hidden');
        loadMCQ(w);
    } else {
        document.getElementById('tr-mcq-section').classList.add('hidden');
        document.getElementById('tr-build-section').classList.remove('hidden');
        loadBuild(w);
    }
}

function loadMCQ(w) {
    var cont = document.getElementById('tr-mcq-options');
    cont.innerHTML = '';
    var all = [];
    for (var i = 0; i < TRANSLATION_WORDS.length; i++) all.push(TRANSLATION_WORDS[i].arabic);
    var opts = [w.arabic], att = 0;
    while (opts.length < 4 && att < 50) {
        var r = all[Math.floor(Math.random() * all.length)];
        if (opts.indexOf(r) === -1) opts.push(r);
        att++;
    }
    opts = shuffle(opts);
    for (var j = 0; j < opts.length; j++) {
        var b = document.createElement('div');
        b.className = 'mcq-option';
        b.textContent = opts[j];
        b.setAttribute('data-action', 'mcq-answer');
        b.setAttribute('data-answer', opts[j]);
        b.setAttribute('data-correct', w.arabic);
        cont.appendChild(b);
    }
}

function handleMCQ(btn) {
    if (state.tr.mcqLocked) return;
    state.tr.mcqLocked = true;
    var chosen = btn.getAttribute('data-answer');
    var correct = btn.getAttribute('data-correct');
    var cont = document.getElementById('tr-mcq-options');

    if (chosen === correct) {
        btn.classList.add('correct-choice');
        state.tr.stars++; state.tr.correctCount++; state.totalStars++; state.totalWords++; state.streak++;
        document.getElementById('tr-stars').textContent = '⭐ ' + state.tr.stars;
        showFeedback('tr-feedback', '🎉 Bravo !', 'success');
        playSuccess(); speakWord(correct);
        setTimeout(function(){ state.tr.currentIndex++; loadTrWord(); }, 1500);
    } else {
        btn.classList.add('wrong-choice'); state.streak = 0; playError();
        var all = cont.querySelectorAll('.mcq-option');
        for (var i = 0; i < all.length; i++) {
            if (all[i].getAttribute('data-answer') === correct) all[i].classList.add('correct-choice');
        }
        showFeedback('tr-feedback', '❌ Réponse : ' + correct, 'error');
        setTimeout(function(){ state.tr.currentIndex++; loadTrWord(); }, 2500);
    }
}

function loadBuild(w) {
    state.tr.dropzoneLetters = [];
    var dz = document.getElementById('tr-dropzone');
    dz.innerHTML = '<p class="drop-placeholder" id="tr-placeholder">Construis le mot ici →</p>';
    dz.className = 'drop-zone';
    buildTiles(document.getElementById('tr-letters'), extractLetters(w.arabic), 'tr');
}

function checkTr() {
    if (state.busy) return;
    var s = state.tr;
    if (s.currentIndex >= s.words.length) return;
    var w = s.words[s.currentIndex];
    var correct = extractLetters(w.arabic);
    var user = [];
    for (var i = 0; i < s.dropzoneLetters.length; i++) user.push(s.dropzoneLetters[i].getAttribute('data-letter'));
    var dz = document.getElementById('tr-dropzone');

    if (user.length !== correct.length) {
        showFeedback('tr-feedback', '📝 Place toutes les lettres !', 'error');
        playError(); dz.classList.add('wrong');
        setTimeout(function(){ dz.classList.remove('wrong'); }, 600);
        return;
    }

    var ok = true;
    for (var j = 0; j < correct.length; j++) { if (user[j] !== correct[j]) { ok = false; break; } }

    if (ok) {
        state.busy = true; dz.classList.add('correct');
        for (var k = 0; k < s.dropzoneLetters.length; k++) s.dropzoneLetters[k].classList.add('correct-tile');
        s.stars++; s.correctCount++; state.totalStars++; state.totalWords++; state.streak++;
        document.getElementById('tr-stars').textContent = '⭐ ' + s.stars;
        showFeedback('tr-feedback', '🎉 Bravo !', 'success');
        playSuccess(); speakWord(w.arabic);
        setTimeout(function(){ s.currentIndex++; state.busy = false; loadTrWord(); }, 1800);
    } else {
        dz.classList.add('wrong');
        setTimeout(function(){ dz.classList.remove('wrong'); }, 600);
        state.streak = 0; playError();
        for (var m = 0; m < s.dropzoneLetters.length; m++) {
            if (m < correct.length && s.dropzoneLetters[m].getAttribute('data-letter') !== correct[m]) {
                (function(t){ t.classList.add('wrong-tile'); setTimeout(function(){ t.classList.remove('wrong-tile'); }, 800); })(s.dropzoneLetters[m]);
            }
        }
        showFeedback('tr-feedback', ERROR_MESSAGES[Math.floor(Math.random()*ERROR_MESSAGES.length)], 'error');
    }
}

/* ===== VICTOIRE ===== */

function showVictory(mod) {
    var s = state[mod];
    var total = s.words.length, correct = s.correctCount;
    var pct = Math.round((correct / total) * 100);
    var nb = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;
    var str = '';
    for (var i = 0; i < nb; i++) str += '⭐';
    for (var j = nb; j < 3; j++) str += '☆';

    document.getElementById('victory-stars').textContent = str;
    document.getElementById('victory-title').textContent = pct >= 80 ? '🎉 Excellent !' : pct >= 50 ? '👏 Bien joué !' : '💪 Continue !';
    document.getElementById('victory-message').textContent = correct + '/' + total + ' bonnes réponses (' + pct + '%)';
    document.getElementById('victory-stats').innerHTML =
        '<div class="stat-item"><span class="stat-icon">✅</span><span class="stat-value">' + correct + '</span><span class="stat-label">Correct</span></div>' +
        '<div class="stat-item"><span class="stat-icon">⭐</span><span class="stat-value">' + s.stars + '</span><span class="stat-label">Étoiles</span></div>';

    document.getElementById('victory-modal').classList.add('show');

    // Confetti
    var cc = document.getElementById('confetti-container');
    cc.innerHTML = '';
    var colors = ['#6C63FF','#FF6584','#00C851','#FFB347','#FFD700'];
    for (var k = 0; k < 35; k++) {
        var p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random()*100+'%';
        p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
        p.style.animationDelay = Math.random()+'s';
        p.style.animationDuration = (Math.random()*1.5+1.5)+'s';
        cc.appendChild(p);
    }

    var prog = document.getElementById(mod + '-progress');
    if (prog) prog.style.width = '100%';
}

/* =============================================
   GESTIONNAIRE D'ÉVÉNEMENTS UNIQUE
   Ceci est le cœur qui fait marcher TOUS les boutons
   ============================================= */

function findAction(el) {
    var cur = el, depth = 10;
    while (cur && depth > 0) {
        if (cur.getAttribute && cur.getAttribute('data-action')) return cur;
        cur = cur.parentElement;
        depth--;
    }
    return null;
}

function onAction(e) {
    var target = findAction(e.target);
    if (!target) return;

    // Empêcher le click fantôme sur mobile après touchend
    if (e.type === 'touchend') {
        e.preventDefault();
    }

    var action = target.getAttribute('data-action');

    switch(action) {
        case 'module':
            startModule(target.getAttribute('data-module'));
            break;
        case 'home':
            goHome();
            break;
        case 'home-close':
            goHome();
            document.getElementById('victory-modal').classList.remove('show');
            break;
        case 'replay':
            document.getElementById('victory-modal').classList.remove('show');
            if (state.currentModule) startModule(state.currentModule);
            break;
        case 'asm-level':
            setAsmLevel(parseInt(target.getAttribute('data-level')));
            break;
        case 'toggle':
            var prefix = target.getAttribute('data-prefix');
            var ar = document.getElementById(prefix + '-arabic');
            if (ar) {
                if (ar.classList.contains('hidden')) {
                    ar.classList.remove('hidden');
                    target.textContent = '🙈 Masquer';
                } else {
                    ar.classList.add('hidden');
                    target.textContent = '👁️ Voir la traduction';
                }
            }
            break;
        case 'check-asm':
            checkAsm();
            break;
        case 'check-gen':
            checkGen();
            break;
        case 'check-tr':
            checkTr();
            break;
        case 'hint':
            giveHint(target.getAttribute('data-module'));
            break;
        case 'skip':
            skipWord(target.getAttribute('data-module'));
            break;
        case 'speak':
            var mod = target.getAttribute('data-module');
            var word = '';
            if (mod === 'asm' && state.asm.words[state.asm.currentIndex]) word = state.asm.words[state.asm.currentIndex].arabic;
            if (mod === 'gen' && state.gen.words[state.gen.currentIndex]) word = state.gen.words[state.gen.currentIndex].feminine;
            if (mod === 'tr' && state.tr.words[state.tr.currentIndex]) word = state.tr.words[state.tr.currentIndex].arabic;
            if (word) speakWord(word);
            break;
        case 'speak-word':
            speakWord(target.getAttribute('data-word'));
            break;
        case 'tile':
            moveTile(target, target.getAttribute('data-module'));
            break;
        case 'prev-letter':
            state.lf.currentIndex = (state.lf.currentIndex - 1 + ARABIC_LETTERS.length) % ARABIC_LETTERS.length;
            loadLetter();
            break;
        case 'next-letter':
            state.lf.currentIndex = (state.lf.currentIndex + 1) % ARABIC_LETTERS.length;
            loadLetter();
            break;
        case 'quiz-answer':
            handleQuiz(target);
            break;
        case 'mcq-answer':
            handleMCQ(target);
            break;
        case 'tr-mode':
            setTrMode(target.getAttribute('data-mode'));
            break;
    }
}

/* ===== DÉMARRAGE ===== */

(function() {
    // Détecte si l'appareil est tactile
    var isTouchDevice = false;

    document.addEventListener('touchstart', function() {
        isTouchDevice = true;
    }, { passive: true });

    // Sur mobile : touchend gère tout (avec preventDefault pour bloquer le click)
    document.addEventListener('touchend', function(e) {
        onAction(e);
    }, { passive: false });

    // Sur desktop : click gère tout (seulement si pas tactile)
    document.addEventListener('click', function(e) {
        if (!isTouchDevice) {
            onAction(e);
        }
        // Reset pour les appareils hybrides
        isTouchDevice = false;
    }, false);

    updateHomeStats();
    showScreen('home-screen');
})();