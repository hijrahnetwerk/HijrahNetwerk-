(function(w){
'use strict';
function safeUrl(value,mode){
  const raw=String(value??'').trim();
  if(!raw)return '#';
  if(raw.startsWith('/')&&!raw.startsWith('//'))return raw;
  if(raw.startsWith('#')||raw.startsWith('?'))return raw;
  try{
    const u=new URL(raw,location.origin);
    const protocol=u.protocol.toLowerCase();
    if(mode==='image'){
      if(protocol==='http:'||protocol==='https:')return u.href;
      return '#';
    }
    if(protocol==='http:'||protocol==='https:'||protocol==='mailto:'||protocol==='tel:')return u.href;
  }catch(e){}
  return '#';
}
w.hnSafeUrl=function(value){return safeUrl(value,'href')};
w.hnSafeImageUrl=function(value){return safeUrl(value,'image')};
})(window);