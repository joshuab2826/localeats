
const $ = (s)=>document.querySelector(s);
async function getData(){ const r=await fetch('data/places_en.json'); return r.json(); }
function loadConfig(){
  const def={maxReviewGrowth:0.5,maxIgGrowth:0.5,maxTouristRatio:0.4,showPremium:false,city:'Seoul',q:'',cat:'All'};
  try{ return Object.assign(def, JSON.parse(localStorage.getItem('le_cfg')||'{}')); }catch(e){ return def; }
}
function saveConfig(cfg){ localStorage.setItem('le_cfg', JSON.stringify(cfg)); }
function applyWaterChange(places,cfg){
  return places.filter(p=>{
    const tooPopular = (p.reviewGrowth||0) > cfg.maxReviewGrowth
                    || (p.igGrowth||0) > cfg.maxIgGrowth
                    || (p.touristRatio||0) > cfg.maxTouristRatio;
    return !tooPopular;
  });
}
function match(p, cfg){
  const q=(cfg.q||'').trim().toLowerCase();
  if(q && ![p.name,p.desc,p.neighborhood,p.category,(p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)) return false;
  if(cfg.cat && cfg.cat!=='All' && (p.category||'').toLowerCase()!==cfg.cat.toLowerCase()) return false;
  if(!cfg.showPremium && p.premium) return false;
  return true;
}
async function initCity(){
  const cfg = loadConfig();
  const params = new URLSearchParams(location.search);
  const city = params.get('city') || cfg.city || 'Seoul';
  cfg.city = city; saveConfig(cfg);
  document.querySelector('#city-name').textContent = city;
  const data = await getData();
  const cats = Array.from(new Set(data.filter(d=>d.city===city).map(d=>d.category||'Food')));
  const catSel = document.querySelector('#cat');
  catSel.innerHTML = '<option>All</option>'+cats.map(c=>`<option>${c}</option>`).join('');
  catSel.value = cfg.cat || 'All';
  function render(){
    const list = document.querySelector('#list'); list.innerHTML='';
    const rows = applyWaterChange(data.filter(d=>d.city===city).filter(p=>match(p,cfg)), cfg)
               .sort((a,b)=>(b.localScore||0)-(a.localScore||0));
    rows.forEach(p=>{
      const el=document.createElement('div'); el.className='item';
      el.innerHTML = `
        <div class="thumb">Photo</div>
        <div>
          <div class="name">${p.name} — <span class="note">${p.neighborhood||'Local'}</span></div>
          <p class="desc">${p.desc||''}</p>
          <div class="kpis">
            <span class="kpi">Local ${(p.localScore||0).toFixed(2)}</span>
            <span class="kpi">Tourist ${(p.touristRatio*100).toFixed(0)}%</span>
            <span class="kpi">Review ${(p.reviewGrowth*100).toFixed(0)}%</span>
            <span class="kpi">IG ${(p.igGrowth*100).toFixed(0)}%</span>
            ${p.price?`<span class="kpi">${p.price}</span>`:''}
          </div>
          <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        </div>`;
      list.appendChild(el);
    });
    document.querySelector('#count').textContent = rows.length;
  }
  document.querySelector('#q').addEventListener('input', e=>{ cfg.q=e.target.value; saveConfig(cfg); render(); });
  document.querySelector('#cat').addEventListener('change', e=>{ cfg.cat=e.target.value; saveConfig(cfg); render(); });
  document.querySelector('#togglePremium').addEventListener('change', e=>{ cfg.showPremium=e.target.checked; saveConfig(cfg); render(); });
  [['maxReviewGrowth','#thr-review'],['maxIgGrowth','#thr-ig'],['maxTouristRatio','#thr-tour']].forEach(([k,sel])=>{
    const el=document.querySelector(sel); el.value = cfg[k]; el.addEventListener('input',e=>{ cfg[k]=parseFloat(e.target.value||0); saveConfig(cfg); render(); });
  });
  render();
}
async function initAdmin(){
  const cfg = loadConfig();
  ['maxReviewGrowth','maxIgGrowth','maxTouristRatio'].forEach(k=>{
    const el = document.querySelector('#'+k);
    el.value = cfg[k];
    el.addEventListener('input', e=>{ cfg[k]=parseFloat(e.target.value||0); saveConfig(cfg); });
  });
  const prem = document.querySelector('#showPremium'); prem.checked = !!cfg.showPremium;
  prem.addEventListener('change', e=>{ cfg.showPremium = prem.checked; saveConfig(cfg); });
  document.querySelector('#reset').addEventListener('click', ()=>{ localStorage.removeItem('le_cfg'); location.reload(); });
}
window.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.dataset.page==='city') initCity();
  if(document.body.dataset.page==='admin') initAdmin();
});
