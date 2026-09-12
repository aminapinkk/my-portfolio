const BACKGROUNDS = [
  'assets/backgrounds/bg1.jpg','assets/backgrounds/bg2.jpg','assets/backgrounds/bg3.jpg','assets/backgrounds/bg4.jpg','assets/backgrounds/bg5.jpg'
];
const BUCKET = 'portfolio-files';
const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient = (window.supabase && cfg.url && cfg.publishableKey && !cfg.url.includes('YOUR-PROJECT-REF'))
  ? window.supabase.createClient(cfg.url, cfg.publishableKey)
  : null;
const state = { route: getRoute(), user: null };

function getRoute(){
  const hash = location.hash.replace('#','').replace(/^\//,'');
  if(hash.startsWith('digital')) return 'digital';
  if(hash.startsWith('traditional')) return 'traditional';
  return 'home';
}
function isConfigured(){ return !!supabaseClient; }
function escapeHtml(str=''){return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function formatDate(s){try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(s+'T00:00:00'))}catch{return s}}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2600)}

function setBackground(i){
  localStorage.setItem('portfolio-bg',String(i));
  document.documentElement.style.setProperty('--bg-image',`url('${BACKGROUNDS[i]}')`);
  document.querySelectorAll('.bg-choice').forEach((b,idx)=>b.classList.toggle('active',idx===i));
}
function loadBackground(){const i=Math.min(4,Math.max(0,Number(localStorage.getItem('portfolio-bg')||0)));setBackground(i)}

function shell(content){
  const auth = state.user
    ? `<span class="user-pill">${escapeHtml(state.user.email||'Owner')}</span><button class="ghost-btn" id="logoutBtn">Log out</button>`
    : `<button class="ghost-btn" id="loginBtn">Owner login</button>`;
  return `<div class="page-bg"></div><div class="shell">
    <nav class="nav"><a class="brand" href="#home"><span class="brand-fish">🐠</span><span>My Portfolio</span></a>
    <div class="nav-actions">${auth}<button class="ghost-btn" id="bgToggle">Change background</button><a class="icon-btn" href="#home">Home</a></div></nav>${content}</div>${backgroundPanel()}`;
}
function backgroundPanel(){return `<aside class="background-panel" id="backgroundPanel"><div class="bg-title">Choose a background</div><div class="bg-grid">${BACKGROUNDS.map((b,i)=>`<button class="bg-choice" data-bg="${i}" aria-label="Background ${i+1}"><img src="${b}" alt=""></button>`).join('')}</div></aside>`}
function fishLayer(){
  const fish=[]; const left=[5,77,23,63,8,72,36,48,86],top=[12,20,42,57,68,72,8,51,35],dur=[5.5,6.8,7.2,5.9,7.7,6.2,8.1,6.6,7.4],drift=[9,11,12,8,13,10,14,9,12];
  for(let i=1;i<=9;i++) fish.push(`<img class="fish" src="assets/fish/fish${i}.png" alt="" style="left:${left[i-1]}%;top:${top[i-1]}%;--dur:${dur[i-1]}s;--drift:${drift[i-1]}s;--r1:${i%2?'−5deg':'6deg'};--r2:${i%2?'5deg':'−5deg'};animation-delay:-${i*.7}s,-${i*.4}s">`);
  return `<div class="fish-layer" aria-hidden="true">${fish.join('')}</div>`;
}

function home(){
  document.title='My Portfolio';
  return shell(`<main class="hero">${fishLayer()}<section class="hero-card"><span class="eyebrow">A little corner for my art</span><h1 class="hero-title">My Portfolio</h1><p class="hero-subtitle">A dreamy place to collect, organize and share the things I create — digitally and by hand.</p><div class="category-grid">
    <a class="category-card" href="#digital"><img class="category-image" src="assets/ui/tablet.jpg" alt="Digital art tablet illustration"><div class="category-label">Digital</div></a>
    <a class="category-card" href="#traditional"><img class="category-image" src="assets/ui/paint.jpg" alt="Watercolor paints illustration"><div class="category-label">Traditional</div></a>
  </div></section></main>${authModal()}`);
}

async function getWorks(category){
  if(!isConfigured()) return [];
  const {data,error}=await supabaseClient.from('works').select('*').eq('category',category).order('created_at',{ascending:false});
  if(error) throw error; return data||[];
}
function publicUrl(path){return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}
function workCard(w){
  const isImage = w.file_type && w.file_type.startsWith('image/');
  const url = publicUrl(w.file_path);
  return `<article class="work-card"><div class="work-preview">${isImage?`<img src="${url}" alt="${escapeHtml(w.title)}" loading="lazy">`:`<div class="file-icon">📄</div>`}</div><div class="work-body"><h2 class="work-title">${escapeHtml(w.title)}</h2>
    ${w.date?`<div class="work-meta">${formatDate(w.date)}${w.file_name?` · ${escapeHtml(w.file_name)}`:''}</div>`:(w.file_name?`<div class="work-meta">${escapeHtml(w.file_name)}</div>`:'')}
    ${w.description?`<p class="work-description">${escapeHtml(w.description)}</p>`:''}
    <div class="work-actions"><a class="small-btn" href="${url}" target="_blank" rel="noopener">Open</a>${state.user&&w.user_id===state.user.id?`<button class="small-btn delete" data-delete="${w.id}" data-path="${escapeHtml(w.file_path)}">Delete</button>`:''}</div></div></article>`;
}
function uploadModal(title){
  if(!state.user) return '';
  return `<div class="modal" id="uploadModal" role="dialog" aria-modal="true"><div class="modal-panel"><div class="modal-head"><h2>Add ${title} work</h2><button class="close" id="closeModal">×</button></div><form id="workForm"><div class="form-grid">
    <div class="field"><label for="workTitle">Title *</label><input id="workTitle" name="title" required maxlength="120" placeholder="e.g. Moonlit Garden"></div>
    <div class="field"><label for="workDate">Date</label><input id="workDate" name="date" type="date"></div>
    <div class="field"><label for="workDescription">Description</label><textarea id="workDescription" name="description" maxlength="1200" placeholder="A few words about this piece..."></textarea></div>
    <div class="field"><label>Artwork / file *</label><div class="file-drop">Choose an image or file<input id="workFile" name="file" type="file" accept="image/*,.pdf,.psd,.ai,.clip,.procreate,.kra,.zip" required></div></div>
  </div><div class="modal-footer"><button type="button" class="secondary" id="cancelModal">Cancel</button><button class="primary" type="submit">Upload to portfolio</button></div></form></div></div>`;
}
function authModal(){return `<div class="modal" id="authModal" role="dialog" aria-modal="true"><div class="modal-panel auth-panel"><div class="modal-head"><h2>Owner login</h2><button class="close" id="closeAuth">×</button></div><p class="page-copy">Log in to add and delete portfolio works. Visitors can still view the portfolio without an account.</p><form id="authForm"><div class="field"><label>Email</label><input id="authEmail" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input id="authPassword" type="password" required autocomplete="current-password"></div><div class="modal-footer"><button class="primary" type="submit">Log in</button></div></form></div></div>`}

async function portfolio(category){
  const title=category==='digital'?'Digital':'Traditional'; document.title=`${title} — My Portfolio`;
  let works=[]; let error='';
  try{works=await getWorks(category)}catch(e){console.error(e);error=e.message||'Could not load portfolio works.'}
  const controls=state.user?`<button class="plus" id="addWork" aria-label="Add a work">+</button><strong>Add a new work</strong><span>Upload an image or file, then give it a title.</span>`:`<button class="plus locked" id="addWork" aria-label="Log in to add a work">+</button><strong>Owner login required to add works</strong><span>Visitors can browse this portfolio; only the owner can upload.</span>`;
  return shell(`<main class="page-card"><div class="page-header"><div><h1 class="page-title">${title}</h1><p class="page-copy">Your ${category} artwork, stored online and available after refresh or from another device.</p></div><a class="back-btn" href="#home">← Back home</a></div>
    <section class="add-card"><div>${controls}</div></section>${error?`<div class="empty error-box">${escapeHtml(error)}<br><small>Check the Supabase setup and SQL policies.</small></div>`:''}
    <section>${works.length?`<div class="works-grid">${works.map(workCard).join('')}</div>`:`<div class="empty">No works here yet. ${state.user?'Click the <strong>+</strong> to add your first one.':'The owner can log in to add the first work.'}</div>`}</section></main>${uploadModal(title)}`);
}

function bindCommon(){
  document.querySelectorAll('[data-bg]').forEach(btn=>btn.addEventListener('click',()=>setBackground(Number(btn.dataset.bg))));
  const bgToggle=document.getElementById('bgToggle'),panel=document.getElementById('backgroundPanel');
  bgToggle?.addEventListener('click',()=>panel?.classList.toggle('open'));
  document.getElementById('loginBtn')?.addEventListener('click',()=>document.getElementById('authModal')?.classList.add('open'));
  document.getElementById('logoutBtn')?.addEventListener('click',async()=>{await supabaseClient.auth.signOut();toast('Logged out.');render()});
  if(document.getElementById('addWork')) bindUpload();
}
function bindUpload(){
  const add=document.getElementById('addWork');
  if(!state.user){add.onclick=()=>document.getElementById('authModal')?.classList.add('open');return}
  const modal=document.getElementById('uploadModal'),close=()=>modal.classList.remove('open');
  add.onclick=()=>modal.classList.add('open'); document.getElementById('closeModal').onclick=close; document.getElementById('cancelModal').onclick=close; modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.getElementById('workForm').addEventListener('submit',async e=>{
    e.preventDefault(); const fd=new FormData(e.currentTarget),file=fd.get('file'); if(!file?.size){toast('Please choose a file.');return}
    const id=crypto.randomUUID(); const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-'); const path=`${state.user.id}/${id}-${safeName}`;
    const {error:uploadError}=await supabaseClient.storage.from(BUCKET).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
    if(uploadError){console.error(uploadError);toast(`Upload failed: ${uploadError.message}`);return}
    const {error:dbError}=await supabaseClient.from('works').insert({id,user_id:state.user.id,category:state.route,title:String(fd.get('title')).trim(),date:String(fd.get('date')||'')||null,description:String(fd.get('description')||'').trim()||null,file_name:file.name,file_type:file.type||'application/octet-stream',file_path:path});
    if(dbError){await supabaseClient.storage.from(BUCKET).remove([path]);console.error(dbError);toast(`Could not save work: ${dbError.message}`);return}
    close(); toast('Saved to your online portfolio ✨'); render();
  });
}
function bindAuth(){
  const modal=document.getElementById('authModal'); if(!modal)return;
  const close=()=>modal.classList.remove('open'); document.getElementById('closeAuth').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.getElementById('authForm').addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('authEmail').value,password=document.getElementById('authPassword').value;const {error}=await supabaseClient.auth.signInWithPassword({email,password});if(error){toast(error.message);return}close();toast('Welcome back ✨');render()});
}
function bindWorkActions(){
  document.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=async()=>{
    if(!confirm('Delete this work from your portfolio?'))return;
    const {error:dbError}=await supabaseClient.from('works').delete().eq('id',btn.dataset.delete).eq('user_id',state.user.id);
    if(dbError){toast(dbError.message);return}
    const {error:fileError}=await supabaseClient.storage.from(BUCKET).remove([btn.dataset.path]);
    if(fileError) console.warn(fileError);
    toast('Work deleted.'); render();
  });
}
async function render(){
  state.route=getRoute();
  const app=document.getElementById('app');
  if(!isConfigured()){
    app.innerHTML=`<div class="shell"><div class="page-card"><h1 class="page-title">Supabase is not connected yet</h1><p class="page-copy">Open <code>config.js</code> and add your Supabase project URL and publishable key. Never put a service_role/secret key in this file.</p></div></div>`;loadBackground();return;
  }
  const {data:{user}}=await supabaseClient.auth.getUser(); state.user=user||null;
  app.innerHTML=state.route==='home'?home():await portfolio(state.route); loadBackground(); bindCommon(); bindAuth(); bindWorkActions();
}
window.addEventListener('hashchange',render);
(async()=>{if(isConfigured()) supabaseClient.auth.onAuthStateChange(()=>render()); try{await render()}catch(e){console.error(e);document.getElementById('app').innerHTML=`<div class="shell"><div class="page-card"><h1 class="page-title">Something went wrong</h1><p class="page-copy">${escapeHtml(e.message||String(e))}</p></div></div>`}})();
