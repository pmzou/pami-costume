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
      if(c.id<=100 || !c.image) continue;
      var card=document.createElement('article'); card.className='card';
      var imageSrc=c.image+(c.imageVersion?'?v='+encodeURIComponent(c.imageVersion):'');
      card.innerHTML='<img class="photo" src="'+imageSrc+'" alt="'+c.name+'" loading="lazy"><div class="name"></div><div class="tags"></div>';
      grid.appendChild(card);
    }
  }
})();