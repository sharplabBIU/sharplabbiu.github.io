// Every page's content scrolls inside its box (the window itself does not scroll), so the mouse wheel or trackpad
// anywhere on the page, beside the box too, scrolls the box, and so do the keys (Space, Page Up/Down, Home/End and the
// arrows) when nothing else has the focus. On the papers page, with two boxes side by side, the wheel scrolls the box on
// its side of the page, and the keys scroll the published papers
(function () {
  var card = document.querySelector('.main-content > .content-card');
  if (!card) return;
  var boxes = card.classList.contains('content-split') ? [].slice.call(card.querySelectorAll('.paper-box')) : [card];
  if (!boxes.length) return;
  function inBox(t) {
    return boxes.some(function (b) {
      return b.contains(t);
    });
  }
  // The box nearest the pointer, across the page
  function nearest(x) {
    var best = boxes[0];
    var d = Infinity;
    boxes.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var e = Math.abs(x - (r.left + r.right) / 2);
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
      var box = nearest(e.clientX);
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
