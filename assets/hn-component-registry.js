(function(w){
'use strict';
var defs={
  hero:{label:'Hero',group:'Pagina',data:null,fields:['title','text','button','url']},
  intro:{label:'Intro',group:'Pagina',data:null,fields:['title','text']},
  text:{label:'Tekst',group:'Inhoud',data:null,fields:['title','text']},
  image:{label:'Afbeelding',group:'Inhoud',data:null,fields:['title','image','text']},
  cards:{label:'Kaarten',group:'Inhoud',data:null,fields:['title','cards']},
  cta:{label:'CTA',group:'Inhoud',data:null,fields:['title','text','button','url']},
  links:{label:'Links',group:'Inhoud',data:null,fields:['title','text']},
  navigation:{label:'HN Navigatie',group:'HN',data:'navigation',fields:['title','text','data_limit']},
  directory:{label:'HN Overzicht',group:'HN',data:'cities',fields:['title','text','data_source','data_limit']},
  articles:{label:'HN Artikelen',group:'HN',data:'topics',fields:['title','text','data_source','data_limit']},
  fiches:{label:'HN Fiches',group:'HN',data:'fiches',fields:['title','text','data_source','data_limit']},
  cities:{label:'HN Steden',group:'HN',data:'cities',fields:['title','text','data_source','data_limit']},
  categories:{label:'HN Categorieën',group:'HN',data:'categories',fields:['title','text','data_source','data_limit']},
  comparison:{label:'HN Vergelijking',group:'HN',data:'comparison',fields:['title','text']},
  steps:{label:'HN Stappen',group:'HN',data:'steps',fields:['title','text']},
  community:{label:'HN Community',group:'HN',data:'community',fields:['title','text']},
  divider:{label:'Scheidingslijn',group:'Layout',data:null,fields:[]},
  spacer:{label:'Ruimte',group:'Layout',data:null,fields:[]}
};
function id(type){return 'cmp-'+String(type||'component').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Math.random().toString(36).slice(2,9);}
function defaults(type){
  var d=defs[type]||defs.text;
  return {component_id:id(type),component_type:type,content:{title:d.label,text:'',url:'',button:'',image:'',cards:'',data_source:d.data||'',data_limit:6},settings:{visibility:true},data:{source:d.data||null,filters:{},limit:6}};
}
function normalize(s){
  s=s||{};var type=s.component_type||s.section_type||'text';var d=defaults(type);
  var c=Object.assign({},d.content,s.content||{});
  var idv=(s.content&&s.content.component_id)||s.component_id||d.component_id;
  c.component_id=idv;
  var data=Object.assign({},d.data,s.data||{});
  if(c.data_source&&!data.source)data.source=c.data_source;
  if(c.data_limit)data.limit=Number(c.data_limit)||6;
  return Object.assign({},s,{section_type:type,component_type:type,content:c,component_id:idv,data:data,settings:Object.assign({},d.settings,s.settings||{})});
}
function tree(sections){
  return (sections||[]).map(function(s,i){var n=normalize(s);return {id:n.component_id,type:n.component_type,order:i,visible:n.is_visible!==false,settings:n.settings||{},content:n.content||{},data:n.data||{}};});
}
w.HNComponentRegistry={definitions:defs,create:defaults,normalize:normalize,tree:tree};
})(window);
