(function(){
  'use strict';

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn);
    else fn();
  }

  ready(async function(){
    var db=window.hijrahSupabase;
    var country=document.getElementById('hnHomeCountry');
    var city=document.getElementById('hnHomeCity');
    var search=document.getElementById('hnHomeSearch');
    var button=document.getElementById('hnHomeSearchBtn');
    var citiesBox=document.getElementById('hnHomeCities');

    if(!db || !country || !city) return;

    var countries=[], cities=[], categories=[];

    var results=await Promise.allSettled([
      db.from('countries').select('id,name').order('name'),
      db.from('cities').select('id,name,country_id').order('name'),
      db.from('categories').select('id,name').order('name')
    ]);

    countries=results[0].status==='fulfilled' && !results[0].value.error ? (results[0].value.data||[]) : [];
    cities=results[1].status==='fulfilled' && !results[1].value.error ? (results[1].value.data||[]) : [];
    categories=results[2].status==='fulfilled' && !results[2].value.error ? (results[2].value.data||[]) : [];

    function option(select,value,label){
      var o=document.createElement('option');
      o.value=value;
      o.textContent=label;
      select.appendChild(o);
    }

    countries.forEach(function(x){ option(country,x.id,x.name); });

    function fillCities(){
      city.innerHTML='';
      option(city,'','Alle steden');
      var selected=country.value;
      cities
        .filter(function(x){return !selected || x.country_id===selected;})
        .forEach(function(x){option(city,x.id,x.name);});
      renderCityPills();
    }

    function renderCityPills(){
      if(!citiesBox) return;
      citiesBox.innerHTML='';
      var visible=cities.filter(function(x){return !country.value || x.country_id===country.value;}).slice(0,8);
      if(!visible.length) return;
      var label=document.createElement('span');
      label.className='hn-discovery-note';
      label.textContent='Populaire steden:';
      citiesBox.appendChild(label);
      visible.forEach(function(x){
        var b=document.createElement('button');
        b.type='button';
        b.className='hn-city';
        b.textContent=x.name;
        b.addEventListener('click',function(){
          city.value=x.id;
          go('');
        });
        citiesBox.appendChild(b);
      });
    }

    function categoryId(name){
      var hit=categories.find(function(x){return (x.name||'').toLowerCase()===name.toLowerCase();});
      return hit ? hit.id : '';
    }

    function go(categoryName){
      var params=new URLSearchParams();
      var q=(search.value||'').trim();
      if(q) params.set('q',q);
      if(country.value) params.set('country',country.value);
      if(city.value) params.set('city',city.value);
      if(categoryName){
        var id=categoryId(categoryName);
        if(id) params.set('category',id);
      }
      location.href='/navigatie'+(params.toString()?'?'+params.toString():'');
    }

    country.addEventListener('change',function(){
      fillCities();
      city.value='';
    });

    city.addEventListener('change',function(){
      if(city.value) go('');
    });

    button.addEventListener('click',function(){go('');});
    search.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();go('');}
    });

    document.querySelectorAll('.hn-discovery-cat').forEach(function(b){
      b.addEventListener('click',function(){go(this.dataset.cat||'');});
    });

    fillCities();
  });
})();