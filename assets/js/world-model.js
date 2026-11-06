// Home-page world-model hero: click (or press Enter/Space on) a part of the diagram to open its explanation bubble.
// A link to #wm-model, #wm-self, #wm-world, #wm-goals or #wm-tasks (as in the cards on the drawings beside the text)
// opens that part
(function () {
  var hero = document.querySelector('.wm-hero');
  if (!hero) return;
  // The colours in the brain, and everything else moving in it, hold still for people who ask for less motion
  var svg = hero.querySelector('svg');
  if (svg && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) svg.pauseAnimations();
  var nodes = hero.querySelectorAll('.wm-node');
  var pops = hero.querySelectorAll('.wm-pop');
  // An open bubble goes over the footer: the page content is raised above it while one is open
  var page = hero.closest('.main-content');
  function raise(on) { if (page) page.classList.toggle('wm-raised', on); }
  function closeAll() {
    pops.forEach(function (p) { p.hidden = true; });
    nodes.forEach(function (n) { n.classList.remove('is-open'); });
    raise(false);
  }
  nodes.forEach(function (node) {
    function toggle() {
      var pop = hero.querySelector('.wm-pop[data-for="' + node.getAttribute('data-wm') + '"]');
      var wasOpen = pop && !pop.hidden;
      closeAll();
      if (pop && !wasOpen) { pop.hidden = false; node.classList.add('is-open'); raise(true); }
    }
    node.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  hero.querySelectorAll('.wm-close').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); closeAll(); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.wm-pop')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  function fromHash() {
    var m = location.hash.match(/^#wm-(model|self|world|goals|tasks)$/);
    if (!m) return;
    var pop = hero.querySelector('.wm-pop[data-for="' + m[1] + '"]');
    var node = hero.querySelector('.wm-node[data-wm="' + m[1] + '"]');
    closeAll();
    if (pop && node) { pop.hidden = false; node.classList.add('is-open'); raise(true); }
    hero.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
