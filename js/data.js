// ═══════════════════════════════════════════════════════
//  PLANIFY — Data layer : constantes, store, utilitaires
// ═══════════════════════════════════════════════════════

// ── Humeurs ───────────────────────────────────────────
const MOODS = [null,
  {e:'✨',l:'Excellent', bg:'#FDE68A',bc:'#F59E0B'},
  {e:'🌸',l:'Bien',     bg:'#F9C8D9',bc:'#C4778E'},
  {e:'☁️',l:'Neutre',   bg:'#E5E7EB',bc:'#9CA3AF'},
  {e:'🌿',l:'Fatiguée', bg:'#D1FAE5',bc:'#10B981'},
  {e:'🌧️',l:'Difficile',bg:'#BFDBFE',bc:'#3B82F6'},
  {e:'🔥',l:'Stressée', bg:'#FED7AA',bc:'#F97316'},
  {e:'😢',l:'Triste',   bg:'#E0E7FF',bc:'#6366F1'},
];

// ── Palette de couleurs pour sujets / listes ─────────
const PALETTE = [
  {bg:'#FAF0F3',dot:'#C4778E'}, // rose
  {bg:'#FDF3E3',dot:'#C9A96E'}, // or
  {bg:'#EAF4EA',dot:'#7AA97C'}, // sauge
  {bg:'#DBEAFE',dot:'#2563EB'}, // bleu
  {bg:'#EDE9FE',dot:'#7C3AED'}, // violet
  {bg:'#FEF3C7',dot:'#D97706'}, // ambre
  {bg:'#FFE4E6',dot:'#E53E5A'}, // rouge
  {bg:'#F3F4F6',dot:'#6B7280'}, // gris
];

// ── Emojis pour sujets / listes ──────────────────────
const EMOJIS = ['📚','💡','🎯','⭐','🔬','📐','💻','🎨','📖','🌍','🏆','🎵','✏️','🧪','📊','🗺️','🔭','📝','💼','🌸','💄','👗','🎀','🌺','🍃'];

// ── Couleurs événements agenda ────────────────────────
const EVCOLORS = ['#C4778E','#C9A96E','#7AA97C','#2563EB','#7C3AED','#D97706','#E53E5A'];

// ── Calendrier français ───────────────────────────────
const MONTHS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_S = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const DOW      = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const DOW1     = ['L','M','M','J','V','S','D'];

// ── Affirmations quotidiennes (FR + AR) ───────────────
const AFFIRMATIONS = [
  // Français
  "Tu es capable d'accomplir tout ce que tu entreprends 💫",
  "Ta féminité est ta force la plus précieuse 🌸",
  "Chaque journée est une nouvelle page de ton histoire ✨",
  "Tu mérites tout le bonheur et la réussite du monde 🌟",
  "Tes rêves sont légitimes et ta détermination les réalisera 🎯",
  "Tu rayonnes de l'intérieur vers l'extérieur 💕",
  "Prendre soin de toi n'est pas un luxe, c'est une nécessité 🧘‍♀️",
  "Tu es plus forte que tes peurs et tes doutes 🌿",
  "Chaque petit progrès compte et mérite d'être célébré 🥂",
  "Tu as tout ce qu'il faut pour réussir aujourd'hui ✨",
  "Ta sensibilité est une qualité, pas une faiblesse 🌷",
  "Tu grandis et évolues chaque jour davantage 🌱",
  "Fais confiance à ton instinct, il ne te trompe pas 💫",
  "Tu es aimée, appréciée et remarquable 💖",
  "Ton énergie attire ce qui te correspond vraiment 🌙",
  "Sois fière du chemin parcouru jusqu'ici 🏆",
  "Tu es la protagoniste de ta propre vie 👑",
  "Tes efforts d'aujourd'hui sont les succès de demain ⭐",
  "Tu mérites des relations qui te nourrissent l'âme 🌸",
  "Chaque respiration est une opportunité de recommencer 🍃",
  "La persévérance est la clé de tous les succès 🗝️",
  "Tu brilles même quand tu ne t'en rends pas compte 🌟",
  "Ton futur sera à la hauteur de tes ambitions 🚀",
  "Aujourd'hui est une chance de te surpasser 💪",
  // Arabe
  "أنتِ قادرة على تحقيق كل ما تحلمين به 🌙",
  "جمالكِ الحقيقي يأتي من داخلكِ ✨",
  "كل يوم هو فرصة جديدة للتألق 🌸",
  "أنتِ أقوى مما تتخيلين 💪",
  "ثقي بنفسكِ، فالنجاح في طريقه إليكِ 🌟",
  "الله معكِ في كل خطوة 🤲",
  "عقلكِ الجميل هو أقوى سلاحكِ 💡",
  "أنتِ مميزة ولا يوجد مثلكِ أبدًا 💕",
  "كل تعبكِ اليوم سيصبح نجاحًا غدًا 🏆",
  "ابتسامتكِ تضيء كل ما حولكِ 🌺",
  "أنتِ لؤلؤة نادرة في هذا العالم 🪩",
  "إيمانكِ بنفسكِ هو بداية كل شيء جميل 🌿",
  "جهدكِ لن يضيع، الصبر مفتاح الفرج 🗝️",
  "أنتِ تستحقين كل الحب والسعادة 💖",
  "خطواتكِ الصغيرة تصنع إنجازات كبيرة 🌱",
];

// ── Affirmations bilingues séparées ──────────────────
const AFFIRMATIONS_FR = [
  "Tu es capable d'accomplir tout ce que tu entreprends 💫",
  "Ta féminité est ta force la plus précieuse 🌸",
  "Chaque journée est une nouvelle page de ton histoire ✨",
  "Tu mérites tout le bonheur et la réussite du monde 🌟",
  "Tes rêves sont légitimes et ta détermination les réalisera 🎯",
  "Tu rayonnes de l'intérieur vers l'extérieur 💕",
  "Prendre soin de toi n'est pas un luxe, c'est une nécessité 🧘‍♀️",
  "Tu es plus forte que tes peurs et tes doutes 🌿",
  "Chaque petit progrès compte et mérite d'être célébré 🥂",
  "Tu as tout ce qu'il faut pour réussir aujourd'hui ✨",
  "Ta sensibilité est une qualité, pas une faiblesse 🌷",
  "Tu grandis et évolues chaque jour davantage 🌱",
  "Fais confiance à ton instinct, il ne te trompe pas 💫",
  "Tu es aimée, appréciée et remarquable 💖",
  "Ton énergie attire ce qui te correspond vraiment 🌙",
  "Sois fière du chemin parcouru jusqu'ici 🏆",
  "Tu es la protagoniste de ta propre vie 👑",
  "Tes efforts d'aujourd'hui sont les succès de demain ⭐",
  "Tu mérites des relations qui te nourrissent l'âme 🌸",
  "La persévérance est la clé de tous les succès 🗝️",
  "Tu brilles même quand tu ne t'en rends pas compte 🌟",
  "Ton futur sera à la hauteur de tes ambitions 🚀",
  "Aujourd'hui est une chance de te surpasser 💪",
  "La douceur envers toi-même est ta plus grande force 🌺",
];
const AFFIRMATIONS_AR = [
  "أنتِ قادرة على تحقيق كل ما تحلمين به 🌙",
  "جمالكِ الحقيقي يأتي من داخلكِ ✨",
  "كل يوم هو فرصة جديدة للتألق 🌸",
  "أنتِ أقوى مما تتخيلين 💪",
  "ثقي بنفسكِ، فالنجاح في طريقه إليكِ 🌟",
  "الله معكِ في كل خطوة 🤲",
  "عقلكِ الجميل هو أقوى سلاحكِ 💡",
  "أنتِ مميزة ولا يوجد مثلكِ أبدًا 💕",
  "كل تعبكِ اليوم سيصبح نجاحًا غدًا 🏆",
  "ابتسامتكِ تضيء كل ما حولكِ 🌺",
  "أنتِ لؤلؤة نادرة في هذا العالم 🪩",
  "إيمانكِ بنفسكِ هو بداية كل شيء جميل 🌿",
  "جهدكِ لن يضيع، الصبر مفتاح الفرج 🗝️",
  "أنتِ تستحقين كل الحب والسعادة 💖",
  "خطواتكِ الصغيرة تصنع إنجازات كبيرة 🌱",
  "ستنجحين بإذن الله، ثقي بربكِ وبنفسكِ 🌟",
  "اجعلي هدفكِ أكبر من عقباتكِ 🎯",
  "حياتكِ رحلة جميلة، استمتعي بكل لحظة 🌺",
  "الصبر والإصرار مفتاح كل باب مغلق 🗝️",
  "لستِ وحدكِ، الله دائمًا بجانبكِ 🤲",
  "أنتِ نعمة في حياة من حولكِ 💕",
  "حلمكِ ممكن، فقط لا تتوقفي 🚀",
  "أنتِ كنز ثمين، لا تنسي قيمتكِ 👑",
  "كوني نفسكِ دائمًا، فأنتِ كافية 🌸",
];

function todayAffirmationFR() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
  return AFFIRMATIONS_FR[doy % AFFIRMATIONS_FR.length];
}
function todayAffirmationAR() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
  return AFFIRMATIONS_AR[(doy + 3) % AFFIRMATIONS_AR.length];
}

// ── Capsules du jour (7 thèmes) ───────────────────────
const CAPSULES = [
  // Dimanche
  {ico:'🌙',label:'Bien-être du soir',
   text:"Prépare ta semaine avec douceur : liste 3 priorités, prévois un moment de joie et planifie ton sommeil. La douceur est une stratégie 🌸",
   ar:"استعدّي لأسبوعكِ بهدوء: اكتبي 3 أولويات وخططي لشيء ممتع. الهدوء والتنظيم هما القوة الحقيقية 🌸"},
  // Lundi
  {ico:'🎓',label:'Conseil étude',
   text:"Découpe tes cours en blocs de 25 min avec 5 min de pause. La méthode Pomodoro transforme ta concentration — ton Pomodoro est déjà ici !",
   ar:"قسّمي دروسكِ إلى جلسات 25 دقيقة مع استراحة 5 دقائق. هذه الطريقة ستضاعف إنتاجيتكِ وتركيزكِ!"},
  // Mardi
  {ico:'✨',label:'Soin beauté',
   text:"N'oublie pas ta crème solaire même en hiver ! Elle protège ta peau et préserve ton éclat naturel toute l'année. Ta peau te remerciera ☀️",
   ar:"لا تنسي واقي الشمس حتى في الشتاء! إنه يحمي بشرتكِ ويحافظ على توهجكِ الطبيعي طوال العام ☀️"},
  // Mercredi
  {ico:'🏃‍♀️',label:'Mouvement & énergie',
   text:"10 minutes de marche après le déjeuner améliorent ta digestion, ton humeur et ta concentration. Un corps qui bouge = un esprit qui brille !",
   ar:"10 دقائق من المشي بعد الغداء تحسن الهضم والمزاج والتركيز. الجسم المتحرك يملك عقلاً متوهجًا!"},
  // Jeudi
  {ico:'🥗',label:'Nutrition santé',
   text:"Commence ta journée avec un grand verre d'eau citronnée. Elle réveille ton métabolisme, clarifie ton teint et te donne de l'énergie 🍋",
   ar:"ابدئي يومكِ بكوب كبير من الماء مع الليمون. سيساعد جسمكِ على الاستيقاظ وتنقية البشرة من الداخل 🍋"},
  // Vendredi
  {ico:'💛',label:'Connexions & amour',
   text:"Envoie un message à quelqu'un qui compte pour toi aujourd'hui. Une pensée positive partagée revient multipliée. Tu mérites l'amour que tu donnes 💌",
   ar:"أرسلي رسالة لشخص عزيز عليكِ اليوم. الطاقة الإيجابية التي ترسليها ستعود إليكِ مضاعفة بإذن الله 💌"},
  // Samedi
  {ico:'🎨',label:'Créativité & passion',
   text:"Prends 15 min pour faire quelque chose que tu aimes juste pour le plaisir : dessiner, écrire, cuisiner ou danser. Ton âme a besoin de joie !",
   ar:"خذي 15 دقيقة لشيء تحبينه فقط للمتعة: رسم، كتابة، طبخ أو رقص. روحكِ تستحق الفرح والبهجة!"},
];
function todayCapsule() {
  return CAPSULES[new Date().getDay()];
}

// ── Habitudes par défaut ──────────────────────────────
const DEFAULT_HABITS = [
  {id:'h1', name:"8 verres d'eau",   emoji:'💧', active:true,  color:'#2563EB'},
  {id:'h2', name:'Sommeil 7-8h',     emoji:'😴', active:true,  color:'#7C3AED'},
  {id:'h3', name:'Bouger / Sport',   emoji:'🏃‍♀️',active:true,  color:'#7AA97C'},
  {id:'h4', name:'Routine skincare', emoji:'✨', active:true,  color:'#C4778E'},
  {id:'h5', name:'Manger équilibré', emoji:'🥗', active:true,  color:'#D97706'},
  {id:'h6', name:'Lecture 20 min',   emoji:'📚', active:false, color:'#8B5CF6'},
  {id:'h7', name:'Méditation',       emoji:'🧘‍♀️',active:false, color:'#EC4899'},
  {id:'h8', name:'Vitamines',        emoji:'💊', active:false, color:'#059669'},
];

// ── Phases du cycle ───────────────────────────────────
const CYCLE_PHASES = [
  {name:'Menstruation',    emoji:'🌹', color:'#FFB3C1', border:'#E53E5A', desc:'Repose-toi, prends soin de toi ❤️'},
  {name:'Phase folliculaire',emoji:'🌱',color:'#B7E4C7',border:'#10B981', desc:'Énergie qui remonte, profites-en !'},
  {name:'Ovulation',       emoji:'✨', color:'#FDE68A', border:'#F59E0B', desc:'Tu rayonnes ! Énergie au maximum'},
  {name:'Phase lutéale',   emoji:'🌙', color:'#C3B1E1', border:'#7C3AED', desc:'Ralentis, introspection et douceur'},
];

// ── Symptômes cycle ───────────────────────────────────
const SYMPTOMS = ['Crampes','Fatigue','Maux de tête','Ballonnements','Acné','Irritabilité','Sautes d\'humeur','Sensibilité'];

// ═══════════════════════════════════════════════════════
//  Store — accès localStorage
// ═══════════════════════════════════════════════════════
const LS = {
  g: k  => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  s: (k,v) => localStorage.setItem(k, JSON.stringify(v)),

  subjects:  () => LS.g('pl_subjects')  || [],
  notes:     () => LS.g('pl_notes')     || [],
  events:    () => LS.g('pl_events')    || [],
  ics:       () => LS.g('pl_ics')       || [],
  moods:     () => LS.g('pl_moods')     || {},
  habits:    () => LS.g('pl_habits')    || DEFAULT_HABITS,
  habitLogs: () => LS.g('pl_hlogs')     || {},
  cycleLog:  () => LS.g('pl_cycle')     || [],
  cycleCfg:  () => LS.g('pl_cyclecfg')  || {avgLen:28, perLen:5},
  lists:     () => LS.g('pl_lists')     || [],
  todos:     () => LS.g('pl_todos')     || [],
  cfg:       () => LS.g('pl_cfg')       || {},
  grades:    () => LS.g('pl_grades')    || {s1:[], s2:[]},
  shopping:  () => LS.g('pl_shopping')  || [],
};

// ═══════════════════════════════════════════════════════
//  Utilitaires généraux
// ═══════════════════════════════════════════════════════
const uid      = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today    = () => new Date().toISOString().slice(0, 10);
const esc      = s  => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cap      = s  => s ? s[0].toUpperCase() + s.slice(1) : s;
const stripHtml= s  => (s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();

function fdate(d, opts) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', opts);
}
function dmy(d) {
  return fdate(d, {day:'numeric', month:'short', year:'numeric'});
}
function addDays(d, n) {
  const dt = new Date(d + 'T12:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00')) / 86400000);
}

// Affirmation du jour (tourne selon le jour de l'année)
function todayAffirmation() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
  return AFFIRMATIONS[doy % AFFIRMATIONS.length];
}

// ── Calcul du cycle menstruel ─────────────────────────
function getCycleInfo() {
  const log = LS.cycleLog();
  if (!log.length) return null;

  const periodSet = new Set(log.filter(e => e.type === 'period').map(e => e.date));

  // Trouver les dates de début de règles
  const starts = [...periodSet].sort().filter(d => !periodSet.has(addDays(d, -1)));
  if (!starts.length) return null;

  // Longueur moyenne du cycle
  let avgLen = LS.cycleCfg().avgLen;
  if (starts.length >= 2) {
    const gaps = starts.slice(1).map((d,i) => daysBetween(starts[i], d));
    avgLen = Math.round(gaps.reduce((a,b) => a+b, 0) / gaps.length);
  }

  const lastStart    = starts[starts.length - 1];
  const nextPeriod   = addDays(lastStart, avgLen);
  const daysUntil    = daysBetween(today(), nextPeriod);
  const dayOfCycle   = Math.max(1, daysBetween(lastStart, today()) + 1);
  const perLen       = LS.cycleCfg().perLen;

  // Phase actuelle
  let phase;
  if (periodSet.has(today()))              phase = 0; // menstruation
  else if (dayOfCycle <= perLen + 8)       phase = 1; // folliculaire
  else if (dayOfCycle <= perLen + 10)      phase = 2; // ovulation
  else                                     phase = 3; // lutéale

  return { lastStart, nextPeriod, daysUntil, dayOfCycle, avgLen, phase, periodSet };
}

// ── Streak d'une habitude ─────────────────────────────
function habitStreak(habitId) {
  const logs = LS.habitLogs();
  let streak = 0;
  let d = today();
  while (true) {
    const dayLogs = logs[d] || [];
    if (!dayLogs.includes(habitId)) break;
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

// ── Compteur tâches en attente ────────────────────────
function pendingTodosCount() {
  return LS.todos().filter(t => !t.done).length;
}

// ── Hydratation ────────────────────────────────────────
function waterToday() {
  const d = LS.g('pl_water') || {};
  return d[today()] || 0;
}
function saveWater(n) {
  const d = LS.g('pl_water') || {};
  d[today()] = Math.min(8, Math.max(0, n));
  LS.s('pl_water', d);
}

// ── Focus du jour ──────────────────────────────────────
function focusToday() {
  const d = LS.g('pl_focus') || {};
  return d[today()] || '';
}
function saveFocus(text) {
  const d = LS.g('pl_focus') || {};
  d[today()] = (text || '').trim();
  LS.s('pl_focus', d);
}

// ── Clé lundi de la semaine courante ─────────────────
function weekKey() {
  const d   = new Date(today() + 'T12:00:00');
  const dow = d.getDay();
  const off = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + off);
  return d.toISOString().slice(0, 10);
}

// ── Objectifs de la semaine ───────────────────────────
function weekGoals() {
  const all = LS.g('pl_wgoals') || {};
  return all[weekKey()] || [];
}
function saveWeekGoals(goals) {
  const all = LS.g('pl_wgoals') || {};
  all[weekKey()] = goals;
  LS.s('pl_wgoals', all);
}

// ── Journal de gratitude ──────────────────────────────
function gratitudeToday() {
  const all = LS.g('pl_gratitude') || {};
  return all[today()] || [];
}
function saveGratitude(items) {
  const all = LS.g('pl_gratitude') || {};
  all[today()] = (items || []).filter(Boolean);
  LS.s('pl_gratitude', all);
}
