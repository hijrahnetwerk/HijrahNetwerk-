/* HN global runtime: keeps dynamically rendered content usable on every viewport. */
(function(){
  'use strict';
  function enhance(root){
    root=root||document;
    root.querySelectorAll('img:not([loading])').forEach(function(img){
      if(!img.closest('.hero')) img.loading='lazy';
      img.decoding='async';
    });
    root.querySelectorAll('table').forEach(function(table){
      if(table.closest('.table-wrap,.responsive-table')) return;
      var wrap=document.createElement('div');
      wrap.className='responsive-table';
      table.parentNode.insertBefore(wrap,table);
      wrap.appendChild(table);
    });
    root.querySelectorAll('iframe').forEach(function(frame){
      if(frame.closest('.map,.map-container,.map-wrap,.embed,.video')) return;
      frame.style.maxWidth='100%';
    });
  }
  function init(){
    enhance(document);
    if(window.MutationObserver){
      var observer=new MutationObserver(function(records){
        records.forEach(function(record){
          record.addedNodes.forEach(function(node){
            if(node.nodeType===1) enhance(node);
          });
        });
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
