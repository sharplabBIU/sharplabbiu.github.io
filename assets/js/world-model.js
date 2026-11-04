// Home-page world-model hero: click (or press Enter/Space on) a part of the diagram to open its explanation bubble.
// A link to #wm-model, #wm-self, #wm-world, #wm-goals or #wm-tasks (as in the notes on the glass panes) opens that part
(function () {
  var hero = document.querySelector('.wm-hero');
  if (!hero) return;
  var nodes = hero.querySelectorAll('.wm-node');
  var pops = hero.querySelectorAll('.wm-pop');
  function closeAll() {
    pops.forEach(function (p) { p.hidden = true; });
    nodes.forEach(function (n) { n.classList.remove('is-open'); });
  }
  nodes.forEach(function (node) {
    function toggle() {
      var pop = hero.querySelector('.wm-pop[data-for="' + node.getAttribute('data-wm') + '"]');
      var wasOpen = pop && !pop.hidden;
      closeAll();
      if (pop && !wasOpen) { pop.hidden = false; node.classList.add('is-open'); }
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
    if (pop && node) { pop.hidden = false; node.classList.add('is-open'); }
    hero.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
