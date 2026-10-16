// Matrix-style "equation rain" in the empty side margins: full reinforcement-
// learning equations (TD variants, on/off-policy control, model-based planning,
// Dyna, successor representations, and models from the lab's papers) fall in
// green on black strips, drawn only outside the main content column. Each page
// leans towards a related group of equations.
(function () {
  "use strict";

  var content = document.querySelector('[role="main"]');
  if (!content || !document.createElement("canvas").getContext) return;

  // [equation, label]
  var GROUPS = {
    td: [
      ["δₜ = rₜ₊₁ + γV(sₜ₊₁) − V(sₜ)", "TD error"],
      ["V(s) ← V(s) + α[r + γV(s′) − V(s)]", "TD(0)"],
      ["eₜ(s) = γλ eₜ₋₁(s) + 1[s = sₜ]", "TD(λ) eligibility trace"],
      ["V(s) ← V(s) + α δₜ eₜ(s)", "TD(λ)"],
      ["Gₜ:ₜ₊ₙ = rₜ₊₁ + γrₜ₊₂ + … + γⁿV(sₜ₊ₙ)", "n-step return"],
      ["V ← V + α(r − V)", "Rescorla–Wagner"],
      ["M(s,·) ← M(s,·) + α[1ₛ + γM(s′,·) − M(s,·)]", "successor representation (TD)"],
      ["θ ← θ + α δ ∇θ ln π(a|s,θ)", "actor–critic"],
    ],
    policy: [
      ["Q(s,a) ← Q(s,a) + α[r + γQ(s′,a′) − Q(s,a)]", "SARSA (on-policy)"],
      ["Q(s,a) ← Q(s,a) + α[r + γ maxₐ′ Q(s′,a′) − Q(s,a)]", "Q-learning (off-policy)"],
      ["Q(s,a) ← Q(s,a) + α[r + γ Σₐ′ π(a′|s′) Q(s′,a′) − Q(s,a)]", "Expected SARSA"],
      ["ρₜ = π(aₜ|sₜ) / b(aₜ|sₜ)", "importance-sampling ratio (off-policy)"],
      ["V(s) ← V(s) + α ρₜ[r + γV(s′) − V(s)]", "off-policy TD(0)"],
      ["θ ← θ + α Gₜ ∇θ ln π(aₜ|sₜ,θ)", "REINFORCE (policy gradient)"],
      ["π(a|s) = exp(βQ(s,a)) / Σᵦ exp(βQ(s,b))", "softmax policy"],
    ],
    planning: [
      ["Vπ(s) = Σₐ π(a|s) Σₛ′ P(s′|s,a)[r + γVπ(s′)]", "Bellman equation"],
      ["Q*(s,a) = Σₛ′ P(s′|s,a)[r + γ maxₐ′ Q*(s′,a′)]", "Bellman optimality"],
      ["V(s) ← maxₐ Σₛ′ P(s′|s,a)[r + γV(s′)]", "value iteration (model-based planning)"],
      ["Model(s,a) ← (r, s′)", "Dyna-Q: model learning"],
      ["(s,a) ~ memory;  (r,s′) ← Model(s,a)", "Dyna-Q: simulated experience"],
      ["Q(s,a) = w·Q_MB(s,a) + (1 − w)·Q_MF(s,a)", "model-based / model-free mixture"],
      ["V(s) = Σₛ′ M(s,s′) r(s′)", "successor-representation value"],
      ["EVB(sₖ,aₖ) = Gain × Need", "prioritized replay"],
    ],
    lab: [
      ["p = 1 − C(n_fail, S) / C(n_total, S)", "Sharp & Eldar: P(search finds the goal)"],
      ["Sₜ = Sₜ₋₁ + b", "Sharp & Eldar: search breadth grows"],
      ["V_take = R_g · γ_d^Δ,  V_relinquish = 1", "Sharp & Eldar: delaying control"],
      ["Q(a) = β_MBMC·V(a) + β_CB + C_CRF(a) + C_P(a)", "Sharp & Eldar: meta-controller"],
      ["P(a|θ) = Σₙ pₙ · σ(Qₙ)(a)", "Sharp & Eldar: choice likelihood"],
      ["EV(s) = Σₛ′ p(s′|s) · r(s′)", "Sharp & Eldar, NHB 2024: forward (SR)"],
      ["p(s|s′) = p(s′|s) p(s) / p(s′)", "Sharp & Eldar, NHB 2024: backward (PR)"],
      ["Q_MB(p) = −β_MBpun · P(pun|p)", "Sharp et al., eLife 2022: avoid-punishment goal"],
      ["Q_GP(p) = β_GPrew·P(rew|p) − β_GPpun·P(pun|p)", "Sharp et al., eLife 2022: goal perseveration"],
      ["Q_MF(p) ← Q_MF(p) + η(outcome − Q_MF(p))", "Sharp et al., eLife 2022: model-free"],
      ["P(s′|a) ← P(s′|a) + γ[1 − P(s′|a)]", "Sharp et al., Psych Med: transition learning"],
    ],
  };

  var ALL = [].concat(GROUPS.td, GROUPS.policy, GROUPS.planning, GROUPS.lab);
  var path = window.location.pathname;
  var favored = ALL;
  if (path.indexOf("/publications") === 0) favored = GROUPS.lab;
  else if (path === "/projects/") favored = GROUPS.planning.concat(GROUPS.lab.slice(0, 7));
  else if (path.indexOf("/team") === 0 || path.indexOf("/projects/") === 0) favored = GROUPS.td;
  else if (path.indexOf("/join") === 0) favored = GROUPS.policy;

  var EQ_FONT = 17; // equation size; shrinks (to EQ_MIN) only if a single term won't fit
  var EQ_MIN = 12;
  var LABEL_FONT = 11;
  var GAP = 12; // white space kept between the content column and the black margin
  var MIN_MARGIN = 100; // don't draw in margins narrower than this
  var LANE_MIN = 170; // minimum lane width before splitting a margin into lanes
  var FPS = 30;
  var REVEAL = 0.9; // seconds to "type" an equation in
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "margin-math";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var width = 0;
  var height = 0;
  var regions = []; // [{x, y, w, h}] margin strips between the navbar and footer
  var lanes = []; // [{region, x, w, drops: []}]
  var running = false;
  var last = 0;
  var lastPick = null;

  function eqFont(size) {
    return "italic " + size + 'px "Cambria Math", "STIX Two Math", "Times New Roman", serif';
  }
  var LABEL = LABEL_FONT + 'px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

  function choose() {
    var pool = Math.random() < 0.65 ? favored : ALL;
    var item;
    do {
      item = pool[Math.floor(Math.random() * pool.length)];
    } while (item === lastPick && ALL.length > 1);
    lastPick = item;
    return item;
  }

  // Wrap an equation into lines that fit the lane, shrinking the font if needed
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
    return { lines: lines, size: size };
  }

  function wrapLabel(text, maxWidth) {
    ctx.font = LABEL;
    var words = text.split(" ");
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
    return lines;
  }

  function makeDrop(lane, y) {
    var item = choose();
    var eq = wrap(item[0], lane.w);
    var label = wrapLabel(item[1], lane.w);
    var lineH = Math.round(eq.size * 1.35);
    var labelH = LABEL_FONT + 4;
    return {
      eq: eq,
      label: label,
      lineH: lineH,
      height: eq.lines.length * lineH + 4 + label.length * labelH,
      chars: item[0].length,
      y: y,
      age: 0,
    };
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

    lanes = [];
    regions.forEach(function (region) {
      var n = Math.max(1, Math.floor(region.w / LANE_MIN));
      var step = region.w / n;
      for (var i = 0; i < n; i++) {
        // Each lane falls at its own constant speed (px/s), so equations never overlap
        var lane = { region: region, x: region.x + i * step + 12, w: step - 24, speed: 16 + Math.random() * 22, drops: [] };
        // Pre-fill the lane so the margin isn't empty on load
        for (var y = region.y + region.h - 40 - Math.random() * 120; y > region.y - 200; ) {
          var d = makeDrop(lane, y);
          d.y = y - d.height;
          d.age = REVEAL;
          lane.drops.unshift(d);
          y = d.y - (50 + Math.random() * 120);
        }
        lanes.push(lane);
      }
    });
  }

  function drawDrop(d, lane, region) {
    // Fade in at the top of the margin and out towards the bottom
    var mid = d.y + d.height / 2;
    var alpha = Math.min(1, (mid - region.y + 40) / 80, (region.y + region.h - mid) / 120);
    if (alpha <= 0) return;
    var fresh = d.age < REVEAL + 0.6; // newly typed equations glow white-green
    var shown = Math.floor((Math.min(d.age, REVEAL) / REVEAL) * d.chars);

    ctx.globalAlpha = alpha;
    ctx.font = eqFont(d.eq.size);
    ctx.fillStyle = fresh ? "#eaffea" : "#00ff41";
    ctx.shadowColor = "rgba(0, 255, 65, 0.8)";
    ctx.shadowBlur = fresh ? 10 : 4;
    var y = d.y;
    var remaining = shown;
    for (var i = 0; i < d.eq.lines.length && remaining > 0; i++) {
      var text = d.eq.lines[i];
      ctx.fillText(text.slice(0, remaining), lane.x, y);
      remaining -= text.length + 1;
      y += d.lineH;
    }

    if (shown >= d.chars) {
      ctx.shadowBlur = 0;
      ctx.font = LABEL;
      ctx.fillStyle = "rgba(0, 255, 65, 0.55)";
      y = d.y + d.eq.lines.length * d.lineH + 4;
      d.label.forEach(function (l) {
        ctx.fillText(l, lane.x, y);
        y += LABEL_FONT + 4;
      });
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function render() {
    ctx.fillStyle = "#000";
    regions.forEach(function (r) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    lanes.forEach(function (lane) {
      lane.drops.forEach(function (d) {
        drawDrop(d, lane, lane.region);
      });
    });
  }

  function step(dt) {
    lanes.forEach(function (lane) {
      var r = lane.region;
      lane.drops.forEach(function (d) {
        d.y += lane.speed * dt;
        d.age += dt;
      });
      // Drop equations that have fallen out of view
      lane.drops = lane.drops.filter(function (d) {
        return d.y < r.y + r.h + 20;
      });
      // Start a new equation once the newest one has moved far enough down
      var first = lane.drops[0];
      if (!first || first.y > r.y + 40 + Math.random() * 100) {
        var d = makeDrop(lane, 0);
        d.y = r.y - d.height + 10;
        lane.drops.unshift(d);
      }
    });
  }

  function frame(t) {
    if (!running) return;
    window.requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / FPS;
    last = t;
    step(dt);
    render();
  }

  function start() {
    layout();
    if (!regions.length) {
      running = false;
      return;
    }
    render();
    if (reduceMotion) {
      running = false;
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
