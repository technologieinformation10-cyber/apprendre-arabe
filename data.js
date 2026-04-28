/* ============================================
   DATA.JS - Toutes les données de l'application
   ============================================ */

// ===== Mots pour le jeu d'assemblage =====
const ASSEMBLY_WORDS = {
    1: [ // Niveau 1 - Mots courts (2-3 lettres)
        { french: "chat", arabic: "قطّ", emoji: "🐱" },
        { french: "chien", arabic: "كلب", emoji: "🐕" },
        { french: "pain", arabic: "خبز", emoji: "🍞" },
        { french: "eau", arabic: "ماء", emoji: "💧" },
        { french: "lait", arabic: "حليب", emoji: "🥛" },
        { french: "jour", arabic: "يوم", emoji: "☀️" },
        { french: "nuit", arabic: "ليل", emoji: "🌙" },
        { french: "roi", arabic: "ملك", emoji: "👑" },
        { french: "mer", arabic: "بحر", emoji: "🌊" },
        { french: "lune", arabic: "قمر", emoji: "🌕" },
    ],
    2: [ // Niveau 2 - Mots moyens (4-5 lettres)
        { french: "école", arabic: "مدرسة", emoji: "🏫" },
        { french: "stylo", arabic: "قلم", emoji: "🖊️" },
        { french: "cahier", arabic: "دفتر", emoji: "📓" },
        { french: "livre", arabic: "كتاب", emoji: "📖" },
        { french: "maison", arabic: "منزل", emoji: "🏠" },
        { french: "jardin", arabic: "حديقة", emoji: "🌳" },
        { french: "soleil", arabic: "شمس", emoji: "☀️" },
        { french: "fleur", arabic: "زهرة", emoji: "🌸" },
        { french: "étoile", arabic: "نجمة", emoji: "⭐" },
        { french: "orange", arabic: "برتقال", emoji: "🍊" },
    ],
    3: [ // Niveau 3 - Mots longs (5+ lettres)
        { french: "professeur", arabic: "أستاذ", emoji: "👨‍🏫" },
        { french: "bibliothèque", arabic: "مكتبة", emoji: "📚" },
        { french: "hôpital", arabic: "مستشفى", emoji: "🏥" },
        { french: "ingénieur", arabic: "مهندس", emoji: "👷" },
        { french: "ordinateur", arabic: "حاسوب", emoji: "💻" },
        { french: "aéroport", arabic: "مطار", emoji: "✈️" },
        { french: "université", arabic: "جامعة", emoji: "🎓" },
        { french: "restaurant", arabic: "مطعم", emoji: "🍽️" },
        { french: "pharmacie", arabic: "صيدلية", emoji: "💊" },
        { french: "éléphant", arabic: "فيل", emoji: "🐘" },
    ]
};

// ===== Données Masculin/Féminin =====
const GENDER_WORDS = [
    { masculine: "معلم", feminine: "معلمة", mascFr: "maître", femFr: "maîtresse", emoji: "👨‍🏫" },
    { masculine: "طبيب", feminine: "طبيبة", mascFr: "médecin (m)", femFr: "médecin (f)", emoji: "👨‍⚕️" },
    { masculine: "صبي", feminine: "صبية", mascFr: "garçon", femFr: "fille", emoji: "👦" },
    { masculine: "تلميذ", feminine: "تلميذة", mascFr: "élève (m)", femFr: "élève (f)", emoji: "🧑‍🎓" },
    { masculine: "مدير", feminine: "مديرة", mascFr: "directeur", femFr: "directrice", emoji: "👔" },
    { masculine: "مريض", feminine: "مريضة", mascFr: "malade (m)", femFr: "malade (f)", emoji: "🤒" },
    { masculine: "مهندس", feminine: "مهندسة", mascFr: "ingénieur (m)", femFr: "ingénieur (f)", emoji: "👷" },
    { masculine: "طالب", feminine: "طالبة", mascFr: "étudiant", femFr: "étudiante", emoji: "📚" },
    { masculine: "كاتب", feminine: "كاتبة", mascFr: "écrivain (m)", femFr: "écrivain (f)", emoji: "✍️" },
    { masculine: "طباخ", feminine: "طباخة", mascFr: "cuisinier", femFr: "cuisinière", emoji: "👨‍🍳" },
];

// ===== Données Traduction =====
const TRANSLATION_WORDS = [
    { french: "apprendre", arabic: "يتعلم", emoji: "📖" },
    { french: "facile", arabic: "سهل", emoji: "👍" },
    { french: "demander", arabic: "يطلب", emoji: "🙋" },
    { french: "école", arabic: "مدرسة", emoji: "🏫" },
    { french: "stylo", arabic: "قلم", emoji: "🖊️" },
    { french: "cahier", arabic: "دفتر", emoji: "📓" },
    { french: "livre", arabic: "كتاب", emoji: "📖" },
    { french: "maître", arabic: "معلم", emoji: "👨‍🏫" },
    { french: "maîtresse", arabic: "معلمة", emoji: "👩‍🏫" },
    { french: "ami", arabic: "صديق", emoji: "🤝" },
    { french: "maison", arabic: "منزل", emoji: "🏠" },
    { french: "soleil", arabic: "شمس", emoji: "☀️" },
];

// ===== Données des formes des lettres arabes =====
const ARABIC_LETTERS = [
    {
        name: "Alif - ألف",
        isolated: "ا", initial: "ا", medial: "ـا", final: "ـا",
        examples: [
            { word: "أسد", meaning: "lion", highlight: 0 },
            { word: "باب", meaning: "porte", highlight: 2 },
            { word: "كتاب", meaning: "livre", highlight: 2 },
        ]
    },
    {
        name: "Ba - باء",
        isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب",
        examples: [
            { word: "بيت", meaning: "maison", highlight: 0 },
            { word: "كتب", meaning: "écrire", highlight: 2 },
            { word: "كلب", meaning: "chien", highlight: 2 },
        ]
    },
    {
        name: "Ta - تاء",
        isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت",
        examples: [
            { word: "تفاح", meaning: "pomme", highlight: 0 },
            { word: "كتب", meaning: "écrire", highlight: 1 },
            { word: "بيت", meaning: "maison", highlight: 2 },
        ]
    },
    {
        name: "Tha - ثاء",
        isolated: "ث", initial: "ثـ", medial: "ـثـ", final: "ـث",
        examples: [
            { word: "ثعلب", meaning: "renard", highlight: 0 },
            { word: "مثال", meaning: "exemple", highlight: 1 },
            { word: "ثلث", meaning: "tiers", highlight: 2 },
        ]
    },
    {
        name: "Jim - جيم",
        isolated: "ج", initial: "جـ", medial: "ـجـ", final: "ـج",
        examples: [
            { word: "جمل", meaning: "chameau", highlight: 0 },
            { word: "رجل", meaning: "homme", highlight: 1 },
            { word: "ثلج", meaning: "neige", highlight: 2 },
        ]
    },
    {
        name: "Ha - حاء",
        isolated: "ح", initial: "حـ", medial: "ـحـ", final: "ـح",
        examples: [
            { word: "حصان", meaning: "cheval", highlight: 0 },
            { word: "بحر", meaning: "mer", highlight: 1 },
            { word: "صباح", meaning: "matin", highlight: 3 },
        ]
    },
    {
        name: "Kha - خاء",
        isolated: "خ", initial: "خـ", medial: "ـخـ", final: "ـخ",
        examples: [
            { word: "خبز", meaning: "pain", highlight: 0 },
            { word: "نخل", meaning: "palmier", highlight: 1 },
            { word: "مطبخ", meaning: "cuisine", highlight: 3 },
        ]
    },
    {
        name: "Dal - دال",
        isolated: "د", initial: "د", medial: "ـد", final: "ـد",
        examples: [
            { word: "ديك", meaning: "coq", highlight: 0 },
            { word: "مدرسة", meaning: "école", highlight: 1 },
            { word: "ولد", meaning: "garçon", highlight: 2 },
        ]
    },
    {
        name: "Shin - شين",
        isolated: "ش", initial: "شـ", medial: "ـشـ", final: "ـش",
        examples: [
            { word: "شمس", meaning: "soleil", highlight: 0 },
            { word: "مشمش", meaning: "abricot", highlight: 1 },
            { word: "عش", meaning: "nid", highlight: 1 },
        ]
    },
    {
        name: "Sad - صاد",
        isolated: "ص", initial: "صـ", medial: "ـصـ", final: "ـص",
        examples: [
            { word: "صبي", meaning: "garçon", highlight: 0 },
            { word: "نصف", meaning: "moitié", highlight: 1 },
            { word: "قفص", meaning: "cage", highlight: 2 },
        ]
    },
    {
        name: "Ain - عين",
        isolated: "ع", initial: "عـ", medial: "ـعـ", final: "ـع",
        examples: [
            { word: "عين", meaning: "œil", highlight: 0 },
            { word: "معلم", meaning: "maître", highlight: 1 },
            { word: "ربيع", meaning: "printemps", highlight: 3 },
        ]
    },
    {
        name: "Mim - ميم",
        isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم",
        examples: [
            { word: "ماء", meaning: "eau", highlight: 0 },
            { word: "شمس", meaning: "soleil", highlight: 1 },
            { word: "قلم", meaning: "stylo", highlight: 2 },
        ]
    },
    {
        name: "Nun - نون",
        isolated: "ن", initial: "نـ", medial: "ـنـ", final: "ـن",
        examples: [
            { word: "نجم", meaning: "étoile", highlight: 0 },
            { word: "منزل", meaning: "maison", highlight: 1 },
            { word: "وطن", meaning: "patrie", highlight: 2 },
        ]
    },
    {
        name: "Ya - ياء",
        isolated: "ي", initial: "يـ", medial: "ـيـ", final: "ـي",
        examples: [
            { word: "يد", meaning: "main", highlight: 0 },
            { word: "بيت", meaning: "maison", highlight: 1 },
            { word: "كرسي", meaning: "chaise", highlight: 3 },
        ]
    },
    {
        name: "Waw - واو",
        isolated: "و", initial: "و", medial: "ـو", final: "ـو",
        examples: [
            { word: "ولد", meaning: "garçon", highlight: 0 },
            { word: "نور", meaning: "lumière", highlight: 1 },
            { word: "دلو", meaning: "seau", highlight: 2 },
        ]
    },
];

// ===== Messages de feedback positifs =====
const POSITIVE_MESSAGES = [
    "🎉 Bravo ! Excellent !",
    "⭐ Super travail !",
    "🏆 Tu es un champion !",
    "🌟 Magnifique !",
    "👏 Parfait !",
    "🎊 Incroyable !",
    "💪 Tu progresses vite !",
    "🔥 En feu !",
    "✨ Fantastique !",
    "🥇 Tu es le meilleur !"
];

const POSITIVE_MESSAGES_AR = [
    "أحسنت",
    "ممتاز",
    "رائع",
    "عمل جيد",
    "مبارك",
];

// ===== Messages d'erreur encourageants =====
const ERROR_MESSAGES = [
    "😊 Presque ! Essaie encore !",
    "💪 Tu peux le faire !",
    "🤔 Regarde bien les lettres...",
    "📝 Encore un petit effort !",
    "🔍 Vérifie l'ordre des lettres.",
];