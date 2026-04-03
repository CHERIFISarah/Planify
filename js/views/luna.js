// ═══════════════════════════════════════════════════════
//  Luna — IA Planify v4  ·  100% offline
//  Scoring NLP · Contexte · Insights proactifs · 25 intents
// ═══════════════════════════════════════════════════════

let _lunaTyping    = false;
let _lunaMsgs      = [];
let _lunaInit      = false;
let _lunaCtx       = null;   // dernier intent (mémoire courante)
let _lunaData_     = null;   // cache données (rafraîchi à chaque message)
let _lunaListening = false;  // microphone actif
let _lunaSpeechRec = null;   // Web Speech API instance
let _lunaRevMode   = false;  // Mode révision actif
let _lunaRevQ      = null;   // Question de révision courante
let _lunaRevSubj   = null;   // Matière en cours de révision

// ── Chargement mémoire persistante depuis localStorage ─
(function _loadLunaHistory() {
  try {
    const saved = localStorage.getItem('luna_history');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) _lunaMsgs = arr.slice(-60); // max 60 msgs
    }
  } catch(e) {}
})();

// ── Chips suggestions ─────────────────────────────────
const _LUNA_CHIPS = [
  '📋 Résumé de ma journée','📅 Planning aujourd\'hui',
  '📅 Et demain ?','🎓 Ma moyenne',
  '🎯 Note pour valider ?','✅ Mes tâches',
  '🛒 Courses','🌸 Motive-moi !',
  '📊 Ma semaine','💗 Comment je me sens ?',
  '🌿 Habitudes','🏆 Ma meilleure matière',
  '⚠️ Ma matière la plus faible','⏰ Prochain événement',
  '🔢 Calcul','❓ Aide',
  '📚 Mode révision','💡 Conseils personnalisés',
  '📈 Tendance humeur','🎤 Aide-moi à noter quelque chose',
];

// ════════════════════════════════════════════════════════
//  NORMALISATION TEXTO/SLANG
// ════════════════════════════════════════════════════════
const _SL = {
  'cv':'ça va','slt':'salut','bjr':'bonjour','bsr':'bonsoir',
  'cc':'coucou','re':'re-salut','wesh':'salut','kikou':'coucou',
  'jsp':'je sais pas','jpp':"je peux plus",'tkt':'tranquille',
  'mdr':'ok','ptdr':'ok','xd':'ok','lol':'ok','haha':'ok',
  'pk':'pourquoi','pcq':'parce que','stp':'sil te plait','svp':'sil te plait',
  'nn':'non','nop':'non','nan':'non',
  'tt':'tout','tjs':'toujours','tjr':'toujours',
  'dc':'donc','pr':'pour','ac':'avec','ss':'sans',
  'bcp':'beaucoup','qd':'quand','koi':'quoi','ki':'qui',
  'pb':'probleme','qlq':'quelque','qch':'quelque chose',
  'auj':"aujourd'hui",'dem':'demain','ds':'dans',
  'fo':'faut','ya':'il y a','po':'pas','pa':'pas',
  'ke':'que','ms':'mais','c':'cest',
  'ouais':'oui','ouep':'oui','yep':'oui','ouai':'oui',
  'g':"jai",'ta':'tu as','je lé':"je lai",
  'exam':'examen','examens':'examen','partiels':'partiel',
  'moy':'moyenne','moyennes':'moyenne','notes':'note',
  'boulot':'travail','taff':'travail','taf':'travail',
  'stressée':'stressée','stressé':'stressée',
  'flemme':'fatigue','fatigue':'fatiguée',
  'cool':'bien','nickel':'bien','top':'bien',
  'nul':'difficile','dur':'difficile','hard':'difficile',
  'chui':'je suis','chu':'je suis','jsuis':'je suis',
};

function _norm(msg) {
  let s = msg.toLowerCase().trim();
  s = s.replace(/[?!.,;:…]/g,' ');
  s = s.replace(/\b(\w+)\b/g, w => _SL[w] || w);
  s = s.replace(/\s+/g,' ').trim();
  return s;
}

// ════════════════════════════════════════════════════════
//  LECTURE DONNÉES (cache par message)
// ════════════════════════════════════════════════════════
function _getData() {
  const g = (fn,fb) => { try{ return fn()||fb; }catch(e){ return fb; } };
  return {
    events  : g(()=>LS.events(),  []),
    tasks   : g(()=>LS.tasks(),   []),
    todos   : g(()=>LS.todos(),   []),
    grades  : g(()=>LS.grades(),  {s1:[],s2:[]}),
    shopping: g(()=>LS.shopping(),[]),
    moods   : g(()=>LS.moods(),   {}),
    habits  : g(()=>LS.habits(),  []),
    hlogs   : g(()=>LS.habitLogs(),{}),
    cfg     : g(()=>LS.cfg(),     {}),
    notes   : g(()=>LS.notes(),   []),
    subjects: g(()=>LS.subjects(),[]),
    water   : typeof waterToday==='function' ? waterToday() : 0,
  };
}

// ════════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════════
function _date(off=0){ const d=new Date(); d.setDate(d.getDate()+off); return d.toISOString().slice(0,10); }
function _tf(t){ return t?t.slice(0,5):''; }
function _pick(a){ return a[Math.floor(Math.random()*a.length)]; }

function _avg(mods){
  if(!mods||!mods.length) return null;
  let tc=0,tp=0;
  for(const m of mods){
    const a=typeof moduleAverage==='function'?moduleAverage(m):null;
    if(a===null) return null;
    tc+=m.coef||1; tp+=a*(m.coef||1);
  }
  return tc>0?tp/tc:null;
}

function _avgPartial(mods){
  // Calcul avec les notes disponibles seulement (ignore les nulls)
  if(!mods||!mods.length) return null;
  let tc=0,tp=0,hasOne=false;
  for(const m of mods){
    const a=typeof moduleAverage==='function'?moduleAverage(m):null;
    if(a===null) continue;
    hasOne=true; tc+=m.coef||1; tp+=a*(m.coef||1);
  }
  return (hasOne&&tc>0)?tp/tc:null;
}

function _mood(moods,date){
  const e=moods[date]; if(!e) return null;
  return typeof MOODS!=='undefined'?MOODS[e.mood]:null;
}

function _dayLabel(ds){
  const diff=Math.round((new Date(ds+'T12:00')-new Date(_date(0)+'T12:00'))/86400000);
  if(diff===0) return "Aujourd'hui";
  if(diff===1) return 'Demain';
  if(diff===2) return 'Après-demain';
  if(diff===-1) return 'Hier';
  if(diff<0) return `Il y a ${Math.abs(diff)} jours`;
  return typeof fdate==='function'?fdate(ds,{weekday:'long',day:'numeric',month:'short'}):ds;
}

function _gradeEmoji(v){
  if(v>=16) return '🏆';
  if(v>=14) return '⭐';
  if(v>=12) return '✨';
  if(v>=10) return '✅';
  return '⚠️';
}

function _mention(v){
  if(v>=16) return 'Très Bien';
  if(v>=14) return 'Bien';
  if(v>=12) return 'Assez Bien';
  if(v>=10) return 'Passable';
  return 'Insuffisant';
}

// ════════════════════════════════════════════════════════
//  INSIGHTS PROACTIFS — ajoutés en fin de certaines réponses
// ════════════════════════════════════════════════════════
function _proactiveInsight(D, exclude){
  const td=_date(0);
  const insights=[];

  // Événement dans les 2 prochains jours
  const soon=D.events.filter(e=>{ const d=Math.round((new Date(e.date+'T12:00')-new Date(td+'T12:00'))/86400000); return d>0&&d<=2; }).sort((a,b)=>a.date.localeCompare(b.date));
  if(soon.length&&exclude!=='today'&&exclude!=='tomorrow')
    insights.push(`📅 _Au fait : **${soon[0].title}** ${_dayLabel(soon[0].date).toLowerCase()}${soon[0].startTime?' à **'+_tf(soon[0].startTime)+'**':''}._`);

  // Tâches urgentes
  const urgent=D.tasks.filter(t=>!t.done&&(t.priority==='high'||t.urgent));
  if(urgent.length&&exclude!=='tasks')
    insights.push(`⚠️ _Tu as **${urgent.length} tâche${urgent.length>1?'s':''}** urgente${urgent.length>1?'s':''}._`);

  // Habitude streak à risque (faite hier mais pas encore aujourd'hui)
  if(exclude!=='habits'){
    const active=D.habits.filter(h=>h.active);
    const todayLogs=D.hlogs[td]||[];
    const ystLogs=D.hlogs[_date(-1)]||[];
    const atRisk=active.filter(h=>ystLogs.includes(h.id)&&!todayLogs.includes(h.id));
    if(atRisk.length===1)
      insights.push(`🔥 _Ta série **${atRisk[0].emoji||''} ${atRisk[0].name}** est en danger — tu ne l'as pas encore faite aujourd'hui !_`);
    else if(atRisk.length>1)
      insights.push(`🔥 _**${atRisk.length} séries** d'habitudes sont en danger aujourd'hui !_`);
  }

  // Eau — moins de 4 verres en fin de journée
  const h=new Date().getHours();
  if(h>=18&&D.water<4&&exclude!=='water')
    insights.push(`💧 _Tu n'as bu que **${D.water} verre${D.water>1?'s':''}** d'eau aujourd'hui !_`);

  // Pas d'humeur notée
  if(!D.moods[td]&&exclude!=='mood'&&h>=12)
    insights.push(`💗 _Tu n'as pas encore noté ton humeur du jour !_`);

  if(!insights.length) return '';
  return '\n\n' + _pick(insights);
}

// ════════════════════════════════════════════════════════
//  MOTEUR DE SCORING (NLP multi-mots-clés)
// ════════════════════════════════════════════════════════
const _INTENTS = {
  greeting  :['bonjour','bonsoir','salut','coucou','hello','hi','hey','yo','wesh','ola','hola','allô','bonne nuit','bonne soirée','re-salut'],
  mood      :['humeur','sens','ça va','se sent','ressent','moral','va bien','vas bien','comment vas','comment je','je suis','je me','tu vas','état','forme','je vais','vibe','feeling'],
  resume    :['résumé','resume','bilan','brief','vue ensemble','tout aujourd','journée complète','dis moi tout','quoi de neuf','raconte','situation'],
  today     :['aujourd','planning','emploi du temps','programme','cours','agenda','journée','ce matin','ce soir','cet aprem','jai quoi','quoi comme'],
  tomorrow  :['demain','lendemain','planning demain','cours demain','jai quoi demain','quoi demain'],
  week      :['semaine','cette semaine','prochains','7 jours','prochain événement','à venir','bientôt','prochainement','planning semaine'],
  tasks     :['tâche','tache','todo','à faire','dois faire','liste tâ','liste faire','mes tâches','taches','faire auj','obligations'],
  grades    :['moyenne','moy','résultat','bilan note','semestre','s1','s2','mes notes','note de','résultats','mes matières','bilan sco','scolaire'],
  validate  :['valider','il faut','quelle note','note pour','obtenir','avoir besoin','combien il faut','pour valider','pour passer','rattraper','seuil'],
  best_sub  :['meilleure','meilleur','matière forte','point fort','top','excelle','réussis le mieux','plus forte matière'],
  worst_sub :['matière faible','point faible','moins bonne','pire','galère','la pire','la moins','échoue','rate','difficile en'],
  countdown :['dans combien','combien de temps','combien il reste','avant','countdown','jours avant','jours restants','j-','échéance'],
  habits    :['habitude','routine','habitudes','mes habitudes','mes routines','streak','série'],
  shopping  :['course','shopping','acheter','achat','liste course','magasin','provisions','reste acheter','à acheter','list de course'],
  notes_sub :['matière','matiere','mes cours','mes sujets','réviser','révision','fiches','notes de cours'],
  motivation:['motiv','courage','encourage','allez','inspir','aide travailler','bosser','donne envie','boosté','boost','énergie','envie','reprendre','travaille','tâche','j\'arrive','j arrive','je peux pas','can do'],
  wellbeing :['stress','anxieux','anxieuse','angoiss','épuisé','épuisée','burn','surmenée','besoin de repos','fatiguée','overwhelm','je craque','crise','déprimée','déprimé','morale à zéro'],
  thanks    :['merci','thank','thanks','super','génial','trop bien','mega','nickel','parfait','cool','topissime','incroyable','bravo','t\'es la best','t es la best','t es bonne'],
  bye       :['au revoir','bye','ciao','à bientôt','bonne nuit','bonne soirée','bonne journée','à demain','see you','tchao','dors bien','à plus'],
  cycle     :['cycle','règle','regle','règles','regles','menstrua','période','ovulat','règles auj'],
  help      :['aide','help','que sais tu','que peux tu','que tu fais','fonctionnalit','commande','tu peux','je peux quoi','liste de commandes'],
  time      :['quelle heure','il est quelle','quel jour','quelle date','on est le','date auj','heure il est','quel mois'],
  calc      :['calcule','combien fait','calcul','multiplie','divise','additionne','soustrait','résoud','math','fois','plus que','moins que','x ','÷','×','=','%','pourcentage'],
  water     :['eau','boire','hydrat','verre','verres','hydratation','bu combien'],
  quote     :['citation','affirmation','pensée du jour','inspire moi','dis moi quelque chose de beau','beau message','phrase inspirante','quote'],
  pomodoro  :['pomodoro','minuteur','timer','chrono','focus time','25 minutes','technique de travail'],
  next_event:['prochain événement','prochain cours','quand est','quand jai','prochaine fois','next'],
};

function _score(q,kws){
  let s=0;
  for(const kw of kws) if(q.includes(kw)) s+=kw.split(' ').length>1?3:kw.length>4?2:1;
  return s;
}

function _intent(q){
  let best=null,bs=0;
  for(const [k,v] of Object.entries(_INTENTS)){
    const sc=_score(q,v);
    if(sc>bs){bs=sc;best=k;}
  }
  return bs>=1?best:null;
}

// ════════════════════════════════════════════════════════
//  GESTION CONTEXTE MULTI-TOUR
// ════════════════════════════════════════════════════════
function _ctxReply(q,D,p,now){
  if(!_lunaCtx) return null;
  if((_lunaCtx==='today'||_lunaCtx==='resume')&&/(demain|lendemain|et dem)/.test(q))    return _hTomorrow(q,D,p,now);
  if((_lunaCtx==='tomorrow')&&/(aujourd|ce matin|ce soir|et auj)/.test(q))              return _hToday(q,D,p,now);
  if(_lunaCtx==='grades'&&/s1/.test(q)){  const a=_avg(D.grades.s1);  return a!==null?`Ton **Semestre 1** : **${a.toFixed(2)}/20** ${_gradeEmoji(a)} — ${_mention(a)}`:`Notes S1 incomplètes ⏳`; }
  if(_lunaCtx==='grades'&&/s2/.test(q)){  const a=_avg(D.grades.s2);  return a!==null?`Ton **Semestre 2** : **${a.toFixed(2)}/20** ${_gradeEmoji(a)} — ${_mention(a)}`:`Notes S2 incomplètes ⏳`; }
  if(_lunaCtx==='grades'&&/(meilleure|fort|top|excelle)/.test(q))                       return _hBestSub(q,D,p,now);
  if(_lunaCtx==='grades'&&/(faible|pire|galère|moins bonne)/.test(q))                   return _hWorstSub(q,D,p,now);
  if(_lunaCtx==='motivation'&&/(encore|re|autre|suite|allez)/.test(q))                  return _hMotivation(q,D,p,now);
  if(_lunaCtx==='tasks'&&/(fait|terminé|terminée|coché)/.test(q))                       return `Super ${p} ! 🎉 Pour cocher tes tâches, va dans l'onglet **Tâches** directement !`;
  if(_lunaCtx==='shopping'&&/(combien|prix|total)/.test(q))                              return `Je ne connais pas les prix ${p} 😅 mais ta liste de courses est dans l'onglet **Courses** !`;
  if(/(merci|super|génial|cool|nickel|parfait)/.test(q))                                 return _hThanks(q,D,p,now);
  if(/(oui|ok|bien|vu|reçu|oke)/.test(q)&&q.length<15)                                  return _pick([`Super ${p} ! 🌸 Autre chose ?`,`Parfait ! 💕 Tu veux savoir autre chose ?`,`C'est noté ! Besoin d'autre chose ${p} ? 🌸`]);
  return null;
}

// ════════════════════════════════════════════════════════
//  HANDLERS PAR INTENTION
// ════════════════════════════════════════════════════════
function _hGreeting(q,D,p,now){
  const h=now.getHours();
  const s=h<5?'Bonne nuit':h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
  const td=_date(0);
  const evs=D.events.filter(e=>e.date===td);
  const pend=D.tasks.filter(t=>!t.done).length;
  const mo=_mood(D.moods,td);
  let ctx='';
  if(evs.length)  ctx+=` Tu as **${evs.length} événement${evs.length>1?'s':''}** aujourd'hui.`;
  if(pend)        ctx+=` **${pend} tâche${pend>1?'s':''}** en attente.`;
  if(mo)          ctx+=` Tu te sens **${mo.l}** ${mo.e}`;
  _lunaCtx='greeting';
  const greets=[
    `${s} **${p}** ! 🌸${ctx}\nComment puis-je t'aider ?`,
    `${s} **${p}** ✨${ctx}\nJe suis là, dis-moi ce qu'il te faut !`,
    `${s} ${p} ! 💕${ctx}\nQu'est-ce que je peux faire pour toi ?`,
  ];
  return _pick(greets);
}

function _hMood(q,D,p,now){
  _lunaCtx='mood';
  const mo=_mood(D.moods,_date(0));
  if(!mo) return `Tu n'as pas encore enregistré ton humeur aujourd'hui **${p}** 🌸\nVa dans **Bien-être** pour noter comment tu te sens !`;

  // Réponse enrichie selon l'humeur + suggestion
  const tips={
    'Excellent': { r:`Tu te sens **Excellent** ✨ Waouh ${p} ! Cette énergie est précieuse — utilise-la pour avancer sur tes objectifs !`, tip:`💡 C'est le moment parfait pour attaquer tes tâches les plus difficiles.` },
    'Bien'     : { r:`Tu te sens **Bien** 🌸 Super ${p} ! Continue à prendre soin de toi.`, tip:`💡 Continue sur cette lancée, tu es dans une bonne dynamique !` },
    'Neutre'   : { r:`Tu te sens **Neutre** ☁️ C'est ok ${p}, on a toutes des journées tranquilles.`, tip:`☕ Un verre d'eau et une petite marche peuvent faire la différence !` },
    'Fatiguée' : { r:`Tu te sens **Fatiguée** 🌿 ${p}, accorde-toi une pause — tu le mérites.`, tip:`😴 Essaie la technique : 20 min de repos, puis une seule tâche courte.` },
    'Difficile': { r:`Tu traverses une période **Difficile** 🌧️ ${p}. Courage, ça va passer.`, tip:`💪 Découpe tes obligations en toutes petites étapes — une seule à la fois.` },
    'Stressée' : { r:`Tu te sens **Stressée** 🔥 ${p}. Prends 5 grandes respirations maintenant.`, tip:`🧘 Méthode : inspire 4 sec, retiens 4 sec, expire 6 sec. Répète 3 fois.` },
    'Triste'   : { r:`Tu te sens **Triste** 😢 ${p}. Je suis là. Tu n'es pas seule.`, tip:`🤗 Parle à quelqu'un que tu aimes — une conversation peut tout changer.` },
  };
  const t=tips[mo.l]||{r:`Ton humeur : **${mo.l}** ${mo.e}. Prends soin de toi ${p} 🌸`,tip:''};
  return `${t.r}${t.tip?'\n\n'+t.tip:''}`;
}

function _hResume(q,D,p,now){
  _lunaCtx='resume';
  const td=_date(0);
  const evs=D.events.filter(e=>e.date===td).sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||''));
  const pend=D.tasks.filter(t=>!t.done);
  const actH=D.habits.filter(h=>h.active);
  const doneH=actH.filter(h=>(D.hlogs[td]||[]).includes(h.id));
  const a2=_avgPartial(D.grades.s2);
  const mo=_mood(D.moods,td);
  const water=D.water;

  let r=`📋 **Résumé du jour — ${p}**\n\n`;
  r+=`😊 Humeur : ${mo?`**${mo.l}** ${mo.e}`:'_non enregistrée_'}\n`;
  r+=`📅 Événements : **${evs.length||'aucun'}**`;
  if(evs.length) r+='\n'+evs.slice(0,3).map(e=>`  • ${_tf(e.startTime)||'—'} ${e.title}`).join('\n');
  r+=`\n✅ Tâches : **${pend.length} en attente**`;
  if(pend.length) r+='\n'+pend.slice(0,3).map(t=>`  • ${t.title}`).join('\n');
  r+=`\n🌿 Habitudes : **${doneH.length}/${actH.length}** faites`;
  r+=`\n💧 Eau : **${water}/8** verres`;
  if(a2!==null) r+=`\n🎓 Moy. S2 : **${a2.toFixed(2)}/20** ${_gradeEmoji(a2)}`;
  r+=`\n\nBonne journée ${p} 🌸`;
  return r;
}

function _hToday(q,D,p,now){
  _lunaCtx='today';
  const td=_date(0);
  const evs=D.events.filter(e=>e.date===td).sort((a,b)=>(a.startTime||'zzz').localeCompare(b.startTime||'zzz'));
  if(!evs.length) return `Aucun événement aujourd'hui ${p} 🗓️\nJournée libre ! Profites-en pour avancer tes révisions 📚`+_proactiveInsight(D,'today');
  const list=evs.map(e=>{
    const t=e.startTime?`**${_tf(e.startTime)}**`:'📌';
    const end=e.endTime?` → ${_tf(e.endTime)}`:'';
    return `• ${t}${end} ${e.title}${e.location?` 📍 ${e.location}`:''}`;
  }).join('\n');
  const suffix=evs.length>3?`\nGrande journée ${p}, courage ! 💪`:`\nBonne journée 🌸`;
  return `Ton planning du jour ${p} 📅 :\n\n${list}${suffix}`;
}

function _hTomorrow(q,D,p,now){
  _lunaCtx='tomorrow';
  const tom=_date(1);
  const evs=D.events.filter(e=>e.date===tom).sort((a,b)=>(a.startTime||'zzz').localeCompare(b.startTime||'zzz'));
  if(!evs.length) return `Aucun événement demain ${p} 🎉 Journée libre ! Profites-en pour te reposer 😴`+_proactiveInsight(D,'tomorrow');
  const list=evs.map(e=>`• ${e.startTime?`**${_tf(e.startTime)}** `:''}${e.title}${e.location?` 📍 ${e.location}`:''}`).join('\n');
  return `Demain tu as **${evs.length} événement${evs.length>1?'s':''}** ${p} 📅 :\n\n${list}\n\nPense à te préparer ce soir ! 🌙`;
}

function _hWeek(q,D,p,now){
  _lunaCtx='week';
  const days=Array.from({length:7},(_,i)=>_date(i));
  const wEvs=D.events.filter(e=>days.includes(e.date)).sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||'').localeCompare(b.startTime||''));
  const tdTasks=D.tasks.filter(t=>!t.done).length;
  if(!wEvs.length&&!tdTasks) return `Semaine plutôt calme ${p} 📅 Aucun événement prévu ! Profite pour avancer tes révisions 🌸`;
  let r='';
  if(wEvs.length){
    const byDay={};
    wEvs.forEach(e=>{if(!byDay[e.date])byDay[e.date]=[];byDay[e.date].push(e);});
    const lines=Object.entries(byDay).map(([d,ev])=>`**${_dayLabel(d)}** : ${ev.map(e=>e.title).join(', ')}`);
    r=`Ta semaine ${p} 📆 :\n\n${lines.join('\n')}`;
  }
  if(tdTasks) r+=`\n\n✅ **${tdTasks} tâche${tdTasks>1?'s':''}** en attente cette semaine.`;
  return r||`Semaine calme ${p} 🌸`;
}

function _hTasks(q,D,p,now){
  _lunaCtx='tasks';
  const pend=D.tasks.filter(t=>!t.done);
  const done=D.tasks.filter(t=>t.done);
  if(!pend.length) return `Bravo **${p}** ! 🎉 Toutes tes tâches sont terminées ! Tu es incroyable ✨`;
  const urgent=pend.filter(t=>t.priority==='high'||t.urgent);
  const list=pend.slice(0,6).map(t=>`• ${t.title}${t.dueDate?` _(échéance : ${t.dueDate})_`:''}`).join('\n');
  const extra=pend.length>6?`\n_...et ${pend.length-6} autres._`:'';
  let r=`**${pend.length} tâche${pend.length>1?'s':''}** en cours ${p} ✅\n\n${list}${extra}`;
  if(urgent.length) r+=`\n\n⚠️ **${urgent.length} urgente${urgent.length>1?'s':''}** — à faire en priorité !`;
  if(done.length)   r+=`\n\n✨ Déjà terminé : **${done.length}** — continue !`;
  return r;
}

function _hGrades(q,D,p,now){
  _lunaCtx='grades';
  const a1=_avg(D.grades.s1), a2=_avg(D.grades.s2);
  const pa2=_avgPartial(D.grades.s2);
  if(!D.grades.s1.length&&!D.grades.s2.length) return `Aucune note enregistrée ${p} 📊\nVa dans l'onglet **Moyennes** pour saisir tes matières !`;
  let r=`Ton bilan de notes ${p} 🎓 :\n\n`;
  if(D.grades.s1.length) r+=a1!==null?`• **Semestre 1** : ${a1.toFixed(2)}/20 ${_gradeEmoji(a1)} — ${_mention(a1)}\n`:`• **Semestre 1** : notes incomplètes ⏳\n`;
  if(D.grades.s2.length){
    if(a2!==null) r+=`• **Semestre 2** : ${a2.toFixed(2)}/20 ${_gradeEmoji(a2)} — ${_mention(a2)}\n`;
    else if(pa2!==null) r+=`• **Semestre 2** : ~${pa2.toFixed(2)}/20 ⏳ _(notes partielles)_\n`;
    else r+=`• **Semestre 2** : notes incomplètes ⏳\n`;
  }
  const ref=a2??a1??pa2;
  if(ref!==null){
    if(ref>=16)      r+='\n🏆 Excellent, tu assures vraiment !';
    else if(ref>=14) r+='\n⭐ Bien ! Continue sur cette lancée.';
    else if(ref>=12) r+='\n✨ Assez bien, tu y es presque !';
    else if(ref>=10) r+='\n✅ Tu valides, garde le rythme !';
    else             r+='\n💪 Courage, tu peux encore rattraper !';
  }
  r+='\n\n_Tape "ma meilleure matière" ou "ma matière faible" pour plus de détails._';
  return r;
}

function _hValidate(q,D,p,now){
  _lunaCtx='validate';
  const mods=D.grades.s2||[];
  if(!mods.length) return `Aucun module S2 enregistré ${p} 📊\nAjoute tes matières dans **Moyennes** !`;
  let tc=0,tp=0,incomplete=false,total_coef=0;
  for(const m of mods){
    const a=typeof moduleAverage==='function'?moduleAverage(m):null;
    total_coef+=m.coef||1;
    if(a===null){incomplete=true;continue;}
    tc+=m.coef||1; tp+=a*(m.coef||1);
  }
  if(incomplete&&tc===0) return `Des notes sont manquantes ${p} ⏳\nComplète tes notes dans **Moyennes** pour que je calcule !`;
  const avg=tc>0?tp/tc:0;
  if(avg>=10) return `🎉 Bonne nouvelle **${p}** ! Tu valides déjà le S2 avec **${avg.toFixed(2)}/20** ${_gradeEmoji(avg)} — ${_mention(avg)} !${incomplete?'\n⚠️ _Calcul partiel._':''}`;
  const diff=(10*total_coef-tp)/(total_coef-tc);
  const diffSimple=(10-avg).toFixed(2);
  let r=`Ta moyenne S2 actuelle : **${avg.toFixed(2)}/20** ${p}.\nIl te manque **${diffSimple} points** pour atteindre 10/20.`;
  if(incomplete) r+=`\n⚠️ _Calcul partiel — certaines notes manquent encore._`;
  r+=`\n\n💪 Tu peux le faire !`;
  return r;
}

function _hBestSub(q,D,p,now){
  _lunaCtx='best_sub';
  const mods=[...D.grades.s1||[],...D.grades.s2||[]];
  if(!mods.length) return `Pas encore de matières enregistrées ${p} 📊 Va dans **Moyennes** !`;
  const withAvg=mods.map(m=>({m,a:typeof moduleAverage==='function'?moduleAverage(m):null})).filter(x=>x.a!==null).sort((a,b)=>b.a-a.a);
  if(!withAvg.length) return `Les notes ne sont pas complètes ${p} ⏳ Continue de saisir tes notes !`;
  const best=withAvg[0];
  const top3=withAvg.slice(0,3).map(x=>`• **${x.m.name}** : ${x.a.toFixed(2)}/20 ${_gradeEmoji(x.a)}`).join('\n');
  return `Ton top 3 **${p}** 🏆 :\n\n${top3}\n\n✨ Ta meilleure matière est **${best.m.name}** avec **${best.a.toFixed(2)}/20** — tu excelles !`;
}

function _hWorstSub(q,D,p,now){
  _lunaCtx='worst_sub';
  const mods=[...D.grades.s1||[],...D.grades.s2||[]];
  if(!mods.length) return `Pas encore de matières enregistrées ${p} 📊 Va dans **Moyennes** !`;
  const withAvg=mods.map(m=>({m,a:typeof moduleAverage==='function'?moduleAverage(m):null})).filter(x=>x.a!==null).sort((a,b)=>a.a-b.a);
  if(!withAvg.length) return `Les notes ne sont pas complètes ${p} ⏳`;
  const worst=withAvg[0];
  const tip=worst.a<10?`\n\n💡 Il te faut **${(10-worst.a).toFixed(2)} points** de plus pour valider cette matière.`:'';
  return `Ta matière la plus difficile **${p}** ⚠️ :\n\n**${worst.m.name}** : **${worst.a.toFixed(2)}/20** ${_gradeEmoji(worst.a)}\n\n💪 Concentre tes révisions là-dessus !${tip}`;
}

function _hCountdown(q,D,p,now){
  _lunaCtx='countdown';
  const td=_date(0);
  const future=D.events.filter(e=>e.date>td).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  if(!future.length) return `Aucun événement futur dans ton agenda ${p} 📅\nAjoute tes prochains examens et rendez-vous !`;
  const lines=future.map(e=>{
    const diff=Math.round((new Date(e.date+'T12:00')-new Date(td+'T12:00'))/86400000);
    const urgency=diff<=2?'🔴':diff<=7?'🟠':diff<=14?'🟡':'🟢';
    return `${urgency} **${e.title}** — dans **${diff} jour${diff>1?'s':''}** _(${_dayLabel(e.date)})_`;
  });
  return `Tes prochains événements ${p} ⏳ :\n\n${lines.join('\n')}`;
}

function _hNextEvent(q,D,p,now){
  _lunaCtx='next_event';
  const td=_date(0);
  // Chercher d'abord aujourd'hui, puis dans le futur
  const todayEvs=D.events.filter(e=>e.date===td&&e.startTime&&e.startTime>now.toTimeString().slice(0,5)).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  if(todayEvs.length) return `Ton prochain événement aujourd'hui ${p} 📅 :\n\n**${todayEvs[0].title}** à **${_tf(todayEvs[0].startTime)}**${todayEvs[0].location?` 📍 ${todayEvs[0].location}`:''}`;
  const next=D.events.filter(e=>e.date>td).sort((a,b)=>a.date.localeCompare(b.date))[0];
  if(!next) return `Aucun prochain événement ${p} 📅 Ton agenda est vide !`;
  const diff=Math.round((new Date(next.date+'T12:00')-new Date(td+'T12:00'))/86400000);
  return `Ton prochain événement ${p} 📅 :\n\n**${next.title}** — dans **${diff} jour${diff>1?'s':''}** _(${_dayLabel(next.date)}${next.startTime?' à **'+_tf(next.startTime)+'**':''})\_ ${next.location?`📍 ${next.location}`:''}`;
}

function _hHabits(q,D,p,now){
  _lunaCtx='habits';
  const active=D.habits.filter(h=>h.active);
  if(!active.length) return `Aucune habitude configurée ${p} 🌿\nVa dans **Bien-être → Habitudes** pour en créer !`;
  const td=_date(0);
  const logs=D.hlogs[td]||[];
  const done=active.filter(h=>logs.includes(h.id));
  const rem=active.filter(h=>!logs.includes(h.id));
  // Streaks
  const streaks=active.map(h=>({h,s:typeof habitStreak==='function'?habitStreak(h.id):0})).filter(x=>x.s>1).sort((a,b)=>b.s-a.s);
  let r=`Tes habitudes du jour ${p} 🌿 :\n\n`;
  done.forEach(h=>{ const st=typeof habitStreak==='function'?habitStreak(h.id):0; r+=`• ✅ ${h.emoji||''} **${h.name}**${st>1?` 🔥 ${st}j`:''}\n`; });
  rem.forEach(h=>{  r+=`• ○  ${h.emoji||''} ${h.name}\n`; });
  r+=`\n**${done.length}/${active.length}** complétées`;
  if(done.length===active.length) r+=' 🎉 Toutes faites, incroyable !';
  else if(!done.length) r+=' — Lance-toi ! 💪';
  if(streaks.length) r+=`\n\n🔥 Meilleure série : **${streaks[0].h.name}** — **${streaks[0].s} jours de suite** !`;
  return r;
}

function _hShopping(q,D,p,now){
  _lunaCtx='shopping';
  const rem=D.shopping.filter(i=>!i.checked);
  const done=D.shopping.filter(i=>i.checked);
  if(!D.shopping.length) return `Ta liste de courses est vide ${p} 🛒\nAjoute des articles dans l'onglet **Courses** !`;
  if(!rem.length) return `Tu as tout acheté ${p} ! 🎉 Liste de courses complète ✅`;
  const list=rem.slice(0,7).map(i=>`• ${i.name}${i.qty?` _(×${i.qty}${i.unit?' '+i.unit:''})_`:''}`).join('\n');
  const extra=rem.length>7?`\n_...et ${rem.length-7} autres._`:'';
  return `**${rem.length} article${rem.length>1?'s':''}** à acheter ${p} 🛒 :\n\n${list}${extra}${done.length?`\n\n✅ Déjà acheté : ${done.length} article${done.length>1?'s':''}` : ''}`;
}

function _hNotesSub(q,D,p,now){
  _lunaCtx='notes';
  if(!D.subjects.length) return `Aucune matière créée ${p} 📝\nVa dans **Notes** pour créer tes premières matières !`;
  const list=D.subjects.map(s=>{ const cnt=D.notes.filter(n=>n.subjectId===s.id).length; return `• ${s.emoji||'📚'} **${s.name}** — ${cnt} note${cnt!==1?'s':''}`; }).join('\n');
  return `Tes matières ${p} 📚 :\n\n${list}\n\n**${D.notes.length} note${D.notes.length!==1?'s':''}** au total !`;
}

function _hMotivation(q,D,p,now){
  _lunaCtx='motivation';
  const a2=_avgPartial(D.grades.s2);
  const streakMax=D.habits.filter(h=>h.active).reduce((max,h)=>{ const s=typeof habitStreak==='function'?habitStreak(h.id):0; return Math.max(max,s); },0);
  const extra=a2!==null&&a2>=10?`\n\n🎓 Ta moyenne S2 est à **${a2.toFixed(2)}/20** — tu es sur la bonne voie !`
    :streakMax>3?`\n\n🔥 Tu as une série de **${streakMax} jours** d'habitudes — preuve que tu tiens tes engagements !`:'';
  const quotes=[
    `**${p}**, tu es capable de choses incroyables ✨ Chaque petit pas compte. Fonce !${extra}`,
    `Tu as déjà surmonté tellement d'obstacles **${p}** 💪 Ce n'est qu'une étape de plus !`,
    `Rappelle-toi pourquoi tu as commencé **${p}** 🌸 Tu es plus forte que tu ne le crois !${extra}`,
    `Le succès c'est la somme de petits efforts répétés 🌟 Tu es sur la bonne voie **${p}** !`,
    `Chaque grande réussite commence par la décision d'essayer ⭐ Lance-toi **${p}** !`,
    `Tu n'as pas besoin d'être parfaite, juste de continuer 🌸 Et tu continues déjà !`,
    `**${p}**, tes efforts d'aujourd'hui sont les succès de demain ⭐${extra}`,
    `Tu rayonnes **${p}** ✨ N'oublie pas à quel point tu es capable de grandes choses !`,
    `Une chose à la fois **${p}** 🌿 Respire, recentre-toi et fais la prochaine petite étape.`,
    `Tu n'as pas à tout faire aujourd'hui **${p}** 💕 Fais juste _une_ chose importante — et c'est déjà une victoire.`,
  ];
  return _pick(quotes);
}

function _hWellbeing(q,D,p,now){
  _lunaCtx='wellbeing';
  const mo=_mood(D.moods,_date(0));
  const pend=D.tasks.filter(t=>!t.done).length;
  let r='';
  if(/(craque|crise|overwhelm|brûle|burn)/.test(q))
    r=`${p} 🌸 Je t'entends. C'est normal de se sentir dépassée parfois.\n\n**3 choses à faire maintenant :**\n• Pose tout ce que tu fais\n• Prends 5 grandes respirations\n• Écris _une seule_ chose importante à faire aujourd'hui\n\nTu n'as pas à tout gérer d'un coup. 💕`;
  else if(/(stress|angoiss|anxieu)/.test(q))
    r=`Respire **${p}** 🧘 Le stress est une réaction normale — mais tu peux le gérer.\n\n💡 **Technique 4-7-8 :** inspire 4 sec → retiens 7 sec → expire 8 sec. Répète 3 fois.\n\nTu gères plus que tu ne le penses 💪${pend?`\n\n✅ _${pend} tâche${pend>1?'s':''}_ en attente — commence par la plus petite.`:''}`;
  else if(/(épuisé|épuisée|fatigue|flemme)/.test(q))
    r=`La fatigue c'est un signal **${p}** — écoute ton corps 🌿\n\n💡 Autorise-toi une vraie pause (même 20 min) sans culpabilité. Ensuite, juste _une_ tâche.\n\nTu n'es pas une machine 💕`;
  else
    r=`Je t'entends **${p}** 💕 Prends soin de toi avant tout.\n\n• 😴 Dors bien (7-8h)\n• 💧 Bois de l'eau (objectif : 8 verres)\n• 🌿 Fais une courte pause\n• 🌸 Parle à quelqu'un que tu aimes\n\nTu comptes, et ton bien-être est une priorité 🌸`;
  if(mo&&(mo.l==='Fatiguée'||mo.l==='Stressée'||mo.l==='Difficile'||mo.l==='Triste'))
    r+=`\n\n_Ton humeur enregistrée aujourd'hui : **${mo.l}** ${mo.e} — c'est normal que ce soit dur._`;
  return r;
}

function _hThanks(q,D,p,now){
  return _pick([
    `Avec plaisir **${p}** ! 🌸 N'hésite pas si tu as d'autres questions !`,
    `C'est mon rôle **${p}** ✨ Je suis toujours là pour toi !`,
    `De rien **${p}** 💕 Tu peux toujours compter sur moi !`,
    `Tout le plaisir est pour moi **${p}** 🌸 Autre chose ?`,
  ]);
}

function _hBye(q,D,p,now){
  const h=now.getHours();
  if(h>=21||h<6) return `Bonne nuit **${p}** ! 🌙 Repose-toi bien, demain sera encore meilleur 🌸`;
  if(h>=18)      return `Bonne soirée **${p}** ! 🌙 Prends soin de toi 🌸`;
  return _pick([`À bientôt **${p}** ! 🌸 Bonne journée !`,`Bonne journée **${p}** ! 💕 Je suis là si tu as besoin 🌸`]);
}

function _hCycle(q,D,p,now){
  return `Pour les détails de ton cycle ${p} 🌹, va dans **Bien-être → Cycle**.\nTu peux y enregistrer tes règles et voir les prédictions !`;
}

function _hHelp(q,D,p,now){
  return `Tout ce que je sais faire ${p} 🌸 :\n\n📋 **Résumé** → "résumé de ma journée"\n📅 **Planning** → "planning aujourd'hui / demain / semaine"\n⏳ **Countdown** → "dans combien de temps j'ai un exam ?"\n🎓 **Moyennes** → "ma moyenne" · "meilleure matière" · "matière faible"\n🎯 **Valider** → "quelle note pour valider ?"\n✅ **Tâches** → "mes tâches en cours"\n🌿 **Habitudes** → "mes habitudes · série"\n🛒 **Courses** → "ma liste de courses"\n💗 **Humeur** → "comment je me sens ?"\n🌸 **Motivation** → "motive-moi !"\n💆 **Bien-être** → "je suis stressée / épuisée"\n🔢 **Calcul** → "calcule 15 × 8"\n💧 **Eau** → "j'ai bu combien de verres ?"\n🌸 **Citation** → "donne-moi une affirmation"\n⏰ **Prochain événement** → "mon prochain cours"\n\n🆕 **Actions directes :**\n🛒 → "dans mes achats rajoute des pommes"\n📝 → "note que…" ou "crée une note : …"\n⏰ → "rappelle-moi à 18h de réviser les maths"\n✅ → "ajoute une tâche : rendre le devoir"\n📚 → "mode révision" ou "quiz sur les maths"\n💡 → "conseille-moi" · "conseils personnalisés"\n📈 → "tendance humeur cette semaine"\n🔢 → "si j'ai 14 en maths, quelle moyenne ?"\n🎤 → Bouton micro pour parler !\n\n_Je comprends aussi le langage texto : cv, slt, auj, dem…_ 😊\n_Je me souviens de nos conversations 💕_`;
}

function _hTime(q,D,p,now){
  const fmt=now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const hh=now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  return `Nous sommes le **${fmt}** et il est **${hh}** ${p} 🕐`;
}

function _hCalc(q,D,p,now){
  const raw=q.replace(/calcule|combien fait|combien|résoud|math/gi,'').trim();
  const expr=raw.replace(/×/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/[^0-9+\-*/^().% ]/g,'').trim();
  if(!expr||expr.length<1) return `Donne-moi un calcul ${p} ! 🔢\nEx: _"calcule 15 × 8"_, _"combien fait 100 ÷ 4"_, _"25 % de 200"_`;
  if(!(/\d/.test(expr))) return `Je n'ai pas compris l'expression ${p} 🤔 Essaie : _"calcule 12 × 8"_`;
  try{
    // Gestion pourcentage : "25 % de 200" → 25/100*200
    const safe=expr.replace(/(\d+\.?\d*)\s*%\s*de\s*(\d+\.?\d*)/g,'($1/100*$2)').replace(/\^/g,'**');
    if(!/^[\d+\-*/.()% ]+$/.test(safe.replace(/\*\*/g,'**'))) return `Expression non reconnue ${p} 🤔`;
    // eslint-disable-next-line no-new-func
    const res=Function('"use strict";return ('+safe+')')();
    if(!isFinite(res)) return `Résultat indéfini ${p} (division par zéro ?) 🤔`;
    const pretty=Number.isInteger(res)?res:parseFloat(res.toFixed(6));
    return `🔢 **${expr.trim()} = ${pretty}**\n\nAutre calcul ${p} ? 😊`;
  }catch(e){
    return `Je n'arrive pas à calculer ça ${p} 🤔\nEssaie : _"calcule 12 × 8"_ ou _"combien fait 100 ÷ 4"_`;
  }
}

function _hWater(q,D,p,now){
  _lunaCtx='water';
  const w=D.water, left=Math.max(0,8-w);
  if(w>=8) return `Objectif atteint ! 🎉 Tu as bu **${w}/8 verres** d'eau aujourd'hui **${p}** — parfait pour ta santé ! 💧`;
  const tips=['Astuce : garde une bouteille à portée de main 💧','Essaie de boire un verre à chaque repas 🥤','L\'hydratation améliore la concentration ! 🧠'];
  return `Tu as bu **${w}/8 verres** d'eau aujourd'hui **${p}** 💧\nIl t'en reste **${left}** à boire pour l'objectif !\n\n_${_pick(tips)}_\n\nTu peux les enregistrer depuis l'**Accueil** 🌸`;
}

function _hQuote(q,D,p,now){
  _lunaCtx='quote';
  const fr=typeof AFFIRMATIONS_FR!=='undefined'?AFFIRMATIONS_FR:[];
  const ar=typeof AFFIRMATIONS_AR!=='undefined'?AFFIRMATIONS_AR:[];
  const all=[...fr,...ar];
  if(!all.length) return `Tu es incroyable **${p}** ! ✨ Rappelle-toi que tu mérites tout le bonheur du monde 🌸`;
  const q1=_pick(fr||all);
  const q2=ar.length?_pick(ar):'';
  return `🌸 **Affirmation du jour pour toi ${p} :**\n\n_${q1}_${q2?`\n\n_${q2}_`:''}`;
}

function _hPomodoro(q,D,p,now){
  return `Le minuteur Pomodoro est sur ton **Accueil** ${p} ⏱️\n\n**Principe Pomodoro :**\n• ⏱️ 25 min de travail intense (téléphone loin !)\n• ☕ 5 min de pause\n• Après 4 cycles → 20-30 min de vraie pause\n\nTu peux démarrer / pauser directement depuis le dashboard 🍅`;
}

// ════════════════════════════════════════════════════════
//  POINT D'ENTRÉE — _lunaThink
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//  SMART ACTIONS — détection et exécution d'actions réelles
// ════════════════════════════════════════════════════════
function _lunaSmartAction(msg, q, D, p) {
  // ── Ajouter à la liste de courses ──────────────────
  // "dans mes achats rajoute des pommes de terre"
  // "ajoute X dans mes courses" / "ajoute X à la liste"
  const shoppingPat = /(?:dans mes (?:achats?|courses?)|(?:rajoute|ajoute|met[sz]?|ajouter)\s+(?:des?|un|une|du|les|l[ae'])?\s+(.+?)\s+(?:dans?|à|au[x]?|en)\s+(?:mes\s+)?(?:achats?|courses?|liste))|(?:(?:rajoute|ajoute|ajouter)\s+(?:des?|un|une|du|les|l[ae'])?\s+(.+?)\s+(?:à|dans?|au[x]?)\s+(?:mes\s+)?(?:achats?|courses?|liste(?:\s+de\s+courses?)?))|(?:(?:dans mes achats?|dans mes courses?|dans la liste)\s+(?:rajoute|ajoute|mets?)\s+(?:des?|un|une|du|les|l[ae'])?\s+(.+))/i;
  let shM = msg.match(shoppingPat);
  if (!shM) {
    // pattern simple : "rajoute pommes de terre dans mes achats"
    const s2 = msg.match(/(?:rajoute|ajoute|ajouter)\s+(?:des?|un|une|du)?\s*(.+?)\s+(?:dans?|à|au[x]?)\s+(?:mes\s+)?(?:achats?|courses?|liste)/i);
    if (s2) shM = s2;
    // pattern: "dans mes achats rajoute pommes de terre"
    const s3 = msg.match(/dans mes (?:achats?|courses?)\s+(?:rajoute|ajoute|mets?)\s+(?:des?|un|une|du|les?)?\s*(.+)/i);
    if (s3) shM = s3;
  }
  if (shM) {
    const itemName = (shM[1]||shM[2]||shM[3]||'').trim().replace(/\s*[.,!?]+$/, '');
    if (itemName.length > 1) {
      const shop = LS.shopping();
      const newItem = { id: Date.now().toString(36), name: itemName, qty: '', unit: '', category: '', checked: false };
      shop.push(newItem);
      LS.s('pl_shopping', shop);
      return `✅ J'ai ajouté **"${itemName}"** à ta liste de courses ${p} 🛒\n\nTa liste a maintenant **${shop.filter(i=>!i.checked).length} article${shop.filter(i=>!i.checked).length>1?'s':''}** à acheter.`;
    }
  }

  // ── Créer une note ─────────────────────────────────
  // "note que..." / "dans notes, note que..." / "crée une note : ..."
  const notePat = /(?:note(?:\s+que)?|dans\s+(?:mes\s+)?notes?\s+(?:note|écris?|mets?)\s+(?:que)?|crée une note\s*:?|prends une note\s*:?)\s+(.+)/i;
  const noteM = msg.match(notePat);
  if (noteM) {
    const content = noteM[1].trim();
    if (content.length > 2) {
      const subjects = LS.subjects();
      const notes = LS.notes();
      // Cherche un sujet "Mémo" ou "Général" ou prend le premier
      let sid = subjects.find(s => /mémo|memo|général|general|divers/i.test(s.name))?.id
             || subjects[0]?.id;
      if (!sid && subjects.length === 0) {
        // Crée un sujet par défaut
        const newSub = { id: uid(), name: 'Mémos', emoji: '📝', color: { dot:'var(--rose)', bg:'var(--rose-l)' } };
        subjects.push(newSub);
        LS.s('pl_subjects', subjects);
        sid = newSub.id;
      }
      if (sid) {
        const newNote = { id: uid(), subjectId: sid, title: content.slice(0, 50), content: `<p>${content}</p>`, createdAt: Date.now(), updatedAt: Date.now() };
        notes.push(newNote);
        LS.s('pl_notes', notes);
        return `✅ Note créée ${p} 📝\n\n**"${content.slice(0,60)}${content.length>60?'…':''}"**\n\nTu peux la retrouver dans l'onglet **Notes**.`;
      }
    }
  }

  // ── Rappel / Créer événement ───────────────────────
  // "rappelle-moi à 18h de réviser les maths"
  // "rappelle-moi demain à 9h de..."
  const rappelPat = /rappelle[- ]?(?:moi|le|la|nous)?\s+(?:(aujourd'?hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+)?à\s+(\d{1,2})h?(?::?(\d{2}))?\s+(?:de\s+|d[''])?(.+)/i;
  const rappelM = msg.match(rappelPat);
  if (rappelM) {
    const dayWord = (rappelM[1]||'').toLowerCase();
    const hh = rappelM[2].padStart(2,'0');
    const mm = (rappelM[3]||'00').padStart(2,'0');
    const what = (rappelM[4]||'').trim().replace(/\s*[.,!?]+$/, '');
    const now2 = new Date();
    let evDate = now2.toISOString().slice(0,10);
    if (dayWord === 'demain') {
      const d = new Date(now2); d.setDate(d.getDate()+1);
      evDate = d.toISOString().slice(0,10);
    } else if (['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].includes(dayWord)) {
      const dowMap = {lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,dimanche:0};
      const target = dowMap[dayWord];
      const d = new Date(now2);
      const cur = d.getDay();
      let diff = target - cur; if (diff <= 0) diff += 7;
      d.setDate(d.getDate()+diff);
      evDate = d.toISOString().slice(0,10);
    }
    const evs = LS.events();
    const newEv = { id: uid(), title: what || 'Rappel', date: evDate, startTime: `${hh}:${mm}`, endTime: '', location: '', color: 'var(--rose)', recurrence: 'none' };
    evs.push(newEv);
    LS.s('pl_events', evs);
    const dayLabel2 = dayWord === 'demain' ? 'demain' : dayWord || "aujourd'hui";
    return `✅ Rappel créé ${p} ! ⏰\n\n**"${what}"**\n📅 ${dayLabel2.charAt(0).toUpperCase()+dayLabel2.slice(1)} à **${hh}h${mm==='00'?'':mm}**\n\nTu le retrouveras dans ton **Agenda** 🗓️`;
  }

  // ── Ajouter une tâche ──────────────────────────────
  // "ajoute [tâche] à mes tâches" / "ajoute une tâche : ..."
  const taskPat = /(?:ajoute(?:r)?\s+(?:une\s+)?(?:tâche|tache)\s*:?\s+(.+)|ajoute(?:r)?\s+(.+?)\s+(?:dans?|à)\s+(?:mes\s+)?(?:tâches?|taches?|todo)|mets?\s+(.+?)\s+(?:dans?|à)\s+(?:mes\s+)?(?:tâches?|taches?))/i;
  const taskM = msg.match(taskPat);
  if (taskM) {
    const title = (taskM[1]||taskM[2]||taskM[3]||'').trim().replace(/\s*[.,!?]+$/, '');
    if (title.length > 1) {
      const todos = LS.todos ? LS.todos() : (JSON.parse(localStorage.getItem('pl_todos')||'[]'));
      const newTask = { id: uid(), title, done: false, priority: 'normal', dueDate: null, createdAt: Date.now() };
      todos.push(newTask);
      LS.s('pl_todos', todos);
      return `✅ Tâche ajoutée ${p} ! 📋\n\n**"${title}"**\n\nTu peux la voir et la cocher dans l'onglet **Tâches** ✅`;
    }
  }

  // ── Mode révision ──────────────────────────────────
  // "mode révision" / "lance une révision de maths"
  const revPat = /(?:mode\s+révision|lance(?:r)?\s+(?:une\s+)?révision|quiz\s+(?:de\s+|sur\s+)?(.+)|révise(?:r)?\s+(?:avec|les?)?\s*(.+)|pose(?:r)?[\- ]moi\s+des\s+questions\s+(?:sur|de)\s+(.+))/i;
  const revM = msg.match(revPat);
  if (revM && !_lunaRevMode) {
    const subjHint = (revM[1]||revM[2]||revM[3]||'').trim();
    return _hStartRevision(subjHint, D, p);
  }

  // ── Analyse humeur cette semaine ───────────────────
  const moodTrendPat = /(?:comment\s+(?:évolue|va)\s+mon\s+humeur|tendance\s+(?:de\s+)?(?:mon\s+)?humeur|humeur\s+(?:cette\s+)?semaine|bilan\s+humeur|analyse\s+humeur)/i;
  if (moodTrendPat.test(msg)) {
    return _hMoodTrend(D, p);
  }

  // ── Conseil personnalisé ───────────────────────────
  const advicePat = /(?:conseil|conseille[- ]moi|que\s+(?:dois[\- ]je|devrais[\- ]je)\s+faire|comment\s+(?:progresser|améliorer|travailler|mieux\s+travailler)|aide[\- ]moi\s+à\s+(?:progresser|m'organiser|travailler))/i;
  if (advicePat.test(msg)) {
    return _hPersonalizedAdvice(D, p);
  }

  // ── Simulation de note ────────────────────────────
  // "si j'ai 14 à l'examen, quelle sera ma moyenne"
  const simPat = /si\s+(?:j[''e]\s+(?:ai?|obtiens?|prends?))\s+(\d+(?:[.,]\d+)?)\s+(?:à|en|au|sur\s+20)?\s*(.+?)(?:\s*,\s*(?:quelle|quel|ma)\s+(?:sera|serait)\s+(?:ma\s+)?moyenne)?/i;
  const simM = msg.match(simPat);
  if (simM && (msg.includes('moyenne') || msg.includes('examen') || msg.includes('exam'))) {
    const grade = parseFloat(simM[1].replace(',','.'));
    const subjName = simM[2]?.trim() || '';
    return _hGradeSimulation(grade, subjName, D, p);
  }

  return null; // Pas d'action détectée
}

// ── Mode révision ─────────────────────────────────────
function _hStartRevision(subjHint, D, p) {
  _lunaRevMode = true;
  const subs = D.subjects;
  if (!subs.length) {
    _lunaRevMode = false;
    return `Tu n'as pas encore de matières ${p} 📚\nCrée tes sujets dans l'onglet **Notes** d'abord !`;
  }
  // Cherche la matière correspondante
  let sub = null;
  if (subjHint) {
    sub = subs.find(s => s.name.toLowerCase().includes(subjHint.toLowerCase()) || subjHint.toLowerCase().includes(s.name.toLowerCase()));
  }
  if (!sub) sub = subs[Math.floor(Math.random()*subs.length)];
  _lunaRevSubj = sub;
  return _lunaNextQuestion(sub, D, p);
}

function _lunaNextQuestion(sub, D, p) {
  // Questions génériques de révision basées sur la matière
  const notes = D.notes.filter(n => n.subjectId === sub.id);
  const genericQs = [
    `📚 **Mode révision — ${sub.emoji||''} ${sub.name}**\n\nQuestion 1 : Explique-moi en 2-3 phrases le concept principal que tu as étudié récemment en **${sub.name}**. Prends le temps de bien formuler ta réponse !`,
    `🎯 Question pour **${sub.name}** :\n\nSi tu devais résumer le chapitre le plus important de **${sub.name}** à quelqu'un qui ne connaît rien, que dirais-tu ?`,
    `💡 Question de révision — **${sub.name}** :\n\nQuels sont les 3 points clés que tu dois absolument retenir pour l'examen de **${sub.name}** ?`,
    `🔍 Test de mémoire — **${sub.name}** :\n\nSans regarder tes notes, donne-moi une définition ou formule importante de **${sub.name}**. Sois le plus précise possible !`,
  ];
  const q = notes.length > 0
    ? `📖 **Mode révision — ${sub.emoji||''} ${sub.name}**\n\nTu as **${notes.length} note${notes.length>1?'s':''}** dans cette matière.\n\nQuestion : Explique-moi en tes propres mots le sujet principal de ta dernière note. Qu'as-tu appris récemment en **${sub.name}** ?`
    : genericQs[Math.floor(Math.random()*genericQs.length)];
  _lunaRevQ = { sub, asked: Date.now() };
  return q + '\n\n_Réponds librement — je t\'évaluerai et poserai la prochaine question !_\n_Tape "stop révision" pour arrêter._';
}

function _lunaHandleRevision(msg, D, p) {
  const q = _norm(msg);
  if (/(stop|arrête|fini|terminé|quitter|exit|stop révision)/.test(q)) {
    _lunaRevMode = false; _lunaRevQ = null; _lunaRevSubj = null;
    return `Super session de révision ${p} ! 🎉\nContinue comme ça, tu vas cartonner à tes examens 💪\n\nAutre chose que je peux faire pour toi ?`;
  }
  // Évalue la réponse (analyse simple)
  const wordCount = msg.trim().split(/\s+/).length;
  let feedback = '';
  if (wordCount < 5) {
    feedback = `Ta réponse est un peu courte ${p} 🤔 Développe davantage ! Essaie d'expliquer avec plus de détails.`;
  } else if (wordCount < 15) {
    feedback = `Bien ${p} ! ✨ Tu commences à bien cerner le concept. Peux-tu donner un exemple concret ?`;
  } else {
    const positives = [`Excellent ${p} ! 🏆 Ta réponse est développée et structurée !`, `Très bien ${p} ⭐ ! Tu maîtrises bien ce sujet !`, `Super réponse ${p} ! 💕 Je vois que tu as bien étudié !`];
    feedback = positives[Math.floor(Math.random()*positives.length)];
  }
  // Pose une nouvelle question
  const sub = _lunaRevSubj;
  if (!sub) { _lunaRevMode = false; return feedback; }
  const nextQs = [
    `\n\n📚 **Prochaine question — ${sub.name}** :\n\nDonne-moi un exemple d'application pratique d'un concept de **${sub.name}**. Comment l'utiliserais-tu dans la vraie vie ?`,
    `\n\n🎯 **Question suivante** :\n\nQuelle est la partie de **${sub.name}** qui te semble la plus difficile ? Explique pourquoi.`,
    `\n\n💡 **Question bonus** :\n\nSi tu avais un examen demain en **${sub.name}**, qu'est-ce que tu réviserais EN PRIORITÉ ? Pourquoi ?`,
    `\n\n🔍 **Test rapide** :\n\nCite 3 termes techniques importants de **${sub.name}** et donne leur définition rapide.`,
  ];
  const next = nextQs[Math.floor(Math.random()*nextQs.length)];
  return `${feedback}${next}\n\n_Tape "stop révision" pour terminer la session._`;
}

// ── Analyse de tendance d'humeur ──────────────────────
function _hMoodTrend(D, p) {
  const moods = D.moods;
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();

  const moodOrder = { 'Excellent':5,'Bien':4,'Neutre':3,'Fatiguée':2,'Stressée':1,'Difficile':1,'Triste':1 };
  const moodEmojis = { 'Excellent':'😄','Bien':'😊','Neutre':'😐','Fatiguée':'😴','Stressée':'😰','Difficile':'😟','Triste':'😢' };

  const entries = days.map(d => ({ date: d, entry: moods[d] })).filter(x => x.entry);
  if (entries.length === 0) {
    return `Tu n'as pas encore enregistré ton humeur cette semaine ${p} 🌸\nVa dans **Bien-être** pour noter tes humeurs — ça m'aide à t'aider mieux !`;
  }

  const MOOD_DEF = typeof MOODS !== 'undefined' ? MOODS : {};
  const chart = days.map(d => {
    const e = moods[d];
    if (!e) return `  ${d.slice(5)} │ ─ ─ ─ ─ ─ ─`;
    const moodLabel = MOOD_DEF[e.mood]?.l || e.mood || '?';
    const score = moodOrder[moodLabel] || 3;
    const bar = '█'.repeat(score) + '░'.repeat(5-score);
    const em = moodEmojis[moodLabel] || '😐';
    return `  ${d.slice(5)} │ ${bar} ${em} ${moodLabel}`;
  }).join('\n');

  const scores = entries.map(x => {
    const ml = MOOD_DEF[x.entry.mood]?.l || x.entry.mood || 'Neutre';
    return moodOrder[ml] || 3;
  });
  const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
  let trend = '';
  if (scores.length >= 2) {
    const firstHalf = scores.slice(0, Math.floor(scores.length/2));
    const secondHalf = scores.slice(Math.floor(scores.length/2));
    const avgFirst = firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length;
    const avgSecond = secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length;
    if (avgSecond > avgFirst + 0.3) trend = '\n\n📈 **Tendance positive** — ton humeur s\'améliore cette semaine ! 🌸';
    else if (avgSecond < avgFirst - 0.3) trend = '\n\n📉 **Tendance à la baisse** — tu sembles moins bien en fin de semaine. Prends soin de toi 💕';
    else trend = '\n\n➡️ **Humeur stable** cette semaine.';
  }
  const avgLabel = avg >= 4.5 ? 'Excellent' : avg >= 3.5 ? 'Bien' : avg >= 2.5 ? 'Neutre' : 'Difficile';
  return `💗 **Tendance d'humeur — 7 derniers jours ${p}**\n\n\`\`\`\n${chart}\n\`\`\`\n\nMoyenne de la semaine : **${avgLabel}** (${avg.toFixed(1)}/5)${trend}`;
}

// ── Conseils personnalisés ────────────────────────────
function _hPersonalizedAdvice(D, p) {
  const a2 = _avgPartial(D.grades.s2);
  const pend = D.tasks.filter(t=>!t.done).length;
  const urgent = D.tasks.filter(t=>!t.done&&t.priority==='high').length;
  const actH = D.habits.filter(h=>h.active);
  const td = _date(0);
  const doneH = actH.filter(h=>(D.hlogs[td]||[]).includes(h.id));
  const mo = _mood(D.moods, td);
  const mods = [...D.grades.s1||[], ...D.grades.s2||[]];
  const withAvg = mods.map(m=>({m,a:typeof moduleAverage==='function'?moduleAverage(m):null})).filter(x=>x.a!==null).sort((a,b)=>a.a-b.a);
  const worst = withAvg[0];

  let advice = `🎯 **Conseils personnalisés pour toi ${p}** :\n\n`;
  const tips = [];

  if (a2 !== null && a2 < 10) {
    tips.push(`📚 Ta moyenne S2 est à **${a2.toFixed(2)}/20** — sous la barre de 10. Concentre-toi sur les matières clés !`);
  } else if (a2 !== null && a2 >= 14) {
    tips.push(`🏆 Excellente moyenne S2 de **${a2.toFixed(2)}/20** ! Continue sur cette lancée.`);
  }
  if (worst && worst.a < 10) {
    tips.push(`⚠️ **${worst.m.name}** est ta matière la plus faible (${worst.a.toFixed(2)}/20). Consacre-lui au moins **30 min/jour** cette semaine.`);
  }
  if (urgent > 0) {
    tips.push(`🔴 Tu as **${urgent} tâche${urgent>1?'s':''} urgente${urgent>1?'s':''}** — commence par là avant tout le reste !`);
  } else if (pend > 5) {
    tips.push(`✅ **${pend} tâches** en attente — utilise la règle **2 minutes** : si ça prend < 2 min, fais-le maintenant !`);
  }
  if (actH.length > 0 && doneH.length < actH.length/2) {
    tips.push(`🌿 Tu as fait seulement **${doneH.length}/${actH.length} habitudes** aujourd'hui. La régularité est la clé !`);
  }
  if (mo && (mo.l === 'Fatiguée' || mo.l === 'Stressée')) {
    tips.push(`😴 Tu te sens **${mo.l}** — priorise ton énergie. Fais d'abord **une seule chose importante** puis repose-toi.`);
  }
  if (D.water < 4 && new Date().getHours() >= 14) {
    tips.push(`💧 Seulement **${D.water} verres** d'eau — la déshydratation réduit la concentration de 20% !`);
  }

  if (!tips.length) {
    tips.push(`✨ Tu gères super bien ${p} ! Continue à maintenir tes habitudes et ton rythme de travail.`);
    tips.push(`📅 Consulte ton planning régulièrement et anticipe les deadlines importantes.`);
  }

  advice += tips.map((t,i)=>`**${i+1}.** ${t}`).join('\n\n');
  advice += `\n\n_Tape "mode révision" pour t'entraîner sur une matière_ 📚`;
  return advice;
}

// ── Simulation de note ────────────────────────────────
function _hGradeSimulation(newGrade, subjName, D, p) {
  const mods = D.grades.s2 || [];
  if (!mods.length) return `Aucune note S2 enregistrée ${p} 📊\nAjoute tes matières dans **Moyennes** d'abord !`;

  if (newGrade < 0 || newGrade > 20) return `La note doit être entre 0 et 20 ${p} 😊`;

  // Cherche la matière si précisée
  let targetMod = null;
  if (subjName) {
    targetMod = mods.find(m => m.name.toLowerCase().includes(subjName.toLowerCase()));
  }

  if (targetMod) {
    // Simulation pour une matière précise
    const currentAvg = typeof moduleAverage === 'function' ? moduleAverage(targetMod) : null;
    const simMods = mods.map(m => {
      if (m.id !== targetMod.id) return m;
      const simM = JSON.parse(JSON.stringify(m));
      if (simM.submodules && simM.submodules.length > 0) {
        // Met la note sur le premier sous-module sans note
        const empty = simM.submodules.find(s => s.grade === null || s.grade === undefined || s.grade === '');
        if (empty) empty.grade = newGrade;
        else simM.submodules[simM.submodules.length-1].grade = newGrade;
      } else {
        simM.grade = newGrade;
      }
      return simM;
    });
    let tc=0,tp=0,hasAll=true;
    simMods.forEach(m => {
      const a = typeof moduleAverage === 'function' ? moduleAverage(m) : null;
      if (a === null) { hasAll=false; return; }
      tc += m.coef||1; tp += a*(m.coef||1);
    });
    const newSemAvg = (hasAll && tc > 0) ? tp/tc : null;
    return `🔢 **Simulation de note ${p}** :\n\nSi tu obtiens **${newGrade}/20** en **${targetMod.name}** :\n\n• Matière actuelle : ${currentAvg!==null?currentAvg.toFixed(2)+'/20':'–'}\n• Avec ${newGrade}/20 → matière = ${newGrade.toFixed(2)}/20\n${newSemAvg!==null?`• Nouvelle moyenne S2 estimée : **${newSemAvg.toFixed(2)}/20** ${_gradeEmoji(newSemAvg)}\n  _(${_mention(newSemAvg)})_`:'⚠️ Des notes manquent encore pour calculer la moyenne globale.'}\n\n${newSemAvg!==null&&newSemAvg>=10?'✅ Tu validerais le semestre !':'💪 Continue, tu peux y arriver !'}`;
  } else {
    // Simulation générique
    let tc=0,tp=0,hasAll=mods.length>0;
    mods.forEach(m => {
      const a = typeof moduleAverage === 'function' ? moduleAverage(m) : null;
      if (a === null) { hasAll=false; return; }
      tc+=m.coef||1; tp+=a*(m.coef||1);
    });
    const current = (hasAll && tc>0) ? tp/tc : null;
    return `🔢 **Simulation** :\n\nMoyenne S2 actuelle : **${current!==null?current.toFixed(2)+'/20':'notes incomplètes'}**\n\nPour simuler l'impact d'une note précise, dis-moi par exemple :\n_"Si j'ai 14 en Maths, quelle sera ma moyenne ?"_\n\n${current!==null&&current<10?`💪 Il te faut **${(10-current).toFixed(2)} points** supplémentaires pour valider !`:''}`;
  }
}

function _lunaThink(msg){
  const now=new Date();
  const q=_norm(msg);
  const D=_getData();
  const raw=D.cfg.prenom||D.cfg.name||'';
  const p=raw?raw.split(' ')[0]:'toi';

  // 0. Mode révision en cours
  if (_lunaRevMode) return _lunaHandleRevision(msg, D, p);

  // 0b. Smart actions (avant tout)
  const smartReply = _lunaSmartAction(msg, q, D, p);
  if (smartReply) return smartReply;

  // 1. Contexte conversationnel
  const ctxR=_ctxReply(q,D,p,now);
  if(ctxR) return ctxR;

  // 2. Détection d'intention
  const it=_intent(q);
  const map={
    greeting:_hGreeting, mood:_hMood, resume:_hResume,
    today:_hToday, tomorrow:_hTomorrow, week:_hWeek,
    tasks:_hTasks, grades:_hGrades, validate:_hValidate,
    best_sub:_hBestSub, worst_sub:_hWorstSub, countdown:_hCountdown,
    next_event:_hNextEvent, habits:_hHabits, shopping:_hShopping,
    notes_sub:_hNotesSub, motivation:_hMotivation, wellbeing:_hWellbeing,
    thanks:_hThanks, bye:_hBye, cycle:_hCycle, help:_hHelp,
    time:_hTime, calc:_hCalc, water:_hWater, quote:_hQuote,
    pomodoro:_hPomodoro,
  };
  if(it&&map[it]) return map[it](q,D,p,now);

  // 3. Fallback intelligent — suggère selon les données
  _lunaCtx=null;
  const pend=D.tasks.filter(t=>!t.done).length;
  const todayEvs=D.events.filter(e=>e.date===_date(0)).length;
  const a2=_avgPartial(D.grades.s2);
  let hints=[];
  if(pend)       hints.push(`tu as **${pend} tâche${pend>1?'s':''}** en attente`);
  if(todayEvs)   hints.push(`**${todayEvs} événement${todayEvs>1?'s':''}** aujourd'hui`);
  if(a2!==null)  hints.push(`ta moyenne S2 est à **${a2.toFixed(2)}/20**`);
  const hintStr=hints.length?` Je sais que ${hints.join(' et ')}.`:'';

  return _pick([
    `Je n'ai pas bien compris **${p}** 🌸${hintStr}\nEssaie : _"mon planning"_, _"mes moyennes"_, _"motive-moi"_ ou tape _"aide"_ !`,
    `Hmm, reformule un peu **${p}** 😊 Je comprends le français naturel et le texto.\nTape _"aide"_ pour voir tout ce que je sais faire !`,
    `${p} 🌸${hintStr}\nDemande-moi ton **planning**, tes **notes**, tes **tâches**, ou une **motivation** !`,
  ]);
}

// ════════════════════════════════════════════════════════
//  RENDU UI
// ════════════════════════════════════════════════════════
function _lunaMd(t){
  return esc(t)
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/_(.*?)_/g,'<em>$1</em>')
    .replace(/\n/g,'<br>');
}
function _lunaTs(){ return new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }

function sendLunaMsg(){
  const inp=document.getElementById('luna-input');
  if(!inp||_lunaTyping) return;
  const msg=inp.value.trim();
  if(!msg) return;
  inp.value=''; inp.style.height='';
  _lunaAsk(msg);
}

function sendLunaQuick(text){
  if(_lunaTyping) return;
  const clean=text.replace(/^[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]\s*/u,'').trim();
  _lunaAsk(clean||text);
}

function clearLunaChat(){
  _lunaMsgs=[]; _lunaInit=false; _lunaCtx=null;
  _lunaRevMode=false; _lunaRevQ=null; _lunaRevSubj=null;
  try { localStorage.removeItem('luna_history'); } catch(e){}
  go('luna');
}

// ── Sauvegarde mémoire persistante ────────────────────
function _saveLunaHistory(){
  try { localStorage.setItem('luna_history', JSON.stringify(_lunaMsgs.slice(-60))); } catch(e){}
}

function _lunaAsk(msg){
  _lunaMsgs.push({role:'user',text:msg,ts:_lunaTs()});
  _lunaTyping=true;
  _refreshMsgs();
  const delay=250+Math.random()*300;
  setTimeout(()=>{
    const reply=_lunaThink(msg);
    _lunaTyping=false;
    _lunaMsgs.push({role:'luna',text:reply,ts:_lunaTs()});
    _saveLunaHistory();
    _refreshMsgs();
    _lunaPlaySound();
  },delay);
}

// ── Son de notification (AudioContext) ────────────────
function _lunaPlaySound(){
  try {
    const cfg = LS.cfg();
    if (cfg.lunaSound === false) return;
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(()=>ctx.close(), 400);
  } catch(e){}
}

// ── Microphone / Voice Input ──────────────────────────
function toggleLunaMic(){
  const btn = document.getElementById('luna-mic-btn');
  if (_lunaListening) {
    _lunaListening = false;
    if (_lunaSpeechRec) { try { _lunaSpeechRec.stop(); } catch(e){} _lunaSpeechRec = null; }
    if (btn) { btn.classList.remove('mic-active'); btn.title = 'Parler à Luna'; }
    return;
  }
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('🎤 Reconnaissance vocale non supportée par ce navigateur');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'fr-FR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => {
    _lunaListening = true;
    if (btn) { btn.classList.add('mic-active'); btn.title = 'Arrêter'; }
    showToast('🎤 Je t\'écoute…');
  };
  rec.onresult = e => {
    const txt = e.results[0][0].transcript;
    const inp = document.getElementById('luna-input');
    if (inp) inp.value = txt;
    _lunaListening = false;
    if (btn) { btn.classList.remove('mic-active'); btn.title = 'Parler à Luna'; }
    _lunaAsk(txt);
  };
  rec.onerror = () => {
    _lunaListening = false;
    _lunaSpeechRec = null;
    if (btn) { btn.classList.remove('mic-active'); btn.title = 'Parler à Luna'; }
    showToast('🎤 Erreur microphone');
  };
  rec.onend = () => {
    _lunaListening = false;
    _lunaSpeechRec = null;
    if (btn) { btn.classList.remove('mic-active'); btn.title = 'Parler à Luna'; }
  };
  _lunaSpeechRec = rec;
  rec.start();
}

// ════════════════════════════════════════════════════════
//  VUE
// ════════════════════════════════════════════════════════
function viewLuna(){
  if(!_lunaInit){
    _lunaInit=true;
    // Si l'historique est vide (première fois ou après clear), envoie le message de bienvenue
    if (_lunaMsgs.length === 0) {
      setTimeout(()=>{
        const D=_getData();
        const raw=D.cfg.prenom||D.cfg.name||'';
        const p=raw?raw.split(' ')[0]:'';
        const pn=p?` **${p}**`:'';
        const h=new Date().getHours();
        const s=h<5?'Bonne nuit':h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
        const td=_date(0);
        const evs=D.events.filter(e=>e.date===td);
        const pend=D.tasks.filter(t=>!t.done).length;
        let ctx='';
        if(evs.length) ctx+=` Tu as **${evs.length} événement${evs.length>1?'s':''}** aujourd'hui.`;
        if(pend)       ctx+=` **${pend} tâche${pend>1?'s':''}** en attente.`;
        _lunaMsgs.push({
          role:'luna',
          text:`${s}${pn} ! Je suis **Luna** 🌸, ton assistante personnelle.${ctx}\n\nJe comprends le français naturel, le langage texto (_cv, slt, auj_…) et j'accède à toutes tes données — **100% hors ligne et privé** 🔒\n\nJe me souviens de nos conversations 💕 Tape _"aide"_ pour voir tout ce que je sais faire !`,
          ts:_lunaTs()
        });
        _saveLunaHistory();
        _refreshMsgs();
      },300);
    } else {
      // Historique existant - affiche directement sans re-render après délai
      setTimeout(()=>_refreshMsgs(), 50);
    }
  }

  return `
<div class="luna-ph">
  <div class="luna-ph-left">
    <div class="luna-ph-av">🌸</div>
    <div>
      <div class="luna-ph-name">Luna</div>
      <div class="luna-ph-status"><span class="luna-online-dot"></span><span>IA offline · Privé 🔒</span></div>
    </div>
  </div>
  <button class="luna-clear-btn" onclick="clearLunaChat()" title="Nouvelle conversation">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
  </button>
</div>

<div class="luna-layout">
  <div class="luna-body" id="luna-body">
    <div class="luna-welcome" id="luna-welcome">
      <div class="luna-welcome-orb"></div>
      <div class="luna-welcome-av">🌸</div>
      <div class="luna-welcome-name">Luna IA</div>
      <div class="luna-welcome-sub">Assistante intelligente · 100% hors ligne · Données privées</div>
      <div class="luna-caps-row">
        <div class="luna-cap"><span>📅</span>Planning</div>
        <div class="luna-cap"><span>🎓</span>Moyennes</div>
        <div class="luna-cap"><span>✅</span>Tâches</div>
        <div class="luna-cap"><span>🌸</span>Motivation</div>
        <div class="luna-cap"><span>🔢</span>Calculs</div>
        <div class="luna-cap"><span>💆</span>Bien-être</div>
        <div class="luna-cap"><span>🛒</span>Courses</div>
        <div class="luna-cap"><span>🎤</span>Vocal</div>
        <div class="luna-cap"><span>📚</span>Révision</div>
        <div class="luna-cap"><span>💡</span>Conseils</div>
      </div>
    </div>
    <div id="luna-msgs"></div>
  </div>
  <div class="luna-sidebar">
    <div class="luna-sidebar-title">Suggestions</div>
    <div class="luna-chips-list">
      ${_LUNA_CHIPS.map(c=>`<button class="luna-chip2" onclick="sendLunaQuick(this.dataset.text)" data-text="${c}">${c}</button>`).join('')}
    </div>
  </div>
</div>

<div class="luna-chips-wrap">
  ${_LUNA_CHIPS.slice(0,8).map(c=>`<button class="luna-chip" onclick="sendLunaQuick(this.dataset.text)" data-text="${c}">${c}</button>`).join('')}
</div>

<div class="luna-bar">
  <button class="luna-mic-btn" id="luna-mic-btn" onclick="toggleLunaMic()" title="Parler à Luna">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M19 10a7 7 0 01-14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  </button>
  <textarea class="luna-input" id="luna-input" rows="1"
    placeholder="Écris ou parle… ex: rappelle-moi à 18h · ajoute des pommes 🌸"
    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendLunaMsg()}"
    oninput="this.style.height='';this.style.height=Math.min(this.scrollHeight,120)+'px'"
    autocomplete="off"></textarea>
  <button class="luna-send" onclick="sendLunaMsg()" title="Envoyer (Entrée)">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  </button>
</div>`;
}

function _msgHTML(m){
  if(m.role==='user') return `
<div class="luna-msg luna-msg-user">
  <div class="luna-msg-wrap">
    <div class="luna-bubble luna-bubble-user">${_lunaMd(m.text)}</div>
    <div class="luna-msg-ts">${m.ts||''}</div>
  </div>
  <div class="luna-av luna-av-user">👩‍🎓</div>
</div>`;
  return `
<div class="luna-msg luna-msg-ai">
  <div class="luna-av">🌸</div>
  <div class="luna-msg-wrap">
    <div class="luna-bubble luna-bubble-ai">${_lunaMd(m.text)}</div>
    <div class="luna-msg-ts">${m.ts||''}</div>
  </div>
</div>`;
}

function _typingHTML(){
  return `<div class="luna-msg luna-msg-ai" id="luna-typing-ind">
  <div class="luna-av">🌸</div>
  <div class="luna-bubble luna-bubble-ai luna-typing"><span></span><span></span><span></span></div>
</div>`;
}

function _refreshMsgs(){
  const el=document.getElementById('luna-msgs'); if(!el) return;
  const wc=document.getElementById('luna-welcome');
  if(wc) wc.style.display=_lunaMsgs.length>0?'none':'';
  el.innerHTML=_lunaMsgs.map(_msgHTML).join('') + (_lunaTyping?_typingHTML():'');
  const body=document.getElementById('luna-body');
  if(body) setTimeout(()=>body.scrollTop=body.scrollHeight,60);
  if(!_lunaTyping){ const inp=document.getElementById('luna-input'); if(inp) setTimeout(()=>inp.focus(),80); }
}
