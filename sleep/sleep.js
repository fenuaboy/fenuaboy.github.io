/* Vidéos YouTube chargées seulement au clic (aucun cookie YouTube avant). */
document.querySelectorAll('button.video[data-id]').forEach(function (b) {
  var id = b.dataset.id;
  b.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + id + '/hqdefault.jpg)';
  b.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = b.querySelector('span').textContent;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    var d = document.createElement('div');
    d.className = 'video';
    d.appendChild(f);
    b.replaceWith(d);
  }, { once: true });
});
