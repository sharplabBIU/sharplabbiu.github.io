// Lab Adventures (team page): a bubble for each photo, "Lab Adventure #1" and on, then "Lab Mascot #1" and on (the
// labels are in the page). Either side of the box (on windows with room there), a click on a bubble makes it swell and
// pop, bursting into droplets, and its photo springs out above where it was; the photo opens large when clicked, and closing it (the ×, a click elsewhere or Escape) blows the bubble again.
// In the box (narrower windows), the bubble pops and its photo opens large straight away. Large, the arrows (or the
// arrow keys) step through the photos, and a click beside the photo, the close button or Escape closes it
(function () {
  'use strict';

  var bubbles = Array.prototype.slice.call(document.querySelectorAll('.adv-bubble'));
  if (!bubbles.length) return;

  // The same test as $side-cols in _sass/_base.scss: whether the bubbles are either side of the box
  var wide = window.matchMedia('(min-width: 1240px) and (min-height: 560px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function label(i) {
    return bubbles[i].getAttribute('data-label');
  }

  // ---- A photo large over the page ----

  var view = document.createElement('div');
  view.className = 'photo-viewer';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-label', 'Photo');
  view.hidden = true;
  view.innerHTML =
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="pv-close" aria-label="Close">×</button>' +
    '<button type="button" class="pv-prev" aria-label="Previous photo">‹</button>' +
    '<button type="button" class="pv-next" aria-label="Next photo">›</button>';
  document.body.appendChild(view);

  var big = view.querySelector('img');
  var caption = view.querySelector('figcaption');
  var at = 0;
  var opener = null;
  var afterLarge = null; // what to do once the large photo is closed

  function show(i) {
    at = (i + bubbles.length) % bubbles.length;
    var b = bubbles[at];
    big.src = b.getAttribute('data-src');
    big.alt = b.getAttribute('data-alt');
    caption.textContent = label(at) + ': ' + b.getAttribute('data-alt');
  }

  function openLarge(i, from, then) {
    opener = from;
    afterLarge = then || null;
    show(i);
    view.hidden = false;
    document.body.classList.add('pv-open');
    view.querySelector('.pv-close').focus();
  }

  function closeLarge() {
    view.hidden = true;
    document.body.classList.remove('pv-open');
    big.removeAttribute('src');
    var then = afterLarge;
    afterLarge = null;
    if (then) then();
    else if (opener && document.body.contains(opener)) opener.focus({ preventScroll: true });
  }

  view.addEventListener('click', function (e) {
    e.stopPropagation(); // (so it does not also close the photo out of a bubble)
    if (e.target.closest('.pv-prev')) show(at - 1);
    else if (e.target.closest('.pv-next')) show(at + 1);
    else if (e.target !== big) closeLarge();
  });

  // ---- Bubbles ----

  // Swells and bursts, scattering droplets, then is gone; then(rect) is given where it was
  function pop(b, then) {
    var r = b.getBoundingClientRect();
    b.classList.remove('is-blowing');
    if (still.matches) {
      b.classList.add('is-popped');
      then(r);
      return;
    }
    b.classList.add('is-popping');
    setTimeout(function () {
      burst(r);
      b.classList.remove('is-popping');
      b.classList.add('is-popped');
      then(r);
    }, 300);
  }

  // Droplets flying out from the rim of a bubble
  function burst(r) {
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var rad = (r.width / 2) * 1.3;
    for (var k = 0; k < 14; k++) {
      var a = (k / 14) * 2 * Math.PI + Math.random() * 0.4;
      var d = 16 + Math.random() * 22;
      var drop = document.createElement('span');
      drop.className = 'adv-drop';
      drop.style.left = cx + Math.cos(a) * rad + 'px';
      drop.style.top = cy + Math.sin(a) * rad + 'px';
      drop.style.setProperty('--dx', Math.cos(a) * d + 'px');
      drop.style.setProperty('--dy', Math.sin(a) * d + 'px');
      var s = 0.6 + Math.random() * 0.8;
      drop.style.width = drop.style.height = 7 * s + 'px';
      document.body.appendChild(drop);
      setTimeout(drop.remove.bind(drop), 700);
    }
  }

  // Blown again, where it was
  function blow(b, focus) {
    b.classList.remove('is-popped');
    void b.offsetWidth; // (so the animation starts again)
    b.classList.add('is-blowing');
    setTimeout(function () {
      b.classList.remove('is-blowing');
    }, 600);
    if (focus) b.focus({ preventScroll: true });
  }

  // ---- The photo out of a bubble, above where it was ----

  var out = null; // { i, bubble, fig }

  function reveal(i, r, keyed) {
    var b = bubbles[i];
    var pw = +b.getAttribute('data-w');
    var ph = +b.getAttribute('data-h');
    var fig = document.createElement('figure');
    fig.className = 'adv-reveal';
    fig.setAttribute('role', 'dialog');
    fig.setAttribute('aria-label', label(i));
    fig.innerHTML =
      '<button type="button" class="adv-close" aria-label="Close the photo">×</button>' +
      '<a title="Show it large"><img alt=""></a><figcaption><strong></strong><span></span></figcaption>';
    var link = fig.querySelector('a');
    link.href = b.getAttribute('data-src');
    var img = fig.querySelector('img');
    img.src = b.getAttribute('data-src');
    img.alt = b.getAttribute('data-alt');
    img.width = pw;
    img.height = ph;
    fig.querySelector('strong').textContent = label(i);
    fig.querySelector('figcaption span').textContent = b.getAttribute('data-alt');

    // As wide as the column and a little more, and no taller than the window leaves room for
    var col = b.parentNode.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top0 = (nav ? nav.getBoundingClientRect().bottom : 0) + 10;
    var room = window.innerHeight - top0 - 10;
    var w = Math.round(Math.min(330, Math.max(210, col.width + 70)));
    fig.style.width = w + 'px';
    fig.style.visibility = 'hidden';
    document.body.appendChild(fig);
    var h = fig.offsetHeight;
    if (h > room) {
      var extra = h - (w - 14) * (ph / pw); // the caption and the padding
      w = Math.max(150, Math.floor(((room - extra) * pw) / ph + 14));
      fig.style.width = w + 'px';
      h = fig.offsetHeight;
    }
    // Its bottom where the middle of the bubble was, and over the bubble's column
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
    var top = Math.max(top0, Math.min(window.innerHeight - h - 10, cy - h));
    fig.style.left = left + 'px';
    fig.style.top = top + 'px';
    fig.style.transformOrigin = cx - left + 'px ' + (cy - top) + 'px';
    fig.style.visibility = '';

    out = { i: i, bubble: b, fig: fig };
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

  // Puts the photo away and blows its bubble again
  function hide(focus) {
    if (!out) return;
    var o = out;
    out = null;
    var gone = function () {
      if (o.fig.parentNode) o.fig.remove();
    };
    if (still.matches) gone();
    else {
      o.fig.classList.add('is-closing');
      setTimeout(gone, 240);
    }
    blow(o.bubble, focus);
  }

  bubbles.forEach(function (b, i) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (b.classList.contains('is-popping') || b.classList.contains('is-popped')) return;
      var keyed = e.detail === 0; // from the keyboard
      hide(false);
      pop(b, function (r) {
        if (wide.matches) reveal(i, r, keyed);
        else
          openLarge(i, b, function () {
            blow(b, true);
          });
      });
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

  window.addEventListener('resize', function () {
    hide(false);
  });
})();
