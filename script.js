// CURSOR
const cur = document.getElementById('cur'), ring = document.getElementById('ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  cur.style.left=mx+'px'; cur.style.top=my+'px';
});
(function loop(){
  rx += (mx-rx)*.12; ry += (my-ry)*.12;
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(loop);
})();

// SCROLL REVEAL
const obs = new IntersectionObserver(entries => {
  entries.forEach((e,i) => {
    if(e.isIntersecting){
      setTimeout(() => e.target.classList.add('show'), i * 60);
      obs.unobserve(e.target);
    }
  });
}, { threshold: .08 });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

/// COUNTERS
function count(el, target, suffix) {
  const dur = 1600;
  const start = performance.now();
  function step(ts) {
    const p = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(ease * target) + (p >= 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = +e.target.dataset.target;
      const suffix = e.target.dataset.suffix || '';
      count(e.target, target, suffix);
      co.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('[data-target]').forEach(el => co.observe(el));

// NAV scroll shadow
window.addEventListener('scroll', () => {
  document.querySelector('nav').style.borderBottomColor = scrollY > 10 ? '#e0e0e0' : '#e8e8e8';
});