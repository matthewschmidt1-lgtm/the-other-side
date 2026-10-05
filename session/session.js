(function(){
"use strict";
var stage=document.getElementById("stage"), prog=document.getElementById("prog"),
    recap=document.getElementById("recap"), restartBtn=document.getElementById("restart"),
    doorLabel=document.getElementById("door-label");
var LETTERS="ABCDEFGHIJ";
var LEVELS=["","Almost impossible","Unlikely","Plausible","Likely","Almost certainly"];
var NUM=["no","one","two","three","four","five","six"];
var HELP='<a href="https://findahelpline.com" target="_blank" rel="noopener">Find someone to talk to</a>.';
var FEEL="<p>A feeling is a summary of evidence you haven't itemized. It may be right. It can't be checked until you unpack it.</p>";

/* Each door is one direction. Its fit tables are this tool's assumptions about what a reported
   observation fits: 1 fits, -1 fits less well, absent = doesn't separate. */
var DOORS={};

/* ---------- why a relationship changed ---------- */
DOORS.rel={
  title:"Why a relationship changed",
  who:{q:"Think of one person. Not a type. Who are they to you?",sub:"That it happened is not in question here. Why it happened is.",
    options:[["Friend","A friend"],["Partner","A partner"],["Family","Family"],["Colleague","Someone I work with"],["Drifted","Someone I've drifted from"]],
    foot:"This tests a read about distance. If you are afraid of this person, or of how they would take a question, it is the wrong instrument. "+HELP},
  what:{q:"What would you point to?",
    options:[["Cancels plans","They cancel plans"],["Gone quiet","They've gone quiet"],["Says one thing, does another","They say one thing and do another"],["Stopped asking","They stopped asking about my life"]]},
  count:{q:"How many times?",thin:"1–2 times",
    options:[["1–2 times","Once or twice"],["3–5 times","Three to five"],["5+ times","More than five"],["Uncounted","I haven't counted"]],
    replies:{"1–2 times":"Two is a thin sample. Keep that in mind when you rate your confidence.","Uncounted":"Then the number isn't what you are going on. We'll find what is."}},
  readQ:"And your read?",
  M:{
    lose:{s:"They're losing interest.",n:"Losing interest",in:1,painful:1,
          pred:"You start most contact. Replies get shorter. Little is offered back.",cond:"I start every contact and nothing comes back"},
    over:{s:"They're overwhelmed.",n:"Overwhelmed",in:0,
          pred:"It is the same with most people, outside a few fixed commitments. Contact is thin but not cold.",cond:"It's the same with everyone in their life"},
    prio:{s:"They want this, but don't prioritize it.",n:"Not a priority",in:1,painful:1,
          pred:"They turn up for other people. You get what is left over, and changes come late.",cond:"Other people still get their time"},
    avoid:{s:"They're avoiding telling me something.",n:"Avoiding something",in:1,painful:1,
          pred:"Fine in a group or by message. It is time alone with you that falls through.",cond:"It's easier for them when other people are there"},
    upset:{s:"They're upset with me.",n:"Upset with me",in:1,painful:1,
          pred:"Cool with you, normal with others. It began at a point you could name."},
    mine:{s:"My expectations changed, not their behavior.",n:"My expectations",in:1,note:"“My expectations changed” is a description, not a fault.",
          pred:"Their behavior is close to what it was. You are the one reaching more.",cond:"I'm reaching out more than I used to"}
  },
  IDS:["lose","over","prio","avoid","upset","mine"],
  story:{kicker:"Your place in the story",
    all:function(n,thr){return n===1?"The explanation you rate"+thr+" is about the two of you.":"The "+NUM[n]+" explanations you rate"+thr+" are all about the two of you."},
    none:function(n,thr){return n===1?"The explanation you rate"+thr+" doesn't involve you.":"None of the explanations you rate"+thr+" involves you."},
    mixed:function(n,k,thr){return "Of the "+NUM[n]+" explanations you rate"+thr+", "+NUM[k]+(k===1?" is":" are")+" about the two of you."},
    qAll:"What tells you it is about the two of you?",qNone:"What tells you that?",qMixed:"What tells you which it is?",
    optsIn:[["only","It happens only with me"],["after","It started after something between us"],["told","They told me"],["none","Nothing specific. It's my reading."]],
    optsOut:[["all","It's the same with everyone"],["life","It started with something in their life"],["told","They told me"],["none","Nothing specific. It's my reading."]],
    replies:{only:"That would be real evidence. We'll come back to whether you know it.",all:"That would be real evidence. We'll come back to whether you know it.",
      after:"A date is something that can be checked.",life:"A date is something that can be checked.",none:"Then your place in this story is an assumption. It may still be right."},
    checks:{only:{q:"q2",ok:"others",say:"Earlier you said it happens only with you.",note:"You said it happens only with you, then didn't confirm it."},
            all:{q:"q2",ok:"all",say:"Earlier you said it's the same with everyone.",note:"You said it is the same with everyone, then didn't confirm it."}}},
  CHAIN:{real:"The change is in them, not in what I expect.",choice:"It's a choice they are making.",us:"It's about the two of us, not about their life.",
    feel:"What they do shows what they feel.",enough:"I know enough to tell these explanations apart.",mem:"I remember accurately how things used to be."},
  CHAIN_SHOWN:["real","choice","us","feel","enough"],
  NEEDS:{lose:["real","us","feel"],over:["real"],prio:["real","choice","us"],avoid:["real","choice"],upset:["real","us"],mine:[]},
  DENIES:{over:"us",mine:"real"},
  FALLBACK:{mine:"mem"},
  noNeeds:"It says the change is in what you expect.",
  carry:{options:[["count","The number of times"],["how","How they do it"],["me","That I'm always the one who reaches out"],["life","Something I know about their life"],["feel","A feeling"]],
    replies:{count:"How often it happens tells you it is a pattern. It doesn't tell you which pattern: the same count is compatible with every explanation here.",
      how:"That can separate them. A late excuse and a worn-out apology point different ways. It is usable evidence, if you can say which you saw.",
      me:"That fits losing interest. It also fits not being a priority, and someone with nothing left to give. It separates less than it feels like it does.",
      life:"That is direct evidence, if it is something you know and not something you have assumed."},
    checks:{me:{q:"q1",ok:"me",say:"Earlier you said you are always the one who reaches out. That was carrying your confidence.",note:"What you said was carrying your confidence didn't match a later answer."}}},
  QS:["q1","q2","q3","q4"],
  Q:{
    q1:{q:"After a lapse, who makes the next move?",col:"Next move",
        o:[["me","Always me"],["them","Sometimes them"],["dk","I don't know"]],
        fit:{me:{lose:1,prio:1,upset:1,mine:1},them:{lose:-1,mine:1}},
        fact:{me:"you make every next move",them:"they sometimes make the next move"},
        say:{me:"That fits losing interest. It also fits not being a priority, and someone with nothing left to give. On its own it separates very little.",
             them:"Losing interest fits that less well. It is closer to what you would see if their behavior had not changed much.",
             dk:"Unknown. This would have helped separate losing interest from the rest."},
        unk:"who makes the next move"},
    q2:{q:"Is it the same with other people in their life?",col:"With others",
        o:[["all","Yes, with everyone"],["others","No, other people still get their time"],["dk","I don't know"]],
        fit:{all:{over:1,lose:-1,prio:-1,avoid:-1,upset:-1},others:{over:-1,prio:1,lose:1,avoid:1,upset:1}},
        fact:{all:"it is the same with everyone in their life",others:"other people still get their time"},
        say:{all:"Then it is not specific to you. Overwhelmed fits. The explanations about the two of you fit less well.",
             others:"Then it is not the same across the board. Overwhelmed fits less well, though people under strain do keep some commitments and drop others.",
             dk:"Unknown. This is the fact that best separates overwhelmed from the explanations about the two of you."},
        unk:"whether it is the same with other people"},
    q3:{q:"Is it different when other people are around?",col:"In company",
        o:[["group","Yes, it's easier in a group"],["same","No, it's the same either way"],["dk","I don't know"]],
        fit:{group:{avoid:1,prio:1},same:{avoid:-1}},
        fact:{group:"it is easier when other people are there",same:"it is the same alone or in company"},
        say:{group:"That fits avoiding time alone with you. It doesn't rule out waning interest; low-cost contact is often what lasts longest.",
             same:"Then there is nothing particular about time alone. Avoidance fits less well.",
             dk:"Unknown. This is the fact that would point to avoidance."},
        unk:"whether it is different in company"},
    q4:{q:"Are you reaching out more than you used to?",col:"Your reach",
        o:[["yes","Yes"],["no","No"],["dk","I don't know"]],
        fit:{yes:{mine:1},no:{mine:-1}},
        fact:{yes:"you are reaching out more than you used to",no:"you are reaching out no more than you used to"},
        say:{yes:"Then your reach has grown. That can be a cause of the gap or a response to it. This answer doesn't say which.",
             no:"Then your side hasn't changed much. “My expectations changed” fits less well.",
             dk:"Unknown. Without a baseline it is hard to say who changed."},
        unk:"whether you are reaching out more than you used to"}
  },
  COND_MET:{lose:["q1","me"],over:["q2","all"],prio:["q2","others"],avoid:["q3","group"],mine:["q4","yes"]},
  wordsVsActs:function(S){return S.whatR==="Says one thing, does another"},
  oppose:{read:"lose",q:"Build the strongest case that this relationship matters to them as much as it ever did.",
    options:[["say","They keep saying they want to see me, and they don't have to."],["together","When we are together, nothing is different."],
             ["everyone","They've been like this with everyone lately."],["counted","They have shown up when it counted."]],
    clash:{v:"everyone",q:"q2",bad:"others",
      sayBad:"A few answers ago you said other people still get their time. Both can't be true, so the case can't stand on this.",
      sayDk:"A few answers ago you didn't know whether it was the same with other people. The case now rests on it."},
    defendPre:"“They're losing interest. Words are cheap. Look at what they do.”",
    defend:[["a","I've been counting the misses, not the times they came through."],["b","They keep saying it, and saying it costs them something too."]],
    built:"You could build a case that it still matters to them, from things you say are true."},
  forecast:{q:"The next time: who makes the move, and does it happen?",
    options:[["I make the move, and it happens","I do, and it happens"],["I make the move, and it falls through","I do, and it falls through"],["They make the move","They do"],["Nobody makes the move","Nobody does"]]},
  premise:"You came in saying something changed. Nothing here disputes that. The question was why.",
  heldPainful:"Held is not the same as welcome. It rests on your account; the rest is theirs to say."
};

/* ---------- why someone behaves the way they do ---------- */
DOORS.person={
  title:"Why someone behaves the way they do",
  who:{q:"Think of one person, and one thing they do. Who are they to you?",sub:"That they do it is not in question here. Why they do it is.",
    options:[["Reports to me","Someone who reports to me"],["Peer","A peer or colleague"],["My boss","Someone I report to"],["Friend or family","A friend or family member"],["Acquaintance","Someone I deal with but don't know well"]],
    foot:"This tests a read about why one person does one thing. It can't tell you whether the behavior is acceptable. If it is harming you, the reason matters less than getting support. "+HELP},
  what:{q:"What do they do?",
    options:[["Agrees, doesn't deliver","They agree, then don't follow through"],["Pushes back","They push back on almost everything"],["Goes around me","They go around me"],["Takes over","They take over, or take the credit"],["Avoids","They avoid a decision or a conversation"]]},
  count:{q:"How many times have you seen it yourself?",thin:"1–2 times",
    options:[["1–2 times","Once or twice"],["3–5 times","Three to five"],["5+ times","More than five"],["Mostly secondhand","I've mostly heard about it"]],
    replies:{"1–2 times":"Two is a thin sample. Keep that in mind when you rate your confidence.","Mostly secondhand":"Then most of what you have is someone else's account. Keep it separate from what you have seen."}},
  readQ:"And your read? Why do they do it?",
  M:{
    char:{s:"It's who they are.",n:"Character",in:1,painful:1,
          pred:"They do it with everyone, on every subject, and have for as long as you've known them.",cond:"They do it with everyone, and always have"},
    incent:{s:"They're responding to incentives.",n:"Incentives",in:0,
          pred:"It pays, or the alternative costs them. Other people in the same position do the same.",cond:"Other people in their position do the same"},
    info:{s:"They're working from different information than I am.",n:"Different information",in:0,
          pred:"It follows particular subjects. What they do makes sense given what they've been told."},
    disagree:{s:"They disagree, and aren't saying so.",n:"Unspoken disagreement",in:1,
          pred:"It happens on particular subjects. They say more to others than to you.",cond:"It only happens on particular subjects"},
    constraint:{s:"Something is constraining them that I can't see.",n:"A hidden constraint",in:0,
          pred:"It shows up across their work, not only with you, and it started at some point.",cond:"It started at a point I could name"},
    me:{s:"They're reacting to something I do.",n:"A reaction to me",in:0,note:"“A reaction to me” is a description, not a fault.",
          pred:"It happens with you, and not with others in your position.",cond:"They do it mainly with me"}
  },
  IDS:["char","incent","info","disagree","constraint","me"],
  story:{kicker:"Where you put the cause",
    all:function(n,thr){return n===1?"The explanation you rate"+thr+" puts the cause in them, not in their situation.":"The "+NUM[n]+" explanations you rate"+thr+" all put the cause in them, not in their situation."},
    none:function(n,thr){return n===1?"The explanation you rate"+thr+" puts the cause outside them.":"None of the explanations you rate"+thr+" puts the cause in them."},
    mixed:function(n,k,thr){return "Of the "+NUM[n]+" explanations you rate"+thr+", "+NUM[k]+(k===1?" puts":" put")+" the cause in them."},
    qAll:"What tells you it is them and not the situation?",qNone:"What tells you that?",qMixed:"What tells you which it is?",
    optsIn:[["every","They do it everywhere, with everyone"],["unusual","Other people in the same position don't"],["told","They've told me why"],["none","Nothing specific. It's my reading."]],
    optsOut:[["common","Other people in the same position do it too"],["changed","It started when something changed around them"],["told","They've told me why"],["none","Nothing specific. It's my reading."]],
    replies:{every:"That would be real evidence. We'll come back to whether you know it.",unusual:"That would be real evidence. We'll come back to whether you know it.",
      common:"That would be real evidence. We'll come back to whether you know it.",changed:"A date is something that can be checked.",
      none:"Then where you put the cause is an assumption. It may still be right."},
    checks:{every:{q:"p1",ok:"all",say:"Earlier you said they do it everywhere, with everyone.",note:"You said they do it with everyone, then didn't confirm it."},
            unusual:{q:"p2",ok:"no",say:"Earlier you said other people in the same position don't do it.",note:"You said others in their position don't do it, then didn't confirm it."},
            common:{q:"p2",ok:"yes",say:"Earlier you said other people in the same position do it too.",note:"You said others in their position do it too, then didn't confirm it."},
            changed:{q:"p3",ok:"started",say:"Earlier you said it started when something changed around them.",note:"You said it started when something changed, then didn't confirm it."}}},
  CHAIN:{pattern:"It's a pattern, not a few incidents.",choice:"They are choosing to do it.",any:"They would do it whatever the situation.",
    same:"They are working from the same facts I am.",aware:"They know how it lands.",enough:"I know enough to tell these explanations apart.",
    gap:"There is a specific fact one of us is missing.",unseen:"There is something bearing on them that I haven't seen."},
  CHAIN_SHOWN:["pattern","choice","any","same","aware","enough"],
  NEEDS:{char:["pattern","any"],incent:["pattern","choice"],info:[],disagree:["choice","same"],constraint:[],me:["pattern"]},
  DENIES:{info:"same",constraint:"choice",incent:"any",me:"any"},
  FALLBACK:{info:"gap",constraint:"unseen"},
  noNeeds:"It rests on something that isn't on this list.",
  carry:{options:[["count","How often it happens"],["how","How they do it"],["past","What I've seen of them before"],["told","What other people say about them"],["feel","A feeling"]],
    replies:{count:"Frequency shows it is a pattern. It doesn't show why: every explanation here is compatible with it happening often.",
      how:"Manner can separate these. Reluctance and indifference look different. It is usable evidence, if you can say which you saw.",
      past:"A track record is evidence of consistency. That fits character. It also fits a situation that hasn't changed.",
      told:"Then part of your confidence is other people's reads. They may be right. They are also watching the same person in the same situation you are."},
    checks:{}},
  QS:["p1","p2","p3","p4"],
  Q:{
    p1:{q:"Do they do it with everyone, or mainly with you?",col:"With whom",
        o:[["all","With everyone"],["me","Mainly with me"],["dk","I don't know"]],
        fit:{all:{char:1,constraint:1,me:-1},me:{me:1,disagree:1,char:-1,constraint:-1}},
        fact:{all:"they do it with everyone",me:"they do it mainly with you"},
        say:{all:"Then it is not about you in particular. “A reaction to me” fits less well. Character and a constraint both fit.",
             me:"Then something about the two of you is part of it. Character fits less well: character doesn't choose its audience.",
             dk:"Unknown. This is the fact that separates a reaction to you from everything else."},
        unk:"whether they do it with everyone"},
    p2:{q:"Do other people in their position do the same thing?",col:"Others like them",
        o:[["yes","Yes, it's common"],["no","No, it's unusual"],["dk","I don't know"]],
        fit:{yes:{incent:1,char:-1},no:{char:1,incent:-1}},
        fact:{yes:"other people in their position do the same",no:"other people in their position don't do it"},
        say:{yes:"Then the position explains a good deal of it. Incentives fit. Character fits less well, since it would have to be everyone's character.",
             no:"Then the position doesn't explain it. Incentives fit less well. Something particular to this person fits better.",
             dk:"Unknown. Without a comparison it is hard to tell a person from a position."},
        unk:"whether others in their position do it"},
    p3:{q:"Has it always been this way, or did it start at some point?",col:"Since when",
        o:[["always","Always, as long as I've known them"],["started","It started at a point I could name"],["dk","I don't know"]],
        fit:{always:{char:1,constraint:-1},started:{constraint:1,char:-1}},
        fact:{always:"it has always been this way",started:"it started at a point you could name"},
        say:{always:"That fits character. A passing constraint fits less well.",
             started:"Then something changed. A constraint fits. Character fits less well, since it rarely arrives on a date.",
             dk:"Unknown. This is the fact that separates who they are from what happened to them."},
        unk:"whether it has always been this way"},
    p4:{q:"Does it happen on particular subjects, or across the board?",col:"Which subjects",
        o:[["topics","On particular subjects"],["across","Across the board"],["dk","I don't know"]],
        fit:{topics:{disagree:1,info:1,char:-1},across:{disagree:-1,info:-1,char:1,constraint:1}},
        fact:{topics:"it happens on particular subjects",across:"it happens across the board"},
        say:{topics:"Then it tracks the subject, not the person. Unspoken disagreement and different information both fit.",
             across:"Then it isn't about any one subject. Disagreement and different information fit less well.",
             dk:"Unknown. This would have shown whether it follows the subject or the person."},
        unk:"whether it follows particular subjects"}
  },
  COND_MET:{char:["p3","always"],incent:["p2","yes"],disagree:["p4","topics"],constraint:["p3","started"],me:["p1","me"]},
  wordsVsActs:function(S){return S.whatR==="Agrees, doesn't deliver"},
  oppose:{read:"char",q:"Build the strongest case that a reasonable person in their position would do the same.",
    options:[["pays","The way their work is judged rewards it."],["facts","They've been told something different from what I've been told."],
             ["load","They're carrying more than I can see."],["mine","I've given them reason to."]],
    clash:{v:"pays",q:"p2",bad:"no",
      sayBad:"A few answers ago you said other people in their position don't do it. If the position rewarded it, they would. The case can't stand on this.",
      sayDk:"A few answers ago you didn't know whether others in their position do the same. The case now rests on it."},
    defendPre:"“It's who they are. Other people manage in the same situation.”",
    defend:[["a","I haven't checked whether other people do manage in it."],["b","I've been judging them on the days it happened, not the days it didn't."]],
    built:"You could build a case that the situation explains it, from things you say are true."},
  forecast:{q:"The next time the situation comes up, what do they do?",
    options:[["They do the same thing","The same thing"],["They do it again, but only with me","The same, but only with me"],["They do something different","Something different"],["The situation doesn't come up","It doesn't come up"]]},
  premise:"You came in with something they do. Nothing here disputes that it happens. The question was why.",
  heldPainful:"A read of character is the easiest kind to keep and the hardest to test. It rests on your account; the rest is theirs to say."
};

var D, M, IDS, CHAIN, QS, Q, COND_MET, S;
function useDoor(id){D=DOORS[id];M=D.M;IDS=D.IDS;CHAIN=D.CHAIN;QS=D.QS;Q=D.Q;COND_MET=D.COND_MET;doorLabel.textContent=D.title}
function fresh(){S={know:{},base:{},after:{},marked:[],notes:[]};recap.textContent="";restartBtn.hidden=true}
function start(){
  fresh();
  var h=(location.hash||"").replace("#","");
  if(DOORS[h]){useDoor(h);who()}else doors();
}
restartBtn.addEventListener("click",function(){if(location.hash)history.replaceState(null,"",location.pathname);fresh();doors()});

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function pct(v){return (Math.max(1,Math.min(5,v))-1)/4*100}
function setProg(p){prog.style.width=(p*100)+"%"}
function show(html){stage.classList.remove("in");stage.innerHTML=html;void stage.offsetWidth;stage.classList.add("in");window.scrollTo(0,0)}
function setRecap(){var a=[];if(S.whoR)a.push(S.whoR);if(S.whatR)a.push(S.whatR);if(S.countR)a.push(S.countR);recap.textContent=a.join("  ·  ")}
function fitOf(k,id){var a=S.know[k];if(!a||a==="dk")return null;return (Q[k].fit[a]||{})[id]||0}
function opts(pairs){return pairs.map(function(p){return {v:p[0],l:p[1]}})}
function order(){return (S.read?[S.read]:[]).concat(IDS.filter(function(id){return id!==S.read}))}

var keyHandler=null;
document.addEventListener("keydown",function(e){
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(keyHandler)keyHandler(e);
});

function head(o){
  return (o.kicker?'<div class="kicker">'+esc(o.kicker)+'</div>':'')+
         (o.pre?'<div class="pre">'+o.pre+'</div>':'')+
         '<h1>'+esc(o.q)+'</h1>'+(o.sub?'<p class="sub">'+esc(o.sub)+'</p>':'');
}
function contBtn(label){return '<button class="go" type="button">'+(label||"Continue")+'<span>↵</span></button>'}
function wireGo(next){
  var b=stage.querySelector(".go");
  b.addEventListener("click",function(){keyHandler=null;next()});
  keyHandler=function(e){if(e.key==="Enter"&&!b.disabled){e.preventDefault();b.click()}};
  return b;
}
function animateGauge(root){
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    root.querySelectorAll(".g-dot[data-to]").forEach(function(d){d.style.left=d.getAttribute("data-to")+"%"});
  })});
}
function addReply(html,next){
  var r=document.createElement("div");r.className="reply";r.innerHTML=html+contBtn();
  stage.appendChild(r);
  var b=r.querySelector(".go");b.addEventListener("click",function(){keyHandler=null;next()});
  keyHandler=function(e){if(e.key==="Enter"){e.preventDefault();b.click()}};
  r.scrollIntoView({block:"nearest",behavior:"smooth"});
}

/* single-choice screen */
function ask(o){
  if(o.p!=null)setProg(o.p);
  var h=head(o)+'<div class="opts">';
  o.options.forEach(function(op,i){
    h+='<button class="opt" type="button" data-i="'+i+'" data-k="'+LETTERS[i]+'" aria-pressed="false"><span class="k">'+LETTERS[i]+'</span><span class="t">'+esc(op.l)+'</span></button>';
  });
  h+='</div>'+(o.foot?'<p class="note">'+o.foot+'</p>':'');
  show(h);
  var box=stage.querySelector(".opts"), btns=[].slice.call(box.querySelectorAll(".opt"));
  function pick(b){
    if(box.classList.contains("done"))return;
    var op=o.options[+b.getAttribute("data-i")];
    b.setAttribute("aria-pressed","true");box.classList.add("done");
    btns.forEach(function(x){x.disabled=true});
    keyHandler=null;
    var rep=o.respond?o.respond(op.v):null;
    if(rep){addReply(rep,function(){o.next(op.v)})}
    else setTimeout(function(){o.next(op.v)},220);
  }
  btns.forEach(function(b){b.addEventListener("click",function(){pick(b)})});
  keyHandler=function(e){
    var key=e.key.toUpperCase();
    var b=btns.filter(function(x){return x.getAttribute("data-k")===key&&!x.disabled})[0];
    if(b){e.preventDefault();pick(b)}
  };
}

/* a screen of five-step scales; pre holds starting values, was shows what they were */
function rateScreen(o){
  setProg(o.p);
  var h=head(o)+'<div class="ends"><span>Impossible</span><span>Certain</span></div><div class="rate">';
  o.ids.forEach(function(id){
    h+='<div class="rrow" data-id="'+id+'"><div class="nm">'+esc(M[id].s)+'<span class="lv"></span></div><div class="scale" role="group" aria-label="'+esc(M[id].n)+'">';
    for(var i=1;i<=5;i++)h+='<button type="button" data-v="'+i+'" aria-pressed="false" aria-label="'+LEVELS[i]+'"></button>';
    h+='</div></div>';
  });
  h+='</div>'+contBtn();
  show(h);
  var go=stage.querySelector(".go"), got={};
  function label(row,id){
    var t=LEVELS[got[id]]||"";
    if(o.was&&got[id]&&o.was[id]!==got[id])t+=" · was "+LEVELS[o.was[id]];
    row.querySelector(".lv").textContent=t;
  }
  stage.querySelectorAll(".rrow").forEach(function(row){
    var id=row.getAttribute("data-id"), bs=[].slice.call(row.querySelectorAll(".scale button"));
    function set(v){got[id]=v;bs.forEach(function(x){x.setAttribute("aria-pressed",+x.getAttribute("data-v")===v?"true":"false")});label(row,id);
      go.disabled=Object.keys(got).length<o.ids.length;}
    bs.forEach(function(b){b.addEventListener("click",function(){set(+b.getAttribute("data-v"))})});
    if(o.pre&&o.pre[id])set(o.pre[id]);
  });
  go.disabled=Object.keys(got).length<o.ids.length;
  go.addEventListener("click",function(){keyHandler=null;o.next(got)});
  keyHandler=function(e){if(e.key==="Enter"&&!go.disabled){e.preventDefault();go.click()}};
}

/* ---------- screens ---------- */
function doors(){
  doorLabel.textContent="";
  ask({p:0,q:"What do you have a theory about?",sub:"Two directions are open so far.",
    options:[{v:"person",l:DOORS.person.title},{v:"rel",l:DOORS.rel.title}],
    next:function(v){useDoor(v);who()}});
}
function who(){
  ask({p:.03,kicker:D.title,q:D.who.q,sub:D.who.sub,options:opts(D.who.options),foot:D.who.foot,
    next:function(v){S.whoR=v;restartBtn.hidden=false;setRecap();what()}});
}
function what(){
  ask({p:.06,kicker:"Anchor",q:D.what.q,options:opts(D.what.options),
    next:function(v){S.whatR=v;setRecap();count()}});
}
function count(){
  ask({p:.1,kicker:"Anchor",q:D.count.q,options:opts(D.count.options),
    respond:function(v){return D.count.replies[v]?"<p>"+D.count.replies[v]+"</p>":null},
    next:function(v){S.countR=v;setRecap();read()}});
}
function read(){
  var ops=IDS.map(function(id){return {v:id,l:M[id].s}});
  ops.push({v:"other",l:"Something else, or more than one of these."});
  ops.push({v:"dk",l:"I don't know."});
  ask({p:.14,kicker:"Your read",q:D.readQ,options:ops,
    respond:function(v){
      if(v==="dk")return "<p>Fair. Then there is no read to test. We can still see what your answers separate.</p>";
      if(v==="other")return "<p>Then this list may not hold your explanation, and more than one can be true at once. We can still see what your answers separate.</p>";
      return null;},
    next:function(v){
      if(v==="dk"||v==="other"){S.read=null;rate();return}
      S.read=v;conf()}});
}
function conf(){
  ask({p:.18,kicker:"Your read",pre:"<strong>"+esc(M[S.read].s)+"</strong>",q:"How sure are you?",
    options:[{v:5,l:"Almost certainly"},{v:4,l:"Likely"},{v:3,l:"Plausible"},{v:2,l:"It's a guess"}],
    next:function(v){S.conf=v;S.confL=v===2?"A guess":LEVELS[v];S.base[S.read]=v;rate()}});
}
function rate(){
  var ids=IDS.filter(function(id){return id!==S.read});
  rateScreen({p:.23,kicker:"What else could explain this",q:S.read?"Rate the other "+NUM[ids.length]+".":"Rate all "+NUM[ids.length]+".",
    sub:"From almost impossible to almost certainly. More than one can be true.",ids:ids,
    next:function(got){ids.forEach(function(id){S.base[id]=got[id]});story()}});
}

function story(){
  var st=D.story;
  var hi=IDS.filter(function(id){return S.base[id]>=4}), thr=" Likely or higher";
  if(!hi.length){var mx=Math.max.apply(null,IDS.map(function(id){return S.base[id]}));hi=IDS.filter(function(id){return S.base[id]===mx});thr=" highest"}
  var n=hi.length, k=hi.filter(function(id){return M[id]["in"]}).length;
  var first=k===n?st.all(n,thr):k===0?st.none(n,thr):st.mixed(n,k,thr);
  var q=k===n?st.qAll:k===0?st.qNone:st.qMixed;
  ask({p:.29,kicker:st.kicker,pre:"<strong>"+first+"</strong>",q:q,options:opts(k>0?st.optsIn:st.optsOut),
    respond:function(v){
      if(v==="told")return D.wordsVsActs(S)?"<p>Then you have their account. Whether it matches what they do is the thing you came in with.</p>":"<p>Then you have their account of it.</p>";
      return "<p>"+st.replies[v]+"</p>";},
    next:function(v){S.storyEv=v;if(S.read)chain();else know(0)}});
}

function chain(){
  setProg(.35);
  var h=head({kicker:"Assumptions",pre:"<strong>"+esc(M[S.read].s)+"</strong>",q:"Which of these are you assuming?",sub:"Mark every one that applies."})+'<div class="opts">';
  D.CHAIN_SHOWN.forEach(function(k,i){h+='<button class="opt" type="button" data-c="'+k+'" data-k="'+LETTERS[i]+'" aria-pressed="false"><span class="k">'+LETTERS[i]+'</span><span class="t">'+esc(CHAIN[k])+'</span></button>'});
  h+='</div>'+contBtn();
  show(h);
  var btns=[].slice.call(stage.querySelectorAll(".opt")), go=stage.querySelector(".go");
  btns.forEach(function(b){b.addEventListener("click",function(){b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true")})});
  go.addEventListener("click",function(){
    keyHandler=null;
    S.marked=btns.filter(function(b){return b.getAttribute("aria-pressed")==="true"}).map(function(b){return b.getAttribute("data-c")});
    chainBack();
  });
  keyHandler=function(e){
    if(e.key==="Enter"){e.preventDefault();go.click();return}
    var b=btns.filter(function(x){return x.getAttribute("data-k")===e.key.toUpperCase()})[0];
    if(b){e.preventDefault();b.click()}
  };
}
function chainBack(){
  var need=D.NEEDS[S.read], has=function(k){return S.marked.indexOf(k)>-1};
  var hit=need.filter(has), miss=need.filter(function(k){return !has(k)});
  var bare=function(k){return esc(CHAIN[k].replace(/\.$/,""))};
  var pre;
  if(!need.length)pre="<strong>Your read needs none of these to be true.</strong> "+D.noNeeds;
  else if(!miss.length)pre="<strong>Your read needs "+NUM[need.length]+" of these to be true. You marked "+(need.length===1?"it":"all of them")+".</strong>";
  else pre="<strong>Your read needs "+NUM[need.length]+" of these to be true. You marked "+(hit.length?NUM[hit.length]:"none")+".</strong><br>Unmarked: "+miss.map(bare).join("; ")+".";
  var deny=D.DENIES[S.read];
  if(deny&&has(deny)){pre+="<br>You also marked “"+bare(deny)+".” Your read says the opposite.";S.notes.push("You marked an assumption your own read denies.")}
  if(!has("enough"))pre+="<br>You left “I know enough to tell these apart” unmarked. The rest of this session tests that.";
  var list=need.length?need:[D.FALLBACK[S.read]];
  if(list.length===1){S.work=list[0];
    show(head({kicker:"Assumptions",pre:pre,q:"One assumption carries the most weight."})+'<p class="sub">'+esc(CHAIN[S.work])+'</p>'+contBtn());setProg(.4);
    wireGo(findable);return;}
  ask({p:.4,kicker:"Assumptions",pre:pre,q:"Which one is doing the most work?",
    options:list.map(function(k){return {v:k,l:CHAIN[k]}}),
    next:function(v){S.work=v;findable()}});
}
function findable(){
  ask({p:.44,kicker:"Assumptions",pre:"<strong>"+esc(CHAIN[S.work])+"</strong>",q:"Could you find that out?",
    options:[{v:"ask",l:"By asking them one question"},{v:"watch",l:"By watching for a few weeks"},{v:"hard",l:"I could ask, but I wouldn't get a straight answer"},{v:"no",l:"It can't be known"}],
    respond:function(v){
      if(v==="no")return "<p>Then something unknowable is doing the most work. Your confidence should carry that.</p>";
      if(v==="hard")return "<p>Then asking is not a cheap test here. That is worth knowing in itself.</p>";
      return null;},
    next:function(v){S.findable=v;if(v==="no"||v==="hard"){S.asked="na";carry()}else asked()}});
}
function asked(){
  ask({p:.48,kicker:"Assumptions",q:"Have you?",
    options:[{v:"yes",l:"Yes"},{v:"no",l:"No"},{v:"half",l:"Not directly"}],
    respond:function(v){
      if(v==="yes")return D.wordsVsActs(S)?"<p>Then you have their account. Whether it matches what they do is the thing you came in with.</p>":"<p>Then you have their answer. Keep what they said separate from what you concluded.</p>";
      if(S.findable==="ask")return "<p>The assumption your read leans on most is one question away. It is still unasked. That is usually about the answer, not the question.</p>";
      return "<p>It would take a few weeks to see. Until then this part is a guess. Watching is slower than asking and easier to misread.</p>";},
    next:function(v){S.asked=v;carry()}});
}

function carry(){
  ask({p:.52,kicker:"Evidence",q:"What is carrying your confidence?",options:opts(D.carry.options),
    respond:function(v){return v==="feel"?FEEL:"<p>"+D.carry.replies[v]+"</p>"},
    next:function(v){S.carry=v;predict()}});
}

function predict(){
  var h='<dl class="preds">';
  IDS.forEach(function(id){h+='<div'+(id===S.read?' class="mine"':'')+'><dt>'+esc(M[id].n)+'</dt><dd>'+esc(M[id].pred)+'</dd></div>'});
  h+='</dl>';
  /* only offer conditions that would count against the read */
  var ops=IDS.filter(function(id){
    if(id===S.read||!COND_MET[id])return false;
    var c=COND_MET[id];return ((Q[c[0]].fit[c[1]]||{})[S.read]||0)<=0;
  }).map(function(id){return {v:id,l:M[id].cond}});
  ops.push({v:"none",l:"None of these would move me"});
  ask({p:.57,kicker:"What each explanation predicts",pre:"If each were true, this is roughly what you would expect to see. These are this tool's assumptions, not facts about this person."+h,
    q:"Which of these, if you saw it, would move you off your read?",options:ops,
    respond:function(v){return v==="none"?"<p>Noted. Then nothing on this list could test your read.</p>":null},
    next:function(v){S.cond=v;know(0)}});
}

function know(i){
  if(i>=QS.length){due();return}
  var key=QS[i], q=Q[key];
  ask({p:.62+i*.04,kicker:"Do you know that?",q:q.q,options:opts(q.o),
    respond:function(v){
      S.know[key]=v;
      var extra="";
      var bears=S.read&&Object.keys(q.fit).some(function(a){return q.fit[a][S.read]});
      if(v==="dk"&&bears&&S.conf>=4&&!S.dkSaid){S.dkSaid=1;extra+="<p class=\"small\">You rated your read "+S.confL+" without it.</p>"}
      [D.story.checks[S.storyEv],D.carry.checks[S.carry]].forEach(function(c){
        if(c&&c.q===key&&v!==c.ok){extra+="<p class=\"small\">"+c.say+"</p>";S.notes.push(c.note)}
      });
      return "<p>"+q.say[v]+"</p>"+extra;},
    next:function(){know(i+1)}});
}

function condState(){
  if(!S.cond||S.cond==="none")return "none";
  var c=COND_MET[S.cond], a=S.know[c[0]];
  return a===c[1]?"met":(a==="dk"?"unknown":"unmet");
}
function due(){
  if(!S.read){fitScreen();return}
  if(condState()!=="met"){oppose();return}
  ask({p:.8,kicker:"Your condition",pre:"You said this would move you off your read:<br><strong>"+esc(M[S.cond].cond)+".</strong><br>By your own account, it's true.",
    q:"Does it?",options:[{v:"yes",l:"Yes"},{v:"no",l:"No"},{v:"less",l:"It counts for less than I said"}],
    next:function(v){S.due=v;oppose()}});
}

/* the opposing case: built only for the read it actually opposes */
function oppose(){
  if(S.read===D.oppose.read){foundation();return}
  var ops=IDS.filter(function(id){return id!==S.read}).map(function(id){return {v:id,l:M[id].s}});
  ops.push({v:"none",l:"None of them."});
  ask({p:.83,kicker:"The other side",q:"Which rival is hardest to dismiss?",options:ops,
    next:function(v){S.hard=v;fitScreen()}});
}
function foundation(){
  var o=D.oppose, c=o.clash;
  ask({p:.83,kicker:"The other side",q:o.q,sub:"Choose its foundation. Only pick what is true.",
    options:opts(o.options).concat([{v:"none",l:"I can't build it from these."}]),
    respond:function(v){
      if(v==="none")return "<p>Then none of these is available to you. That counts. It is an absence of counter-evidence, not proof.</p>";
      if(v===c.v&&S.know[c.q]===c.bad)return "<p>"+c.sayBad+"</p>";
      if(v===c.v&&S.know[c.q]==="dk")return "<p>"+c.sayDk+"</p>";
      return null;},
    next:function(v){
      S.found=v;
      if(v===c.v&&S.know[c.q]===c.bad){S.found="conflict";S.notes.push("You built the opposing case on something you had already said was not true.");fitScreen();return}
      if(v===c.v&&S.know[c.q]==="dk")S.notes.push("The opposing case you built rests on a fact you said you didn't know.");
      /* when the complaint is that words and actions don't match, don't ask them to argue the words */
      if(v==="none"||(D===DOORS.rel&&D.wordsVsActs(S)))fitScreen();else defend()}});
}
function defend(){
  var o=D.oppose;
  ask({p:.86,kicker:"The other side",pre:"Your original read answers it:<br><strong>"+esc(o.defendPre)+"</strong>",
    q:"Does any response hold?",options:opts(o.defend).concat([{v:"none",l:"No. My read stands."}]),
    next:function(v){S.defend=v;fitScreen()}});
}

function fitScreen(){
  setProg(.9);
  var h='<div class="kicker">What your answers fit</div><h1>Here is how the four things you reported sit against each explanation.</h1>'+
    '<div class="fitwrap"><table class="fit"><thead><tr><th scope="col"></th>'+QS.map(function(k){return '<th scope="col">'+Q[k].col+'</th>'}).join("")+'</tr></thead><tbody>';
  order().forEach(function(id){
    h+='<tr'+(id===S.read?' class="read"':'')+'><th scope="row">'+esc(M[id].n)+'</th>';
    QS.forEach(function(k){var f=fitOf(k,id);
      h+=f===null?'<td aria-label="unknown">?</td>':f>0?'<td class="f" aria-label="fits">●</td>':f<0?'<td class="l" aria-label="fits less well">○</td>':'<td aria-label="does not separate">·</td>'});
    h+='</tr>';
  });
  h+='</tbody></table></div><div class="legend"><span>● fits</span><span>○ fits less well</span><span>· doesn\'t separate</span><span>? you don\'t know</span></div>'+
    '<p class="note">These marks are this tool\'s assumptions about what each explanation predicts, applied to what you reported from memory. They are not facts about this person, and more than one explanation can be true.</p>'+contBtn();
  show(h);wireGo(rerate);
}
function rerate(){
  var ids=order();
  rateScreen({p:.93,kicker:"Second rating",q:"Having seen that, rate all "+NUM[ids.length]+" again.",sub:"Your first ratings are filled in. Change only what you would now change.",
    ids:ids,pre:S.base,was:S.base,next:function(got){S.after=got;findings()}});
}

function gauge(){
  var h='<div class="gauge" aria-label="Your first and second ratings">';
  order().forEach(function(id){
    var moved=S.after[id]!==S.base[id];
    h+='<div class="g-row'+(id===S.read?' read':'')+'"><div class="g-name">'+(id===S.read?'<small>Your read</small>':'')+'<b>'+esc(M[id].n)+'</b></div><div class="g-track">';
    for(var i=0;i<5;i++)h+='<s style="left:'+(i*25)+'%"></s>';
    h+='<i class="g-ghost" style="left:'+pct(S.base[id])+'%"></i><i class="g-dot" style="left:'+pct(S.base[id])+'%" data-to="'+pct(S.after[id])+'"></i></div><div class="g-val'+(moved?' moved':'')+'">'+LEVELS[S.after[id]]+'</div></div>';
  });
  return h+'</div>';
}
function names(ids){var a=ids.map(function(id){return "“"+M[id].n+"”"});return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1]}

function findings(){
  setProg(.96);
  var a=S.after, b=S.base, r=S.read;
  var mx=Math.max.apply(null,IDS.map(function(id){return a[id]})), tops=IDS.filter(function(id){return a[id]===mx});
  var bmx=Math.max.apply(null,IDS.map(function(id){return b[id]}));
  var dks=QS.filter(function(k){return S.know[k]==="dk"});
  var kind;
  if(!r)kind="noread";
  else if(dks.length>=3)kind="open";
  else if(tops.length===1&&tops[0]===r)kind=a[r]<b[r]?"lower":"held";
  else if(tops.indexOf(r)>-1)kind="level";
  else kind=b[r]<bmx?"inverted":"moved";
  S.kind=kind;
  var h1,lines=[];
  /* what the audit turned up that a held read should carry */
  var weak=[];
  if(S.countR===D.count.thin)weak.push("you have seen it once or twice");
  if(S.countR==="Mostly secondhand")weak.push("most of it is secondhand");
  if(S.carry==="feel")weak.push("what carries it is a feeling you haven't itemized");
  if(S.asked==="no"||S.asked==="half")weak.push("the assumption it leans on is unchecked");
  if(S.findable==="no")weak.push("the assumption it leans on can't be known");
  if(S.cond==="none")weak.push("you named nothing that would move you");
  if(S.due==="yes"&&r&&a[r]>=b[r])weak.push("you said your condition was met and moves you, and your rating didn't move");
  if(dks.length)weak.push(NUM[dks.length]+" of the four facts "+(dks.length===1?"is":"are")+" unknown");

  if(kind==="held"){
    h1="Your read held.";
    if(weak.length)lines.push("It is still your leading explanation. It has been tested less than your rating suggests: "+weak.join("; ")+".");
    else lines.push("By your account it is the best-supported explanation here. That is your account, not theirs.");
  }else if(kind==="lower"){
    h1="Your read still leads, lower than you started.";
    if(weak.length)lines.push("Also worth carrying: "+weak.join("; ")+".");
  }else if(kind==="moved"){
    h1="You now rate another explanation above your read.";
    lines.push("Both ratings were yours. What came between them was seeing what your answers fit.");
  }else if(kind==="inverted"){
    h1="You bet on one explanation and rated another higher from the start.";
    lines.push("That was true before any question was asked. The bet and the ratings were never the same view.");
  }else if(kind==="level"){
    h1="Your read is level with "+names(tops.filter(function(id){return id!==r}))+".";
    lines.push("More than one of these can be true at once.");
  }else if(kind==="open"){
    h1="You don't have enough to know yet.";
    lines.push("You answered “I don't know” to "+(dks.length===4?"all four":"three of the four")+" facts that separate these explanations.");
  }else{
    h1="You came in without a read.";
    lines.push(tops.length===1?"After seeing what your answers fit, you rate "+names(tops)+" highest.":"After seeing what your answers fit, "+names(tops)+" are level at the top.");
  }
  if(r)lines.push(D.premise);
  if((kind==="held"||kind==="lower")&&M[r].painful)lines.push(D.heldPainful);
  tops.forEach(function(id){if(M[id].note)lines.push(M[id].note)});
  if(S.hard&&S.hard!=="none")lines.push("Hardest rival to dismiss: “"+M[S.hard].n+".” You first rated it "+LEVELS[b[S.hard]]+(a[S.hard]!==b[S.hard]?", then "+LEVELS[a[S.hard]]:"")+".");
  if(S.defend&&S.defend!=="none")lines.push(D.oppose.built);
  S.notes.forEach(function(n){lines.push(n)});
  if(condState()==="unknown")lines.push("You named what would move you. You don't know whether it is true.");
  if(S.due==="no"||S.due==="less")lines.push("Your condition was met and you "+(S.due==="no"?"did not move":"discounted it")+". That is allowed. It may mean the condition wasn't the real one.");

  var lead=tops[0];
  var fits=QS.filter(function(k){return fitOf(k,lead)>0}).map(function(k){return Q[k].fact[S.know[k]]});
  var changed=IDS.filter(function(id){return a[id]!==b[id]}).map(function(id){return M[id].n+": "+LEVELS[b[id]]+" to "+LEVELS[a[id]]});
  var rows="";
  if(r)rows+='<div><dt>At the start</dt><dd>'+esc(M[r].s)+'<em>'+S.confL+'</em></dd></div>';
  rows+='<div><dt>Now leading</dt><dd>'+tops.map(function(id){return esc(M[id].n)}).join(", ")+'<em>'+LEVELS[mx]+'</em></dd></div>';
  rows+='<div><dt>What you changed</dt><dd>'+(changed.length?esc(changed.join(". "))+".":"Nothing. You rated every one as before.")+'</dd></div>';
  rows+='<div><dt>What fits it, by your account</dt><dd>'+(fits.length?esc(cap(fits.join("; ")))+".":"Nothing you reported separates it from the others.")+'</dd></div>';
  if(r){
    var assume=esc(CHAIN[S.work]);
    if(S.asked==="no"||S.asked==="half")assume+="<em>"+(S.findable==="ask"?"One question away, unasked":"Unobserved")+"</em>";
    else if(S.findable==="hard")assume+="<em>Asking wouldn't settle it</em>";
    else if(S.findable==="no")assume+="<em>Unknowable</em>";
    rows+='<div><dt>Assumption carrying it</dt><dd>'+assume+'</dd></div>';
  }
  rows+='<div><dt>Not yet known</dt><dd>'+(dks.length?esc(cap(dks.map(function(k){return Q[k].unk}).join("; ")))+".":"Nothing on this list. You gave an answer to every one.")+'</dd></div>';

  show('<div class="kicker">What the session found</div><h1>'+esc(h1)+'</h1>'+
    lines.map(function(l){return '<p class="sub">'+esc(l)+'</p>'}).join("")+
    '<dl class="card">'+rows+'</dl>'+gauge()+
    '<p class="note">This is what your answers support. It is not what they think.</p>'+contBtn());
  animateGauge(stage);
  wireGo(forecast);
}

function forecast(){
  ask({p:.98,kicker:"Forecast · optional",pre:"The explanations don't all predict the same thing.",q:D.forecast.q,
    options:opts(D.forecast.options).concat([{v:"",l:"Skip this"}]),
    next:function(v){S.forecast=v;view()}});
}
function view(){
  ask({p:.99,kicker:"One last question",q:"Did anything here change your view?",
    options:[{v:"no",l:"No"},{v:"slight",l:"Slightly"},{v:"sig",l:"Significantly"},{v:"wrong",l:"I was wrong"},{v:"expl",l:"My conclusion stayed the same, but my explanation changed"}],
    next:function(v){S.view=v;end()}});
}
function end(){
  setProg(1);
  var dks=QS.filter(function(k){return S.know[k]==="dk"});
  var h1,sub="";
  if(S.findable==="ask"&&(S.asked==="no"||S.asked==="half")){h1="Still open: one question, unasked.";sub="It is cheaper than any forecast.";}
  else if(dks.length){h1="Still open: "+Q[dks[0]].unk+".";}
  else h1="Nothing on this list is still open.";
  var changed=IDS.some(function(id){return S.after[id]!==S.base[id]});
  var mismatch="";
  if(S.view==="no"&&changed)mismatch='<p class="sub">You say nothing changed. Your ratings did. Worth knowing which one you would act on.</p>';
  if((S.view==="sig"||S.view==="wrong")&&!changed)mismatch='<p class="sub">You say your view changed. Your ratings didn\'t. Worth knowing which one you would act on.</p>';
  show('<div class="kicker">Where this leaves it</div><h1>'+esc(h1)+'</h1>'+(sub?'<p class="sub">'+sub+'</p>':'')+mismatch+
    (S.forecast?'<p class="sub">Sealed: '+esc(S.forecast.toLowerCase())+'. In the full product this comes back once, when it happens, and asks what you saw.</p>':'')+
    '<button class="go" type="button">Start again<span>↵</span></button>');
  wireGo(function(){fresh();doors()});
}

start();
})();
