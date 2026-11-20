/* HN page publication guard.
   Published pages are public; draft/private pages remain admin-only. */
(function () {
  'use strict';
  if (window.__HN_PRIVATE_GUARD_RUNNING) return;
  window.__HN_PRIVATE_GUARD_RUNNING = true;
  var style = document.createElement('style');
  style.id = 'hn-private-guard-style';
  style.textContent = 'html{visibility:hidden!important}';
  document.head.appendChild(style);
  function reveal(){var s=document.getElementById('hn-private-guard-style');if(s)s.remove();}
  function deny(){window.location.replace('/');}
  function loadScript(src){return new Promise(function(resolve,reject){var existing=document.querySelector('script[src="'+src+'"]');if(existing){if(window.supabase||window.hijrahSupabase){resolve();return;}existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}var script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});}
  async function getClient(){if(window.hijrahSupabase)return window.hijrahSupabase;if(!window.__ENV||!window.__ENV.SUPABASE_URL||!window.__ENV.SUPABASE_ANON_KEY)await loadScript('/assets/config.js');if(!window.supabase||!window.supabase.createClient)await loadScript('/assets/vendor/supabase-js-2.117.3.umd.js');if(!window.hijrahSupabase&&window.supabase&&window.supabase.createClient)window.hijrahSupabase=window.supabase.createClient(window.__ENV.SUPABASE_URL,window.__ENV.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return window.hijrahSupabase;}
  function pageSlug(){var p=location.pathname.replace(/\/$/,'').replace(/^\//,'');if(!p)return '';if(p.indexOf('pagina/')===0)return decodeURIComponent(p.slice(7));return p.replace(/\.html$/i,'').split('/').pop();}
  async function adminAccess(db){var result=await db.auth.getUser(),user=result&&result.data&&result.data.user;if(!user)return false;var p=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();return !p.error&&p.data&&p.data.role==='admin';}
  async function check(){try{var db=await getClient();if(!db)return deny();var slug=pageSlug();var page=await db.from('hn_site_pages').select('status').eq('slug',slug).maybeSingle();if(!page.error&&page.data&&page.data.status==='published'){reveal();return;}if(await adminAccess(db)){reveal();return;}deny();}catch(e){console.error('[HN] Publicatiecontrole kon niet worden uitgevoerd.',e);deny();}}
  check();
})();
