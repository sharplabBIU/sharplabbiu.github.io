// Matrix-style "math rain" in the empty side margins: green streams of
// reinforcement-learning / Bayesian notation falling on a black background,
// drawn only outside the main content column. Each page gets a symbol set
// related to its topic.
(function () {
  "use strict";

  var content = document.querySelector('[role="main"]');
  if (!content || !document.createElement("canvas").getContext) return;

  var SETS = {
    // Home: core reinforcement learning
    rl: ["Q(s,a)", "V(s)", "π(a|s)", "γ", "α", "δ", "r", "s′", "a", "max", "Σ", "E[·]", "←", "λ", "θ", "∇θ", "Gₜ", "Rₜ₊₁", "π*", "γᵏ",
      "δ = r + γV′ − V", "Q ← Q + αδ", "V* = max Q", "P(s′|s,a)", "Σ γᵏ r"],
    // Projects: planning, model-based control and replay
    planning: ["s₀", "s₁", "s₂", "s₃", "→", "⇒", "argmax", "VOC", "Qᴹᴮ", "Qᴹᶠ", "T(s,a,s′)", "M(s,s′)", "π(s)", "d = 3", "c(plan)",
      "max", "γ", "δ", "Σ P·V", "w·Qᴹᴮ", "s → s′", "replay"],
    // Publications: Bayesian inference and statistics
    bayes: ["P(θ|D)", "∝", "P(D|θ)", "P(θ)", "θ", "μ", "σ²", "N(μ,σ²)", "β", "∫", "log p", "KL", "E[θ]", "p(x)", "Σ", "Δ", "≈",
      "ℒ(θ)", "∂", "∇", "x̄", "BF₁₀", "H(p)"],
    // Team and member pages: learning
    learning: ["α", "δ", "Q ← Q + αδ", "β", "softmax", "τ", "r", "Gₜ", "ΔV", "η", "∇", "w", "θ ← θ + α∇", "V(s)", "γ", "Σ", "e"],
    // Join: exploration
    explore: ["ε", "explore", "exploit", "UCB", "√(ln t / n)", "β", "softmax", "H(π)", "argmax", "N(s,a)", "Q + c√", "?", "→", "γ", "τ"],
  };

  var path = window.location.pathname;
  var symbols = SETS.rl;
  if (path.indexOf("/publications") === 0) symbols = SETS.bayes;
  else if (path === "/projects/") symbols = SETS.planning;
  else if (path.indexOf("/team") === 0 || path.indexOf("/projects/") === 0) symbols = SETS.learning;
  else if (path.indexOf("/join") === 0) symbols = SETS.explore;

  var FONT_SIZE = 20;
  var LINE = 38; // vertical distance between expressions in a stream
  var COL_PAD = 14; // horizontal space between streams
  var GAP = 12; // white space kept between the content column and the black margin
  var MIN_MARGIN = 40; // don't draw in margins narrower than this
  var FPS = 20;
  var GREEN = "rgba(0, 255, 65, 0.9)";
  var HEAD = "#eaffea"; // the newest expression in each stream glows white-green
  var FADE = "rgba(0, 0, 0, 0.06)";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "margin-math";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var width = 0;
  var height = 0;
  var regions = []; // [{x, y, w, h}] margin strips between the navbar and footer
  var streams = [];
  var running = false;
  var last = 0;

  function pick(maxWidth) {
    for (var tries = 0; tries < 12; tries++) {
      var s = symbols[Math.floor(Math.random() * symbols.length)];
      if (ctx.measureText(s).width <= maxWidth) return s;
    }
    return "γ";
  }

  function resetStream(st, randomStart) {
    var r = st.region;
    st.y = r.y + 8 + (randomStart ? Math.floor(Math.random() * (r.h / LINE)) * LINE : -LINE * Math.floor(1 + Math.random() * 12));
    st.every = 2 + Math.floor(Math.random() * 4); // frames between steps (speed)
    st.count = 0;
    st.prev = null;
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
    ctx.font = "italic " + FONT_SIZE + 'px "Cambria Math", "STIX Two Math", "Times New Roman", serif';
    ctx.textBaseline = "top";

    var rect = content.getBoundingClientRect();
    var left = Math.max(0, rect.left - GAP);
    var rightStart = Math.min(width, rect.right + GAP);
    var nav = document.getElementById("navbar");
    var footer = document.querySelector("footer.fixed-bottom");
    var top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    var bottom = footer ? Math.min(height, footer.getBoundingClientRect().top) : height;
    regions = [];
    if (bottom - top > LINE) {
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
    streams = [];
    regions.forEach(function (region) {
      ctx.fillRect(region.x, region.y, region.w, region.h);
      var cols = Math.max(1, Math.floor(region.w / 90));
      var step = region.w / cols;
      for (var c = 0; c < cols; c++) {
        var st = { region: region, x: region.x + c * step + COL_PAD / 2, colWidth: step - COL_PAD };
        resetStream(st, true);
        streams.push(st);
      }
    });
  }

  function advance(st) {
    // Repaint the previous head in green, then draw the new head below it
    if (st.prev) {
      ctx.fillStyle = "#000";
      ctx.fillRect(st.x - 1, st.prev.y - 2, st.prev.w + 2, FONT_SIZE + 6);
      ctx.fillStyle = GREEN;
      ctx.fillText(st.prev.token, st.x, st.prev.y);
    }
    var token = pick(st.colWidth);
    ctx.fillStyle = "#000"; // clear the cell so expressions never overlap
    ctx.fillRect(st.x - 1, st.y - 2, st.colWidth + 2, FONT_SIZE + 6);
    ctx.fillStyle = HEAD;
    ctx.fillText(token, st.x, st.y);
    st.prev = { token: token, y: st.y, w: ctx.measureText(token).width };
    st.y += LINE;
    if (st.y > st.region.y + st.region.h + LINE) resetStream(st, false);
  }

  function frame(t) {
    if (!running) return;
    window.requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    last = t;

    // Fade older expressions into the black margins
    ctx.fillStyle = FADE;
    regions.forEach(function (r) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    streams.forEach(function (st) {
      if (++st.count >= st.every) {
        st.count = 0;
        advance(st);
      }
    });
  }

  function drawStatic() {
    ctx.fillStyle = GREEN;
    streams.forEach(function (st) {
      for (var y = st.region.y + 8; y < st.region.y + st.region.h; y += LINE) {
        if (Math.random() < 0.5) ctx.fillText(pick(st.colWidth), st.x, y);
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
