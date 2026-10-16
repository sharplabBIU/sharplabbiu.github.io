// Animated "math rain" in the empty side margins: Matrix-style streams of
// reinforcement-learning / Bayesian notation, drawn only outside the main
// content column. Each page gets a symbol set related to its topic.
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

  var FONT_SIZE = 15;
  var LINE = 22; // vertical spacing between tokens in a stream
  var GAP = 12; // keep this far away from the content column
  var MIN_MARGIN = 40; // don't draw in margins narrower than this
  var FPS = 14;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "margin-math";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var dpr = 1;
  var width = 0;
  var height = 0;
  var regions = []; // [{x, w}] margin strips
  var streams = [];
  var running = false;
  var last = 0;

  function font() {
    return "italic " + FONT_SIZE + 'px "Cambria Math", "STIX Two Math", "Times New Roman", serif';
  }

  function pick(maxWidth) {
    for (var tries = 0; tries < 10; tries++) {
      var s = symbols[Math.floor(Math.random() * symbols.length)];
      if (ctx.measureText(s).width <= maxWidth) return s;
    }
    return symbols[0].length <= 2 ? symbols[0] : "γ";
  }

  function newStream(region, x, colWidth, randomStart) {
    return {
      region: region,
      x: x,
      colWidth: colWidth,
      y: randomStart ? Math.random() * height : -Math.random() * height * 0.5,
      speed: 0.6 + Math.random() * 0.9, // lines per frame
      alpha: 0.35 + Math.random() * 0.35,
    };
  }

  function layout() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = font();
    ctx.textBaseline = "top";

    var rect = content.getBoundingClientRect();
    var left = Math.max(0, rect.left - GAP);
    var rightStart = Math.min(width, rect.right + GAP);
    regions = [];
    if (left >= MIN_MARGIN) regions.push({ x: 0, w: left });
    if (width - rightStart >= MIN_MARGIN) regions.push({ x: rightStart, w: width - rightStart });

    streams = [];
    regions.forEach(function (region) {
      var colWidth = Math.min(90, region.w - 10);
      var cols = Math.max(1, Math.floor(region.w / 60));
      var step = region.w / cols;
      for (var c = 0; c < cols; c++) {
        streams.push(newStream(region, region.x + c * step + 5, Math.min(colWidth, step - 10), true));
      }
    });
    ctx.clearRect(0, 0, width, height);
  }

  function drawToken(st) {
    var token = pick(st.colWidth);
    ctx.fillStyle = "rgba(0, 54, 159, " + st.alpha + ")";
    ctx.fillText(token, st.x, st.y);
  }

  function frame(t) {
    if (!running) return;
    window.requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    last = t;

    // Fade previous tokens into the white page background (margins only)
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    regions.forEach(function (r) {
      ctx.fillRect(r.x, 0, r.w, height);
    });

    streams.forEach(function (st) {
      st.y += st.speed * LINE * 0.5;
      if (Math.random() < 0.7) drawToken(st);
      if (st.y > height + LINE) {
        var fresh = newStream(st.region, st.x, st.colWidth, false);
        fresh.y = -LINE * (1 + Math.random() * 10);
        Object.assign(st, fresh);
      }
    });
  }

  function drawStatic() {
    streams.forEach(function (st) {
      for (var y = Math.random() * LINE * 3; y < height; y += LINE * (1 + Math.random() * 3)) {
        st.y = y;
        st.alpha = 0.15 + Math.random() * 0.2;
        drawToken(st);
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

  start();
})();
