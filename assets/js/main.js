/* Sibley Financial Group — site behaviour
   Progressive enhancement only: every page is fully readable and usable
   with JavaScript disabled. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------- sticky header --- */
  var header = document.querySelector('.site-header');
  if (header) {
    var setStuck = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  /* ------------------------------------------------------- mobile nav --- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var closeNav = function (returnFocus) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav(true);
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav(false);
    });

    window.matchMedia('(min-width: 64rem)').addEventListener('change', function (e) {
      if (e.matches) closeNav(false);
    });
  }

  /* ---------------------------------------------------- scroll reveal --- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ------------------------------------------- count up the stat bar ---- */
  var figures = document.querySelectorAll('[data-count-to]');
  if (figures.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countObserver.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count-to'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var started = null;
        var step = function (now) {
          if (started === null) started = now;
          var p = Math.min((now - started) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased).toLocaleString('en-US') + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    figures.forEach(function (el) { countObserver.observe(el); });
  }

  /* ------------------------------------------------------- accordions --- */
  document.querySelectorAll('.accordion__trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var item = trigger.closest('.accordion__item');
      var open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* --------------------------------------- conditional field groups ----- */
  /* A select can reveal or hide a related block. Enhancement only: with no
     JavaScript the block stays visible and every field still submits. */
  document.querySelectorAll('select[data-toggles]').forEach(function (select) {
    var target = document.getElementById(select.getAttribute('data-toggles'));
    if (!target) return;
    var sync = function () {
      // Their details are only needed when we are the ones making contact.
      var needed = select.value !== 'introduce';
      target.hidden = !needed;
      if (!needed) {
        target.querySelectorAll('input').forEach(function (i) {
          i.value = '';
          i.setAttribute('aria-invalid', 'false');
          var err = document.getElementById(i.id + '-error');
          if (err) err.textContent = '';
        });
      }
    };
    select.addEventListener('change', sync);
    sync();
  });

  /* ------------------------------------------------ shop category filter - */
  /* Filtering is an enhancement only: with no JavaScript every product shows. */
  (function () {
    var chips = document.querySelectorAll('.shop-filter');
    var grid = document.getElementById('shop-grid');
    if (!chips.length || !grid) return;
    var products = Array.prototype.slice.call(grid.querySelectorAll('.product'));
    var empty = document.getElementById('shop-empty');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
        var shown = 0;
        products.forEach(function (p) {
          var match = want === 'all' || p.getAttribute('data-category') === want;
          // A chosen item stays visible so the basket never disagrees with the grid.
          var chosen = p.querySelector('[data-gift]').checked;
          p.hidden = !(match || chosen);
          if (!p.hidden) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  })();

  /* -------------------------------------------- gift selection limit ---- */
  /* The checkboxes work on their own; this only adds the running count and
     stops a selection going past the limit. */
  document.querySelectorAll('form[data-gift-limit]').forEach(function (form) {
    var limit = parseInt(form.getAttribute('data-gift-limit'), 10) || 2;
    var boxes = Array.prototype.slice.call(form.querySelectorAll('[data-gift]'));
    var bar = form.querySelector('#gift-counter');
    var countEl = form.querySelector('#gift-count');
    var noteEl = form.querySelector('#gift-counter-note');
    var errEl = form.querySelector('#gifts-error');
    var namesEl = form.querySelector('#gift-names');
    if (!boxes.length) return;

    var sync = function () {
      var chosen = boxes.filter(function (b) { return b.checked; });
      var atLimit = chosen.length >= limit;
      boxes.forEach(function (b) { b.disabled = atLimit && !b.checked; });
      if (countEl) countEl.textContent = String(chosen.length);
      if (namesEl) {
        namesEl.textContent = chosen.length
          ? '\u2014 ' + chosen.map(function (b) { return b.value; }).join(', ')
          : '';
      }
      if (noteEl) {
        noteEl.textContent = atLimit ? '\u2014 that is your two. Untick one to swap.' : '';
        noteEl.className = atLimit ? 'gift-counter__full' : '';
      }
      if (bar) bar.hidden = chosen.length === 0;
      if (chosen.length && errEl) errEl.textContent = '';
    };

    boxes.forEach(function (b) { b.addEventListener('change', sync); });
    sync();

    form.addEventListener('submit', function (e) {
      if (boxes.some(function (b) { return b.checked; })) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (errEl) errEl.textContent = 'Please choose at least one gift.';
      boxes[0].focus();
      boxes[0].closest('.gift').scrollIntoView({ block: 'center' });
    }, true);   // capture phase: runs before the shared form handler
  });

  /* ------------------------------------------------------ site forms ---- */
  /* Any form carrying .js-form gets validation, honeypot handling and the
     email fallback. Scoped per form so a page can hold more than one. */
  document.querySelectorAll('form.js-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    var setError = function (field, message) {
      var errorEl = document.getElementById(field.id + '-error');
      if (errorEl) errorEl.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    };

    var validate = function (field) {
      var value = (field.value || '').trim();
      if (field.hasAttribute('required') && !value) {
        return setError(field, 'This field is required.');
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return setError(field, 'Enter a valid email address.');
      }
      if (field.type === 'tel' && value && value.replace(/\D/g, '').length < 10) {
        return setError(field, 'Enter a 10-digit phone number.');
      }
      if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        return setError(field, 'Please confirm before sending.');
      }
      return setError(field, '');
    };

    var fields = Array.prototype.slice.call(
      form.querySelectorAll('input[name], select[name], textarea[name]')
    ).filter(function (f) { return f.type !== 'hidden'; });

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    var announce = function (kind, message) {
      if (!status) return;
      status.className = 'form-status is-visible form-status--' + kind;
      status.textContent = message;
    };

    form.addEventListener('submit', function (e) {
      var valid = fields.map(validate).every(Boolean);
      if (!valid) {
        e.preventDefault();
        announce('err', 'Please correct the highlighted fields and try again.');
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      // Honeypot: silently drop anything that fills the hidden field.
      var honey = form.querySelector('input[name="company_website"]');
      if (honey && honey.value) { e.preventDefault(); return; }

      var endpoint = form.getAttribute('action') || '';
      // Until a real form endpoint is configured (see README), fall back to a
      // pre-filled email so no enquiry is ever lost.
      if (endpoint.indexOf('REPLACE_WITH') !== -1 || endpoint === '') {
        e.preventDefault();
        var get = function (name) {
          var el = form.elements[name];
          return el ? (el.value || '').trim() : '';
        };
        var body = [
          'Name: ' + get('name'),
          'Email: ' + get('email'),
          'Phone: ' + get('phone'),
          'Interested in: ' + get('interest'),
          'Preferred contact: ' + get('preferred'),
          '',
          get('message')
        ].join('\n');
        announce('ok', 'Opening your email app with this message ready to send.');
        window.location.href = 'mailto:' + (form.dataset.fallbackEmail || 'info@sibleyfinancialgroup.com') +
          '?subject=' + encodeURIComponent('Website enquiry from ' + get('name')) +
          '&body=' + encodeURIComponent(body);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Sending…';
      }
      announce('ok', 'Sending your request…');
    });
  });

  /* ---------------------------------------------------- footer year ----- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
