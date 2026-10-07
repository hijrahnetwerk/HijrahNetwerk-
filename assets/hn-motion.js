(function(){
if(window.__HN_MOTION__)return;window.__HN_MOTION__=true;
function init(){
const targets=[];
document.querySelectorAll("main > section,.section,.hero,.panel,.card,.country-card,.topic-card,.result-card,.fiche-card,.article-card,.overview-grid > *,.form-grid > *").forEach(function(el){if(!el.closest(".liveFrameWrap")){el.classList.add("hn-reveal");targets.push(el)}});
document.querySelectorAll(".cards,.grid,.card-grid,.results-grid,.directory-grid,.overview-list").forEach(function(el){el.classList.add("hn-stagger")});
if(!("IntersectionObserver" in window)){targets.forEach(function(el){el.classList.add("hn-visible")});document.querySelectorAll(".hn-stagger").forEach(function(el){el.classList.add("hn-visible")});return}
var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("hn-visible");io.unobserve(e.target)}})},{threshold:.08,rootMargin:"0px 0px -40px 0px"});
targets.forEach(function(el){io.observe(el)});document.querySelectorAll(".hn-stagger").forEach(function(el){io.observe(el)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();