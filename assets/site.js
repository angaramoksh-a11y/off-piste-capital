/* Off Piste Capital — shared sibling-page behaviours.
   Same input-gated reveal + nav mechanics as the home storyboard. */
(function(){
'use strict';
var qs = new URLSearchParams(location.search);
var STATIC = qs.get('static') === '1';
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (STATIC) document.documentElement.classList.add('no-motion');

/* ---------- storyboard ribbon: auto-hide in prod ---------- */
var rb = document.getElementById('ribbon');
if (rb){
  var isProd = location.protocol.indexOf('http') === 0 &&
    !/localhost|127\.0\.0\.1|netlify|\.pages\.dev/.test(location.hostname);
  if (isProd || qs.get('prod') === '1') rb.classList.add('hide');
}

/* ---------- nav scroll state ---------- */
var nav = document.getElementById('nav');
if (nav){
  var onScroll = function(){ nav.classList.toggle('scrolled', scrollY > 24); };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
}

/* ---------- mobile menu toggle ---------- */
var navToggle = document.querySelector('.navtoggle');
if (navToggle && nav){
  navToggle.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('.navlinks a').forEach(function(a){
    a.addEventListener('click', function(){ nav.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); });
  });
}

/* ---------- first-input gate: nothing hidden until a real human interacts ---------- */
var armed = false;
function arm(){
  if (armed || STATIC) return; armed = true;
  document.documentElement.classList.add('anim');
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(function(n){
    var r = n.getBoundingClientRect();
    if (r.top < innerHeight * .9) n.classList.add('in');
    io.observe(n);
  });
}
['pointermove','pointerdown','wheel','touchstart','keydown','scroll'].forEach(function(ev){
  addEventListener(ev, arm, {passive:true, once:false});
});
/* also arm shortly after load so above-the-fold reveals never get stuck if JS loads late */
addEventListener('load', function(){ setTimeout(arm, 900); });
})();

/* contact-mark frosted-glass fill — IO reveal, no scroll handlers */
(function(){
'use strict';
if (document.documentElement.hasAttribute('data-cm-glass')) return; /* double-include guard */
document.documentElement.setAttribute('data-cm-glass','');

function cmInit(){
  var marks = document.querySelectorAll('.contact-mark');
  if (!marks.length) return;
  var i;
  var isStatic = /[?&]static=1(?:&|$)/.test(location.search) ||
                 document.documentElement.classList.contains('no-motion');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isStatic || reduced || !('IntersectionObserver' in window)){
    for (i = 0; i < marks.length; i++) marks[i].classList.add('cm-filled');
    return;
  }
  var io = new IntersectionObserver(function(entries){
    for (var j = 0; j < entries.length; j++){
      if (entries[j].isIntersecting){
        entries[j].target.classList.add('cm-filled');
        io.unobserve(entries[j].target);
      }
    }
  }, {threshold:.3, rootMargin:'0px 0px -8% 0px'});
  for (i = 0; i < marks.length; i++) io.observe(marks[i]);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', cmInit);
} else {
  cmInit();
}
})();

/* OPX route scroll-draw — optional. Default = fully composed chart. */
(function(){
  try{
    var doc=document.documentElement;
    if(doc.classList.contains('no-motion'))return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(!('IntersectionObserver'in window))return;
    var svgs=document.querySelectorAll('.opx-map svg');
    if(!svgs.length)return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        io.unobserve(en.target);
        if(doc.classList.contains('no-motion'))return;
        var svg=en.target;
        var main=svg.querySelector('.opx-rline');
        var extras=svg.querySelectorAll('.opx-bline,.opx-fork,.opx-bdot,.opx-slabel,.opx-wp,.opx-flagpole,.opx-flag');
        if(main && main.getTotalLength){
          var L=main.getTotalLength();
          main.style.strokeDasharray=L+' '+L;
          main.style.strokeDashoffset=L;
          void main.getBoundingClientRect();
          main.style.transition='stroke-dashoffset 1.6s cubic-bezier(.45,0,.2,1)';
          main.style.strokeDashoffset='0';
          main.addEventListener('transitionend',function(){
            main.style.strokeDasharray='';main.style.strokeDashoffset='';main.style.transition='';
          },{once:true});
        }
        Array.prototype.forEach.call(extras,function(el,i){
          el.style.opacity='0';
          void el.getBoundingClientRect();
          el.style.transition='opacity .55s ease '+(0.55+i*0.05)+'s';
          el.style.opacity='1';
        });
      });
    },{threshold:.3});
    Array.prototype.forEach.call(svgs,function(s){io.observe(s)});
  }catch(_){}
})();

/* signals motif -> scroll-progress: the accent line grows from the fork origin and REACHES the
   dot exactly at the bottom of the page. Driven SYNCHRONOUSLY on scroll — NO rAF/ticking flag
   (the documented off-piste wedge gotcha). Reduced-motion / ?static=1 leave the complete state. */
(function(){
  'use strict';
  var isStatic = /[?&]static=1(?:&|$)/.test(location.search) ||
                 document.documentElement.classList.contains('no-motion');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isStatic || reduced) return;
  var offs = document.querySelectorAll('.signal-field .sf-off');
  if (!offs.length) return;
  var dots = document.querySelectorAll('.signal-field .sf-dot');
  var MIN = 6, fired = false, i;
  for (i = 0; i < dots.length; i++){
    dots[i].addEventListener('animationend', function(e){
      if (e.animationName === 'sf-arrive') this.classList.remove('sf-arrived');
    });
  }
  function apply(){
    var d = document.documentElement;
    var max = (d.scrollHeight || document.body.scrollHeight) - innerHeight;
    var y = window.pageYOffset || d.scrollTop || 0;
    var p = max > 0 ? y / max : 1;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    var off = 100 - (MIN + (100 - MIN) * p);   /* drawn 6%..100% -> dashoffset 94..0 */
    for (var k = 0; k < offs.length; k++) offs[k].style.strokeDashoffset = off;
    if (p >= 0.985 && !fired){ fired = true; for (var m = 0; m < dots.length; m++) dots[m].classList.add('sf-arrived'); }
    else if (p < 0.9 && fired){ fired = false; }
  }
  apply();
  addEventListener('scroll', apply, {passive:true});
  addEventListener('resize', apply, {passive:true});
})();
