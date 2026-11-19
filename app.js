const KEY='touki_cards_v1',HKEY='touki_history_v1';
let cards=JSON.parse(localStorage.getItem(KEY)||'null')||window.STARTER_CARDS||[];
let history=JSON.parse(localStorage.getItem(HKEY)||'{}');
let queue=[],current=0,flipped=false;
const $=id=>document.getElementById(id);
const today=()=>new Date().toLocaleDateString('sv-SE');
function datePlus(days){const d=new Date();d.setDate(d.getDate()+days);return d.toLocaleDateString('sv-SE')}
function save(){localStorage.setItem(KEY,JSON.stringify(cards));localStorage.setItem(HKEY,JSON.stringify(history))}
function due(c){return !history[c.id]||history[c.id].due<=today()}
function rebuild(){let mode=$('filter').value;queue=cards.filter(c=>mode==='all'||(mode==='due'&&due(c))||(mode==='missed'&&history[c.id]?.missed)||(mode==='new'&&!history[c.id]));current=0;render()}
function render(){const c=queue[current];$('stats').textContent=`全${cards.length}枚｜本日対象${cards.filter(due).length}枚`;$('counter').textContent=c?`${current+1} / ${queue.length}｜${c.category||'未分類'}`:'対象カードはありません';$('card').textContent=c?(flipped?c.back:c.front):'この条件のカードはありません';$('source').textContent=c?.source||'';$('flip').disabled=!c;$('flip').textContent=flipped?'問題に戻る':'答えを見る';$('grading').classList.toggle('hidden',!flipped||!c)}
function flip(){if(!queue[current])return;flipped=!flipped;render()}
function grade(ok){const c=queue[current];if(!c)return;const prev=history[c.id]||{step:-1};const step=ok?Math.min(prev.step+1,4):-1;history[c.id]={step,due:datePlus(ok?[1,3,7,14,30][step]:1),missed:!ok,last:today()};save();queue.splice(current,1);if(current>=queue.length)current=0;flipped=false;render()}
$('flip').onclick=flip;$('card').onclick=flip;$('card').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}};$('know').onclick=()=>grade(true);$('miss').onclick=()=>grade(false);$('filter').onchange=()=>{flipped=false;rebuild()};
$('export').onclick=()=>download('touki-backup.json',JSON.stringify({version:1,cards,history,exported:today()},null,2),'application/json');
function download(name,body,type){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([body],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$('importButton').onclick=()=>$('import').click();
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{let txt=await f.text(),obj;if(f.name.toLowerCase().endsWith('.csv')){let lines=parseCSV(txt.replace(/^\uFEFF/,''));let header=lines.shift().map(x=>x.trim().toLowerCase());obj=lines.filter(x=>x.length>1).map((r,i)=>Object.fromEntries(header.map((h,j)=>[h,r[j]||''])))}else obj=JSON.parse(txt);let arr=Array.isArray(obj)?obj:obj.cards;if(!Array.isArray(arr))throw Error('カード配列がありません');let valid=arr.filter(c=>typeof c.front==='string'&&typeof c.back==='string'&&c.front.trim()&&c.back.trim()).map((c,i)=>({....c,id:String(c.id||'import-'+i+'-'+c.front)}));if(!valid.length)throw Error('有効なカードがありません');if(!confirm(`${valid.length}枚を読み込みます。既存カードは置き換えます。よろしいですか？`))return;cards=valid;history=obj.history&&typeof obj.history==='object'?obj.history:{};save();rebuild();alert('読み込みました')}catch(err){alert('読込エラー: '+err.message)}e.target.value=''};
function parseCSV(s){let rows=[],r=[],v='',quote=false;for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quote&&s[i+1]==='"'){v+='"';i++}else quote=!quote}else if(c===','&&!quote){r.push(v);v=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&s[i+1]==='\n')i++;r.push(v);if(r.some(x=>x!==''))rows.push(r);r=[];v=''}else v+=c}r.push(v);if(r.some(x=>x!==''))rows.push(r);return rows}
$('reset').onclick=()=>{if(confirm('学習履歴をすべて初期化しますか？')){history={};save();rebuild()}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});rebuild();
