(function(){
  var style=document.createElement('style');
  style.textContent=
    ':root{--pami-orange:#F07828;--pami-orange-tint:#FEF2EA;--pami-ink:#202124;--pami-muted:#74777D;--pami-border:#E8E9EB;--pami-tag:#F4F4F5}'+
    'body{color:var(--pami-ink);background:#fff}.wrap{max-width:1100px;margin:auto;padding:18px 10px 50px}h1{color:var(--pami-ink)}'+
    '.sub{color:var(--pami-muted);margin:5px 0 12px}.filters{gap:6px;padding-top:8px;padding-bottom:12px;background:rgba(255,255,255,.96)}'+
    '.filters button{min-height:32px;border:1px solid var(--pami-border);background:#fff;color:var(--pami-ink);border-radius:999px;padding:7px 11px;font:inherit;font-size:12px;white-space:nowrap}'+
    '.filters button.on{background:var(--pami-orange-tint);color:var(--pami-ink);border-color:transparent;font-weight:600}'+
    '.grid{column-gap:8px;row-gap:16px}.photo{aspect-ratio:3/4;object-fit:cover;border-radius:7px;background:#f1f1f1}'+
    '.name{color:var(--pami-ink);font-size:11px;font-weight:600;margin:6px 1px 0;line-height:1.25}.tags{gap:3px;margin-top:6px}'+
    '.tag{font-size:8px;background:var(--pami-tag);color:var(--pami-muted);padding:2px 5px;border-radius:999px}'+
    '@media(pointer:coarse){.filters button{min-height:44px;padding-top:7px;padding-bottom:7px}}';
  document.head.appendChild(style);

  function get(url){
    var x=new XMLHttpRequest(); x.open('GET',url,false); x.send(null);
    return x.status>=200&&x.status<300 ? x.responseText : '';
  }
  var base=get('data-base.js?v=20260916');
  if(base) (0,eval)(base); else window.COSTUMES=[];
  try{
    var custom=JSON.parse(get('custom-data.json?v='+Date.now())||'[]');
    Array.prototype.push.apply(window.COSTUMES,custom);
  }catch(e){}

  var grid=document.querySelector('.grid');
  if(grid){
    for(var i=0;i<window.COSTUMES.length;i++){
      var c=window.COSTUMES[i];
      if(Number(c.id)<=100 || !c.image) continue;
      var card=document.createElement('article'); card.className='card';
      var imageSrc=c.image+(c.imageVersion?'?v='+encodeURIComponent(c.imageVersion):'');
      card.innerHTML='<img class="photo" src="'+imageSrc+'" alt="'+c.name+'" loading="lazy"><div class="name"></div><div class="tags"></div>';
      grid.appendChild(card);
    }
  }
  // Re-run metadata binding after dynamically adding custom cards.
  var cards=document.querySelectorAll('.card');
  for(var j=0;j<window.COSTUMES.length&&j<cards.length;j++){
    var item=window.COSTUMES[j], el=cards[j];
    if(item.visible===false || item.visible==='false'){el.style.display='none';continue;}
    var n=el.querySelector('.name'); if(n)n.textContent=item.name||'';
    var normTags=Array.isArray(item.tags)?item.tags:(item.tags?[item.tags]:[]); el.setAttribute('data-tags',normTags.join(' '));
    var t=el.querySelector('.tags'); if(t){t.innerHTML=''; var tags=normTags; for(var k=0;k<tags.length;k++){var s=document.createElement('span');s.className='tag';s.textContent=({fullback:'フルバック',tback:'Tバック',character:'キャラクター',other:'その他'})[tags[k]]||tags[k];t.appendChild(s);}}
  }
  // Bind filters again so dynamically added cards participate too.
  var buttons=document.querySelectorAll('.filters button');
  for(var b=0;b<buttons.length;b++)(function(btn){btn.onclick=function(){
    for(var q=0;q<buttons.length;q++)buttons[q].classList.remove('on'); btn.classList.add('on');
    var key=btn.getAttribute('data-filter')||btn.getAttribute('data-tag')||'';
    var label=(btn.textContent||'').trim();
    if(!key){key=label==='すべて'?'all':label==='フルバック'?'fullback':label==='Tバック'?'tback':label==='キャラクター'?'character':label==='その他'?'other':'';}
    var all=document.querySelectorAll('.card');
    for(var z=0;z<all.length;z++){var it=window.COSTUMES[z]||{}, ts=Array.isArray(it.tags)?it.tags:(it.tags?[it.tags]:[]), visible=!(it.visible===false||it.visible==='false'); all[z].style.display=visible&&(key==='all'||key===''||ts.indexOf(key)>=0)?'':'none';}
  };})(buttons[b]);
})();