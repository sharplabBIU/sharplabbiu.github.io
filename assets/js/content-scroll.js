// Every page's content scrolls inside its box (the window itself does not scroll), so the mouse wheel or trackpad
// anywhere on the page, beside the box too, scrolls the box, and so do the keys (Space, Page Up/Down, Home/End and the
// arrows) when nothing else has the focus. On the papers and news pages, with several boxes side by side, the wheel
// scrolls the box nearest the pointer, and the keys scroll the first box
(function () {
  var card = document.querySelector('.main-content > .content-card');
  if (!card) return;
  var boxes = card.classList.contains('content-split') ? [].slice.call(card.querySelectorAll('.paper-box, .news-board')) : [card];
  if (!boxes.length) return;
  // (not the columns either side of the box, though some are inside it: they stay put, and the wheel over them
  // scrolls the box, as it does anywhere else beside it)
  function inBox(t) {
    if (t.closest && t.closest('.side-col')) return false;
    return boxes.some(function (b) {
      return b.contains(t);
    });
  }
  [].forEach.call(document.querySelectorAll('.side-col'), function (col) {
    col.addEventListener(
      'wheel',
      function (e) {
        if (!e.ctrlKey) e.preventDefault(); // (the box is scrolled below, and only there)
      },
      { passive: false }
    );
  });
  // The box nearest the pointer
  function nearest(x, y) {
    var best = boxes[0];
    var d = Infinity;
    boxes.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var dx = Math.max(r.left - x, 0, x - r.right);
      var dy = Math.max(r.top - y, 0, y - r.bottom);
      var e = dx * dx + dy * dy;
      if (e < d) {
        d = e;
        best = b;
      }
    });
    return best;
  }
  // Not while a photo is open large, or over a card that opened beside a whiteboard
  function busy(t) {
    return document.body.classList.contains('pv-open') || (t && t.closest && t.closest('.glass-note'));
  }
  window.addEventListener(
    'wheel',
    function (e) {
      if (e.ctrlKey || inBox(e.target) || busy(e.target)) return;
      var box = nearest(e.clientX, e.clientY);
      var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.clientHeight : 1;
      box.scrollBy(boxes.length > 1 ? 0 : e.deltaX * unit, e.deltaY * unit);
    },
    { passive: true }
  );
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || busy()) return;
    if (a && a !== document.body && a !== document.documentElement) return; // a box with the focus scrolls itself
    var box = boxes[0];
    var page = box.clientHeight * 0.9;
    var by = { ArrowDown: 40, ArrowUp: -40, PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page }[e.key];
    if (e.key === 'Home') by = -box.scrollTop;
    if (e.key === 'End') by = box.scrollHeight;
    if (by === undefined) return;
    e.preventDefault();
    box.scrollBy(0, by);
  });
})();
