// Lab Adventures (team page): a string of Christmas lights hung almost straight down either side of the box (on windows
// with room there), with "Lab Adventures" written into the left one's cable at the top and a tiny light for each photo.
// Nothing moves. A click on a light shows its photo (beside the box, just above or below the light; in the box, on
// narrower windows, under the row of lights), and only another click on that light puts it away
(function () {
  'use strict';

  var lights = Array.prototype.slice.call(document.querySelectorAll('.adv-light'));
  if (!lights.length) return;
  var cols = Array.prototype.slice.call(document.querySelectorAll('.adventure-col'));

  // The same test as $side-cols in _sass/_base.scss: whether the lights hang either side of the box
  var wide = window.matchMedia('(min-width: 1240px) and (min-height: 560px)');
  var NS = 'http://www.w3.org/2000/svg';

  // ---- The cable and its lights ----

  function add(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // A steady pseudo-random number for a seed, so the lights hang the same way each time
  function rnd(n) {
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // Hangs column col's cable (k: 0 on the left, 1 on the right) and its lights along it: the cable hangs from a hook at
  // the top almost straight down, with a slight wave, to a plug at the bottom
  function hang(col, k) {
    var old = col.querySelector('.adv-cable');
    if (old) old.remove();
    var mine = Array.prototype.slice.call(col.querySelectorAll('.adv-light'));
    if (!wide.matches) {
      mine.forEach(function (l) {
        l.style.left = l.style.top = l.style.transform = '';
      });
      return;
    }
    var W = col.clientWidth;
    var H = col.clientHeight;
    if (!W || !H) return;
    var x0 = W / 2;
    var top = 18;
    var end = H - 22;
    var words = col.getAttribute('data-cable-label');
    var phase = k ? 2.1 : 0.4;
    function xAt(y) {
      return x0 + 5 * Math.sin(((y - top) / 230) * 2 * Math.PI + phase) * Math.min(1, (y - top) / 60);
    }
    var pts = [];
    for (var y = top; y <= end; y += 6) pts.push([xAt(y), y]);
    pts.push([xAt(end), end]);
    var d =
      'M' +
      pts
        .map(function (p) {
          return p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        })
        .join(' L');

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'adv-cable');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-hidden', 'true');
    var id = 'adv-cable-' + k;
    // the cable: two wires twisted together
    add('path', { id: id, d: d, fill: 'none', stroke: '#06142e', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    add('path', { d: d, fill: 'none', stroke: '#2f5fa6', 'stroke-width': 1.2, 'stroke-dasharray': '2.6 3.2', 'stroke-linecap': 'round' }, svg);
    // the hook it hangs from, and the plug at its end
    add('circle', { cx: x0, cy: top - 4, r: 3.6, fill: '#dbe6f7', stroke: '#06142e', 'stroke-width': 1.2 }, svg);
    var px = xAt(end);
    add('rect', { x: (px - 4).toFixed(1), y: end, width: 8, height: 11, rx: 2, fill: '#1c2c4a', stroke: '#06142e', 'stroke-width': 1 }, svg);
    add('path', { d: 'M' + (px - 2).toFixed(1) + ' ' + (end + 11) + ' v4 M' + (px + 2).toFixed(1) + ' ' + (end + 11) + ' v4', stroke: '#dbe6f7', 'stroke-width': 1.2 }, svg);
    // the words, written down into the cable near its top (the cable's colour cut away behind the letters)
    var text = null;
    if (words) {
      text = add('text', { class: 'adv-cable-words', dy: '5' }, svg);
      var tp = add('textPath', { href: '#' + id, startOffset: '22' }, text);
      tp.textContent = words;
    }
    col.insertBefore(svg, col.firstChild);

    // The lights, spaced evenly down the cable below the words, pointing out to either side in turn
    var first = top + 34 + (text ? text.getComputedTextLength() + 22 : 0);
    var last = end - 26;
    mine.forEach(function (light, j) {
      var y = mine.length > 1 ? first + ((last - first) * j) / (mine.length - 1) : (first + last) / 2;
      var side = j % 2 ? 1 : -1;
      light.style.left = xAt(y).toFixed(1) + 'px';
      light.style.top = y.toFixed(1) + 'px';
      light.style.transform = 'rotate(' + (side * (38 + rnd(j * 3.1 + k * 7) * 14)).toFixed(1) + 'deg)';
    });
  }

  function hangAll() {
    cols.forEach(hang);
  }

  // ---- The photo out of a light ----

  var out = null; // { i, light, box (what to take away), wide }

  // Beside the box: the photo just above its light, or below it where there is more room there, as big as the room
  // allows (up to a little wider than the column), and never over the light itself
  function place(fig, light, pw, ph) {
    var r = light.getBoundingClientRect();
    var col = light.parentNode.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top0 = (nav ? nav.getBoundingClientRect().bottom : 0) + 10;
    var above = r.top - 6 - top0;
    var below = window.innerHeight - 10 - (r.bottom + 6);
    var F = 16; // the frame round the photo (padding and border), across and down
    var w = Math.round(Math.min(330, Math.max(210, col.width + 70)));
    var h = ((w - F) * ph) / pw + F;
    var up = h <= above || above >= below;
    var room = up ? above : below;
    if (h > room) {
      w = Math.max(120, Math.floor(((room - F) * pw) / ph + F));
      h = ((w - F) * ph) / pw + F;
    }
    fig.style.width = w + 'px';
    var cx = r.left + r.width / 2;
    fig.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2)) + 'px';
    fig.style.top = (up ? r.top - 6 - h : r.bottom + 6) + 'px';
  }

  function reveal(i) {
    var light = lights[i];
    var pw = +light.getAttribute('data-w');
    var ph = +light.getAttribute('data-h');
    var fig = document.createElement('figure');
    fig.className = 'adv-reveal';
    var img = document.createElement('img');
    img.src = light.getAttribute('data-src');
    img.alt = light.getAttribute('data-alt');
    img.width = pw;
    img.height = ph;
    fig.appendChild(img);
    var box = fig;
    if (wide.matches) {
      place(fig, light, pw, ph);
      document.body.appendChild(fig);
    } else {
      // on a line of its own under the lights, no taller than most of the window
      var row = light.closest('.adventure-lights');
      box = document.createElement('div');
      box.className = 'adv-reveal-row';
      fig.classList.add('in-row');
      box.appendChild(fig);
      row.appendChild(box);
      fig.style.width = Math.round(Math.min(440, (window.innerHeight * 0.6 * pw) / ph + 16)) + 'px';
    }
    light.classList.add('is-on');
    light.setAttribute('aria-expanded', 'true');
    out = { i: i, light: light, box: box, wide: wide.matches };
  }

  function hide() {
    if (!out) return;
    out.box.remove();
    out.light.classList.remove('is-on');
    out.light.setAttribute('aria-expanded', 'false');
    out = null;
  }

  // A click on a light shows its photo (in place of any other), and a second click on it puts it away
  lights.forEach(function (light, i) {
    light.setAttribute('aria-expanded', 'false');
    light.addEventListener('click', function () {
      var again = out && out.i === i;
      hide();
      if (!again) reveal(i);
    });
  });

  // A new window size hangs the lights again, and puts a photo that is out back beside its light
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      hangAll();
      if (out && (out.wide || wide.matches)) {
        var i = out.i;
        hide();
        reveal(i);
      }
    }, 150);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hangAll);
  else hangAll();
})();
