/* Filozen site : bandeau de consentement + Google Tag Manager (Consent Mode v2).
   Tant que le visiteur n'a pas accepté, Google ne dépose aucun cookie d'analyse.
   Le choix est gardé 6 mois dans localStorage (clé fz-consent). */
(function () {
  var GTM_ID = 'GTM-PFFBH82G';
  var GA_ID = 'G-QKRSXF0YF8'; // GA4, utilisé tant que GTM n'est pas branché
  var KEY = 'fz-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && Date.now() - v.t < MAX_AGE) return v.c;
    } catch (e) {}
    return null;
  }
  function save(c) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: c, t: Date.now() })); } catch (e) {}
  }
  function apply(c) {
    gtag('consent', 'update', { analytics_storage: c === 'yes' ? 'granted' : 'denied' });
  }

  var saved = read();
  if (saved) apply(saved);

  // Avec GTM, c'est le conteneur qui charge GA4. Sans GTM, on charge GA4 directement.
  var s = document.createElement('script');
  s.async = true;
  if (/^GTM-[A-Z0-9]+$/.test(GTM_ID) && GTM_ID !== 'GTM-XXXXXXX') {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  } else {
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  }
  document.head.appendChild(s);

  var fr = (document.documentElement.lang || 'fr').slice(0, 2) === 'fr';
  var T = fr
    ? { msg: 'Nous mesurons l’audience du site avec Google Analytics pour l’améliorer. Aucune publicité, aucune revente.', yes: 'Accepter', no: 'Refuser', more: 'En savoir plus' }
    : { msg: 'We measure site traffic with Google Analytics to improve it. No ads, nothing sold.', yes: 'Accept', no: 'Decline', more: 'Learn more' };
  var base = (document.currentScript && document.currentScript.src || '').replace(/consent\.js.*$/, '');

  function banner() {
    if (document.getElementById('fz-consent')) return;
    var b = document.createElement('div');
    b.id = 'fz-consent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', fr ? 'Cookies' : 'Cookies');
    b.innerHTML =
      '<p>' + T.msg + ' <a href="' + base + 'cookies.html">' + T.more + '</a></p>' +
      '<div><button type="button" data-c="no">' + T.no + '</button>' +
      '<button type="button" data-c="yes">' + T.yes + '</button></div>';
    var css = document.createElement('style');
    css.textContent =
      '#fz-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'background:#fff;color:#1B1640;border-radius:18px;padding:16px 18px;box-shadow:0 6px 0 #D9DBF5,0 10px 30px rgba(0,0,0,.12);' +
      'font:15px/1.5 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left}' +
      '#fz-consent p{margin:0 0 12px;max-width:none;color:#1B1640;font-weight:500}' +
      '#fz-consent a{color:#2F6BFF;font-weight:700}' +
      '#fz-consent div{display:flex;gap:10px;justify-content:flex-end}' +
      '#fz-consent button{font:inherit;font-weight:800;border:0;border-radius:12px;padding:10px 18px;cursor:pointer;background:#ECEEFF;color:#1B1640}' +
      '#fz-consent button[data-c=yes]{background:#1B1640;color:#fff}';
    document.head.appendChild(css);
    b.addEventListener('click', function (e) {
      var c = e.target.getAttribute && e.target.getAttribute('data-c');
      if (!c) return;
      save(c); apply(c); b.remove();
    });
    document.body.appendChild(b);
  }

  window.fzConsentReset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    apply('no'); banner();
  };

  if (!saved) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner);
    else banner();
  }
})();
