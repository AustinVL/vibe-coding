/* Step engine, contemporary draft. The chrome is a fixed rail rather than a top
   bar, and the opening is a measured sequence rather than an attract screen.

   The page is authored expanded and JS hides what it does not need: the `js`
   class on <html> (set in each page's head, removed again if this file fails to
   load or throws) is what gates every display:none rule in alt.css. If anything
   here breaks, the guide degrades to one long readable document. */
(function () {
  "use strict";

  var TRACK = window.TRACK || { id: "track" };
  var KEY = "vc26." + TRACK.id;
  var reduce = /[?&]still/.test(location.search) ||
    (window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ...and make it freeze the CSS transitions too, so ?still=1 means what the
  // README says it means rather than only skipping the scheduled steps
  if (reduce) document.documentElement.className += " still";

  /* ------------------------------------------------------------- storage */
  function load() {
    var v;
    try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    // a stored scalar would throw on state.checks below, in module scope
    return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  // ?fresh=1 — one link a helper can hand a student stranded on a shared laptop.
  // Strip it from the URL afterwards, or every later reload silently wipes the
  // work done since, which is the opposite of what the student wants.
  if (/[?&]fresh/.test(location.search)) {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try {
      var q = location.search.replace(/[?&]fresh(=[^&]*)?/g, "").replace(/^&/, "?");
      history.replaceState(null, "", location.pathname + q + location.hash);
    } catch (e) {}
  }
  var state = load();
  if (!state.checks) state.checks = {};

  /* ------------------------------------------------------- dot numerals */
  /* The deck's own device (sloan.ghost_numeral): a 5x7 dot matrix drawn as
     separate squares with a gap, which is what makes it read as pixels rather
     than a blob. Built from real elements, so it stays crisp at any size. */
  var DOT = {
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
    ".": ["0", "0", "0", "0", "0", "0", "1"]          // one column wide
  };

  function fillNumeral(el, animate) {
    var chars = String(el.getAttribute("data-num") || "").split("")
      .filter(function (ch) { return DOT[ch]; });
    // glyphs differ in width (a digit is five columns, the point one), with a
    // blank column between neighbours
    var widths = chars.map(function (ch) { return DOT[ch][0].length; });
    var cols = widths.reduce(function (a, w) { return a + w; }, 0) +
      Math.max(0, chars.length - 1);
    el.textContent = "";
    el.style.setProperty("--cols", cols);
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", chars.join(""));
    for (var r = 0; r < 7; r++) {
      var x = 0;
      for (var d = 0; d < chars.length; d++) {
        if (d > 0) { el.appendChild(document.createElement("i")); x++; } // spacer
        for (var c = 0; c < widths[d]; c++, x++) {
          var i = document.createElement("i");
          if (DOT[chars[d]][r][c] === "1") {
            i.className = "on";
            if (animate && !reduce) i.style.transitionDelay = (x * 34 + r * 6) + "ms";
          }
          el.appendChild(i);
        }
      }
    }
    if (!animate || reduce) el.classList.add("is-in");
  }

  function paintNumerals(root) {
    Array.prototype.forEach.call(
      (root || document).querySelectorAll("[data-num]"), function (el) {
        if (!el.classList.contains("intro__num")) fillNumeral(el, false);
      });
  }

  /* ---------------------------------------------------------------- intro */
  function runIntro() {
    var intro = document.querySelector(".intro");
    if (!intro) return;

    var seen = /[?&]nointro/.test(location.search);
    // localStorage, not session: the exercise guarantees a second tab, and
    // nobody should be made to watch the opening twice
    try { seen = seen || localStorage.getItem("vc26alt.intro." + TRACK.id) === "1"; }
    catch (e) {}
    if (seen) { intro.parentNode.removeChild(intro); return; }

    var step = reduce ? 0 : 1;
    var at = function (ms, fn) { setTimeout(fn, ms * step); };
    var hit = function (sel, fn) { var el = intro.querySelector(sel); if (el) fn(el); };

    at(60, function () { hit(".intro__sweep", function (e) { e.classList.add("is-in"); }); });
    at(240, function () { hit(".intro__eyebrow", function (e) { e.classList.add("is-in"); }); });

    var num = intro.querySelector(".intro__num");
    if (num) {
      num.classList.add("dots--anim");
      fillNumeral(num, true);            // squares light column by column
      at(420, function () { num.classList.add("is-in"); });
    }

    var lines = intro.querySelectorAll(".intro__title span");
    Array.prototype.forEach.call(lines, function (ln, i) {
      at(900 + i * 110, function () { ln.classList.add("is-in"); });
    });
    at(900 + lines.length * 110 + 180, function () {
      hit(".intro__rule", function (e) { e.classList.add("is-in"); });
      hit(".intro__meta", function (e) { e.classList.add("is-in"); });
    });
    at(900 + lines.length * 110 + 500, function () {
      hit(".intro__go", function (e) { e.classList.add("is-in"); });
    });

    var gone = false;
    function dismiss() {
      if (gone) return;
      gone = true;
      try { localStorage.setItem("vc26alt.intro." + TRACK.id, "1"); } catch (e) {}
      intro.classList.add("is-gone");
      setTimeout(function () {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 800);
    }
    // dismissible from the first frame, anywhere — the designed sequence still
    // plays for anyone who waits, but a late student is never gated by it
    intro.addEventListener("click", dismiss);
    document.addEventListener("keydown", function onKey(e) {
      // once dismissed, get out of the way — otherwise this swallows the first
      // Space press a reader uses to scroll the page
      if (gone) { document.removeEventListener("keydown", onKey); return; }
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        document.removeEventListener("keydown", onKey);
        dismiss();
      }
    });
  }

  function introOpen() { return !!document.querySelector(".intro"); }

  /* -------------------------------------------------------------- stepper */
  var steps = [].slice.call(document.querySelectorAll(".step"));
  var doneScreen = document.querySelector(".done");
  var indexWrap = document.querySelector(".rail__index");
  var fillEl = document.querySelector(".meter__fill");
  var meterEl = document.querySelector(".meter");
  var readStep = document.querySelector("[data-read-step]");
  var readPct = document.querySelector("[data-read-pct]");
  var nowEl = document.querySelector(".rail__now");
  var current = 0;

  /* The label a step shows the student — "2.2" is section 2, step 2 — or null
     for the unnumbered preflight. The big numeral, the rail, the readout and
     #step- all derive from these, so the numbering systems agree. */
  function stepNum(i) {
    if (!steps[i]) return null;
    var n = steps[i].querySelector(".step__num");
    var v = n && n.getAttribute("data-num");
    return v || null;
  }
  // the section this page belongs to, read off its own step numerals
  var SECTION = (function () {
    for (var i = 0; i < steps.length; i++) {
      var v = stepNum(i);
      if (v && v.indexOf(".") > 0) return v.split(".")[0];
    }
    return "";
  })();
  function stepLabel(i) {
    return stepNum(i) || (SECTION ? SECTION + ".0" : "0");
  }
  // takes the label as shown ("2.2", "2.0") or a bare step number ("2", "0")
  function indexOfNum(n) {
    var k = parseInt(String(n).split(".").pop(), 10);
    if (k === 0) return steps.length ? 0 : -1;
    for (var i = 0; i < steps.length; i++) {
      var v = stepNum(i);
      if (v && parseInt(v.split(".").pop(), 10) === k) return i;
    }
    return -1;
  }

  function allChecks() {
    return [].slice.call(document.querySelectorAll("input[data-check]"));
  }
  function stepChecks(i) {
    if (!steps[i]) return [];
    return [].slice.call(steps[i].querySelectorAll("input[data-check]"));
  }
  function stepComplete(i) {
    var cs = stepChecks(i);
    return cs.length > 0 && cs.every(function (c) { return c.checked; });
  }
  function progress() {
    var all = allChecks();
    if (!all.length) return 0;
    return all.filter(function (c) { return c.checked; }).length / all.length;
  }
  function isDone() { return !!(doneScreen && doneScreen.classList.contains("is-active")); }

  /* The gate. A step is satisfied when every box on it is ticked; the furthest
     a student may be is the first unsatisfied step, or steps.length — the
     completion screen — once every box on the page is ticked. */
  function stepSatisfied(i) {
    return stepChecks(i).every(function (c) { return c.checked; });
  }
  function furthest() {
    for (var i = 0; i < steps.length; i++) if (!stepSatisfied(i)) return i;
    return steps.length;
  }

  function setHash(h) {
    // file:// gives an opaque origin and some engines throttle or refuse this;
    // an uncaught throw here used to abort the scroll that follows it
    try { if (history.replaceState) history.replaceState(null, "", h); } catch (e) {}
  }
  function toTop(smooth) {
    try { window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" }); }
    catch (e) { window.scrollTo(0, 0); }
    if (window.pageYOffset > 0) window.scrollTo(0, 0);
  }

  function buildIndex() {
    // the hub hand-writes its own index; only build one where there are steps
    if (!indexWrap || !steps.length) return;
    indexWrap.innerHTML = "";
    steps.forEach(function (s, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.className = "rail__item";
      b.type = "button";
      b.innerHTML = '<span class="rail__n"></span><span class="rail__l"></span>';
      b.querySelector(".rail__n").textContent = stepLabel(i);
      b.querySelector(".rail__l").textContent =
        s.getAttribute("data-rail") || ("Step " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      li.appendChild(b);
      indexWrap.appendChild(li);
    });
  }

  function paintIndex() {
    if (indexWrap && steps.length) {
      var limit = furthest();
      [].slice.call(indexWrap.querySelectorAll(".rail__item"))
        .forEach(function (b, i) {
          var now = i === current && !isDone();
          var locked = i > limit;
          b.disabled = locked;
          b.title = locked ? "Tick every box on the step before this one first" : "";
          b.classList.toggle("is-done", stepComplete(i));
          b.classList.toggle("is-now", now);
          if (now) b.setAttribute("aria-current", "step");
          else b.removeAttribute("aria-current");
        });
    }
    // the meter must agree with the readout beside it: COMPLETE means full
    var p = isDone() ? 1 : progress();
    var pct = Math.round(p * 100);
    if (fillEl) fillEl.style.width = pct + "%";
    if (meterEl) meterEl.setAttribute("aria-valuenow", String(pct));
    if (readStep) {
      readStep.textContent = isDone()
        ? "COMPLETE"
        : "STEP " + stepLabel(current);
    }
    if (readPct) readPct.textContent = pct + "%";
    paintGuides();
    if (nowEl) {
      nowEl.textContent = isDone()
        ? "Complete"
        : (steps[current] && steps[current].getAttribute("data-rail")) || "";
    }
  }

  function go(i, opts) {
    opts = opts || {};
    if (doneScreen) doneScreen.classList.remove("is-active");
    var limit = furthest();
    if (i >= steps.length) {
      if (limit >= steps.length) { finish(); return; }
      i = limit;
    }
    // nobody lands past the first step that still has an unticked box — not by
    // Next, the rail, a deep link, or saved progress
    current = Math.max(0, Math.min(steps.length - 1, i, limit));
    steps.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
    state.step = current;
    save(state);
    paintIndex();
    refreshNav();
    if (!opts.silent) {
      setHash("#step-" + stepLabel(current));
      toTop(!reduce);
      focusHead(steps[current].querySelector(".step__title"));
    }
  }

  function advance() {
    var limit = furthest();
    if (limit > current) go(current + 1);
    else nudge(limit);
  }

  /* A locked Next still takes the press, so it can point at what is missing
     rather than doing nothing: go to the step with the unticked box if it is an
     earlier one, outline every unticked box, and put focus on the first. */
  function nudge(i) {
    if (i !== current) go(i);
    var missing = stepChecks(i).filter(function (c) { return !c.checked; });
    missing.forEach(function (c) {
      var row = c.closest(".check");
      if (!row) return;
      row.classList.remove("is-missing");
      void row.offsetWidth;                 // restart the pulse on a repeat press
      row.classList.add("is-missing");
    });
    var first = missing[0];
    if (!first) return;
    try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    var target = first.closest(".check") || first;
    try { target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); }
    catch (e) { target.scrollIntoView(); }
  }

  /* Steps swap the whole of main; without this, focus falls to <body>, the next
     Tab restarts up in the rail, and a screen reader is told nothing happened. */
  function focusHead(el) {
    if (!el) return;
    el.setAttribute("tabindex", "-1");
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function finish() {
    var limit = furthest();
    if (limit < steps.length) { go(limit); nudge(limit); return; }
    steps.forEach(function (s) { s.classList.remove("is-active"); });
    if (doneScreen) doneScreen.classList.add("is-active");
    state.done = true;
    save(state);
    paintIndex();
    setHash("#done");
    toTop(!reduce);
    if (doneScreen) focusHead(doneScreen.querySelector(".done__t"));
  }

  function refreshNav() {
    var limit = furthest();
    steps.forEach(function (s, i) {
      var cs = stepChecks(i);
      var left = cs.filter(function (c) { return !c.checked; }).length;
      var open = limit > i;          // this step and every one before it: ticked
      var hint = s.querySelector("[data-hint]");
      var next = s.querySelector("[data-next]");
      if (hint && !hint.id) hint.id = "hint-" + i;
      if (next) {
        next.classList.toggle("is-locked", !open);
        next.setAttribute("aria-disabled", open ? "false" : "true");
        if (hint) next.setAttribute("aria-describedby", hint.id);
      }
      if (!hint) return;
      hint.textContent = !cs.length ? ""
        : open ? "All checks done."
        : left === 0 ? "An earlier step still has an unticked box."
        : left === 1 ? "Tick the last check to continue."
        : "Tick the " + left + " remaining checks to continue.";
    });
  }

  /* ----------------------------------------------------------------- copy */
  function wireCopy() {
    Array.prototype.forEach.call(document.querySelectorAll(".btn-copy"), function (b) {
      var label = b.textContent;          // captured once, not per click
      var timer = null;

      function flash(text, okState) {
        if (timer) clearTimeout(timer);
        b.textContent = text;
        b.classList.toggle("is-ok", !!okState);
        timer = setTimeout(function () {
          b.textContent = label;
          b.classList.remove("is-ok");
        }, okState ? 1600 : 4000);
      }

      b.addEventListener("click", function () {
        var card = b.closest(".prompt");
        var body = card && card.querySelector(".prompt__body");
        if (!body) return;
        var text = body.innerText.replace(/ /g, " ").trim();

        function manual() {
          // Tell the truth and leave the text selected so Ctrl/Cmd-C works.
          try {
            var r = document.createRange();
            r.selectNodeContents(body);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
          } catch (e) {}
          flash("Press Ctrl/Cmd-C", false);
        }

        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "0";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          var copied = false;
          // execCommand RETURNS false when refused; it does not throw, so the
          // old code reported success onto an empty clipboard
          try { copied = document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
          try { b.focus(); } catch (e) {}
          if (copied) flash("Copied", true); else manual();
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            navigator.clipboard.writeText(text)
              .then(function () { flash("Copied", true); }, fallback);
          } catch (e) { fallback(); }
        } else { fallback(); }
      });
    });
  }

  /* --------------------------------------------------------------- wiring */
  function wireChecks() {
    allChecks().forEach(function (c) {
      var id = c.getAttribute("data-check");
      if (state.checks[id]) c.checked = true;
      c.addEventListener("change", function () {
        state.checks[id] = c.checked;
        var row = c.closest(".check");
        if (row) row.classList.remove("is-missing");
        save(state);
        paintIndex();
        refreshNav();
      });
    });
  }

  function wireNav() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var n = t.closest("[data-next]");
      if (n) { e.preventDefault(); advance(); return; }
      var p = t.closest("[data-back]");
      if (p) { e.preventDefault(); go(current - 1); return; }
      var r = t.closest("[data-restart]");
      if (r) {
        e.preventDefault();
        state.done = false;              // or the next reload jumps back here
        save(state);
        go(0);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (introOpen()) return;
      var t = e.target;
      if (!t || !t.matches || t.matches("input, textarea, summary, button, a, [contenteditable]")) return;
      // never let a stray key complete a track — that is always a button press
      // and never nudge on a stray key: a locked step just stays put
      if (e.key === "ArrowRight" && current < steps.length - 1 && furthest() > current) {
        go(current + 1);
      }
      if (e.key === "ArrowLeft") go(current - 1);
    });

    var reset = document.querySelector(".btn-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        if (!confirm("Clear the ticks and progress saved on this page in this browser?")) return;
        try { localStorage.removeItem(KEY); } catch (e) {}
        state = { checks: {} };
        allChecks().forEach(function (c) { c.checked = false; });
        go(0);
        paintIndex();
        refreshNav();
      });
    }
  }

  /* A quiet tick beside every finished guide, in the rail of every page.
     Reads storage rather than this page's state, so it covers the other two. */
  function paintGuides() {
    Array.prototype.forEach.call(document.querySelectorAll(".rail__guide[data-guide]"), function (li) {
      var s;
      try { s = JSON.parse(localStorage.getItem("vc26." + li.getAttribute("data-guide"))); }
      catch (e) {}
      var done = !!(s && s.done);
      var link = li.querySelector(".rail__g");
      var tick = link && link.querySelector(".rail__tick");
      li.classList.toggle("is-finished", done);
      if (done && link && !tick) {
        tick = document.createElement("span");
        tick.className = "rail__tick";
        tick.innerHTML = '<span class="vh"> (finished)</span>';
        link.appendChild(tick);
      } else if (!done && tick) {
        tick.parentNode.removeChild(tick);
      }
    });
  }

  function paintHubStatus() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-track-status]"), function (el) {
        var id = el.getAttribute("data-track-status"), s;
        try { s = JSON.parse(localStorage.getItem("vc26." + id)) || {}; }
        catch (e) { s = {}; }
        if (s && s.done) { el.textContent = "Finished"; el.classList.add("is-done"); }
        else if (s && s.checks &&
          Object.keys(s.checks).some(function (k) { return s.checks[k]; })) {
          el.textContent = "In progress";
        }
      });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    paintNumerals();
    buildIndex();
    wireChecks();
    wireCopy();
    wireNav();
    paintHubStatus();
    runIntro();

    if (steps.length) {
      var limit = furthest();
      var want;
      var m = /^#step-(\d+(?:\.\d+)?)$/.exec(location.hash);
      if (m) {
        var i = indexOfNum(m[1]);
        want = i >= 0 ? i : steps.length - 1;   // clamp, never silently finish
      } else if (location.hash === "#done" || state.done) {
        want = steps.length;
      } else if (typeof state.step === "number") {
        want = state.step;
      } else {
        want = 0;
      }
      if (want >= steps.length && limit >= steps.length) {
        finish();
      } else {
        go(Math.min(want, limit), { silent: true });
        if (location.hash && want !== current) {   // a deep link the gate refused
          setHash("#step-" + stepLabel(current));
        }
      }
    }
    paintIndex();
    refreshNav();
  }

  function degrade() {
    // Show everything rather than nothing. Mirrors the inline guard in each page.
    var h = document.documentElement;
    h.className = h.className.replace(/(^|\s)js(\s|$)/, " ").trim();
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { boot(); }
    catch (err) {
      degrade();
      if (window.console) console.error("workshop guide: falling back to the full page", err);
    }
  });

  window.__ALT_OK = 1;   // the page's inline guard checks this after loading us
})();
