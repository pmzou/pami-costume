(function(){
  var x=new XMLHttpRequest();
  x.open('GET','data-base.js?v=20260916',false);
  x.send(null);
  if(x.status>=200 && x.status<300) (0,eval)(x.responseText);
  else window.COSTUMES=[];
  window.COSTUMES.push(
    {"id":101,"name":"No.101｜REALIZE 肌色×黒メッシュ水着","tags":["fullback"],"visible":true,"image":"images/101.jpg","imageVersion":1},
    {"id":102,"name":"No.102｜REALIZE 青×白水着","tags":["fullback"],"visible":true,"image":"images/102.jpg","imageVersion":3}
  );
  var grid=document.querySelector('.grid');
  if(grid){
    for(var i=0;i<window.COSTUMES.length;i++){
      var c=window.COSTUMES[i];
      if(c.id<=100 || !c.image) continue;
      var card=document.createElement('article');
      card.className='card';
      var imageSrc=c.image+(c.imageVersion?'?v='+encodeURIComponent(c.imageVersion):'');
      card.innerHTML='<img class="photo" src="'+imageSrc+'" alt="'+c.name+'" loading="lazy"><div class="name"></div><div class="tags"></div>';
      grid.appendChild(card);
    }
  }
})();