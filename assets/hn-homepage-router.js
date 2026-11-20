/* Resolves the admin-selected homepage at /. */
(function(){
'use strict';
var style=document.createElement('style');style.textContent='html{visibility:hidden!important}';document.head.appendChild(style);
function show(){document.documentElement.style.visibility='';style.remove();}
function load(src){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function run(){try{if(!window.__ENV)await load('/assets/config.js');if(!window.supabase||!window.supabase.createClient)await load('/assets/vendor/supabase-js-2.117.3.umd.js');var db=window.hijrahSupabase||window.supabase.createClient(window.__ENV.SUPABASE_URL,window.__ENV.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});var r=await db.from('hn_site_settings').select('value').eq('key','site').maybeSingle();var slug=r.data&&r.data.value&&r.data.value.homepage_slug;if(!r.error&&slug&&slug!=='startpagina'&&/^[a-z0-9-]+$/.test(slug)){var p=await db.from('hn_site_pages').select('status,settings,page_type').eq('slug',slug).maybeSingle();if(!p.error&&p.data&&p.data.status==='published'){location.replace(p.data.settings&&p.data.settings.builder_mode==='cms'?'/pagina/'+encodeURIComponent(slug):p.data.page_type==='landing'?'/pagina/'+encodeURIComponent(slug):'/'+encodeURIComponent(slug));return;}}if(!r.error&&slug==='startpagina'){var p2=await db.from('hn_site_pages').select('status').eq('slug','startpagina').maybeSingle();if(!p2.error&&p2.data&&p2.data.status==='published'){location.replace('/startpagina');return;}}}catch(e){console.warn('[HN homepage] Fallback naar standaard startpagina.',e);}show();}
run();setTimeout(show,7000);
})();
