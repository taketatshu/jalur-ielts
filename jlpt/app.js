(function(){"use strict";
var D=window.NIHONGO,LS="jalur-nihongo-v1",PLANW=12;

/* ---------- util ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function pad(n){return (n<10?"0":"")+n}
function ymd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return ymd(new Date())}
function parse(k){var p=k.split("-");return new Date(+p[0],p[1]-1,+p[2])}
function addDays(k,n){var d=parse(k);d.setDate(d.getDate()+n);return ymd(d)}
function diff(a,b){return Math.round((parse(b)-parse(a))/864e5)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function $(id){return document.getElementById(id)}
var HARI=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
var BULAN=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function tgl(k){var d=parse(k);return HARI[d.getDay()]+", "+d.getDate()+" "+BULAN[d.getMonth()]}

/* ---------- state ---------- */
function fresh(){return {v:1,start:today(),cards:{},daily:{},err:[],kana:{},qr:{},ks:{},furi:true,newPer:10,theme:"auto"}}
var S;try{S=JSON.parse(localStorage.getItem(LS)||"null")}catch(e){S=null}
if(!S||S.v!==1)S=fresh();
(function(){var f=fresh();for(var k in f)if(S[k]===undefined)S[k]=f[k]})();
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
function day(k){k=k||today();return S.daily[k]||(S.daily[k]={rev:0,quiz:0,kana:0,newc:0,done:0})}
function active(k){var d=S.daily[k];return !!(d&&(d.rev||d.quiz||d.kana||d.done))}
function streak(){var t=today(),n=0,k=active(t)?t:addDays(t,-1);while(active(k)){n++;k=addDays(k,-1)}return n}
function week(){return Math.max(1,Math.min(PLANW,Math.floor(diff(S.start,today())/7)+1))}
var state={tab:"hari",kanaS:"h",kanaM:"tabel",kanaG:{dasar:1,daku:0,yoon:0},kq:null,vm:"kartu",vcat:"Semua",vq:"",fc:null,kj:-1,kf:"semua",gopen:-1,qs:null};

/* ---------- kana ---------- */
var ROWS=[["あいうえお","a i u e o","dasar"],["かきくけこ","ka ki ku ke ko","dasar"],["さしすせそ","sa shi su se so","dasar"],["たちつてと","ta chi tsu te to","dasar"],["なにぬねの","na ni nu ne no","dasar"],["はひふへほ","ha hi fu he ho","dasar"],["まみむめも","ma mi mu me mo","dasar"],["や・ゆ・よ","ya - yu - yo","dasar"],["らりるれろ","ra ri ru re ro","dasar"],["わ・・・を","wa - - - wo","dasar"],["ん・・・・","n - - - -","dasar"],
 ["がぎぐげご","ga gi gu ge go","daku"],["ざじずぜぞ","za ji zu ze zo","daku"],["だぢづでど","da ji zu de do","daku"],["ばびぶべぼ","ba bi bu be bo","daku"],["ぱぴぷぺぽ","pa pi pu pe po","daku"]];
var YB=[["き","ky"],["し","sh"],["ち","ch"],["に","ny"],["ひ","hy"],["み","my"],["り","ry"],["ぎ","gy"],["じ","j"],["び","by"],["ぴ","py"]];
function toKata(s){return s.replace(/[ぁ-ゖ]/g,function(c){return String.fromCharCode(c.charCodeAt(0)+96)})}
function toHira(s){return s.replace(/[ァ-ヶ]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-96)})}
var KANA=[],RM={};
ROWS.forEach(function(r){var ch=r[0].split(""),rm=r[1].split(" ");ch.forEach(function(c,i){if(c!=="・")KANA.push({h:c,r:rm[i],g:r[2]})})});
YB.forEach(function(b){["ゃ","ゅ","ょ"].forEach(function(s,i){KANA.push({h:b[0]+s,r:b[1]+["a","u","o"][i],g:"yoon"})})});
KANA.forEach(function(k){RM[k.h]=k.r});RM["を"]="o";RM["ゔ"]="vu";
var SMALLV={"ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o"},PUNCT={"。":".","、":",","？":"?","！":"!","＿":"_","「":"\"","」":"\"","・":" "};
function romaji(kana){
  var s=toHira(kana),out="",dbl=false;
  for(var i=0;i<s.length;i++){
    var c=s[i],n=s[i+1],r;
    if(c==="っ"){dbl=true;continue}
    if(c==="ー"){var m=out.match(/[aeiou](?=[^aeiou]*$)/);out+=m?m[0]:"";continue}
    if(n&&"ゃゅょ".indexOf(n)>=0&&RM[c+n]){r=RM[c+n];i++}
    else if(n&&SMALLV[n]&&RM[c]){r=(c==="う"?"w":RM[c].replace(/[aeiou]$/,""))+SMALLV[n];i++}
    else r=RM[c]!=null?RM[c]:(PUNCT[c]!=null?PUNCT[c]:c);
    if(dbl&&/^[bcdfghjkmprstwz]/.test(r))r=(r.indexOf("ch")===0?"t":r[0])+r;
    dbl=false;out+=r;
  }
  return out;
}

/* ---------- teks Jepang bermarkup ---------- */
var KJ=/([㐀-鿿々〆]+)\[([^\]]+)\]/g;
function tokens(m){return String(m).split(" ").filter(function(t){return t!==""})}
function ruby(m,furi){if(furi===undefined)furi=S.furi;
  return tokens(m).map(function(t,i){
    if(/^[AB]:$/.test(t))return (i?'<br>':'')+'<b class="who">'+t+'</b> ';
    var h=esc(t.replace(/_/g,"")).replace(KJ,furi?'<ruby>$1<rt>$2</rt></ruby>':'$1');
    return h.replace(/＿＿/g,'<span class="blank" aria-label="titik kosong"></span>');
  }).join("")}
function plain(m){return tokens(m).filter(function(t){return !/^[AB]:$/.test(t)}).join("").replace(/_/g,"").replace(KJ,"$1")}
function reading(m){return tokens(m).join("").replace(/_/g,"").replace(KJ,"$2")}
function roma(m){
  return tokens(m).map(function(t){
    if(/^[AB]:$/.test(t))return t;
    if(t==="は"||t==="_は")return "wa";
    if(t==="へ"||t==="_へ")return "e";
    t=t.replace(/_は/g,"\u0001").replace(/_へ/g,"\u0002").replace(KJ,"$2");
    return romaji(t).replace(/\u0001/g,"wa").replace(/\u0002/g,"e");
  }).join(" ").replace(/\s+([.,?!])/g,"$1").replace(/_+/g,"___").replace(/\s+/g," ").trim()}

/* ---------- suara ---------- */
var VOICE=null;
function pickVoice(){if(!("speechSynthesis" in window))return;var v=speechSynthesis.getVoices().filter(function(x){return /^ja([-_]|$)/i.test(x.lang)});
  VOICE=v.filter(function(x){return /Nanami|Online|Natural|Google/i.test(x.name)})[0]||v[0]||null}
if("speechSynthesis" in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function say(t){if(!("speechSynthesis" in window)||!t)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";if(VOICE)u.voice=VOICE;u.rate=.9;speechSynthesis.speak(u)}
var ICO={
 spk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
 ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 no:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 hari:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></svg>',
 kana:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M12 3.5v17M3.5 12h17"/></svg>',
 vocab:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="13" height="15" rx="2"/><path d="M8 3h11a1 1 0 0 1 1 1v13"/></svg>',
 kanji:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M12 3v18M7 11h10M6 16h12"/></svg>',
 gram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H4zM20 5h-3a3 3 0 0 0-3 3"/></svg>',
 soal:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
 err:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17v.5"/></svg>',
 set:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>'
};
function spk(t,lbl){return '<button class="spk" type="button" data-say="'+esc(t)+'" aria-label="Dengarkan'+(lbl?" "+esc(lbl):"")+'">'+ICO.spk+'</button>'}

/* ---------- kosakata & SRS ---------- */
var V=D.vocab.map(function(v,i){return {i:i,w:v[0],m:v[1],c:v[2],ex:v[3],et:v[4]}});
var CATS=["Semua"];V.forEach(function(v){if(CATS.indexOf(v.c)<0)CATS.push(v.c)});
var INT=[0,1,2,4,8,16,32];
function card(i){return S.cards["v"+i]}
function dueList(){var t=today();return V.filter(function(v){var c=card(v.i);return c&&c.due<=t}).map(function(v){return v.i})}
function newList(n){var a=[];for(var i=0;i<V.length&&a.length<n;i++)if(!card(i))a.push(i);return a}
function newLeft(){return Math.max(0,S.newPer-day().newc)}
function mastered(){var n=0;for(var k in S.cards)if(S.cards[k].b>=4)n++;return n}
function vStatus(i){var c=card(i);return !c?"baru":c.b>=4?"dikuasai":"belajar"}
function fcStart(extra){var q=dueList().concat(newList(extra?10:newLeft()));state.fc={q:shuffle(q),i:0,flip:false,done:0,extra:!!extra}}
function fcGrade(g){var f=state.fc,i=f.q[f.i],k="v"+i,c=S.cards[k],d=day();
  if(!c){c=S.cards[k]={b:0,due:today()};d.newc++}
  if(g===0){c.b=0;c.due=today();if(f.q.indexOf(i,f.i+1)<0)f.q.push(i)}
  else{c.b=Math.min(6,c.b+(g===2?2:1));c.due=addDays(today(),INT[c.b])}
  d.rev++;f.done++;f.i++;f.flip=false;save()}

/* ---------- kanji ---------- */
var K=D.kanji.map(function(k,i){return {i:i,k:k[0],m:k[1],on:k[2],kun:k[3],ex:k[4]}});
function weekKanji(){var w=week(),s=w<3?0:(w-3)*10;s=Math.min(s,K.length-10);return K.slice(s,s+10)}
function weekPoints(){var w=week(),s=w<3?0:(w-3)*3;s=Math.min(s,D.grammar.length-3);return [s,s+1,s+2]}

/* ---------- pembuat soal ---------- */
function others(arr,n,ok){return shuffle(arr.filter(ok)).slice(0,n)}
function uniq(fn){var seen={};return function(x){var k=fn(x);if(seen[k])return false;seen[k]=1;return true}}
function mkItem(key){
  var p=key.split(":"),t=p[0],it;
  if(t==="vm"){var v=V[+p[1]],u=uniq(function(x){return x.m});u(v);
    var ds=others(V.filter(function(x){return x.c===v.c}),3,u);if(ds.length<3)ds=ds.concat(others(V,3-ds.length,u));
    it={key:key,t:t,ref:v,lead:"Apa arti kata ini?",prompt:'<div class="qjp">'+ruby(v.w)+'</div>',say:reading(v.w),
      opts:shuffle([v].concat(ds)).map(function(x){return {h:esc(x.m),ok:x===v,why:x===v?"":"\""+esc(x.m)+"\" adalah arti "+ruby(x.w)+" ("+esc(roma(x.w))+")."}})}}
  else if(t==="vj"){var v2=V[+p[1]],u2=uniq(function(x){return plain(x.w)});u2(v2);
    var d2=others(V.filter(function(x){return x.c===v2.c}),3,u2);if(d2.length<3)d2=d2.concat(others(V,3-d2.length,u2));
    it={key:key,t:t,ref:v2,lead:"Mana kata Jepang untuk arti ini?",prompt:'<div class="qid">'+esc(v2.m)+'</div>',
      opts:shuffle([v2].concat(d2)).map(function(x){return {h:'<span class="jp">'+ruby(x.w)+'</span>',ok:x===v2,why:x===v2?"":ruby(x.w)+" ("+esc(roma(x.w))+") artinya \""+esc(x.m)+"\"."}})}}
  else if(t==="km"){var k=K[+p[1]],u3=uniq(function(x){return x.m});u3(k);var d3=others(K,3,u3);
    it={key:key,t:t,ref:k,lead:"Apa arti kanji ini?",prompt:'<div class="qkanji">'+esc(k.k)+'</div>',
      opts:shuffle([k].concat(d3)).map(function(x){return {h:esc(x.m),ok:x===k,why:x===k?"":"\""+esc(x.m)+"\" adalah arti kanji <span class=\"jp\">"+esc(x.k)+"</span>."}})}}
  else if(t==="kr"){var k2=K[+p[1]],ex=k2.ex[+p[2]],rd=reading(ex[0]),pool=[];
    K.forEach(function(x){x.ex.forEach(function(e){pool.push({k:x,e:e,r:reading(e[0])})})});
    var u4=uniq(function(x){return x.r});u4({r:rd});
    var near=pool.filter(function(x){return x.e[0].indexOf(k2.k)>=0}),d4=others(near,3,u4);if(d4.length<3)d4=d4.concat(others(pool,3-d4.length,u4));
    var me={k:k2,e:ex,r:rd};
    it={key:key,t:t,ref:k2,ex:ex,lead:"Bagaimana cara membaca kata ini?",prompt:'<div class="qjp">'+esc(plain(ex[0]))+'</div>',say:rd,
      opts:shuffle([me].concat(d4)).map(function(x){return {h:'<span class="jp">'+esc(x.r)+'</span>',ok:x===me,why:x===me?"":"<span class=\"jp\">"+esc(x.r)+"</span> adalah bacaan "+ruby(x.e[0])+" ("+esc(x.e[1])+")."}})}}
  else if(t==="g"){var g=D.grammar[+p[1]],q=D.grammar[+p[1]].q[+p[2]];
    it={key:key,t:t,ref:g,gi:+p[1],q:q,lead:q.h?esc(q.h):"Pilih jawaban yang paling tepat.",prompt:'<div class="qsent">'+ruby(q.q)+'</div>',
      opts:q.o.map(function(o,i){return {h:'<span class="jp">'+ruby(o)+'</span>',ok:i===q.a,why:q.w[i],raw:o}})}}
  return it;
}
function poolKeys(mode,arg){
  var a=[];
  if(mode==="vm"||mode==="vj")V.forEach(function(v){a.push(mode+":"+v.i)});
  else if(mode==="km")K.forEach(function(k){a.push("km:"+k.i)});
  else if(mode==="kr")K.forEach(function(k){k.ex.forEach(function(e,j){a.push("kr:"+k.i+":"+j)})});
  else if(mode==="kweek")weekKanji().forEach(function(k){a.push("km:"+k.i);a.push("kr:"+k.i+":0")});
  else if(mode==="g")D.grammar.forEach(function(g,i){g.q.forEach(function(q,j){a.push("g:"+i+":"+j)})});
  else if(mode==="gweek")weekPoints().forEach(function(i){D.grammar[i].q.forEach(function(q,j){a.push("g:"+i+":"+j)})});
  else if(mode==="gp")D.grammar[arg].q.forEach(function(q,j){a.push("g:"+arg+":"+j)});
  else if(mode==="err"){var seen={};S.err.slice().reverse().forEach(function(e){if(!seen[e.key]){seen[e.key]=1;a.push(e.key)}})}
  return a;
}
function choose(keys,n){ /* utamakan yang belum pernah benar */
  var fresh=[],weak=[],rest=[];
  keys.forEach(function(k){var r=S.qr[k];if(!r)fresh.push(k);else if(r.ok<r.n||r.ok<2)weak.push(k);else rest.push(k)});
  return shuffle(weak).concat(shuffle(fresh),shuffle(rest)).slice(0,n);
}
var MODES={vm:"Kosakata: arti",vj:"Kosakata: tulisan Jepang",km:"Kanji: arti",kr:"Kanji: cara baca",g:"Tata bahasa",mix:"Campuran",gweek:"Tata bahasa minggu ini",kweek:"Kanji minggu ini",gp:"Latihan tata bahasa",err:"Ulang kesalahan"};
function startQuiz(mode,arg){
  var keys;
  if(mode==="mix")keys=shuffle(choose(poolKeys("vm"),3).concat(choose(poolKeys("km"),2),choose(poolKeys("kr"),2),choose(poolKeys("g"),3)));
  else if(mode==="err"||mode==="gp")keys=poolKeys(mode,arg).slice(0,mode==="err"?20:10);
  else keys=choose(poolKeys(mode,arg),10);
  if(!keys.length)return;
  state.qs={mode:mode,arg:arg,items:keys.map(mkItem),i:0,picked:null,ok:0,res:[]};state.tab="soal";
}
function answer(i){
  var s=state.qs;if(!s||s.picked!==null)return;var it=s.items[s.i],ok=it.opts[i].ok;s.picked=i;
  var r=S.qr[it.key]||(S.qr[it.key]={n:0,ok:0});r.n++;if(ok){r.ok++;s.ok++}
  s.res.push({key:it.key,ok:ok});day().quiz++;
  if(!ok){S.err.push({d:today(),key:it.key});if(S.err.length>300)S.err.splice(0,S.err.length-300)}
  else if(s.mode==="err")S.err=S.err.filter(function(e){return e.key!==it.key});
  save();
}

/* ---------- rencana harian ---------- */
function task(){
  var w=week(),dw=new Date().getDay(),wp=weekPoints().map(function(i){return D.grammar[i].t}).join(", ");
  if(w===1)return {t:"Hiragana",d:"Pelajari tabel hiragana baris demi baris sambil mendengarkan bunyinya, lalu kerjakan kuis 20 huruf. Ulangi sampai hampir semua huruf hijau.",cta:"Mulai kuis hiragana",act:"kana:h",chk:"kana"};
  if(w===2)return {t:"Katakana",d:"Katakana dipakai untuk kata serapan seperti コーヒー (kopi). Pelajari tabelnya, lalu kerjakan kuis 20 huruf.",cta:"Mulai kuis katakana",act:"kana:k",chk:"kana"};
  switch(dw){
    case 1:return {t:"Tata bahasa baru",d:"Pelajari tiga pola minggu ini: "+wp+". Baca contoh kalimatnya keras-keras.",cta:"Buka tata bahasa",act:"gram:week",chk:"quiz"};
    case 2:return {t:"Kanji minggu ini",d:"Kenali sepuluh kanji minggu ini: arti, cara baca, dan contoh katanya. Lalu uji dengan kuis.",cta:"Buka kanji minggu ini",act:"kanji:week",chk:"quiz"};
    case 3:return {t:"Soal campuran",d:"Sepuluh soal dari kosakata, kanji, dan tata bahasa. Baca penjelasan setiap jawaban yang salah.",cta:"Mulai 10 soal",act:"soal:mix",chk:"quiz"};
    case 4:return {t:"Latihan tata bahasa",d:"Kerjakan soal untuk pola minggu ini: "+wp+".",cta:"Mulai latihan",act:"soal:gweek",chk:"quiz"};
    case 5:return {t:"Kuis kanji",d:"Uji arti dan cara baca kanji minggu ini.",cta:"Mulai kuis kanji",act:"soal:kweek",chk:"quiz"};
    case 6:return S.err.length?{t:"Ulang kesalahan",d:"Kerjakan ulang soal yang pernah salah. Soal yang dijawab benar akan hilang dari daftar.",cta:"Ulang kesalahan",act:"soal:err",chk:"quiz"}:{t:"Soal campuran",d:"Belum ada kesalahan tercatat. Kerjakan sepuluh soal campuran.",cta:"Mulai 10 soal",act:"soal:mix",chk:"quiz"};
    default:return {t:"Ulang ringan",d:"Hari santai: kuis kana campuran hiragana dan katakana, lalu kartu kosakata.",cta:"Mulai kuis kana",act:"kana:hk",chk:"kana"};
  }
}
function checks(){var d=day(),tk=task(),due=dueList().length+newLeft();
  return [{ok:d.rev>0&&due===0,txt:"Kartu kosakata ("+(due?due+" menunggu":"selesai")+")",act:"go:kosakata"},
    {ok:tk.chk==="kana"?d.kana>=20:d.quiz>=10,txt:tk.t,act:tk.act}]}

/* ---------- tampilan ---------- */
var TABS=[["hari","Hari ini","hari"],["kana","Kana","kana"],["kosakata","Kosakata","vocab"],["kanji","Kanji","kanji"],["gram","Tata bahasa","gram"],["soal","Soal","soal"],["salah","Kesalahan","err"],["atur","Pengaturan","set"]];
function vNav(){return TABS.map(function(t){return '<button type="button" role="tab" data-act="go:'+t[0]+'" aria-selected="'+(state.tab===t[0])+'">'+ICO[t[2]]+'<span>'+t[1]+'</span></button>'}).join("")}
function bar(lbl,n,tot){var pc=tot?Math.round(n/tot*100):0;return '<div class="bar"><div class="bar-h"><span>'+lbl+'</span><span class="num">'+n+' / '+tot+'</span></div><div class="bar-t"><i style="width:'+pc+'%"></i></div></div>'}
function kanaCount(scr){var n=0;KANA.forEach(function(k){var g=scr==="k"?toKata(k.h):k.h,r=S.kana[g];if(r&&r.st>=3)n++});return n}
function gramDone(){var n=0;D.grammar.forEach(function(g,i){if(g.q.some(function(q,j){var r=S.qr["g:"+i+":"+j];return r&&r.ok}))n++});return n}
function kanjiDone(){var n=0;K.forEach(function(k){var r=S.qr["km:"+k.i];if(r&&r.ok)n++});return n}
function wordOfDay(){return V[((diff("2026-01-01",today())%V.length)+V.length)%V.length]}
function weekStrip(){var t=today(),h="";for(var i=6;i>=0;i--){var k=addDays(t,-i);h+='<div class="'+(active(k)?"on":"")+(i===0?" now":"")+'"><span>'+HARI[parse(k).getDay()].slice(0,3)+'</span><b>'+parse(k).getDate()+'</b></div>'}return h}

function vHari(){
  var tk=task(),d=day(),due=dueList().length+newLeft();
  var h='<section class="hero"><div class="hero-t"><p class="when">'+tgl(today())+' · minggu '+week()+' dari '+PLANW+'</p><h2>'+esc(tk.t)+'</h2><p>'+esc(tk.d)+'</p></div>'
   +'<div class="hero-a"><button class="cta" type="button" data-act="'+tk.act+'">'+esc(tk.cta)+'</button><div class="hero-l"><button class="lnk" type="button" data-act="go:kosakata">Kartu kosakata ('+due+')</button><button class="lnk" type="button" data-act="done" aria-pressed="'+!!d.done+'">'+(d.done?"Hari ini selesai":"Tandai selesai")+'</button></div></div></section>';
  h+='<dl class="strip"><div><dt>Streak</dt><dd><span class="num">'+streak()+'</span> hari</dd></div><div><dt>Kartu menunggu</dt><dd><span class="num">'+due+'</span></dd></div><div><dt>Kata dikuasai</dt><dd><span class="num">'+mastered()+'</span><small>/'+V.length+'</small></dd></div><div><dt>Soal hari ini</dt><dd><span class="num">'+d.quiz+'</span></dd></div></dl>';
  h+='<section class="card"><h3>7 hari terakhir</h3><div class="week">'+weekStrip()+'</div></section>';
  h+='<section class="card"><h3>Kemajuan</h3>'+bar("Hiragana dikuasai",kanaCount("h"),KANA.length)+bar("Katakana dikuasai",kanaCount("k"),KANA.length)+bar("Kosakata dikuasai",mastered(),V.length)+bar("Kanji dijawab benar",kanjiDone(),K.length)+bar("Pola tata bahasa dilatih",gramDone(),D.grammar.length)+'</section>';
  var w=wordOfDay();
  h+='<section class="card onlynarrow"><h3>Kata hari ini</h3>'+wordBox(w)+'</section>';
  return h;
}
function wordBox(w){return '<div class="rword"><span class="jp big">'+ruby(w.w)+'</span>'+spk(reading(w.w),w.m)+'</div><p class="rom">'+esc(roma(w.w))+'</p><p>'+esc(w.m)+'</p>'+(w.ex?'<p class="jp ex">'+ruby(w.ex)+'</p><p class="small">'+esc(w.et)+'</p>':'')}
function vRail(){
  var c=checks(),d=day(),w=wordOfDay();
  return '<section class="rcard"><h3>Checklist hari ini</h3><ul class="rchk">'+c.map(function(x){return '<li class="'+(x.ok?"ok":"")+'"><button type="button" data-act="'+x.act+'"><span class="bx">'+(x.ok?ICO.ok:"")+'</span><span>'+esc(x.txt)+'</span></button></li>'}).join("")
   +'<li class="'+(d.done?"ok":"")+'"><button type="button" data-act="done" aria-pressed="'+!!d.done+'"><span class="bx">'+(d.done?ICO.ok:"")+'</span><span>'+(d.done?"Hari ini ditandai selesai":"Tandai hari ini selesai")+'</span></button></li></ul></section>'
   +'<section class="rcard"><h3>Konsistensi</h3><div class="rstat"><div><b class="num">'+streak()+'</b><span>hari streak</span></div><div><b class="num">'+d.rev+'</b><span>kartu hari ini</span></div><div><b class="num">'+d.quiz+'</b><span>soal hari ini</span></div></div><div class="week sm">'+weekStrip()+'</div></section>'
   +'<section class="rcard"><h3>Kata hari ini</h3>'+wordBox(w)+'</section>';
}

/* Kana */
function vKana(){
  var s=state.kanaS,h='<div class="tabs2"><div class="seg" role="group" aria-label="Huruf"><button type="button" data-act="kanaS:h" aria-pressed="'+(s==="h")+'">Hiragana</button><button type="button" data-act="kanaS:k" aria-pressed="'+(s==="k")+'">Katakana</button></div>'
   +'<div class="seg" role="group" aria-label="Mode"><button type="button" data-act="kanaM:tabel" aria-pressed="'+(state.kanaM==="tabel")+'">Tabel</button><button type="button" data-act="kanaM:kuis" aria-pressed="'+(state.kanaM==="kuis")+'">Kuis</button></div></div>';
  if(state.kanaM==="kuis")return h+vKanaQuiz();
  var conv=function(c){return s==="k"?toKata(c):c};
  h+='<p class="lead">Ketuk huruf untuk mendengar bunyinya. Huruf berlatar hijau sudah Anda kuasai (benar 3 kali berturut-turut di kuis). '+(s==="k"?"Katakana dipakai untuk kata serapan dan nama asing.":"Hiragana dipakai untuk kata asli Jepang, partikel, dan akhiran kata kerja.")+'</p>';
  function cell(c,r){if(c==="・")return '<span class="kc gap"></span>';var g=conv(c),st=S.kana[g];return '<button type="button" class="kc'+(st&&st.st>=3?" m":"")+'" data-say="'+g+'" aria-label="'+g+' '+r+'"><b>'+g+'</b><span>'+r+'</span></button>'}
  h+='<section class="card"><h3>Huruf dasar</h3><div class="kgrid">'+ROWS.filter(function(r){return r[2]==="dasar"}).map(function(r){var rm=r[1].split(" ");return r[0].split("").map(function(c,i){return cell(c,rm[i]==="wo"?"wo / o":rm[i])}).join("")}).join("")+'</div></section>';
  h+='<section class="card"><h3>Dakuten dan handakuten</h3><p class="small">Tanda ゛ mengubah bunyi menjadi berat (か → が), tanda ゜ mengubah は menjadi ぱ.</p><div class="kgrid">'+ROWS.filter(function(r){return r[2]==="daku"}).map(function(r){var rm=r[1].split(" ");return r[0].split("").map(function(c,i){return cell(c,rm[i])}).join("")}).join("")+'</div></section>';
  h+='<section class="card"><h3>Gabungan (yōon)</h3><p class="small">Huruf kecil ゃ・ゅ・ょ menempel pada huruf sebelumnya: き + ゃ = きゃ (kya).</p><div class="kgrid k3">'+KANA.filter(function(k){return k.g==="yoon"}).map(function(k){return cell(k.h,k.r)}).join("")+'</div></section>';
  return h;
}
function vKanaQuiz(){
  var q=state.kq;
  if(!q||q.scr!==state.kanaS&&q.scr!=="hk"||q.end&&q.dismiss){
    var g=state.kanaG;
    return '<section class="card"><h3>Kuis '+(state.kanaS==="k"?"katakana":"hiragana")+'</h3><p>Pilih kelompok huruf, lalu jawab 20 huruf. Huruf yang belum dikuasai lebih sering muncul.</p><div class="chips">'
      +[["dasar","Huruf dasar"],["daku","Dakuten"],["yoon","Gabungan"]].map(function(x){return '<button type="button" class="chip" data-act="kanaG:'+x[0]+'" aria-pressed="'+!!g[x[0]]+'">'+x[1]+'</button>'}).join("")
      +'</div><div class="row"><button class="btn" type="button" data-act="kana:'+state.kanaS+'">Mulai 20 huruf</button><button class="lnk" type="button" data-act="kana:hk">Campur hiragana dan katakana</button></div></section>';
  }
  if(q.end){var wr=q.items.filter(function(x){return x.ok===false});
    return '<section class="card"><h3>Selesai: '+q.ok+' dari '+q.items.length+' benar</h3>'+(wr.length?'<p>Huruf yang perlu diulang:</p><div class="kgrid">'+wr.map(function(x){return '<button type="button" class="kc" data-say="'+x.g+'"><b>'+x.g+'</b><span>'+x.r+'</span></button>'}).join("")+'</div>':'<p>Semua benar. Bagus sekali.</p>')
      +'<div class="row"><button class="btn" type="button" data-act="kana:'+q.scr+'">Ulangi 20 huruf</button><button class="lnk" type="button" data-act="kanaEnd">Kembali ke pilihan</button></div></section>';}
  var it=q.items[q.i];
  return '<section class="card quiz"><div class="qhead"><span>Huruf '+(q.i+1)+' dari '+q.items.length+'</span><span>Benar '+q.ok+'</span></div><div class="qbar"><i style="width:'+(q.i/q.items.length*100)+'%"></i></div>'
   +'<div class="kbig jp">'+it.g+'</div><p class="lead center">Bagaimana bunyinya?</p><div class="opts g2">'+it.o.map(function(o,i){var cls=q.picked===null?"":(o===it.r?" ok":(q.picked===i?" no":""));return '<button type="button" class="opt'+cls+'" data-act="kans:'+i+'"'+(q.picked!==null?' disabled':'')+'><span class="key">'+(i+1)+'</span>'+o+'</button>'}).join("")+'</div>'
   +(q.picked!==null&&it.o[q.picked]!==it.r?'<div class="fb no"><b>'+it.g+' dibaca '+it.r+'.</b> '+spk(it.g)+'</div><div class="row"><button class="btn" type="button" id="nextBtn" data-act="kanNext">Lanjut</button></div>':'')+'</section>';
}
function kanaStart(scr){
  var g=state.kanaG,base=KANA.filter(function(k){return g[k.g]});if(!base.length)base=KANA.filter(function(k){return k.g==="dasar"});
  var pool=[];base.forEach(function(k){if(scr!=="k")pool.push({g:k.h,r:k.r});if(scr!=="h")pool.push({g:toKata(k.h),r:k.r})});
  var wt=pool.map(function(p){var s=S.kana[p.g];return {p:p,w:Math.random()*(s&&s.st>=3?1:3)}}).sort(function(a,b){return b.w-a.w}).slice(0,20).map(function(x){return x.p});
  var items=wt.map(function(p){var rs={};rs[p.r]=1;var ds=shuffle(pool).filter(function(x){if(rs[x.r])return false;rs[x.r]=1;return true}).slice(0,3).map(function(x){return x.r});return {g:p.g,r:p.r,o:shuffle([p.r].concat(ds)),ok:null}});
  state.kq={scr:scr,items:items,i:0,ok:0,picked:null,end:false};state.tab="kana";state.kanaM="kuis";if(scr!=="hk")state.kanaS=scr;
}
function kanaAns(i){var q=state.kq,it=q.items[q.i];if(q.picked!==null)return;q.picked=i;var ok=it.o[i]===it.r;it.ok=ok;
  var s=S.kana[it.g]||(S.kana[it.g]={n:0,ok:0,st:0});s.n++;if(ok){s.ok++;s.st++;q.ok++}else s.st=0;day().kana++;save();
  if(ok){say(it.g);setTimeout(function(){if(state.kq===q&&q.picked!==null){kanaNext();render()}},650)}}
function kanaNext(){var q=state.kq;q.i++;q.picked=null;if(q.i>=q.items.length)q.end=true}

/* Kosakata */
function vKosakata(){
  var h='<div class="tabs2"><div class="seg" role="group" aria-label="Mode kosakata"><button type="button" data-act="vm:kartu" aria-pressed="'+(state.vm==="kartu")+'">Kartu</button><button type="button" data-act="vm:daftar" aria-pressed="'+(state.vm==="daftar")+'">Daftar</button></div></div>';
  return h+(state.vm==="kartu"?vCards():vList());
}
function vCards(){
  if(!state.fc)fcStart(false);
  var f=state.fc;
  if(f.i>=f.q.length){var due=dueList().length;
    return '<section class="card"><h3>'+(f.done?"Selesai untuk sekarang":"Tidak ada kartu menunggu")+'</h3><p>'+(f.done?"Anda mengulang "+f.done+" kartu. ":"")+'Kartu yang Anda ingat akan muncul lagi beberapa hari kemudian, sesuai jadwal pengulangan.</p><div class="row">'
      +(due?'<button class="btn" type="button" data-act="fcAgain">Ulang '+due+' kartu yang jatuh tempo</button>':'')
      +'<button class="btn'+(due?" alt":"")+'" type="button" data-act="fcMore">Tambah 10 kata baru</button></div><p class="small">Jumlah kata baru per hari bisa diubah di Pengaturan.</p></section>';}
  var v=V[f.q[f.i]],c=card(v.i);
  var h='<section class="card fc"><div class="qhead"><span>Kartu '+(f.i+1)+' dari '+f.q.length+'</span><span class="chip sm">'+(c?"ulang":"kata baru")+' · '+esc(v.c)+'</span></div>'
   +'<div class="fc-front"><div class="jp fcw">'+ruby(v.w)+'</div>'+spk(reading(v.w),"kata")+'</div>';
  if(!f.flip)h+='<div class="row center"><button class="btn" type="button" id="flipBtn" data-act="flip">Lihat arti <kbd>Spasi</kbd></button></div><p class="small center">Coba ingat artinya dulu, baru buka.</p>';
  else{
    h+='<div class="fc-back"><p class="rom">'+esc(roma(v.w))+'</p><p class="fcm">'+esc(v.m)+'</p>'+(v.ex?'<div class="exbox"><p class="jp">'+ruby(v.ex)+' '+spk(plain(v.ex),"contoh")+'</p><p class="rom sm">'+esc(roma(v.ex))+'</p><p>'+esc(v.et)+'</p></div>':'')+'</div>';
    var b=c?c.b:0;
    h+='<div class="grade"><button type="button" class="gbtn no" data-act="grade:0"><b>Lupa</b><span>muncul lagi sekarang</span></button><button type="button" class="gbtn" data-act="grade:1"><b>Ingat</b><span>'+ivl(Math.min(6,b+1))+'</span></button><button type="button" class="gbtn ok" data-act="grade:2"><b>Mudah</b><span>'+ivl(Math.min(6,b+2))+'</span></button></div><p class="small center">Tombol keyboard: 1 Lupa · 2 Ingat · 3 Mudah</p>';
  }
  return h+'</section>';
}
function ivl(b){var n=INT[b];return n<=1?"besok":n+" hari lagi"}
function vList(){
  return '<section class="card"><div class="fbar"><label class="sr" for="vq">Cari kata</label><input id="vq" type="search" placeholder="Cari arti, kana, atau romaji" value="'+esc(state.vq)+'"><div class="chips">'
   +CATS.map(function(c){return '<button type="button" class="chip" data-act="vcat:'+c+'" aria-pressed="'+(state.vcat===c)+'">'+c+'</button>'}).join("")+'</div></div><div id="vlist">'+vRows()+'</div></section>';
}
function vRows(){
  var q=state.vq.trim().toLowerCase(),rows=V.filter(function(v){return (state.vcat==="Semua"||v.c===state.vcat)&&(!q||v.m.toLowerCase().indexOf(q)>=0||roma(v.w).indexOf(q)>=0||reading(v.w).indexOf(q)>=0||plain(v.w).indexOf(q)>=0)});
  if(!rows.length)return '<p class="empty">Tidak ada kata yang cocok.</p>';
  return '<ul class="vl">'+rows.map(function(v){var st=vStatus(v.i);return '<li><div class="vl-w"><span class="jp">'+ruby(v.w)+'</span><span class="rom sm">'+esc(roma(v.w))+'</span></div><div class="vl-m">'+esc(v.m)+'</div><span class="badge '+st+'">'+st+'</span>'+spk(reading(v.w),v.m)+'</li>'}).join("")+'</ul><p class="small">'+rows.length+' kata</p>';
}

/* Kanji */
function vKanji(){
  var list=state.kf==="minggu"?weekKanji():K,h='<div class="tabs2"><div class="seg" role="group" aria-label="Filter kanji"><button type="button" data-act="kf:semua" aria-pressed="'+(state.kf==="semua")+'">Semua ('+K.length+')</button><button type="button" data-act="kf:minggu" aria-pressed="'+(state.kf==="minggu")+'">Minggu ini</button></div>'
   +'<button class="btn alt" type="button" data-act="soal:'+(state.kf==="minggu"?"kweek":"km")+'">Kuis kanji</button></div>';
  if(state.kj>=0)h+=kanjiCard(K[state.kj],true);
  h+='<p class="lead">Onyomi (bacaan Cina) ditulis dengan katakana, kunyomi (bacaan Jepang) dengan hiragana. Ketuk kanji untuk melihat detailnya.</p><div class="kjgrid">'+list.map(function(k){var r=S.qr["km:"+k.i];return '<button type="button" class="kj'+(state.kj===k.i?" sel":"")+(r&&r.ok?" m":"")+'" data-act="kj:'+k.i+'"><b class="jp">'+k.k+'</b><span>'+esc(k.m)+'</span></button>'}).join("")+'</div>';
  return h;
}
function kanjiCard(k,closable){
  return '<article class="card kcard" id="kcard"><div class="kc-l"><div class="kglyph jp">'+k.k+'</div></div><div class="kc-r"><div class="kc-h"><h3>'+esc(k.m)+'</h3>'+(closable?'<button class="lnk" type="button" data-act="kj:-1">Tutup</button>':'')+'</div>'
   +'<dl class="rd"><div><dt>Onyomi</dt><dd class="jp">'+esc(k.on||"-")+'</dd></div><div><dt>Kunyomi</dt><dd class="jp">'+esc(k.kun||"-")+'</dd></div></dl>'
   +'<ul class="kex">'+k.ex.map(function(e){return '<li><span class="jp">'+ruby(e[0],true)+'</span><span class="rom sm">'+esc(roma(e[0]))+'</span><span>'+esc(e[1])+'</span>'+spk(reading(e[0]),e[1])+'</li>'}).join("")+'</ul></div></article>';
}

/* Tata bahasa */
var ROLE={n:"kata benda",p:"partikel",v:"kata kerja",a:"kata sifat",x:"bagian tetap"};
function eqHtml(g){var used={};g.eq.forEach(function(e){used[e[0]]=1});
  return '<div class="eqbox"><div class="eq">'+g.eq.map(function(e){return '<span class="eqc r-'+e[0]+'">'+esc(e[1])+'</span>'}).join('<span class="eqp">+</span>')+'</div><div class="eql">'+Object.keys(used).map(function(r){return '<span><i class="r-'+r+'"></i>'+ROLE[r]+'</span>'}).join("")+'</div></div>'}
function vGram(){
  var wp=weekPoints();
  var h='<p class="lead">Tiga puluh pola tata bahasa JLPT N5. Setiap minggu (mulai minggu ke-3) ada tiga pola baru, ditandai "minggu ini". Buka satu pola, baca contohnya keras-keras, lalu kerjakan latihannya.</p>';
  h+=D.grammar.map(function(g,i){var done=g.q.some(function(q,j){var r=S.qr["g:"+i+":"+j];return r&&r.ok});
    return '<details class="gp" id="gp'+i+'"'+(state.gopen===i?" open":"")+'><summary><span class="gn num">'+(i+1)+'</span><span class="gt"><b class="jp">'+esc(g.t)+'</b><span>'+esc(g.s)+'</span></span>'+(wp.indexOf(i)>=0?'<span class="chip sm hot">minggu ini</span>':'')+(done?'<span class="chip sm okc">dilatih</span>':'')+'</summary>'
     +'<div class="gbody">'+eqHtml(g)+'<p>'+esc(g.d)+'</p><ul class="gex">'+g.ex.map(function(e){return '<li><p class="jp">'+ruby(e[0])+' '+spk(plain(e[0]),"contoh")+'</p><p class="rom sm">'+esc(roma(e[0]))+'</p><p>'+esc(e[1])+'</p></li>'}).join("")+'</ul>'
     +(g.note?'<p class="note">'+esc(g.note)+'</p>':'')+'<button class="btn" type="button" data-act="soal:gp:'+i+'">Latihan pola ini ('+g.q.length+' soal)</button></div></details>'}).join("");
  return h;
}

/* Soal */
function vSoal(){
  var s=state.qs;
  if(!s){
    var cnt={vm:V.length,vj:V.length,km:K.length,kr:poolKeys("kr").length,g:poolKeys("g").length};
    function acc(pref){var n=0,ok=0;for(var k in S.qr)if(k.indexOf(pref+":")===0){n+=S.qr[k].n;ok+=S.qr[k].ok}return n?Math.round(ok/n*100)+"% benar":"belum dicoba"}
    var cards=[["mix","Campuran","Kosakata, kanji, dan tata bahasa dalam satu sesi.","10 soal acak"],["vm","Kosakata: arti","Lihat kata Jepang, pilih artinya.",cnt.vm+" kata · "+acc("vm")],["vj","Kosakata: tulisan Jepang","Lihat artinya, pilih kata Jepangnya.",cnt.vj+" kata · "+acc("vj")],["km","Kanji: arti","Lihat kanji, pilih artinya.",cnt.km+" kanji · "+acc("km")],["kr","Kanji: cara baca","Baca kata berkanji tanpa furigana.",cnt.kr+" kata · "+acc("kr")],["g","Tata bahasa","Isi bagian kosong, lalu lihat mengapa pilihan lain salah.",cnt.g+" soal · "+acc("g")]];
    return '<p class="lead">Satu sesi berisi 10 soal. Soal yang belum pernah benar didahulukan. Setiap jawaban punya penjelasan.</p><div class="mgrid">'+cards.map(function(c){return '<section class="card mode"><h3>'+c[1]+'</h3><p>'+c[2]+'</p><p class="small">'+c[3]+'</p><button class="btn'+(c[0]==="mix"?"":" alt")+'" type="button" data-act="soal:'+c[0]+'">Mulai</button></section>'}).join("")+'</div>';
  }
  if(s.i>=s.items.length){
    var wrong=s.res.filter(function(r){return !r.ok});
    return '<section class="card"><h3>'+MODES[s.mode]+': '+s.ok+' dari '+s.items.length+' benar</h3><div class="score"><b class="num">'+Math.round(s.ok/s.items.length*100)+'%</b></div>'
      +(wrong.length?'<p>'+wrong.length+' soal yang salah sudah masuk ke halaman Kesalahan untuk diulang nanti.</p>':'<p>Semua benar.</p>')
      +'<div class="row"><button class="btn" type="button" data-act="soal:'+s.mode+(s.arg!=null?":"+s.arg:"")+'">Sesi baru</button><button class="lnk" type="button" data-act="qmenu">Kembali ke menu soal</button></div></section>';
  }
  var it=s.items[s.i],L="ABCD";
  var h='<section class="card quiz"><div class="qhead"><span>'+MODES[s.mode]+' · soal '+(s.i+1)+' dari '+s.items.length+'</span><span>Benar '+s.ok+'</span></div><div class="qbar"><i style="width:'+(s.i/s.items.length*100)+'%"></i></div>'
   +'<p class="qlead">'+it.lead+'</p><div class="qp">'+it.prompt+(it.say?spk(it.say):"")+'</div><div class="opts">'
   +it.opts.map(function(o,i){var cls=s.picked===null?"":(o.ok?" ok":(s.picked===i?" no":" dim"));return '<button type="button" class="opt'+cls+'" data-act="ans:'+i+'"'+(s.picked!==null?' disabled':'')+'><span class="key">'+L[i]+'</span><span>'+o.h+'</span></button>'}).join("")+'</div>';
  if(s.picked!==null)h+=reveal(it,s.picked)+'<div class="row"><button class="btn" type="button" id="nextBtn" data-act="next">'+(s.i+1<s.items.length?"Lanjut":"Lihat hasil")+' <kbd>Enter</kbd></button><button class="lnk" type="button" data-act="qmenu">Akhiri sesi</button></div>';
  return h+'</section>';
}
function reveal(it,p){
  var L="ABCD",okI=0;it.opts.forEach(function(o,i){if(o.ok)okI=i});var ok=it.opts[p].ok;
  var h='<div class="ans '+(ok?"ok":"no")+'"><div class="ans-h">'+(ok?ICO.ok:ICO.no)+'<b>'+(ok?"Benar.":"Jawaban yang benar: "+L[okI]+".")+'</b></div>'+(ok?"":'<p class="small">Anda memilih '+L[p]+'.</p>');
  if(it.t==="g"){var full=it.q.q.replace("＿＿",/^\(/.test(it.q.o[it.q.a])?"":it.q.o[it.q.a]);
    h+='<p class="jp fulls">'+ruby(full)+' '+spk(plain(full),"kalimat")+'</p><p class="rom sm">'+esc(roma(full))+'</p><p class="tr">'+esc(it.q.tr)+'</p></div>';
    h+='<section class="why"><h4>Pola: <span class="jp">'+esc(it.ref.t)+'</span> ('+esc(it.ref.s)+')</h4>'+eqHtml(it.ref)+'<p>'+esc(it.ref.d)+'</p></section>';
    h+='<section class="why"><h4>Mengapa pilihan lain salah?</h4><table class="wt"><thead><tr><th>Pilihan</th><th>Penjelasan</th><th>Status</th></tr></thead><tbody>'
      +it.opts.map(function(o,i){return '<tr class="'+(o.ok?"ok":"")+(p===i&&!o.ok?" pick":"")+'"><td class="jp">'+L[i]+'. '+o.h+'</td><td>'+esc(o.why)+'</td><td>'+(o.ok?'<span class="st ok">'+ICO.ok+'Benar</span>':'<span class="st no">'+ICO.no+'Salah'+(p===i?", pilihan Anda":"")+'</span>')+'</td></tr>'}).join("")+'</tbody></table></section>';
    h+='<button class="lnk" type="button" data-act="gopen:'+it.gi+'">Pelajari pola ini di Tata bahasa</button>';
    return h;
  }
  h+='</div>';
  if(it.t==="vm"||it.t==="vj"){var v=it.ref;
    h+='<article class="wcard"><div class="wc-h"><span class="jp big">'+ruby(v.w)+'</span>'+spk(reading(v.w),v.m)+'<span class="chip sm">'+esc(v.c)+'</span></div><p class="rom">'+esc(roma(v.w))+'</p><p class="wm">'+esc(v.m)+'</p>'+(v.ex?'<div class="exbox"><p class="jp">'+ruby(v.ex)+'</p><p class="rom sm">'+esc(roma(v.ex))+'</p><p>'+esc(v.et)+'</p></div>':'')+'</article>';
  }else h+=kanjiCard(it.ref,false);
  h+='<section class="why"><h4>Mengapa bukan pilihan lain?</h4><ul class="wl">'+it.opts.map(function(o,i){return o.ok?"":'<li class="'+(p===i?"pick":"")+'"><b>'+L[i]+'.</b> '+o.why+(p===i?' <em>(pilihan Anda)</em>':'')+'</li>'}).join("")+'</ul></section>';
  return h;
}

/* Kesalahan */
function errLabel(key){var it=mkItem(key);if(!it)return esc(key);
  if(it.t==="g")return '<span class="jp">'+ruby(it.q.q)+'</span>';
  if(it.t==="vm"||it.t==="vj")return '<span class="jp">'+ruby(it.ref.w)+'</span> · '+esc(it.ref.m);
  if(it.t==="km")return '<span class="jp">'+it.ref.k+'</span> · '+esc(it.ref.m);
  return '<span class="jp">'+ruby(it.ex[0],true)+'</span> · '+esc(it.ex[1])}
function vSalah(){
  var keys=poolKeys("err");
  if(!keys.length)return '<section class="card"><h3>Belum ada kesalahan</h3><p>Soal yang Anda jawab salah akan muncul di sini. Kerjakan ulang, dan soal yang dijawab benar akan hilang dari daftar.</p><button class="btn" type="button" data-act="go:soal">Ke menu soal</button></section>';
  var cnt={};S.err.forEach(function(e){cnt[e.key]=(cnt[e.key]||0)+1});
  var TY={vm:"Kosakata",vj:"Kosakata",km:"Kanji",kr:"Kanji",g:"Tata bahasa"};
  return '<section class="card"><div class="kc-h"><h3>'+keys.length+' soal perlu diulang</h3><button class="btn" type="button" data-act="soal:err">Ulang '+Math.min(20,keys.length)+' soal</button></div><ul class="el">'
   +keys.map(function(k){return '<li><span class="chip sm">'+TY[k.split(":")[0]]+'</span><span class="el-t">'+errLabel(k)+'</span><span class="small">salah '+cnt[k]+'×</span></li>'}).join("")+'</ul></section>';
}

/* Pengaturan */
function vAtur(){
  var hasJa=!!VOICE;
  return '<section class="card"><h3>Tampilan</h3><div class="srow"><span>Furigana (cara baca di atas kanji)</span><div class="seg"><button type="button" data-act="furi:1" aria-pressed="'+S.furi+'">Tampilkan</button><button type="button" data-act="furi:0" aria-pressed="'+!S.furi+'">Sembunyikan</button></div></div>'
   +'<div class="srow"><span>Tema</span><div class="seg">'+[["auto","Otomatis"],["light","Terang"],["dark","Gelap"]].map(function(t){return '<button type="button" data-act="theme:'+t[0]+'" aria-pressed="'+(S.theme===t[0])+'">'+t[1]+'</button>'}).join("")+'</div></div>'
   +'<div class="srow"><span>Kata baru per hari</span><div class="seg">'+[5,10,15,20].map(function(n){return '<button type="button" data-act="newPer:'+n+'" aria-pressed="'+(S.newPer===n)+'">'+n+'</button>'}).join("")+'</div></div></section>'
   +'<section class="card"><h3>Suara</h3><p>'+(hasJa?'Suara Jepang ditemukan: <b>'+esc(VOICE.name)+'</b>.':'Belum ada suara bahasa Jepang di perangkat ini. Di Windows: Pengaturan → Waktu & bahasa → Ucapan → Tambahkan suara → Jepang. Browser Microsoft Edge biasanya sudah punya suara Jepang yang natural (Nanami).')+'</p><button class="btn alt" type="button" data-say="こんにちは、にほんごを べんきょうしましょう。">Tes suara</button></section>'
   +'<section class="card"><h3>Cadangan</h3><p>Kemajuan disimpan di browser ini saja. Ekspor ke file secara berkala, lalu impor di perangkat lain.</p><div class="row"><button class="btn" type="button" data-act="export">Ekspor cadangan</button><label class="btn alt" for="impFile">Impor cadangan</label><input id="impFile" type="file" accept="application/json,.json" class="sr"></div><p class="small" id="impMsg" aria-live="polite"></p></section>'
   +'<section class="card"><h3>Rencana</h3><p>Rencana 12 minggu dimulai '+tgl(S.start)+'. Minggu 1 hiragana, minggu 2 katakana, minggu 3 sampai 12 kosakata, kanji, dan tata bahasa N5.</p><div class="row"><button class="lnk" type="button" data-act="restart">Mulai rencana dari hari ini</button><button class="lnk danger" type="button" data-act="reset">Hapus semua kemajuan</button></div></section>';
}

/* ---------- render & aksi ---------- */
function applyTheme(){var r=document.documentElement;if(S.theme==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.theme)}
function render(){
  $("nav").innerHTML=vNav();
  var f={hari:vHari,kana:vKana,kosakata:vKosakata,kanji:vKanji,gram:vGram,soal:vSoal,salah:vSalah,atur:vAtur}[state.tab];
  $("view").innerHTML=f();
  $("rail").innerHTML=vRail();
  $("wk").textContent="Minggu "+week()+" dari "+PLANW;
  var n=$("nextBtn")||$("flipBtn");if(n)n.focus({preventScroll:true});
  var vq=$("vq");if(vq)vq.oninput=function(){state.vq=vq.value;$("vlist").innerHTML=vRows()};
  var imp=$("impFile");if(imp)imp.onchange=importFile;
}
function go(tab){state.tab=tab;if(tab!=="soal"&&state.qs&&state.qs.i>=state.qs.items.length)state.qs=null;render();window.scrollTo(0,0)}
function act(a,el){
  var p=a.split(":"),c=p[0],v=p[1];
  switch(c){
    case "go":if(v==="kosakata"){state.vm="kartu";if(state.fc&&state.fc.i>=state.fc.q.length)state.fc=null}go(v);return;
    case "done":var d=day();d.done=d.done?0:1;save();break;
    case "kanaS":state.kanaS=v;if(state.kq&&state.kq.end)state.kq=null;break;
    case "kanaM":state.kanaM=v;break;
    case "kanaG":state.kanaG[v]=state.kanaG[v]?0:1;break;
    case "kana":kanaStart(v);render();window.scrollTo(0,0);return;
    case "kans":kanaAns(+v);break;
    case "kanNext":kanaNext();break;
    case "kanaEnd":state.kq=null;break;
    case "vm":state.vm=v;break;
    case "vcat":state.vcat=v;break;
    case "flip":state.fc.flip=true;break;
    case "grade":fcGrade(+v);break;
    case "fcAgain":fcStart(false);break;
    case "fcMore":fcStart(true);break;
    case "kf":state.kf=v;break;
    case "kj":var i=+v;state.kj=i;if(i>=0)S.ks[i]=1;render();if(i>=0){var kc=$("kcard");if(kc)kc.scrollIntoView({behavior:"smooth",block:"start"})}return;
    case "gram":state.tab="gram";state.gopen=weekPoints()[0];render();setTimeout(function(){var e=$("gp"+state.gopen);if(e)e.scrollIntoView({block:"start"})},0);return;
    case "gopen":state.tab="gram";state.gopen=+v;render();setTimeout(function(){var e=$("gp"+state.gopen);if(e)e.scrollIntoView({block:"start"})},0);return;
    case "kanji":state.tab="kanji";state.kf="minggu";state.kj=-1;break;
    case "soal":startQuiz(v,p[2]!=null?+p[2]:undefined);render();window.scrollTo(0,0);return;
    case "ans":answer(+v);break;
    case "next":state.qs.i++;state.qs.picked=null;render();window.scrollTo(0,0);return;
    case "qmenu":state.qs=null;break;
    case "furi":S.furi=v==="1";save();break;
    case "theme":S.theme=v;save();applyTheme();break;
    case "newPer":S.newPer=+v;state.fc=null;save();break;
    case "export":exportFile();return;
    case "restart":if(confirm("Mulai rencana 12 minggu dari hari ini? Kemajuan belajar tetap disimpan.")){S.start=today();save()}break;
    case "reset":if(confirm("Hapus semua kemajuan di browser ini? Ini tidak bisa dibatalkan, kecuali Anda punya file cadangan.")){S=fresh();save();state.fc=null;state.qs=null;state.kq=null}break;
  }
  render();
}
document.addEventListener("click",function(e){
  var s=e.target.closest("[data-say]");if(s){say(s.getAttribute("data-say"));if(!s.hasAttribute("data-act")&&!s.closest("[data-act]"))return}
  var b=e.target.closest("[data-act]");if(b&&!b.disabled)act(b.getAttribute("data-act"),b);
});
document.addEventListener("keydown",function(e){
  if(e.target.matches("input,textarea,select")||e.ctrlKey||e.metaKey||e.altKey)return;
  var k=e.key;
  if(state.tab==="soal"&&state.qs&&state.qs.i<state.qs.items.length){var s=state.qs,m={"1":0,"2":1,"3":2,"4":3,a:0,b:1,c:2,d:3}[k.toLowerCase()];
    if(s.picked===null&&m!=null&&m<s.items[s.i].opts.length){e.preventDefault();act("ans:"+m)}
    else if(s.picked!==null&&k==="Enter"&&document.activeElement&&document.activeElement.id!=="nextBtn"){e.preventDefault();act("next")}}
  else if(state.tab==="kana"&&state.kanaM==="kuis"&&state.kq&&!state.kq.end){var q=state.kq,n={"1":0,"2":1,"3":2,"4":3}[k];if(q.picked===null&&n!=null){e.preventDefault();act("kans:"+n)}}
  else if(state.tab==="kosakata"&&state.vm==="kartu"&&state.fc&&state.fc.i<state.fc.q.length){
    if(!state.fc.flip&&(k===" "||k==="Enter")){e.preventDefault();act("flip")}
    else if(state.fc.flip&&{"1":1,"2":1,"3":1}[k]){e.preventDefault();act("grade:"+(+k-1))}}
});
function exportFile(){var b=new Blob([JSON.stringify(S,null,1)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="nihongo-cadangan-"+today()+".json";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
function importFile(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var m=$("impMsg");
  try{var o=JSON.parse(r.result);if(!o||o.v!==1||typeof o.cards!=="object")throw 0;
    if(confirm("Ganti kemajuan di browser ini dengan isi file "+f.name+"?")){S=o;var fr=fresh();for(var k in fr)if(S[k]===undefined)S[k]=fr[k];save();applyTheme();state.fc=null;state.qs=null;render();$("impMsg").textContent="Cadangan berhasil diimpor."}}
  catch(err){if(m)m.textContent="File ini bukan cadangan Nihongo yang valid."}};r.readAsText(f)}

applyTheme();render();
window.NJ={S:function(){return S},state:state,romaji:romaji,roma:roma,mkItem:mkItem,poolKeys:poolKeys};
})();
