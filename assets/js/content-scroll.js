// Every page's content scrolls inside its box (the window itself does not scroll), so the mouse wheel or trackpad
// anywhere on the page, beside the box too, scrolls the box, and so do the keys (Space, Page Up/Down, Home/End and the
// arrows) when nothing else has the focus
(function () {
  var box = document.querySelector('.main-content > .content-card');
  if (!box) return;
  // Not while a photo is open large, or over a card that opened beside a whiteboard
  function busy(t) {
    return document.body.classList.contains('pv-open') || (t && t.closest && t.closest('.glass-note'));
  }
  window.addEventListener(
    'wheel',
    function (e) {
      if (e.ctrlKey || box.contains(e.target) || busy(e.target)) return;
      var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.clientHeight : 1;
      box.scrollBy(e.deltaX * unit, e.deltaY * unit);
    },
    { passive: true }
  );
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || busy()) return;
    if (a && a !== document.body && a !== document.documentElement && a !== box) return;
    var page = box.clientHeight * 0.9;
    var by = { ArrowDown: 40, ArrowUp: -40, PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page }[e.key];
    if (e.key === 'Home') by = -box.scrollTop;
    if (e.key === 'End') by = box.scrollHeight;
    if (by === undefined || a === box) return; // a box with the focus scrolls itself
    e.preventDefault();
    box.scrollBy(0, by);
  });
})();
