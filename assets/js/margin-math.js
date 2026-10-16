// Matrix-style digital rain in the empty side margins: staggered columns of
// falling 0s and 1s on black, with full reinforcement-learning equations (TD
// variants, on/off-policy control, model-based planning, Dyna, successor
// representations, and models from the lab's papers) dropping through the rain.
// Drawn only outside the main content column; each page favors related equations.
(function () {
  "use strict";

  var content = document.querySelector('[role="main"]');
  if (!content || !document.createElement("canvas").getContext) return;

  var GROUPS = {
    td: [
      "δₜ = rₜ₊₁ + γV(sₜ₊₁) − V(sₜ)",
      "V(s) ← V(s) + α[r + γV(s′) − V(s)]",
      "eₜ(s) = γλ eₜ₋₁(s) + 1[s = sₜ]",
      "V(s) ← V(s) + α δₜ eₜ(s)",
      "Gₜ:ₜ₊ₙ = rₜ₊₁ + γrₜ₊₂ + … + γⁿV(sₜ₊ₙ)",
      "V ← V + α(r − V)",
      "M(s,·) ← M(s,·) + α[1ₛ + γM(s′,·) − M(s,·)]",
      "θ ← θ + α δ ∇θ ln π(a|s,θ)",
    ],
    policy: [
      "Q(s,a) ← Q(s,a) + α[r + γQ(s′,a′) − Q(s,a)]",
      "Q(s,a) ← Q(s,a) + α[r + γ maxₐ′ Q(s′,a′) − Q(s,a)]",
      "Q(s,a) ← Q(s,a) + α[r + γ Σₐ′ π(a′|s′) Q(s′,a′) − Q(s,a)]",
      "ρₜ = π(aₜ|sₜ) / b(aₜ|sₜ)",
      "V(s) ← V(s) + α ρₜ[r + γV(s′) − V(s)]",
      "θ ← θ + α Gₜ ∇θ ln π(aₜ|sₜ,θ)",
      "π(a|s) = exp(βQ(s,a)) / Σᵦ exp(βQ(s,b))",
    ],
    planning: [
      "Vπ(s) = Σₐ π(a|s) Σₛ′ P(s′|s,a)[r + γVπ(s′)]",
      "Q*(s,a) = Σₛ′ P(s′|s,a)[r + γ maxₐ′ Q*(s′,a′)]",
      "V(s) ← maxₐ Σₛ′ P(s′|s,a)[r + γV(s′)]",
      "Model(s,a) ← (r, s′)",
      "(s,a) ~ memory;  (r,s′) ← Model(s,a)",
      "Q(s,a) = w·Q_MB(s,a) + (1 − w)·Q_MF(s,a)",
      "V(s) = Σₛ′ M(s,s′) r(s′)",
      "EVB(sₖ,aₖ) = Gain × Need",
    ],
    lab: [
      "p = 1 − C(n_fail, S) / C(n_total, S)",
      "Sₜ = Sₜ₋₁ + b",
      "V_take = R_g · γ_d^Δ,  V_relinquish = 1",
      "Q(a) = β_MBMC·V(a) + β_CB + C_CRF(a) + C_P(a)",
      "P(a|θ) = Σₙ pₙ · σ(Qₙ)(a)",
      "EV(s) = Σₛ′ p(s′|s) · r(s′)",
      "p(s|s′) = p(s′|s) p(s) / p(s′)",
      "Q_MB(p) = −β_MBpun · P(pun|p)",
      "Q_GP(p) = β_GPrew·P(rew|p) − β_GPpun·P(pun|p)",
      "Q_MF(p) ← Q_MF(p) + η(outcome − Q_MF(p))",
      "P(s′|a) ← P(s′|a) + γ[1 − P(s′|a)]",
    ],
  };

  var ALL = [].concat(GROUPS.td, GROUPS.policy, GROUPS.planning, GROUPS.lab);
  var path = window.location.pathname;
  var favored = ALL;
  if (path.indexOf("/publications") === 0) favored = GROUPS.lab;
  else if (path === "/projects/") favored = GROUPS.planning.concat(GROUPS.lab.slice(0, 7));
  else if (path.indexOf("/team") === 0 || path.indexOf("/projects/") === 0) favored = GROUPS.td;
  else if (path.indexOf("/join") === 0) favored = GROUPS.policy;

  var CELL = 16; // binary rain grid (px)
  var BIN_FONT = '15px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  var EQ_FONT = 17; // equation size; shrinks (to EQ_MIN) only if a single term won't fit
  var EQ_MIN = 12;
  var EQ_REGION_MIN = 110; // narrower margins get binary rain only
  var GAP = 12; // white space kept between the content column and the black margin
  var MIN_MARGIN = 40; // don't draw in margins narrower than this
  var FPS = 30;
  var FADE = "rgba(0, 0, 0, 0.09)"; // trail length of the rain
  var GREEN = "#00ff41";
  var HEAD = "#d8ffd8";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "margin-math";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var width = 0;
  var height = 0;
  var regions = []; // [{x, y, w, h, nextEq}] margin strips between the navbar and footer
  var columns = []; // binary rain streams
  var drops = []; // falling equations
  var running = false;
  var last = 0;
  var lastEq = null;

  function eqFont(size) {
    return "italic " + size + 'px "Cambria Math", "STIX Two Math", "Times New Roman", serif';
  }

  function bit() {
    return Math.random() < 0.5 ? "0" : "1";
  }

  function chooseEq() {
    var pool = Math.random() < 0.65 ? favored : ALL;
    var eq;
    do {
      eq = pool[Math.floor(Math.random() * pool.length)];
    } while (eq === lastEq);
    lastEq = eq;
    return eq;
  }

  // Wrap an equation into lines that fit, shrinking the font if a single term is too wide
  function wrap(text, maxWidth) {
    var words = text.split(" ");
    var size = EQ_FONT;
    for (; size > EQ_MIN; size--) {
      ctx.font = eqFont(size);
      var fits = words.every(function (w) {
        return ctx.measureText(w).width <= maxWidth;
      });
      if (fits) break;
    }
    ctx.font = eqFont(size);
    var lines = [];
    var line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    var w = 0;
    lines.forEach(function (l) {
      w = Math.max(w, ctx.measureText(l).width);
    });
    return { lines: lines, size: size, w: w };
  }

  function newColumn(region, x, stagger) {
    return {
      region: region,
      x: x,
      // Staggered starts: some columns begin mid-way, others well above the top
      row: stagger ? Math.floor(Math.random() * (region.h / CELL)) - Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 25),
      rate: 6 + Math.random() * 16, // cells per second
      acc: 0,
      prev: null,
    };
  }

  function spawnDrop(region) {
    var eq = wrap(chooseEq(), region.w - 20);
    var lineH = Math.round(eq.size * 1.3);
    var h = eq.lines.length * lineH;
    drops.push({
      region: region,
      eq: eq,
      lineH: lineH,
      x: region.x + 10 + Math.random() * Math.max(0, region.w - 20 - eq.w),
      y: region.y - h,
      h: h,
      speed: 75 + Math.random() * 70, // px per second: a falling drop, not a scroll
    });
  }

  function layout() {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "top";

    var rect = content.getBoundingClientRect();
    var left = Math.max(0, rect.left - GAP);
    var rightStart = Math.min(width, rect.right + GAP);
    var nav = document.getElementById("navbar");
    var footer = document.querySelector("footer.fixed-bottom");
    var top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    var bottom = footer ? Math.min(height, footer.getBoundingClientRect().top) : height;
    regions = [];
    if (bottom - top > 80) {
      if (left >= MIN_MARGIN) regions.push({ x: 0, y: top, w: left, h: bottom - top });
      if (width - rightStart >= MIN_MARGIN) regions.push({ x: rightStart, y: top, w: width - rightStart, h: bottom - top });
    }

    ctx.clearRect(0, 0, width, height);
    // Confine all drawing to the margin strips
    ctx.beginPath();
    regions.forEach(function (r) {
      ctx.rect(r.x, r.y, r.w, r.h);
    });
    ctx.clip();
    ctx.fillStyle = "#000";

    columns = [];
    drops = [];
    regions.forEach(function (r) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
      var n = Math.floor((r.w - 4) / CELL);
      var offset = r.x + (r.w - n * CELL) / 2;
      for (var i = 0; i < n; i++) columns.push(newColumn(r, offset + i * CELL, true));
      r.nextEq = r.w >= EQ_REGION_MIN ? Math.random() * 1.5 : Infinity;
    });
  }

  function insideDrop(x, y) {
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      if (x + CELL > d.x - 6 && x < d.x + d.eq.w + 6 && y + CELL > d.y - 4 && y < d.y + d.h + 4) return true;
    }
    return false;
  }

  function stepColumns(dt) {
    ctx.font = BIN_FONT;
    columns.forEach(function (c) {
      c.acc += dt * c.rate;
      while (c.acc >= 1) {
        c.acc -= 1;
        var r = c.region;
        // Turn the previous head into an ordinary green digit
        if (c.prev && !insideDrop(c.x, c.prev.y)) {
          ctx.fillStyle = "#000";
          ctx.fillRect(c.x, c.prev.y, CELL, CELL);
          ctx.fillStyle = GREEN;
          ctx.fillText(c.prev.ch, c.x + 3, c.prev.y);
        }
        c.row += 1;
        var y = r.y + c.row * CELL;
        if (y > r.y + r.h) {
          // Restart from above the top after a random pause, keeping columns staggered
          c.row = -Math.floor(Math.random() * 30);
          c.rate = 6 + Math.random() * 16;
          c.prev = null;
          continue;
        }
        if (y >= r.y - CELL && !insideDrop(c.x, y)) {
          var ch = bit();
          ctx.fillStyle = "#000";
          ctx.fillRect(c.x, y, CELL, CELL);
          ctx.fillStyle = HEAD;
          ctx.fillText(ch, c.x + 3, y);
          c.prev = { ch: ch, y: y };
        } else {
          c.prev = null;
        }
      }
    });
  }

  function stepDrops(dt) {
    regions.forEach(function (r) {
      r.nextEq -= dt;
      if (r.nextEq <= 0) {
        spawnDrop(r);
        r.nextEq = 0.8 + Math.random() * (r.w > 260 ? 1.6 : 2.8);
      }
    });
    drops = drops.filter(function (d) {
      return d.y < d.region.y + d.region.h + 10;
    });
    drops.forEach(function (d) {
      // Never fall into an equation below: slow to its speed when close behind it
      drops.forEach(function (e) {
        if (e !== d && e.region === d.region && e.y > d.y && d.x < e.x + e.eq.w + 12 && e.x < d.x + d.eq.w + 12 && e.y - (d.y + d.h) < 30) {
          d.speed = Math.min(d.speed, e.speed);
        }
      });
      d.y += d.speed * dt;
      // Clear the rain behind the equation, then draw it glowing; earlier frames
      // left behind fade into a short streak above it, like a falling drop
      ctx.fillStyle = "#000";
      ctx.fillRect(d.x - 6, d.y - 2, d.eq.w + 12, d.h + 4);
      ctx.font = eqFont(d.eq.size);
      ctx.fillStyle = HEAD;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 8;
      d.eq.lines.forEach(function (line, i) {
        ctx.fillText(line, d.x, d.y + i * d.lineH);
      });
      ctx.shadowBlur = 0;
    });
  }

  function frame(t) {
    if (!running) return;
    window.requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / FPS;
    last = t;

    ctx.fillStyle = FADE;
    regions.forEach(function (r) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    stepColumns(dt);
    stepDrops(dt);
  }

  function drawStatic() {
    ctx.font = BIN_FONT;
    columns.forEach(function (c) {
      var r = c.region;
      for (var y = r.y; y < r.y + r.h; y += CELL) {
        if (Math.random() < 0.35) {
          ctx.fillStyle = "rgba(0, 255, 65, " + (0.2 + Math.random() * 0.5) + ")";
          ctx.fillText(bit(), c.x + 3, y);
        }
      }
    });
  }

  function start() {
    layout();
    if (!regions.length) {
      running = false;
      return;
    }
    if (reduceMotion) {
      running = false;
      drawStatic();
      return;
    }
    if (!running) {
      running = true;
      last = 0;
      window.requestAnimationFrame(frame);
    }
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else start();
  });
  window.addEventListener("load", start); // re-measure once fonts and images have loaded

  start();
})();
