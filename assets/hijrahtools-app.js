/* HijrahTools — interactive tools, personal save state, HN catalog */
(function () {
  'use strict';
  var KEY = 'hn_hijrahtools_v1';
  var root = document.documentElement;
  var toolNames = {
    '1':'Mijn Hijrah-gereedheidscheck',
    '2':'Landen- en stedenvergelijker',
    '3':'Mijn Hijrah-stappenplan',
    '4':'Hijrah-budgetplanner',
    '5':'Welke stad past bij ons?',
    '6':'Documenten- en regelingencheck',
    '7':'Emotionele voorbereiding',
    '8':'Mijn wijk- en voorzieningenkaart',
    '9':'De ervaring van een andere zuster',
    '10':'Mijn persoonlijke Hijrah-dashboard'
  };
  var catalogSlug = {
    '1':'gereedheidscheck','2':'stedenvergelijker','3':'stappenplan','4':'budgetplanner',
    '5':'stadkeuzehulp','6':'documentencheck','7':'emotionele-voorbereiding',
    '8':'voorzieningenkaart','9':'zusterervaringen','10':'mijn-dashboard'
  };
  var phases = ['Oriëntatie','Onderzoeken','Voorbereiden','Vertrekken','Integreren'];
  var stepItems = [
    ['ori-reden','Oriëntatie','Mijn redenen en verwachtingen opgeschreven'],
    ['ori-gezin','Oriëntatie','Mijn gezinssituatie en verantwoordelijkheden in kaart gebracht'],
    ['ori-voorwaarden','Oriëntatie','Mijn belangrijkste voorwaarden bepaald'],
    ['onderzoek-land','Onderzoeken','Officiële verblijfsregels voor mijn bestemming onderzocht'],
    ['onderzoek-stad','Onderzoeken','Minstens twee steden of wijken vergeleken'],
    ['onderzoek-kosten','Onderzoeken','Woonkosten en dagelijkse uitgaven onderzocht'],
    ['onderzoek-zorg','Onderzoeken','Zorg en verzekeringen onderzocht'],
    ['onderzoek-school','Onderzoeken','Onderwijs en opvang onderzocht indien relevant'],
    ['voorbereid-budget','Voorbereiden','Vertrekbudget en financiële reserve berekend'],
    ['voorbereid-docs','Voorbereiden','Documenten en geldigheid gecontroleerd'],
    ['voorbereid-inkomen','Voorbereiden','Inkomen of werkmogelijkheden onderzocht'],
    ['voorbereid-woning','Voorbereiden','Tijdelijke of vaste huisvesting onderzocht'],
    ['vertrek-regelen','Vertrekken','Reisplanning en belangrijke afspraken vastgelegd'],
    ['vertrek-kopie','Vertrekken','Veilige kopieën van belangrijke documenten gemaakt'],
    ['aankomst-zorg','Integreren','Praktische zaken na aankomst op een rij gezet'],
    ['aankomst-netwerk','Integreren','Mogelijke steunbronnen en lokaal netwerk onderzocht']
  ];
  var readinessQuestions = [
    {id:'reason',group:'Persoonlijke voorbereiding',q:'Ik kan uitleggen waarom ik wil emigreren en wat ik ervan verwacht.'},
    {id:'family',group:'Persoonlijke voorbereiding',q:'Ik heb besproken wat de verhuizing betekent voor mijn gezin en verantwoordelijkheden.'},
    {id:'destination',group:'Onderzoek',q:'Ik onderzoek mijn bestemming op basis van betrouwbare informatie, niet alleen verhalen of vakantie-indrukken.'},
    {id:'legal',group:'Officiële zaken',q:'Ik weet welke officiële verblijfsregels ik nog moet controleren en waar ik dat kan doen.'},
    {id:'housing',group:'Praktische zaken',q:'Ik heb een realistisch beeld van huisvesting en dagelijkse kosten.'},
    {id:'income',group:'Financiën',q:'Ik heb mijn inkomen, spaargeld, uitgaven en financiële buffer in kaart gebracht.'},
    {id:'health',group:'Praktische zaken',q:'Ik heb onderzocht welke zorg, verzekeringen en eventuele ondersteuning nodig zijn.'},
    {id:'support',group:'Netwerk en welzijn',q:'Ik heb nagedacht over afscheid, steunbronnen en hoe ik na aankomst contact kan opbouwen.'}
  ];
  var compareCriteria = [
    {id:'cost',label:'Woon- en dagelijkse kosten'},
    {id:'housing',label:'Beschikbaarheid van huisvesting'},
    {id:'school',label:'Onderwijs en opvang'},
    {id:'health',label:'Zorg en verzekeringen'},
    {id:'language',label:'Taal en communicatie'},
    {id:'community',label:'Gemeenschap en voorzieningen'}
  ];
  var budgetGroups = [
    {key:'oneTime',title:'Eenmalige vertrekuitgaven',items:[
      ['tickets','Reis en tickets'],['documents','Documenten en administratie'],['deposit','Waarborg en eerste huur'],['setup','Inrichting en basisbenodigdheden'],['shipping','Verzending en bagage'],['otherOneTime','Overige eenmalige kosten']
    ]},
    {key:'monthly',title:'Maandelijkse uitgaven',items:[
      ['rent','Huur'],['utilities','Water, elektriciteit en internet'],['food','Boodschappen'],['transport','Vervoer'],['school','School en opvang'],['health','Zorg en verzekering'],['phone','Telefoon'],['otherMonthly','Overige maandelijkse kosten']
    ]}
  ];
  var defaultDocs = [
    ['passport','Paspoorten en geldigheid'],
    ['civil','Geboorte-, huwelijks- en andere burgerlijke documenten'],
    ['residency','Verblijfsrecht, visum of verblijfsprocedure'],
    ['translations','Vertalingen, legalisatie of apostille indien vereist'],
    ['children','Documenten voor kinderen en ouderlijke toestemming indien relevant'],
    ['school','Schoolrapporten, diploma’s of inschrijvingsdocumenten indien relevant'],
    ['health','Medische dossiers, vaccinatiegegevens en voorschriften indien relevant'],
    ['insurance','Zorgverzekering en dekking na vertrek'],
    ['bank','Bankzaken, belastingzaken en financiële verplichtingen'],
    ['driving','Rijbewijs en voertuigdocumenten indien relevant'],
    ['housing','Huurcontracten, opzegtermijnen en bewijsstukken'],
    ['copies','Veilige digitale en papieren kopieën']
  ];
  var defaultState = {
    version:1, selectedTools:[],
    readiness:{answers:{},result:null},
    comparator:{cities:[{name:'',ratings:{}},{name:'',ratings:{}},{name:'',ratings:{}}],notes:''},
    steps:{checked:{},notes:''},
    budget:{currency:'EUR',savings:0,monthlyIncome:0,oneTime:{},monthly:{}},
    fit:{cities:[{name:'',ratings:{}},{name:'',ratings:{}},{name:'',ratings:{}}],weights:{cost:3,housing:3,school:3,health:3,language:2,community:3},notes:''},
    documents:{destination:'',family:'',items:defaultDocs.map(function(x){return {key:x[0],label:x[1],status:'onderzoeken',source:'',notes:''};})},
    reflection:{answers:{},support:[],confidence:3,nextStep:''},
    locations:{items:[]},
    experiences:{query:'',kind:'all',country:'',city:''},
    dashboard:{hiddenPanels:[]}
  };
  var state = clone(defaultState);
  var sessionUser = null;
  var existingPlanData = {};
  var saveTimer = null;
  var catalog = {};
  var experienceRows = [];
  var countries = [];
  var cities = [];
  var dialog, dialogTitle, dialogBody, saveStatus;
  var currentTool = null;
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function merge(base, extra) {
    if (!extra || typeof extra !== 'object') return clone(base);
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(extra).forEach(function (key) {
      if (extra[key] && typeof extra[key] === 'object' && !Array.isArray(extra[key]) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) out[key] = merge(base[key], extra[key]);
      else out[key] = extra[key];
    });
    return out;
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function safeUrl(value) {
    try { var u = new URL(String(value || ''), window.location.origin); return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : ''; }
    catch (e) { return ''; }
  }
  function money(value, currency) {
    var n = Number(value || 0);
    try { return new Intl.NumberFormat('nl-NL',{style:'currency',currency:currency||'EUR',maximumFractionDigits:2}).format(n); }
    catch (e) { return (Math.round(n*100)/100).toFixed(2)+' '+(currency||'EUR'); }
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (cur, key) { return cur == null ? undefined : cur[key]; }, obj);
  }
  function setPath(obj, path, value) {
    var parts = path.split('.'), cur = obj;
    for (var i=0;i<parts.length-1;i++) {
      if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = /^\d+$/.test(parts[i]) ? [] : {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length-1]] = value;
  }
  function value(path, fallback) {
    var v = getPath(state,path);
    return v == null ? (fallback == null ? '' : fallback) : v;
  }
  function bind(path, val, type) {
    var v = value(path, val == null ? '' : val);
    if (type === 'checked') return ' data-bind="'+esc(path)+'" type="checkbox"'+(v ? ' checked' : '');
    return ' data-bind="'+esc(path)+'" value="'+esc(v)+'"';
  }
  function selectOptions(options, selected) {
    return options.map(function (o) {
      var v = typeof o === 'string' ? o : o.value, label = typeof o === 'string' ? o : o.label;
      return '<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(label)+'</option>';
    }).join('');
  }
  function field(label, path, type, opts) {
    opts = opts || {};
    var v = value(path, opts.defaultValue);
    var html = '<div class="hnt-field"><label for="hnt-'+esc(path.replace(/\./g,'-'))+'">'+esc(label)+'</label>';
    if (type === 'textarea') {
      html += '<textarea id="hnt-'+esc(path.replace(/\./g,'-'))+'" data-bind="'+esc(path)+'" rows="'+(opts.rows||3)+'" placeholder="'+esc(opts.placeholder||'')+'">'+esc(v)+'</textarea>';
    } else if (type === 'select') {
      html += '<select id="hnt-'+esc(path.replace(/\./g,'-'))+'" data-bind="'+esc(path)+'">'+selectOptions(opts.options||[],v)+'</select>';
    } else if (type === 'range') {
      html += '<div class="hnt-range"><input id="hnt-'+esc(path.replace(/\./g,'-'))+'" type="range" min="'+(opts.min||1)+'" max="'+(opts.max||5)+'" step="1" data-bind="'+esc(path)+'" value="'+esc(v===''?(opts.defaultValue||3):v)+'"><output>'+esc(v||opts.defaultValue||3)+'</output></div>';
    } else {
      html += '<input id="hnt-'+esc(path.replace(/\./g,'-'))+'" type="'+(type||'text')+'" data-bind="'+esc(path)+'" value="'+esc(v)+'" '+(opts.min!=null?'min="'+opts.min+'" ':'')+(opts.step?'step="'+opts.step+'" ':'')+(opts.placeholder?'placeholder="'+esc(opts.placeholder)+'" ':'')+(opts.required?'required ':'')+'>';
    }
    if (opts.help) html += '<small>'+esc(opts.help)+'</small>';
    return html+'</div>';
  }
  function bindCheckbox(path, label, checked) {
    var v = value(path, !!checked);
    return '<label class="hnt-check"><input type="checkbox" data-bind="'+esc(path)+'"'+(v?' checked':'')+'><span>'+esc(label)+'</span></label>';
  }
  function shell(id, intro, body, submitLabel) {
    return '<form class="hnt-form" data-tool-form="'+id+'"><p class="hnt-intro">'+intro+'</p>'+body+'<div class="hnt-form-actions"><button type="submit" class="hnt-primary">'+esc(submitLabel||'Bereken / bekijk resultaat')+'</button><span class="hnt-save-inline" data-save-inline></span></div><div class="hnt-result" data-result hidden aria-live="polite"></div></form>';
  }
  function renderReadiness() {
    var body = '<div class="hnt-progress-note">Kies per stelling hoe goed dit op dit moment bij jouw situatie past. Je hoeft niet alles al geregeld te hebben.</div>';
    readinessQuestions.forEach(function (q,i) {
      body += '<fieldset class="hnt-question"><legend><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(q.q)+'</legend><div class="hnt-options">';
      [{v:'1',t:'Nog niet'}, {v:'2',t:'Deels'}, {v:'3',t:'Grotendeels'}, {v:'4',t:'Goed uitgezocht'}].forEach(function (o) {
        body += '<label><input type="radio" name="answer-'+q.id+'" data-bind="readiness.answers.'+q.id+'" value="'+o.v+'"'+(String(value('readiness.answers.'+q.id,''))===o.v?' checked':'')+'><span>'+o.t+'</span></label>';
      });
      body += '</div><small>'+esc(q.group)+'</small></fieldset>';
    });
    body += '<p class="hnt-disclaimer">Dit is een reflectiehulpmiddel, geen oordeel of besluit om wel of niet te emigreren.</p>';
    return shell('1','Beantwoord de stellingen om te zien welke onderwerpen al duidelijk zijn en welke nog onderzoek vragen.',body,'Bekijk mijn aandachtspunten');
  }
  function renderCityRows(path, label) {
    var rows = '';
    for (var i=0;i<3;i++) {
      var city = value(path+'.cities.'+i,{name:'',ratings:{}});
      rows += '<div class="hnt-city-card"><h4>'+label+' '+(i+1)+'</h4>'+field('Stad / wijk',path+'.cities.'+i+'.name','text',{placeholder:'Vul zelf een stad in'})+'<div class="hnt-rating-grid">';
      compareCriteria.forEach(function(c) {
        rows += '<div class="hnt-field"><label for="hnt-'+path.replace(/\./g,'-')+'-'+i+'-'+c.id+'">'+esc(c.label)+'</label><select id="hnt-'+path.replace(/\./g,'-')+'-'+i+'-'+c.id+'" data-bind="'+path+'.cities.'+i+'.ratings.'+c.id+'">'+selectOptions([{value:'',label:'Nog onbekend'},{value:'1',label:'1 · ongunstig'},{value:'2',label:'2'},{value:'3',label:'3 · gemiddeld'},{value:'4',label:'4'},{value:'5',label:'5 · gunstig'}], city.ratings && city.ratings[c.id] != null ? city.ratings[c.id] : '')+'</select></div>';
      });
      rows += '</div></div>';
    }
    return rows;
  }
  function renderComparator() {
    var body = '<p class="hnt-note">Vul alleen in wat je zelf hebt onderzocht. Een lege score blijft onbekend; Hijrah Netwerk verzint geen prijzen of feiten.</p>';
    body += '<div class="hnt-city-grid">'+renderCityRows('comparator','Stad')+'</div>';
    body += field('Notities en bronnen om later te controleren','comparator.notes','textarea',{rows:3,placeholder:'Bijvoorbeeld: officiële huurdata nog zoeken, schoolbezoek plannen...'});
    return shell('2','Vergelijk maximaal drie steden met dezelfde criteria, zodat je verschillen naast elkaar kunt zien.',body,'Maak vergelijking');
  }
  function renderSteps() {
    var checked = state.steps.checked || {}, total = stepItems.length, done = stepItems.filter(function(s){return !!checked[s[0]];}).length;
    var body = '<div class="hnt-progress-wrap"><div class="hnt-progress-label"><strong>'+done+' van '+total+' stappen</strong><span>'+Math.round(done/total*100)+'%</span></div><div class="hnt-progress"><span style="width:'+Math.round(done/total*100)+'%"></span></div></div>';
    phases.forEach(function (phase) {
      var items = stepItems.filter(function(s){return s[1]===phase;});
      if (!items.length) return;
      body += '<section class="hnt-step-group"><h4>'+esc(phase)+'</h4>';
      items.forEach(function(s) { body += bindCheckbox('steps.checked.'+s[0],s[2],false); });
      body += '</section>';
    });
    body += field('Mijn notities bij het stappenplan','steps.notes','textarea',{rows:4,placeholder:'Wat moet ik nog uitzoeken, bespreken of regelen?'});
    body += '<p class="hnt-note">Dit is een algemene basischecklist. Pas de stappen aan jouw gezin, bestemming en officiële voorwaarden aan.</p>';
    return shell('3','Werk in je eigen tempo. Je kunt stappen afvinken en je notities worden automatisch bewaard.',body,'Bewaar mijn voortgang');
  }
  function renderBudget() {
    var body = '<div class="hnt-grid-2">'+field('Valuta','budget.currency','select',{options:[{value:'EUR',label:'EUR · euro'},{value:'MAD',label:'MAD · Marokkaanse dirham'},{value:'EGP',label:'EGP · Egyptische pond'},{value:'USD',label:'USD · Amerikaanse dollar'},{value:'GBP',label:'GBP · Britse pond'}]})+field('Beschikbaar spaargeld','budget.savings','number',{min:0,step:'0.01',defaultValue:0})+field('Verwacht maandinkomen na vertrek','budget.monthlyIncome','number',{min:0,step:'0.01',defaultValue:0})+'</div>';
    budgetGroups.forEach(function(g) {
      body += '<section class="hnt-budget-group"><h4>'+esc(g.title)+'</h4><div class="hnt-grid-2">';
      g.items.forEach(function(it){body += field(it[1], 'budget.'+g.key+'.'+it[0], 'number',{min:0,step:'0.01',defaultValue:0});});
      body += '</div></section>';
    });
    body += '<div class="hnt-budget-summary" id="hnt-budget-live"></div><p class="hnt-note">Vul bedragen in één gekozen valuta in. Er wordt geen wisselkoers opgehaald of verondersteld.</p>';
    return shell('4','Bereken hoeveel je vertrek ongeveer kost en hoe groot je maandelijkse buffer is. De uitkomst hangt af van jouw eigen invoer.',body,'Bereken mijn budget');
  }
  function renderFit() {
    var body = '<p class="hnt-note">Geef elk criterium een gewicht (1 = minder belangrijk, 5 = zeer belangrijk). Beoordeel steden alleen op basis van jouw eigen onderzoek. De tool bepaalt niet objectief welke stad het beste is.</p>';
    body += '<section class="hnt-budget-group"><h4>Wat weegt voor mij het zwaarst?</h4><div class="hnt-grid-2">';
    compareCriteria.forEach(function(c){body += field(c.label,'fit.weights.'+c.id,'range',{min:1,max:5,defaultValue:3});});
    body += '</div></section><div class="hnt-city-grid">'+renderCityRows('fit','Kandidaat')+'</div>';
    body += field('Wat moet ik nog verifiëren?','fit.notes','textarea',{rows:3,placeholder:'Welke informatie ontbreekt nog per stad?'});
    return shell('5','Maak je persoonlijke prioriteiten zichtbaar en vergelijk je eigen inschatting van maximaal drie steden.',body,'Vergelijk mijn prioriteiten');
  }
  function renderDocuments() {
    var body = '<div class="hnt-grid-2">'+field('Land of bestemming','documents.destination','text',{placeholder:'Bijvoorbeeld Marokko'})+field('Gezinssituatie','documents.family','select',{options:[{value:'',label:'Kies indien van toepassing'},{value:'alleen',label:'Ik verhuis alleen'},{value:'partner',label:'Met partner'},{value:'kinderen',label:'Met kinderen'},{value:'gezin',label:'Met partner en kinderen'}]})+'</div>';
    body += '<p class="hnt-note">Dit is een onderzoekschecklist, geen officiële lijst van verplichte documenten. Wat nodig is, hangt af van nationaliteit, verblijfsroute, gezinssituatie en bestemming.</p><div class="hnt-doc-list">';
    (state.documents.items||[]).forEach(function(it,i) {
      body += '<article class="hnt-doc-row"><div class="hnt-doc-title"><strong>'+esc(it.label)+'</strong><label class="hnt-doc-status"><span class="sr-only">Status voor '+esc(it.label)+'</span><select data-bind="documents.items.'+i+'.status">'+selectOptions([{value:'onderzoeken',label:'Nog onderzoeken'},{value:'bron-gevonden',label:'Bron gevonden'},{value:'officieel-bevestigd',label:'Officieel bevestigd'},{value:'niet-van-toepassing',label:'Niet van toepassing'}],it.status||'onderzoeken')+'</select></label></div><div class="hnt-grid-2">'+field('Officiële bronlink','documents.items.'+i+'.source','url',{placeholder:'https://...'})+field('Notitie','documents.items.'+i+'.notes','text',{placeholder:'Geldigheid, afspraak, vraag...'})+'</div></article>';
    });
    body += '</div><div class="hnt-add-row"><input id="hnt-new-doc" type="text" maxlength="160" placeholder="Eigen document of controle toevoegen"><button type="button" class="hnt-secondary" data-add-doc>Voeg toe</button></div>';
    return shell('6','Houd per document bij wat je nog moet onderzoeken en noteer de officiële bron die je hebt gecontroleerd.',body,'Bewaar documentcheck');
  }
  function renderReflection() {
    var prompts = [
      ['expectations','Wat hoop ik dat emigratie verandert? Wat verwacht ik dat hetzelfde blijft?'],
      ['worries','Waar maak ik me op dit moment het meest zorgen over?'],
      ['family','Wat moet ik met mijn partner, kinderen of familie bespreken?'],
      ['support','Bij wie kan ik terecht voor praktische of emotionele steun?'],
      ['missing','Wat weet ik nog niet en hoef ik vandaag nog niet op te lossen?']
    ];
    var body = '<div class="hnt-field"><label for="hnt-confidence">Hoeveel overzicht voel ik op dit moment?</label><div class="hnt-range"><input id="hnt-confidence" type="range" min="1" max="5" data-bind="reflection.confidence" value="'+esc(value('reflection.confidence',3))+'"><output>'+esc(value('reflection.confidence',3))+'</output></div><small>1 = weinig overzicht · 5 = veel overzicht. Dit is alleen een eigen reflectie.</small></div>';
    prompts.forEach(function(p){body += field(p[1],'reflection.answers.'+p[0],'textarea',{rows:3,placeholder:'Schrijf alleen op wat je wilt bewaren.'});});
    body += field('Wie of wat kan mij ondersteunen?','reflection.supportText','textarea',{rows:2,placeholder:'Een vertrouwd persoon, betrouwbare informatie, praktische hulp...'});
    body += field('Eén kleine volgende stap','reflection.nextStep','text',{placeholder:'Bijvoorbeeld: met mijn partner het budget bespreken.'});
    body += '<p class="hnt-note">Je antwoorden zijn privé in je eigen toolopslag. Deel ze alleen bewust met iemand anders.</p>';
    return shell('7','Neem even de tijd om verwachtingen, zorgen en steunbronnen op papier te zetten. Je hoeft niet alles tegelijk op te lossen.',body,'Bewaar mijn reflectie');
  }
  function renderLocations() {
    var items = state.locations.items || [];
    var body = '<p class="hnt-note">Voeg zelf onderzochte voorzieningen toe. Deze lijst is persoonlijk; er worden geen locaties automatisch geverifieerd.</p>';
    body += '<div class="hnt-location-form">';
    body += field('Naam van locatie','locations.draft.name','text',{placeholder:'Naam van school, zorgpunt, moskee of winkel'});
    body += '<div class="hnt-grid-2">'+field('Categorie','locations.draft.category','select',{options:['School / opvang','Zorg','Moskee','Winkel','Vervoer','Netwerk / contact','Woning','Overig'].map(function(x){return {value:x,label:x};})})+field('Stad of wijk','locations.draft.city','text',{placeholder:'Stad, wijk of buurt'})+'</div>';
    body += '<div class="hnt-grid-2">'+field('Adres of herkenningspunt','locations.draft.address','text',{placeholder:'Adres of omschrijving'})+field('Website of bronlink','locations.draft.url','url',{placeholder:'https://...'})+'</div>';
    body += field('Aandachtspunt / ervaring','locations.draft.notes','textarea',{rows:2,placeholder:'Wat moet je nog controleren? Is dit jouw eigen ervaring?'});
    body += '<button type="button" class="hnt-primary" data-add-location>Voeg locatie toe</button></div>';
    body += '<div class="hnt-location-list">';
    if (!items.length) body += '<p class="hnt-empty">Je hebt nog geen voorzieningen toegevoegd.</p>';
    items.forEach(function(it,i) {
      var url = safeUrl(it.url);
      var maps = it.address || it.city || it.name;
      body += '<article class="hnt-location-card"><div><span class="hnt-tag">'+esc(it.category||'Overig')+'</span><h4>'+esc(it.name)+'</h4><p>'+esc([it.city,it.address].filter(Boolean).join(' · '))+'</p><p>'+esc(it.notes||'')+'</p></div><div class="hnt-card-actions">'+(url?'<a class="hnt-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Bron openen ↗</a>':'')+(maps?'<a class="hnt-link" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(maps)+'" target="_blank" rel="noopener noreferrer">Zoek op kaart ↗</a>':'')+'<button type="button" class="hnt-danger" data-delete-location="'+i+'">Verwijderen</button></div></article>';
    });
    body += '</div>';
    return shell('8','Bewaar zelf gevonden voorzieningen per stad of wijk en noteer wat je nog moet controleren.',body,'Bewaar voorzieningen');
  }
  function renderExperiences() {
    var body = '<div class="hnt-grid-2">'+field('Zoek op onderwerp, stad of land','experiences.query','search',{placeholder:'Bijvoorbeeld school, huur, Tanger...'})+field('Type informatie','experiences.kind','select',{options:[{value:'all',label:'Alle gepubliceerde informatie'},{value:'ervaring',label:'Ervaringen / reviews'},{value:'officieel',label:'Officiële informatie'},{value:'aanbeveling',label:'Aanbevelingen'}]})+'</div>';
    body += '<div class="hnt-grid-2">'+field('Land (optioneel)','experiences.country','text',{placeholder:'Land'})+field('Stad (optioneel)','experiences.city','text',{placeholder:'Stad'})+'</div>';
    body += '<div class="hnt-experience-tools"><button type="button" class="hnt-primary" data-search-experiences>Zoek ervaringen</button><a class="hnt-link" href="/verhalen">Open alle HN-verhalen ↗</a></div>';
    body += '<div id="hnt-experience-results" class="hnt-experience-results"><p class="hnt-loading">Gepubliceerde HN-informatie laden…</p></div>';
    body += '<p class="hnt-note">Een persoonlijke ervaring is geen garantie dat de situatie voor jou hetzelfde is. Officiële regels controleer je altijd bij de bevoegde instantie.</p>';
    return shell('9','Doorzoek gepubliceerde HN-informatie. De tool toont geen verzonnen verhalen en maakt zichtbaar wanneer informatie een persoonlijke ervaring is.',body,'Zoek ervaringen');
  }
  function renderDashboard() {
    var stepDone = stepItems.filter(function(s){return !!state.steps.checked[s[0]];}).length;
    var docsDone = (state.documents.items||[]).filter(function(d){return d.status==='officieel-bevestigd'||d.status==='niet-van-toepassing';}).length;
    var locations = (state.locations.items||[]).length;
    var selected = state.selectedTools||[];
    var savings = Number(state.budget.savings||0);
    var monthly = Number(state.budget.monthlyIncome||0);
    var monthlyCosts = Object.keys(state.budget.monthly||{}).reduce(function(sum,k){return sum+Number(state.budget.monthly[k]||0);},0);
    var cards = [
      ['stappen','Stappenplan',stepDone+' / '+stepItems.length+' stappen afgerond','3'],
      ['budget','Budgetplanner',money(savings,state.budget.currency)+' spaargeld · '+money(monthly-monthlyCosts,state.budget.currency)+' maandelijks saldo','4'],
      ['docs','Documentencheck',docsDone+' / '+(state.documents.items||[]).length+' items bevestigd of niet van toepassing','6'],
      ['locations','Voorzieningen',locations+' eigen locaties bewaard','8'],
      ['selected','Gekozen tools',selected.length+' tools gekozen','']
    ];
    var body = '<div class="hnt-dashboard-grid">';
    cards.forEach(function(c) {
      if ((state.dashboard.hiddenPanels||[]).indexOf(c[0])!==-1) return;
      body += '<article class="hnt-dashboard-card"><h4>'+esc(c[1])+'</h4><p>'+esc(c[2])+'</p>'+(c[3]?'<button type="button" class="hnt-secondary" data-open-tool="'+c[3]+'">Open onderdeel</button>':'')+'</article>';
    });
    body += '</div><div class="hnt-dashboard-actions"><button type="button" class="hnt-primary" data-export>Exporteer mijn gegevens (JSON)</button><button type="button" class="hnt-secondary" data-reset-tool-data>Wis mijn toolgegevens</button></div>';
    body += '<p class="hnt-note">Dit overzicht gebruikt gegevens die je in HijrahTools hebt ingevuld. Het is geen beoordeling van je geschiktheid om te emigreren.</p>';
    return shell('10','Je persoonlijke overzicht brengt je eigen voortgang en ingevoerde gegevens bij elkaar.',body,'Ververs overzicht');
  }
  function renderTool(id) {
    var renderers = {'1':renderReadiness,'2':renderComparator,'3':renderSteps,'4':renderBudget,'5':renderFit,'6':renderDocuments,'7':renderReflection,'8':renderLocations,'9':renderExperiences,'10':renderDashboard};
    return (renderers[id] || renderDashboard)();
  }
  function injectStyles() {
    var css = [
      '.hn-tools-page{--hnt-gold:#C6A15B;--hnt-gold-light:#E4CA84;--hnt-brown:#674C2E;--hnt-rust:#DD842A}',
      '.hn-tool-launch{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;border:1px solid #9B7735;border-radius:9px;padding:10px 13px;background:linear-gradient(135deg,#E4CA84,#C6A15B);color:#392A18;font-weight:700;cursor:pointer;min-height:42px}',
      '.hn-tool-launch:hover{background:linear-gradient(135deg,#EBD79E,#D8B665)}',
      '.hnt-dialog{width:min(940px,calc(100% - 24px));max-width:940px;max-height:calc(100dvh - 24px);padding:0;border:1px solid #C6A15B;border-radius:20px;color:#674C2E;background:#fff;box-shadow:0 24px 80px #20170e66}',
      '.hnt-dialog::backdrop{background:rgba(32,24,16,.66);backdrop-filter:blur(3px)}',
      '.hnt-dialog-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:22px 24px;background:linear-gradient(115deg,#674C2E,#8A6435 70%,#C6A15B);color:#fff;border-bottom:3px solid #D8B665}',
      '.hnt-dialog-head h2{margin:0;font-size:clamp(21px,3vw,30px);line-height:1.2}.hnt-dialog-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#FFE6A8;margin-bottom:7px}',
      '.hnt-dialog-close{flex:0 0 auto;border:1px solid #f8e5b7;background:transparent;color:#fff;border-radius:50%;width:38px;height:38px;font-size:24px;line-height:1;cursor:pointer}',
      '.hnt-dialog-body{padding:22px 24px 28px;overflow:auto;max-height:calc(100dvh - 150px)}',
      '.hnt-dialog-status{padding:9px 24px;background:#FBF6E9;border-bottom:1px solid #E8D5A7;font-size:12px;color:#674C2E}',
      '.hnt-form{display:block}.hnt-intro{font-size:15px;line-height:1.65;margin:0 0 18px}.hnt-note,.hnt-disclaimer{font-size:13px;line-height:1.6;background:#FBF7EE;border-left:3px solid #C6A15B;padding:11px 13px;border-radius:0 8px 8px 0;margin:12px 0 18px}.hnt-disclaimer{background:#fff8ed}',
      '.hnt-field{display:flex;flex-direction:column;gap:7px;margin:0 0 14px;min-width:0}.hnt-field label{font-size:13px;font-weight:700}.hnt-field input,.hnt-field textarea,.hnt-field select,.hnt-doc-status select{width:100%;min-height:42px;padding:10px 11px;border:1px solid #d8cbb7;border-radius:9px;background:#fff;color:#3d3023;font:inherit;box-sizing:border-box}.hnt-field textarea{resize:vertical}.hnt-field input:focus-visible,.hnt-field textarea:focus-visible,.hnt-field select:focus-visible,.hnt-primary:focus-visible,.hnt-secondary:focus-visible,.hnt-danger:focus-visible,.hnt-link:focus-visible,.hnt-dialog-close:focus-visible{outline:3px solid #D8B665;outline-offset:2px}.hnt-field small,.hnt-field .hint{font-size:12px;color:#716252;line-height:1.5}',
      '.hnt-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.hnt-city-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.hnt-city-card,.hnt-budget-group,.hnt-step-group{border:1px solid #e4d7c1;border-radius:13px;padding:15px;margin:0 0 15px;background:#fffdf8}.hnt-city-card h4,.hnt-budget-group h4,.hnt-step-group h4{margin:0 0 13px;font-size:16px;color:#674C2E}.hnt-rating-grid{display:grid;grid-template-columns:1fr;gap:0}.hnt-rating-grid .hnt-field{margin-bottom:10px}',
      '.hnt-progress-wrap{margin:0 0 20px}.hnt-progress-label{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:7px}.hnt-progress{height:10px;border-radius:99px;background:#f0e8d9;overflow:hidden}.hnt-progress span{display:block;height:100%;background:linear-gradient(90deg,#9B7735,#D8B665);border-radius:99px}.hnt-check{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid #eee5d7;line-height:1.5}.hnt-check input{margin-top:4px;accent-color:#9B7735;width:18px;height:18px;flex:0 0 auto}.hnt-question{border:1px solid #e7dccb;border-radius:12px;padding:14px;margin:0 0 12px}.hnt-question legend{font-weight:700;line-height:1.5;padding:0 5px}.hnt-question legend span{display:inline-grid;place-items:center;background:#F3E4BC;color:#5b421d;border:1px solid #d1b56e;border-radius:8px;width:30px;height:28px;margin-right:9px;font-size:11px}.hnt-options{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 5px}.hnt-options label{display:flex;align-items:center;gap:6px;border:1px solid #e0d3c0;border-radius:8px;padding:8px 10px;font-size:12px;cursor:pointer}.hnt-options input{accent-color:#9B7735}.hnt-question small{font-size:11px;color:#756d63}',
      '.hnt-range{display:flex;align-items:center;gap:12px}.hnt-range input{accent-color:#9B7735;min-width:0}.hnt-range output{display:grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:#F3E4BC;font-weight:700}',
      '.hnt-form-actions,.hnt-dashboard-actions,.hnt-experience-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}.hnt-primary,.hnt-secondary,.hnt-danger{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-radius:9px;padding:10px 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}.hnt-primary{border:1px solid #9B7735;background:linear-gradient(130deg,#E4CA84,#C6A15B);color:#392A18}.hnt-secondary{border:1px solid #b7a68d;background:#fff;color:#674C2E}.hnt-danger{border:1px solid #cda39a;background:#fff8f6;color:#8a3024}.hnt-primary:hover,.hnt-secondary:hover,.hnt-danger:hover{filter:brightness(.98)}.hnt-save-inline{font-size:12px;color:#6c5b43}.hnt-result{border:1px solid #D8B665;background:linear-gradient(135deg,#fffdf7,#f8edcf);padding:18px;border-radius:14px;margin-top:20px;line-height:1.6}.hnt-result h3{margin:0 0 10px}.hnt-result h4{margin:15px 0 7px}.hnt-result ul{padding-left:22px}.hnt-score{font-size:27px;font-weight:800;color:#674C2E}.hnt-result-row{padding:10px 0;border-bottom:1px solid #e8d7ad}.hnt-result-row:last-child{border-bottom:0}',
      '.hnt-budget-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}.hnt-budget-metric{padding:13px;border-radius:11px;background:#f9f1df;border:1px solid #e1c985}.hnt-budget-metric span{display:block;font-size:11px;color:#65543b;margin-bottom:6px}.hnt-budget-metric strong{font-size:18px;overflow-wrap:anywhere}.hnt-doc-row{border:1px solid #e5dac8;border-radius:12px;padding:14px;margin-bottom:12px}.hnt-doc-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.hnt-doc-status{min-width:180px}.hnt-doc-status select{min-height:36px;padding:6px;font-size:12px}.hnt-add-row{display:flex;gap:8px;margin:16px 0}.hnt-add-row input{flex:1;min-width:0;border:1px solid #d8cbb7;border-radius:9px;padding:10px}',
      '.hnt-table-wrap{overflow-x:auto}.hnt-compare-table{width:100%;border-collapse:collapse;min-width:520px}.hnt-compare-table th,.hnt-compare-table td{padding:10px;border-bottom:1px solid #e8ddcc;text-align:left;font-size:13px}.hnt-compare-table th{background:#fbf5e8}.hnt-unknown{color:#88765d;font-style:italic}.hnt-location-form{padding:16px;border:1px solid #e4d7c1;border-radius:13px;background:#fffdf8}.hnt-location-list{margin-top:16px}.hnt-location-card{display:flex;justify-content:space-between;gap:18px;padding:15px 0;border-bottom:1px solid #e8ddcc}.hnt-location-card h4{margin:8px 0 5px}.hnt-location-card p{margin:4px 0;font-size:13px;line-height:1.5}.hnt-tag{display:inline-block;border:1px solid #d3b76d;background:#f5e7c0;color:#5a421e;padding:4px 8px;border-radius:99px;font-size:11px}.hnt-card-actions{display:flex;align-items:flex-start;flex-direction:column;gap:8px;min-width:140px}.hnt-link{color:#755019;font-weight:700;font-size:13px}.hnt-empty,.hnt-loading{padding:18px;border:1px dashed #d9c8ac;border-radius:10px;color:#756d63;text-align:center}',
      '.hnt-experience-card{border:1px solid #e3d5bf;border-radius:12px;padding:15px;margin:0 0 12px;background:#fff}.hnt-experience-card h4{margin:8px 0;font-size:17px}.hnt-experience-card p{line-height:1.6;font-size:13px}.hnt-meta{font-size:11px;color:#74634d}.hnt-dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hnt-dashboard-card{border:1px solid #dfc989;border-radius:12px;padding:16px;background:linear-gradient(140deg,#fffdf8,#f8efda)}.hnt-dashboard-card h4{margin:0 0 7px}.hnt-dashboard-card p{font-size:13px;line-height:1.5;min-height:36px}.hnt-dashboard-card button{margin-top:8px}',
      '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
      '@media(max-width:700px){.hnt-dialog{width:calc(100% - 12px);max-height:calc(100dvh - 12px);border-radius:14px}.hnt-dialog-head{padding:17px}.hnt-dialog-body{padding:16px;max-height:calc(100dvh - 130px)}.hnt-grid-2,.hnt-city-grid,.hnt-budget-summary,.hnt-dashboard-grid{grid-template-columns:1fr}.hnt-doc-title,.hnt-location-card{align-items:flex-start;flex-direction:column}.hnt-doc-status{width:100%}.hnt-add-row{flex-direction:column}.hnt-card-actions{flex-direction:row;flex-wrap:wrap}.hn-tool-launch{width:100%}}',
      '@media(prefers-reduced-motion:reduce){.hnt-dialog *{scroll-behavior:auto!important;transition:none!important}}'
    ].join('\n');
    var style = document.createElement('style'); style.id='hnt-styles'; style.textContent=css; document.head.appendChild(style);
  }
  function ensureDialog() {
    dialog = document.getElementById('hnt-dialog');
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className='hnt-dialog';
    dialog.id='hnt-dialog';
    dialog.setAttribute('aria-labelledby','hnt-dialog-title');
    dialog.innerHTML='<div class="hnt-dialog-head"><div><div class="hnt-dialog-kicker">HijrahTools · jouw werkruimte</div><h2 id="hnt-dialog-title">Interactieve tool</h2></div><button type="button" class="hnt-dialog-close" aria-label="Sluiten">×</button></div><div id="hnt-dialog-status" class="hnt-dialog-status" role="status">Je voortgang wordt voorbereid…</div><div id="hnt-dialog-body" class="hnt-dialog-body"></div>';
    document.body.appendChild(dialog);
    dialogTitle=$('#hnt-dialog-title',dialog); dialogBody=$('#hnt-dialog-body',dialog); saveStatus=$('#hnt-dialog-status',dialog);
    $('.hnt-dialog-close',dialog).addEventListener('click',function(){dialog.close();});
    dialog.addEventListener('click',function(e){if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',function(){currentTool=null;});
  }
  function setSaveStatus(text) {
    if (saveStatus) saveStatus.textContent=text;
  }
  function openTool(id) {
    if (!toolNames[id]) return;
    currentTool=id; ensureDialog();
    dialogTitle.textContent=(catalog[catalogSlug[id]]&&catalog[catalogSlug[id]].title)||toolNames[id];
    dialogBody.innerHTML=renderTool(id);
    setSaveStatus(sessionUser?'Je voortgang wordt bewaard in je HN-account.':'Je kunt de tool gebruiken; zonder inloggen blijft de voortgang in deze browser.');
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','open');
    if (id==='4') updateBudgetSummary();
    if (id==='9') {renderExperienceResults();loadExperiences();}
    var first = $('input,select,textarea,button',dialogBody);
    if (first) first.focus({preventScroll:true});
  }
  function applyCatalog(rows) {
    rows.forEach(function(row){catalog[row.slug]=row;});
    Object.keys(catalogSlug).forEach(function(id){
      var slug=catalogSlug[id], row=catalog[slug], card=$('.hn-tool-card[data-tool-id="'+id+'"]');
      if (!card || !row) return;
      if (row.title) { var h= $('h2',card); if(h) h.textContent=row.title; }
      var phaseEl=$('.hn-tool-phase',card); if(phaseEl&&row.phase) phaseEl.textContent=row.phase;
      if (row.description) { var p=$('.hn-tool-description',card); if(p) p.textContent=row.description; }
      card.setAttribute('data-tool-active',String(row.is_active!==false));
      card.hidden=row.is_active===false;
      var status=$('.hn-tool-status',card);
      if(status) status.textContent=row.status==='onderhoud'?'Tijdelijk in onderhoud':(row.status==='beta'?'Beschikbaar · bèta':'Interactieve tool beschikbaar');
      var launch=$('.hn-tool-launch',card);
      if(launch) launch.disabled=row.status==='onderhoud';
    });
  }
  function addLaunchButtons() {
    Object.keys(toolNames).forEach(function(id){
      var card=$('.hn-tool-card[data-tool-id="'+id+'"]');
      if(!card) return;
      var bottom=$('.hn-tool-card-bottom',card);
      if(!bottom || $('.hn-tool-launch',bottom)) return;
      var button=document.createElement('button');
      button.type='button'; button.className='hn-tool-launch'; button.textContent='Open interactieve tool →';
      button.setAttribute('data-open-tool',id);
      var status=$('.hn-tool-status',bottom);
      if(status) status.textContent='Interactieve tool beschikbaar';
      bottom.insertBefore(button,status||null);
    });
  }
  function sortCards(rows) {
    var grid=$('#hn-tools-grid'); if(!grid)return;
    rows.slice().sort(function(a,b){return Number(a.sort_order||0)-Number(b.sort_order||0);}).forEach(function(row){
      var id=Object.keys(catalogSlug).filter(function(k){return catalogSlug[k]===row.slug;})[0];
      var card=id&&$('.hn-tool-card[data-tool-id="'+id+'"]',grid);
      if(card)grid.appendChild(card);
    });
    var empty=$('#hn-tools-empty',grid); if(empty)grid.appendChild(empty);
  }
  function readLocal() {
    try {
      var raw=window.localStorage.getItem(KEY);
      if(raw) state=merge(defaultState,JSON.parse(raw));
    } catch(e) { /* private browsing or blocked storage: keep in memory */ }
  }
  function writeLocal() {
    try { window.localStorage.setItem(KEY,JSON.stringify(state)); } catch(e) { /* memory-only session */ }
  }
  async function loadRemoteState() {
    var client=window.hijrahSupabase;
    if(!client||!client.auth) return;
    try {
      var sessionResult=await client.auth.getSession();
      sessionUser=sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.user||null;
      if(!sessionUser) return;
      var result=await client.from('hijrah_plans').select('plan_data').eq('user_id',sessionUser.id).maybeSingle();
      if(result.error) throw result.error;
      existingPlanData=result.data&&result.data.plan_data&&typeof result.data.plan_data==='object'?result.data.plan_data:{};
      if(existingPlanData.hijrahtools) state=merge(state,existingPlanData.hijrahtools);
      writeLocal();
    } catch(e) {
      setSaveStatus('Accountopslag kon niet worden geladen. Je invoer blijft voorlopig in deze browser.');
      console.warn('[HijrahTools] Laden van persoonlijke voortgang mislukt:',e.message);
    }
  }
  async function loadCatalog() {
    var client=window.hijrahSupabase;
    if(!client) return;
    try {
      var result=await client.from('hn_tool_catalog').select('slug,title,description,phase,status,is_active,sort_order').order('sort_order',{ascending:true});
      if(result.error) throw result.error;
      if(result.data&&result.data.length) {applyCatalog(result.data);sortCards(result.data);}
    } catch(e) { console.warn('[HijrahTools] Catalogus niet geladen; standaardinhoud wordt gebruikt.',e.message); }
  }
  function saveState() {
    writeLocal();
    setSaveStatus(sessionUser?'Je voortgang wordt bewaard in je HN-account…':'Opgeslagen in deze browser op dit apparaat.');
    if(saveTimer) window.clearTimeout(saveTimer);
    saveTimer=window.setTimeout(persistRemote,650);
    var inline=$('[data-save-inline]',dialogBody);
    if(inline) inline.textContent=sessionUser?'Opslaan in je account…':'Automatisch bewaard in deze browser';
  }
  async function persistRemote() {
    if(!sessionUser||!window.hijrahSupabase) {
      setSaveStatus('Opgeslagen in deze browser op dit apparaat. Log in om je voortgang aan je account te koppelen.');
      return;
    }
    try {
      var client=window.hijrahSupabase;
      var result=await client.from('hijrah_plans').select('target_country_id,target_city_id,target_date,plan_data,notes').eq('user_id',sessionUser.id).maybeSingle();
      if(result.error) throw result.error;
      var row=result.data||{};
      var current=row.plan_data&&typeof row.plan_data==='object'?row.plan_data:existingPlanData;
      var merged=Object.assign({},current,{hijrahtools:state});
      var save=await client.from('hijrah_plans').upsert({
        user_id:sessionUser.id,
        target_country_id:row.target_country_id==null?null:row.target_country_id,
        target_city_id:row.target_city_id==null?null:row.target_city_id,
        target_date:row.target_date==null?null:row.target_date,
        notes:row.notes==null?null:row.notes,
        plan_data:merged,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(save.error) throw save.error;
      existingPlanData=merged;
      setSaveStatus('Opgeslagen in je HN-account.');
      var inline=$('[data-save-inline]',dialogBody);
      if(inline) inline.textContent='Opgeslagen in je account';
    } catch(e) {
      setSaveStatus('Accountopslag mislukt. Je gegevens staan voorlopig alleen in deze browser.');
      console.error('[HijrahTools] Opslaan mislukt:',e.message);
    }
  }
  function parseBoundValue(el) {
    if(el.type==='checkbox') return el.checked;
    if(el.type==='radio') return el.checked ? el.value : undefined;
    if(el.type==='number'||el.type==='range') return el.value===''?0:Number(el.value);
    return el.value;
  }
  function onBoundChange(el) {
    if(!el.dataset.bind) return;
    if(el.type==='radio'&&!el.checked) return;
    setPath(state,el.dataset.bind,parseBoundValue(el));
    var out=el.parentElement&&$('.hnt-range output',el.parentElement);
    if(out) out.textContent=el.value;
    saveState();
    if(currentTool==='4') updateBudgetSummary();
    if(currentTool==='9') renderExperienceResults();
    if(currentTool==='3') refreshStepsProgress();
    if(currentTool==='10') {
      var body=$('#hnt-dialog-body');
      if(body) body.innerHTML=renderTool('10');
    }
  }
  function refreshStepsProgress() {
    var checked=state.steps.checked||{}, done=stepItems.filter(function(s){return !!checked[s[0]];}).length;
    var label=$('.hnt-progress-label',dialogBody), bar=$('.hnt-progress span',dialogBody);
    if(label) label.innerHTML='<strong>'+done+' van '+stepItems.length+' stappen</strong><span>'+Math.round(done/stepItems.length*100)+'%</span>';
    if(bar) bar.style.width=Math.round(done/stepItems.length*100)+'%';
  }
  function updateBudgetSummary() {
    var el=$('#hnt-budget-live',dialogBody);
    if(!el) return;
    var b=state.budget,currency=b.currency||'EUR';
    var once=Object.keys(b.oneTime||{}).reduce(function(sum,k){return sum+Number(b.oneTime[k]||0);},0);
    var monthly=Object.keys(b.monthly||{}).reduce(function(sum,k){return sum+Number(b.monthly[k]||0);},0);
    var income=Number(b.monthlyIncome||0), savings=Number(b.savings||0), balance=income-monthly;
    var burn=monthly-income;
    var months=burn>0?Math.max(0,(savings-once)/burn):null;
    el.innerHTML='<div class="hnt-budget-metric"><span>Eenmalige kosten</span><strong>'+money(once,currency)+'</strong></div><div class="hnt-budget-metric"><span>Maandelijkse kosten</span><strong>'+money(monthly,currency)+'</strong></div><div class="hnt-budget-metric"><span>Maandelijks saldo</span><strong>'+money(balance,currency)+'</strong></div><div class="hnt-budget-metric"><span>Na vertrek over</span><strong>'+money(savings-once,currency)+'</strong></div><div class="hnt-budget-metric"><span>Buffer bij verwacht tekort</span><strong>'+(months===null?'Inkomsten dekken uitgaven':months.toFixed(1)+' maanden')+'</strong></div>';
  }
  function readinessResult() {
    var answers=state.readiness.answers||{}, answered=readinessQuestions.filter(function(q){return Number(answers[q.id])>0;});
    if(!answered.length) return '<h3>Beantwoord eerst een paar stellingen</h3><p>Kies bij minstens één stelling een antwoord om je aandachtspunten te zien.</p>';
    var avg=answered.reduce(function(s,q){return s+Number(answers[q.id]);},0)/answered.length;
    var attention=readinessQuestions.filter(function(q){return !answers[q.id]||Number(answers[q.id])<=2;});
    var good=readinessQuestions.filter(function(q){return Number(answers[q.id])>=3;});
    var message=avg<2?'Je hebt nog meerdere onderwerpen om rustig te onderzoeken. Dat is normaal in een vroege oriëntatiefase.':avg<3.3?'Je hebt al een begin gemaakt. Een aantal praktische onderwerpen verdient nog aandacht voordat je keuzes vastlegt.':'Je hebt op veel punten al overzicht. Controleer de onderdelen die nog openstaan en toets belangrijke informatie aan betrouwbare bronnen.';
    return '<h3>Jouw overzicht</h3><div class="hnt-score">'+answered.length+' / '+readinessQuestions.length+' beantwoord</div><p>'+message+'</p><h4>Onderwerpen om verder te onderzoeken</h4>'+(attention.length?'<ul>'+attention.map(function(q){return '<li>'+esc(q.q)+'</li>';}).join('')+'</ul>':'<p>Je hebt geen lage scores ingevuld. Controleer nog wel of de informatie actueel en passend voor jouw situatie is.</p>')+'<h4>Onderwerpen waar je al aan hebt gewerkt</h4>'+(good.length?'<ul>'+good.map(function(q){return '<li>'+esc(q.group)+': '+esc(q.q)+'</li>';}).join('')+'</ul>':'<p>Er is nog geen onderwerp als grotendeels uitgezocht aangegeven.</p>')+'<p class="hnt-note">Gemiddelde zelfinschatting: '+avg.toFixed(1).replace('.',',')+' / 4. Dit is geen objectieve gereedheidsscore en geen advies om wel of niet te emigreren.</p>';
  }
  function cityTableResult(path, weighted) {
    var citiesList=value(path+'.cities',[]), weights=value('fit.weights',{});
    var named=citiesList.map(function(c,i){return {city:c,index:i};}).filter(function(x){return x.city.name&&x.city.name.trim();});
    if(!named.length) return '<h3>Vul eerst minstens één stad in</h3><p>Geef een stad een naam en vul je eigen scores in.</p>';
    if(!weighted) {
      return '<h3>Vergelijking per criterium</h3><p class="hnt-note">Dit overzicht toont alleen jouw invoer. “Nog onbekend” betekent dat je de informatie nog moet onderzoeken.</p><div class="hnt-table-wrap"><table class="hnt-compare-table"><thead><tr><th>Criterium</th>'+named.map(function(x){return '<th>'+esc(x.city.name)+'</th>';}).join('')+'</tr></thead><tbody>'+compareCriteria.map(function(criterion){
        return '<tr><th>'+esc(criterion.label)+'</th>'+named.map(function(x){var v=x.city.ratings&&x.city.ratings[criterion.id];return '<td>'+(v==null||v===''?'<span class="hnt-unknown">Nog onbekend</span>':esc(v)+' / 5')+'</td>';}).join('')+'</tr>';
      }).join('')+'</tbody></table></div>';
    }
    var scored=named.map(function(x){
      var c=x.city,sum=0,total=0,details=[];
      compareCriteria.forEach(function(criterion){
        var raw=c.ratings&&c.ratings[criterion.id];
        if(raw==null||raw==='') return;
        var score=Number(raw), weight=Number(weights[criterion.id]||1);
        sum+=score*weight; total+=weight; details.push({label:criterion.label,score:score,weight:weight});
      });
      return {name:c.name,score:total?sum/total:null,details:details,total:total};
    });
    scored.sort(function(a,b){if(a.score==null)return 1;if(b.score==null)return -1;return b.score-a.score;});
    return '<h3>Vergelijking op basis van jouw prioriteiten</h3><p class="hnt-note">De cijfers zijn jouw eigen beoordeling. Onbekende gegevens tellen niet mee; een hoge score betekent niet dat feiten onafhankelijk zijn geverifieerd.</p>'+scored.map(function(c){
      return '<div class="hnt-result-row"><strong>'+esc(c.name)+'</strong><div>'+(c.score==null?'Nog onvoldoende scores':('Gewogen gemiddelde: <strong>'+c.score.toFixed(2).replace('.',',')+' / 5</strong>'))+'</div><small>'+c.details.length+' van '+compareCriteria.length+' criteria beoordeeld</small><ul>'+c.details.map(function(d){return '<li>'+esc(d.label)+': '+d.score+' / 5 (gewicht '+d.weight+')</li>';}).join('')+'</ul></div>';
    }).join('')+'<p class="hnt-note">Deze volgorde weerspiegelt jouw ingevulde voorkeuren, geen objectieve beoordeling van een stad.</p>';
  }
  function budgetResult() {
    var b=state.budget,currency=b.currency||'EUR';
    var once=Object.keys(b.oneTime||{}).reduce(function(s,k){return s+Number(b.oneTime[k]||0);},0);
    var monthly=Object.keys(b.monthly||{}).reduce(function(s,k){return s+Number(b.monthly[k]||0);},0);
    var balance=Number(b.monthlyIncome||0)-monthly, after=Number(b.savings||0)-once, burn=monthly-Number(b.monthlyIncome||0);
    var months=burn>0?Math.max(0,after/burn):null;
    return '<h3>Je berekende budget</h3><div class="hnt-budget-summary"><div class="hnt-budget-metric"><span>Eenmalige vertrekuitgaven</span><strong>'+money(once,currency)+'</strong></div><div class="hnt-budget-metric"><span>Maandelijkse uitgaven</span><strong>'+money(monthly,currency)+'</strong></div><div class="hnt-budget-metric"><span>Maandelijks saldo</span><strong>'+money(balance,currency)+'</strong></div><div class="hnt-budget-metric"><span>Na eenmalige uitgaven over</span><strong>'+money(after,currency)+'</strong></div><div class="hnt-budget-metric"><span>Buffer bij verwacht tekort</span><strong>'+(months===null?'Inkomsten dekken uitgaven':months.toFixed(1)+' maanden')+'</strong></div></div><p>'+(balance<0?'Je maandelijkse uitgaven zijn hoger dan het opgegeven maandinkomen.':balance===0?'Je opgegeven inkomen en maandelijkse uitgaven zijn gelijk.':'Je opgegeven inkomen ligt boven de maandelijkse uitgaven.')+'</p><p class="hnt-note">Dit is een berekening op basis van jouw eigen bedragen. Het bevat geen automatische prijsdata, belastingen, wisselkoersen of onverwachte kosten.</p>';
  }
  function documentsResult() {
    var items=state.documents.items||[];
    var total=items.length, confirmed=items.filter(function(d){return d.status==='officieel-bevestigd'||d.status==='niet-van-toepassing';}).length;
    var missing=items.filter(function(d){return d.status!=='officieel-bevestigd'&&d.status!=='niet-van-toepassing';});
    return '<h3>Voortgang documentencheck</h3><div class="hnt-score">'+confirmed+' / '+total+'</div><p>Items zijn als officieel bevestigd of niet van toepassing gemarkeerd. Dit betekent niet dat de checklist compleet is voor jouw verblijfsroute.</p>'+(missing.length?'<h4>Nog te onderzoeken</h4><ul>'+missing.map(function(d){return '<li>'+esc(d.label)+' — '+esc(d.status||'onderzoeken')+'</li>';}).join('')+'</ul>':'<p>Alle items zijn gemarkeerd. Controleer de bronlinks en eventuele wijzigingen voordat je vertrekt.</p>')+'<p class="hnt-note">Controleer de actuele vereisten altijd bij de bevoegde officiële instantie voor jouw nationaliteit en bestemming.</p>';
  }
  function renderExperienceResults() {
    var el=$('#hnt-experience-results',dialogBody);
    if(!el) return;
    var query=String(state.experiences.query||'').toLocaleLowerCase('nl');
    var kind=state.experiences.kind||'all';
    var country=String(state.experiences.country||'').toLocaleLowerCase('nl');
    var city=String(state.experiences.city||'').toLocaleLowerCase('nl');
    var filtered=experienceRows.filter(function(row){
      var info=String(row.information_type||row.source_type||'').toLocaleLowerCase('nl');
      var text=[row.title,row.summary,row.content,row.countryName,row.cityName,row.neighborhood,row.information_type,row.source].join(' ').toLocaleLowerCase('nl');
      if(query&&text.indexOf(query)===-1)return false;
      if(country&&String(row.countryName||'').toLocaleLowerCase('nl').indexOf(country)===-1)return false;
      if(city&&String(row.cityName||'').toLocaleLowerCase('nl').indexOf(city)===-1)return false;
      if(kind==='ervaring'&&!(info.includes('ervaring')||info.includes('review')))return false;
      if(kind==='officieel'&&!(info.includes('officieel')||String(row.source_type||'').toLocaleLowerCase('nl').includes('officieel')))return false;
      if(kind==='aanbeveling'&&!info.includes('aanbeveling'))return false;
      return true;
    });
    if(!experienceRows.length) {
      el.innerHTML='<p class="hnt-empty">Er zijn momenteel geen gepubliceerde fiches beschikbaar via deze koppeling. Je kunt ook de HN-verhalenpagina bekijken of later opnieuw zoeken.</p>';
      return;
    }
    if(!filtered.length){
      var emptyText=kind==='ervaring'?'Er zijn nog geen gepubliceerde HN-ervaringen die bij dit filter passen. De tool toont geen fictieve verhalen; bekijk de HN-verhalenpagina of kom later terug.':'Geen resultaten met deze filters. Probeer een andere zoekterm.';
      el.innerHTML='<p class="hnt-empty">'+esc(emptyText)+' <a class="hnt-link" href="/verhalen">Bekijk HN-verhalen ↗</a></p>';return;
    }
    el.innerHTML=filtered.slice(0,40).map(function(row){
      var type=row.information_type||row.source_type||'HN-informatie';
      var body=String(row.summary||row.content||'');
      if(body.length>520) body=body.slice(0,520)+'…';
      var src=safeUrl(row.source_url);
      var status=row.verification_status==='gecontroleerd'?'Bron gecontroleerd':row.verification_status==='verouderd'?'Controle nodig':'Nog niet gecontroleerd';
      var place=[row.cityName,row.countryName,row.neighborhood].filter(Boolean).join(' · ');
      return '<article class="hnt-experience-card"><span class="hnt-tag">'+esc(type)+'</span><h4>'+esc(row.title)+'</h4>'+(place?'<div class="hnt-meta">'+esc(place)+'</div>':'')+'<p>'+esc(body||'Open de fiche voor meer informatie.')+'</p><div class="hnt-meta">'+esc(status)+(row.last_checked_at?' · Laatst gecontroleerd: '+esc(new Date(row.last_checked_at).toLocaleDateString('nl-NL')):'')+'</div>'+(src?'<p><a class="hnt-link" href="'+esc(src)+'" target="_blank" rel="noopener noreferrer">Bron openen ↗</a></p>':'')+'</article>';
    }).join('');
  }
  async function loadExperiences() {
    if(!window.hijrahSupabase) {experienceRows=[];renderExperienceResults();return;}
    try {
      var client=window.hijrahSupabase;
      var res=await client.from('topic').select('id,title,summary,content,information_type,source_type,source,source_url,verification_status,last_checked_at,neighborhood,country_id,city_id,visibility').eq('published',true).order('updated_at',{ascending:false}).limit(100);
      if(res.error) throw res.error;
      var raw=res.data||[];
      var countryIds=Array.from(new Set(raw.map(function(r){return r.country_id;}).filter(Boolean)));
      var cityIds=Array.from(new Set(raw.map(function(r){return r.city_id;}).filter(Boolean)));
      var cMap={}, cityMap={};
      if(countryIds.length){var cr=await client.from('countries').select('id,name').in('id',countryIds);if(!cr.error)(cr.data||[]).forEach(function(c){cMap[c.id]=c.name;});}
      if(cityIds.length){var sr=await client.from('cities').select('id,name').in('id',cityIds);if(!sr.error)(sr.data||[]).forEach(function(c){cityMap[c.id]=c.name;});}
      experienceRows=raw.map(function(r){r.countryName=cMap[r.country_id]||'';r.cityName=cityMap[r.city_id]||'';return r;});
      renderExperienceResults();
    } catch(e) {
      experienceRows=[];
      var el=$('#hnt-experience-results',dialogBody);
      if(el) el.innerHTML='<p class="hnt-empty">De HN-kennisbank kon nu niet worden geladen. Probeer opnieuw of open <a class="hnt-link" href="/verhalen">de verhalenpagina</a>.</p>';
      console.warn('[HijrahTools] Ervaringen laden mislukt:',e.message);
    }
  }
  function exportData() {
    var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url;a.download='mijn-hijrahtools-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function handleSubmit(form) {
    var id=form.getAttribute('data-tool-form'), result=$('[data-result]',form);
    if(!result) return;
    var html='';
    if(id==='1') html=readinessResult();
    if(id==='2') html=cityTableResult('comparator',false);
    if(id==='3') html='<h3>Voortgang bewaard</h3><p>'+stepItems.filter(function(s){return !!state.steps.checked[s[0]];}).length+' van '+stepItems.length+' stappen zijn afgevinkt. Je kunt later verdergaan.</p>';
    if(id==='4') html=budgetResult();
    if(id==='5') html=cityTableResult('fit',true);
    if(id==='6') html=documentsResult();
    if(id==='7') html='<h3>Je reflectie is bewaard</h3><p>Je antwoorden staan in je persoonlijke toolgegevens. Je kunt ze later aanpassen of aanvullen.</p>';
    if(id==='8') html='<h3>Je voorzieningen zijn bewaard</h3><p>'+((state.locations.items||[]).length)+' eigen locaties staan in je lijst.</p>';
    if(id==='9') {renderExperienceResults();return;}
    if(id==='10') {dialogBody.innerHTML=renderTool('10');return;}
    result.innerHTML=html;result.hidden=false;saveState();
  }
  function handleClick(e) {
    if(e.target.closest('#hn-tools-clear-selection')) {state.selectedTools=[];saveState();return;}
    var open=e.target.closest('[data-open-tool]');
    if(open) {e.preventDefault();openTool(open.getAttribute('data-open-tool'));return;}
    var addDoc=e.target.closest('[data-add-doc]');
    if(addDoc) {
      var input=$('#hnt-new-doc',dialogBody), label=(input&&input.value||'').trim();
      if(!label) {if(input) input.focus();return;}
      state.documents.items.push({key:'custom-'+Date.now(),label:label,status:'onderzoeken',source:'',notes:''});
      saveState();dialogBody.innerHTML=renderTool('6');return;
    }
    var addLocation=e.target.closest('[data-add-location]');
    if(addLocation) {
      var draft=state.locations.draft||{};
      if(!String(draft.name||'').trim()) {var name=$('[data-bind="locations.draft.name"]',dialogBody);if(name)name.focus();return;}
      state.locations.items.push({name:String(draft.name).trim(),category:draft.category||'Overig',city:String(draft.city||'').trim(),address:String(draft.address||'').trim(),url:safeUrl(draft.url),notes:String(draft.notes||'').trim(),createdAt:new Date().toISOString()});
      state.locations.draft={name:'',category:'School / opvang',city:'',address:'',url:'',notes:''};
      saveState();dialogBody.innerHTML=renderTool('8');return;
    }
    var del=e.target.closest('[data-delete-location]');
    if(del) {
      var idx=Number(del.getAttribute('data-delete-location'));
      if(Number.isInteger(idx)&&idx>=0&&idx<state.locations.items.length)state.locations.items.splice(idx,1);
      saveState();dialogBody.innerHTML=renderTool('8');return;
    }
    if(e.target.closest('[data-search-experiences]')) {loadExperiences();return;}
    if(e.target.closest('[data-export]')) {exportData();return;}
    if(e.target.closest('[data-reset-tool-data]')) {
      if(!window.confirm('Wil je alle gegevens van HijrahTools wissen? Dit verwijdert je opgeslagen toolgegevens uit deze browser en, als je bent ingelogd, uit het HijrahTools-deel van je account.'))return;
      state=clone(defaultState);saveState();dialogBody.innerHTML=renderTool('10');return;
    }
  }
  function bindSelection() {
    var cards=$$('.hn-tool-card[data-tool-id]');
    cards.forEach(function(card){
      var id=card.getAttribute('data-tool-id'), input=$('input[type="checkbox"]',card);
      if(input) {
        input.checked=(state.selectedTools||[]).indexOf(id)!==-1;
        input.addEventListener('change',function(){
          state.selectedTools=cards.filter(function(c){var cb=$('input[type="checkbox"]',c);return cb&&cb.checked;}).map(function(c){return c.getAttribute('data-tool-id');});
          saveState();
        });
      }
    });
  }
  function updateSelectionFromState() {
    var cards=$$('.hn-tool-card[data-tool-id]');
    cards.forEach(function(card){
      var cb=$('input[type="checkbox"]',card);
      if(cb) cb.checked=(state.selectedTools||[]).indexOf(card.getAttribute('data-tool-id'))!==-1;
    });
    var selected=(state.selectedTools||[]).length;
    var count=$('#hn-tools-selected-count'); if(count) {count.textContent=String(selected);count.setAttribute('aria-label',selected+' hulpmiddelen gekozen');}
    var show=$('#hn-tools-show-selection'), clear=$('#hn-tools-clear-selection');
    if(show)show.disabled=selected===0;
    if(clear)clear.disabled=selected===0;
    cards.forEach(function(card){card.classList.toggle('is-selected',!!(card.querySelector('input[type="checkbox"]:checked')));});
  }
  function loadReferenceData() {
    if(!window.hijrahSupabase)return Promise.resolve();
    var client=window.hijrahSupabase;
    return Promise.all([
      client.from('countries').select('id,name').eq('is_active',true).order('name').then(function(r){if(!r.error)countries=r.data||[];}),
      client.from('cities').select('id,name,country_id').eq('is_active',true).order('name').then(function(r){if(!r.error)cities=r.data||[];})
    ]).catch(function(){});
  }
  function init() {
    injectStyles();
    addLaunchButtons();
    ensureDialog();
    readLocal();
    bindSelection();
    document.addEventListener('click',handleClick);
    document.addEventListener('input',function(e){if(e.target&&e.target.dataset&&e.target.dataset.bind)onBoundChange(e.target);});
    document.addEventListener('change',function(e){if(e.target&&e.target.dataset&&e.target.dataset.bind)onBoundChange(e.target);});
    document.addEventListener('submit',function(e){var form=e.target.closest&&e.target.closest('[data-tool-form]');if(form){e.preventDefault();handleSubmit(form);}});
    loadRemoteState().then(function(){
      updateSelectionFromState();
      loadCatalog();
      loadReferenceData();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();