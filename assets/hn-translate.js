(function(){
  if(window.hnTranslateLoaded)return;
  window.hnTranslateLoaded=true;
  window.googleTranslateElementInit=function(){
    var el=document.getElementById('google_translate_element');
    if(!el||!window.google||!google.translate)return;
    new google.translate.TranslateElement({
      pageLanguage:'nl',
      includedLanguages:'nl,fr,en,ar',
      autoDisplay:false,
      layout:google.translate.TranslateElement.InlineLayout.SIMPLE
    },'google_translate_element');
  };
  function mount(){
    if(document.getElementById('hn-language'))return;
    var wrap=document.createElement('div');
    wrap.id='hn-language';
    wrap.innerHTML='<span class="hn-language-label">Taal</span><div id="google_translate_element"></div>';
    document.body.appendChild(wrap);
    var s=document.createElement('script');
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async=true;
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();