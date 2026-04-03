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
  return `Tout ce que je sais faire ${p} 🌸 :\n\n📋 **Résumé** → "résumé de ma journée"\n📅 **Planning** → "planning aujourd'hui / demain / semaine"\n⏳ **Countdown** → "dans combien de temps j'ai un exam ?"\n🎓 **Moyennes** → "ma moyenne" · "meilleure matière" · "matière faible"\n🎯 **Valider** → "quelle note pour valider ?"\n✅ **Tâches** → "mes tâches en cours"\n🌿 **Habitudes** → "mes habitudes · série"\n🛒 **Courses** → "ma liste de courses"\n💗 **Humeur** → "comment je me sens ?"\n🌸 **Motivation** → "motive-moi !"\n💆 **Bien-être** → "je suis stressée / épuisée"\n🔢 **Calcul** → "calcule 15 × 8"\n💧 **Eau** → "j'ai bu combien de verres ?"\n🌸 **Citation** → "donne-moi une affirmation"\n⏰ **Prochain événement** → "mon prochain cours"\n\n_Je comprends aussi le langage texto : cv, slt, auj, dem…_ 😊`;
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
//  ACTIONS DIRECTES — exécutées avant le NLP
// ════════════════════════════════════════════════════════
function _parseTime(str){
  const m=(str||'').match(/(\d{1,2})[h:](\d{0,2})/i);
  if(!m) return null;
  return m[1].padStart(2,'0')+':'+(m[2]||'00').padStart(2,'0');
}

function _lunaAction(msg,p){
  // ── Ajouter une note ──────────────────────────────────
  const noteRx=[
    /(?:rajoute?|ajoute?|écris?|mets?)\s+(?:sur|dans|une?|que)?\s*(?:mes?\s*)?notes?\s+(?:que\s+)?(.+)/i,
    /dans?\s+(?:mes?\s*)?notes?\s+(?:rajoute?|ajoute?|note|écris?|mets?)\s+(?:que\s+)?(.+)/i,
    /note\s+que\s+(.+)/i,
  ];
  for(const rx of noteRx){
    const m=msg.match(rx);
    if(m&&m[1].trim().length>1){
      const content=m[1].trim();
      let subs=LS.subjects();
      let sub=subs.find(s=>/mémo|memo|luna/i.test(s.name));
      if(!sub){
        sub={id:uid(),name:'Mémos Luna',emoji:'🌸',color:PALETTE[0]};
        LS.s('pl_subjects',[...subs,sub]);
      }
      LS.s('pl_notes',[...LS.notes(),{
        id:uid(),title:content.length>40?content.slice(0,40)+'…':content,
        content:`<p>${content}</p>`,subjectId:sub.id,
        createdAt:Date.now(),updatedAt:Date.now()
      }]);
      _lunaCtx='notes';
      return `✅ Note ajoutée **${p}** ! 📝\n\n_"${content}"_\n\nSauvegardée dans **${sub.emoji} ${sub.name}** — retrouve-la dans l'onglet **Notes** !`;
    }
  }

  // ── Ajouter à la liste de courses ─────────────────────
  const shopRx=[
    /(?:rajoute?|ajoute?|mets?)\s+(.+?)\s+(?:dans?|sur|à|au|aux)\s+(?:mes?\s*)?(?:achats?|courses?|liste(?:\s*de\s*courses?)?|commissions?)/i,
    /(?:dans?|sur|à|au|aux)\s+(?:mes?\s*)?(?:achats?|courses?|liste(?:\s*de\s*courses?)?)\s+(?:rajoute?|ajoute?|mets?)\s+(.+)/i,
  ];
  for(const rx of shopRx){
    const m=msg.match(rx);
    if(m&&m[1].trim().length>1){
      const name=m[1].trim().replace(/^(des?|du|de\s+la|de\s+l'|un[e]?)\s+/i,'');
      LS.s('pl_shopping',[...LS.shopping(),{id:uid(),name:cap(name),qty:null,unit:'',category:'other',checked:false}]);
      _lunaCtx='shopping';
      return `✅ **${cap(name)}** ajouté à tes courses ${p} 🛒\n\nRetrouve ta liste dans l'onglet **Courses** !`;
    }
  }

  // ── Ajouter une tâche ─────────────────────────────────
  const taskRx=[
    /(?:rajoute?|ajoute?|mets?)\s+(.+?)\s+(?:dans?|à)\s+(?:mes?\s*)?(?:tâches?|todos?|liste\s*(?:de\s*tâches?)?)/i,
    /(?:dans?|à)\s+(?:mes?\s*)?(?:tâches?|todos?)\s+(?:rajoute?|ajoute?|mets?)\s+(.+)/i,
    /(?:nouvelle?\s+)?tâche\s*:\s*(.+)/i,
  ];
  for(const rx of taskRx){
    const m=msg.match(rx);
    if(m&&m[1].trim().length>1){
      const title=m[1].trim();
      LS.s('pl_todos',[...LS.todos(),{id:uid(),title:cap(title),done:false,priority:'normal',dueDate:null,createdAt:Date.now()}]);
      _lunaCtx='tasks';
      return `✅ Tâche ajoutée **${p}** ! ✅\n\n_"${cap(title)}"_\n\nRetrouve-la dans l'onglet **Tâches** !`;
    }
  }

  // ── Créer un rappel / événement ───────────────────────
  const remRx=[
    /rappelle?-?moi\s+(?:à\s+(\d{1,2}[h:]\d{0,2})\s+)?(?:de|d'|que\s+(?:je\s+)?(?:dois?|faut?)\s+)?(.+)/i,
    /crée?\s+un\s+rappel?\s+(?:à\s+(\d{1,2}[h:]\d{0,2})\s+)?(?:pour|de)\s+(.+)/i,
  ];
  for(const rx of remRx){
    const m=msg.match(rx);
    if(m){
      const timeStr=m[1]||null;
      const title=(m[2]||'').trim();
      if(title.length<2) continue;
      const time=timeStr?_parseTime(timeStr):'';
      const ev={id:uid(),title:cap(title),date:_date(0),startTime:time,endTime:'',location:'',color:'#C4778E'};
      LS.s('pl_events',[...LS.events(),ev]);
      _lunaCtx='today';
      return `✅ Rappel créé **${p}** ! ⏰\n\n📅 _"${cap(title)}"_${time?` à **${time}**`:''}\n\nAjouté à ton **Agenda** d'aujourd'hui !`;
    }
  }

  return null;
}

// ════════════════════════════════════════════════════════
//  POINT D'ENTRÉE — _lunaThink
// ════════════════════════════════════════════════════════
function _lunaThink(msg){
  const now=new Date();
  const q=_norm(msg);
  const D=_getData();
  const raw=D.cfg.prenom||D.cfg.name||'';
  const p=raw?raw.split(' ')[0]:'toi';

  // 0. Actions directes (note / courses / tâche / rappel)
  const actR=_lunaAction(msg,p);
  if(actR) return actR;

  // 0b. Expression mathématique pure (ex: 5*5/6.5+2468)
  if(/^[\d\s+\-*/^().,÷×%]+$/.test(msg.trim())&&/\d/.test(msg)&&/[+\-*/÷×^]/.test(msg))
    return _hCalc(q,D,p,now);

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

function clearLunaChat(){ _lunaMsgs=[]; _lunaInit=false; _lunaCtx=null; go('luna'); }

function _lunaAsk(msg){
  _lunaMsgs.push({role:'user',text:msg,ts:_lunaTs()});
  _lunaTyping=true;
  _refreshMsgs();
  const delay=250+Math.random()*300;
  setTimeout(()=>{
    const reply=_lunaThink(msg);
    _lunaTyping=false;
    _lunaMsgs.push({role:'luna',text:reply,ts:_lunaTs()});
    _refreshMsgs();
  },delay);
}

// ════════════════════════════════════════════════════════
//  VUE
// ════════════════════════════════════════════════════════
function viewLuna(){
  if(!_lunaInit){
    _lunaInit=true;
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
        text:`${s}${pn} ! Je suis **Luna** 🌸, ton assistante personnelle.${ctx}\n\nJe comprends le français naturel, le langage texto (_cv, slt, auj_…) et j'accède à toutes tes données — **100% hors ligne et privé** 🔒\n\nComment puis-je t'aider ?`,
        ts:_lunaTs()
      });
      _refreshMsgs();
    },300);
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
        <div class="luna-cap"><span>⏳</span>Countdown</div>
        <div class="luna-cap"><span>🏆</span>Matières</div>
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
  <textarea class="luna-input" id="luna-input" rows="1"
    placeholder="Écris en français… ex: cv ? · motive moi · calcule 15×8 🌸"
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
