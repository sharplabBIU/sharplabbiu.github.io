// Lab Adventures photos (team page): a photo opens large over the page when clicked. The arrows (or the arrow keys)
// step through the photos, and a click beside the photo, the close button or Escape closes it
(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.lab-adventures a.adventure-photo'));
  if (!links.length) return;

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

  var img = view.querySelector('img');
  var caption = view.querySelector('figcaption');
  var at = 0;
  var opener = null;

  function show(i) {
    at = (i + links.length) % links.length;
    var thumb = links[at].querySelector('img');
    img.src = links[at].href;
    img.alt = thumb.alt;
    caption.textContent = thumb.alt;
  }

  function open(i) {
    opener = links[i];
    show(i);
    view.hidden = false;
    document.body.classList.add('pv-open');
    view.querySelector('.pv-close').focus();
  }

  function close() {
    view.hidden = true;
    document.body.classList.remove('pv-open');
    img.removeAttribute('src');
    if (opener) opener.focus();
  }

  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      open(i);
    });
  });

  view.addEventListener('click', function (e) {
    if (e.target.closest('.pv-prev')) show(at - 1);
    else if (e.target.closest('.pv-next')) show(at + 1);
    else if (e.target !== img) close();
  });

  document.addEventListener('keydown', function (e) {
    if (view.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'ArrowRight') show(at + 1);
  });
})();
