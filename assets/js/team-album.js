// Team page photo album: the up and down buttons flip the vertical strip to the previous or next photo
(function () {
  document.querySelectorAll('.team-album').forEach(function (album) {
    var strip = album.querySelector('.album-strip');
    var items = strip.querySelectorAll('.album-item');
    function current() {
      var index = 0;
      items.forEach(function (item, i) {
        if (item.offsetTop <= strip.scrollTop + 4) index = i;
      });
      return index;
    }
    function flip(step) {
      var i = Math.max(0, Math.min(items.length - 1, current() + step));
      strip.scrollTo({ top: items[i].offsetTop, behavior: 'smooth' });
    }
    album.querySelector('.album-prev').addEventListener('click', function () { flip(-1); });
    album.querySelector('.album-next').addEventListener('click', function () { flip(1); });
  });
})();
