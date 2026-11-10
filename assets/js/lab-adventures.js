// Lab Adventures (team page): a string of Christmas lights hung almost straight down either side of the box (on windows
// with room there), with "Lab Adventures" written into the left one's cable at the top and a tiny light for each photo.
// Nothing moves. A click on a light shows its photo above it; the photo opens large when clicked, and the ×, a click
// elsewhere or Escape puts it away. In the box (narrower windows) the lights are a row and open their photos large
// straight away. Large, the arrows (or the arrow keys) step through the photos, and a click beside the photo, the close
// button or Escape closes it
(function () {
  'use strict';

  var lights = Array.prototype.slice.call(document.querySelectorAll('.adv-light'));
  if (!lights.length) return;
  var cols = Array.prototype.slice.call(document.querySelectorAll('.adventure-col'));

  // The same test as $side-cols in _sass/_base.scss: whether the lights hang either side of the box
  var wide = window.matchMedia('(min-width: 1240px) and (min-height: 560px)');
  var NS = 'http://www.w3.org/2000/svg';

  function label(i) {
    return lights[i].getAttribute('data-label');
  }

  // ---- A photo large over the page ----

  var view = document.createElement('div');
  view.className = 'photo-viewer';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-label', 'Photo');
  view.hidden = true;
  view.innerHTML =
    '<figure><img alt=""></figure>' +
    '<button type="button" class="pv-close" aria-label="Close">×</button>' +
    '<button type="button" class="pv-prev" aria-label="Previous photo">‹</button>' +
    '<button type="button" class="pv-next" aria-label="Next photo">›</button>';
  document.body.appendChild(view);

  var big = view.querySelector('img');
  var at = 0;
  var opener = null;

  function show(i) {
    at = (i + lights.length) % lights.length;
    big.src = lights[at].getAttribute('data-src');
    big.alt = lights[at].getAttribute('data-alt');
  }

  function openLarge(i, from) {
    opener = from;
    show(i);
    view.hidden = false;
    document.body.classList.add('pv-open');
    view.querySelector('.pv-close').focus();
  }

  function closeLarge() {
    view.hidden = true;
    document.body.classList.remove('pv-open');
    big.removeAttribute('src');
    if (opener && document.body.contains(opener)) opener.focus({ preventScroll: true });
  }

  view.addEventListener('click', function (e) {
    e.stopPropagation(); // (so it does not also close the photo out of a light)
    if (e.target.closest('.pv-prev')) show(at - 1);
    else if (e.target.closest('.pv-next')) show(at + 1);
    else if (e.target !== big) closeLarge();
  });

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
      var out = j % 2 ? 1 : -1;
      light.style.left = xAt(y).toFixed(1) + 'px';
      light.style.top = y.toFixed(1) + 'px';
      light.style.transform = 'rotate(' + (out * (38 + rnd(j * 3.1 + k * 7) * 14)).toFixed(1) + 'deg)';
    });
  }

  function hangAll() {
    hide();
    cols.forEach(hang);
  }

  // ---- The photo out of a light, above it ----

  var out = null; // { i, light, fig }

  function reveal(i, keyed) {
    var light = lights[i];
    var r = light.getBoundingClientRect();
    var pw = +light.getAttribute('data-w');
    var ph = +light.getAttribute('data-h');
    var fig = document.createElement('figure');
    fig.className = 'adv-reveal';
    fig.setAttribute('role', 'dialog');
    fig.setAttribute('aria-label', label(i));
    fig.innerHTML =
      '<button type="button" class="adv-close" aria-label="Close the photo">×</button>' +
      '<a title="Show it large"><img alt=""></a>';
    var link = fig.querySelector('a');
    link.href = light.getAttribute('data-src');
    var img = fig.querySelector('img');
    img.src = light.getAttribute('data-src');
    img.alt = light.getAttribute('data-alt');
    img.width = pw;
    img.height = ph;

    // As wide as the column and a little more, and no taller than the window leaves room for
    var col = light.parentNode.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top0 = (nav ? nav.getBoundingClientRect().bottom : 0) + 10;
    var room = window.innerHeight - top0 - 10;
    var w = Math.round(Math.min(330, Math.max(210, col.width + 70)));
    fig.style.width = w + 'px';
    fig.style.visibility = 'hidden';
    document.body.appendChild(fig);
    var h = fig.offsetHeight;
    if (h > room) {
      var extra = h - (w - 14) * (ph / pw); // the padding
      w = Math.max(150, Math.floor(((room - extra) * pw) / ph + 14));
      fig.style.width = w + 'px';
      h = fig.offsetHeight;
    }
    // Its bottom just above the light, over the light's column
    var cx = r.left + r.width / 2;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
    var top = Math.max(top0, Math.min(window.innerHeight - h - 10, r.top - h - 6));
    fig.style.left = left + 'px';
    fig.style.top = top + 'px';
    fig.style.visibility = '';
    light.classList.add('is-on');

    out = { i: i, light: light, fig: fig };
    fig.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.adv-close')) {
        hide(true);
      } else if (e.target.closest('a')) {
        e.preventDefault();
        openLarge(i, link);
      }
    });
    if (keyed) link.focus({ preventScroll: true });
  }

  function hide(focus) {
    if (!out) return;
    var o = out;
    out = null;
    o.fig.remove();
    o.light.classList.remove('is-on');
    if (focus) o.light.focus({ preventScroll: true });
  }

  lights.forEach(function (light, i) {
    light.addEventListener('click', function (e) {
      e.stopPropagation();
      var again = out && out.i === i;
      hide(false);
      if (again) return; // a second click on the light puts its photo away
      if (wide.matches) reveal(i, e.detail === 0);
      else openLarge(i, light);
    });
  });

  document.addEventListener('click', function () {
    hide(false);
  });

  document.addEventListener('keydown', function (e) {
    if (!view.hidden) {
      if (e.key === 'Escape') closeLarge();
      else if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'ArrowRight') show(at + 1);
    } else if (e.key === 'Escape' && out) {
      hide(true);
    }
  });

  var timer;
  window.addEventListener('resize', function () {
    hide(false);
    clearTimeout(timer);
    timer = setTimeout(hangAll, 150);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hangAll);
  else hangAll();
})();
