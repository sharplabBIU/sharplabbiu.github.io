// A navy board down each side of the window (wider windows only), beside the text column and well clear of
// the header and the bottom of the window, like a computational lab's board: two drawings on each, in neon marker in the
// logo's colours, with equations scrawled around them. Left, how and when to plan: task construal in a grid world (Ho
// et al.), and when to plan (Sharp & Eldar). Right, planning with one's own world model, and offline learning by replay. Each board
// is put away until the button in the middle of its side is clicked: then it opens out from the middle (and closes again
// with the × at its top), and stays open from page to page for the rest of the visit. Clicking a drawing opens a card
// describing it, with key papers, and most drawings also change when clicked (on the home page, the parts of the world
// model open the matching part of the brain). Two canvases fixed beside the text, drawn again only when something
// changes.
(function () {
  'use strict';

  // Neon marker: the logo's dodger blue, medium sea green and light coral, made bright
  var BLUE = '#5cc2ff';
  var GREEN = '#3cf08c';
  var CORAL = '#ff7a7a';
  var INK = BLUE; // what a drawing is drawn in (set for each drawing as it is drawn)
  var PICK = GREEN; // what is picked out in it (the plan, the replay, the backward prediction)
  var STAR = CORAL; // goals and rewards (the stars)
  var COLOURS = { left: [[BLUE, GREEN], [GREEN, BLUE]], right: [[GREEN, BLUE], [BLUE, GREEN]] };
  var BOARD = '#151d28'; // the board: the navy of the header and the text panel (Bluesky's "Dim")
  var HAND = '"Caveat", "Comic Sans MS", "Chalkboard SE", cursive'; // handwriting, for the equations
  var DW = 120; // the width the drawings are made at, before scaling to the board
  var PANE = 152; // the drawings are sized to this much of the board's width
  var ZIG = 70; // and the board is this much wider, where the window has room, for them to zigzag from side to side
  var MIN_PANE = 112; // the narrowest space that gets a board
  var GAP = 16; // between the board and the text column, at the least
  var NEAR = 48; // and at the most: the board sits this close to the text, however wide the window
  var SCALE = 0.86; // the largest the drawings are drawn, of DW
  var PAD = 9; // the room around a drawing that a click on it counts in
  // Where each drawing sits, from side to side, on its board (0 at the left, 1 at the right): a zigzag, the two boards
  // mirroring each other, with the middle drawings out toward the window's edges and the others in near the text
  var STAGGER = { left: [1, 0], right: [0, 1] };
  var TILT = { left: [-1.6, 1.3], right: [1.4, -1.8] }; // how far each drawing is turned, in degrees
  // The equations scrawled on each board, around the drawings
  var EQUATIONS = {
    left: [
      'VOR(c) = U(π_c) − C(c)',
      'c* = argmax_c VOR(c)',
      'C(c) = λ |c|',
      'V_take = R γ^Δ',
      'VOC = E[ΔU] − cost',
      'P(plan) = σ(β · VOC)',
      'plan iff VOC > 0 ?',
      'π(a|s) ∝ exp(β Q(s,a))',
      'V(s) = max_a Q(s,a)',
      'M = (I − γT)^-1',
      'argmax_a Q !',
    ],
    right: [
      'Q_i(s,a) = r_i(s) + γ Σ p_i(s′|s,a) V_i(s′)',
      'p_i(s′|s,a) ~ Dir(α)',
      'π_i(s) = argmax_a Q_i(s,a)',
      'b′(s′) ∝ Σ p(s′|s,a) b(s)',
      'δ = r + γV(s′) − V(s)',
      'V(s) ← V(s) + α δ',
      'Q ← Q + α(r − Q)',
      'replay: s3 → s2 → s1',
      'ITI ↑ ⇒ lose-shift ↑',
      'Δt = cost?',
      'r_i(s) ≠ r_j(s)',
    ],
  };

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // The cards: what each drawing shows, how it relates to the field's key ideas, its key equation and key papers. "wm"
  // names the part of the home page's world-model brain that a drawing corresponds to
  var LAB = {
    anxiety: ['Sharp 2024, Anxiety involves altered planning (Trends Cogn Sci)', 'https://www.sciencedirect.com/science/article/pii/S1364661324002924'],
    worldModel: ['Sharp et al., A world-model theory of trait anxiety (PsyArXiv)', 'https://osf.io/preprints/psyarxiv/98ktg_v4'],
    delay: ['Sharp & Eldar, Humans adaptively delay planning using cognitive maps (Psychol Sci, accepted)', 'https://osf.io/preprints/psyarxiv/8ubct_v5'],
    construal: ['Schiff & Sharp, anxiety and task generalization (Top Cogn Sci)', 'https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051'],
  };
  var REF = {
    suttonBarto: ['Sutton & Barto 2018, Reinforcement Learning: An Introduction', 'http://incompleteideas.net/book/the-book-2nd.html'],
    dawNivDayan: ['Daw, Niv & Dayan 2005, Uncertainty-based competition between prefrontal and striatal systems', 'https://doi.org/10.1038/nn1560'],
    dyna: ['Sutton 1991, Dyna, an integrated architecture for learning, planning, and reacting', 'https://doi.org/10.1145/122344.122377'],
    momennejad: ['Momennejad et al. 2018, Offline replay supports planning in human reinforcement learning', 'https://doi.org/10.7554/eLife.32548'],
    fosterWilson: ['Foster & Wilson 2006, Reverse replay of behavioural sequences in hippocampal place cells', 'https://doi.org/10.1038/nature04587'],
    callaway: ['Callaway et al. 2022, Rational use of cognitive resources in human planning', 'https://doi.org/10.1038/s41562-022-01332-8'],
    lieder: ['Lieder & Griffiths 2020, Resource-rational analysis', 'https://doi.org/10.1017/S0140525X1900061X'],
    ho2022: ['Ho et al. 2022, People construct simplified mental representations to plan', 'https://doi.org/10.1038/s41586-022-04743-9'],
  };
  var NOTES = {
    world: {
      wm: 'model',
      title: 'Planning with one’s own world model',
      text:
        'Each person plans with their own model of the world: beliefs about what leads to what (the map, its arrows as thick as they are likely) and about what is worth having (the star). Planning looks ahead through this model and takes the best action at each step (the bold branch). The equation is the same for everyone; what differs is the model it is solved with, as in the brain on our home page, and biases in it, as in anxiety, reshape every plan. Click the map, the star or the branches for each part.',
      eq: 'Q<sub>i</sub>(s,a) = r<sub>i</sub>(s) + γ Σ<sub>s′</sub> p<sub>i</sub>(s′|s,a) max<sub>a′</sub> Q<sub>i</sub>(s′,a′)',
      links: [LAB.worldModel, LAB.anxiety, REF.dawNivDayan, REF.suttonBarto],
    },
    world_p: {
      wm: 'world',
      title: 'Beliefs about what leads to what',
      text:
        'Person i’s transition beliefs: where action a leads from state s, drawn as a map whose arrows are as thick as they are likely. They draw on causal knowledge about the world and about the self (what one’s own actions can bring about), as in the brain on our home page. Overstating the chance of harm, or understating one’s control, changes every plan built on them, as in anxiety.',
      eq: 'p<sub>i</sub>(s′|s,a)',
      links: [LAB.anxiety, LAB.worldModel],
    },
    world_r: {
      wm: 'goals',
      title: 'Goals: what is worth having',
      text:
        'What person i finds rewarding or threatening in each state, drawn as the star. These come from their intrinsic goals (the goals in the brain on our home page), so the same outcome can be worth different amounts to different people.',
      eq: 'r<sub>i</sub>(s)',
      links: [LAB.worldModel],
    },
    world_q: {
      wm: 'tasks',
      title: 'The plan: values of actions',
      text:
        'The value person i expects from taking action a in state s and acting well afterwards, worked out with their own world model; the plan takes the best action (the bold branch). In the brain on our home page this is a task representation, built for the task at hand from the beliefs and goals above it.',
      eq: 'π<sub>i</sub>(s) = argmax<sub>a</sub> Q<sub>i</sub>(s,a)',
      links: [REF.dawNivDayan, LAB.worldModel],
    },
    construal: {
      title: 'Task construal',
      text:
        'To plan, people build a simplified representation of the task, keeping only what matters. Here the plan from the dot to the star (the bold line) keeps the wall in its way and ignores the obstacles drawn dashed, which do not change the best route. Representing more costs effort, so the best construal trades how well its plan does against its cost. We ask how anxiety distorts construals. Click an obstacle to keep it or leave it out: leave out the wall and the plan runs into it.',
      eq: 'VOR(c) = U(π<sub>c</sub>) − C(c)',
      links: [REF.ho2022, REF.lieder, LAB.anxiety, LAB.construal],
    },
    offline: {
      title: 'Offline learning from memory',
      text:
        'Learning without new experience, at rest (the moon), by replaying stored steps of experience. After a reward (the star), replay can run backward along the path just taken, as hippocampal place cells do, and each replayed step updates a value as a real step would, so the value spreads back without walking the path again. Click to replay the next step.',
      eq: 'V(s) ← V(s) + α [ r + γV(s′) − V(s) ]',
      links: [REF.dyna, REF.fosterWilson, REF.momennejad, ['Offline learning, on our projects page', '/projects/#offline-learning']],
    },
    when: {
      title: 'When to plan',
      text:
        'In our task people moved three steps down a decision tree toward a goal (the star). At each step they could plan the move themselves, or let the computer choose at random for a small sure reward. Planning pays only where the choice decides whether the goal is reached (filled); where both moves keep the goal in reach (dashed), it is better to delay. People learned to delay planning adaptively, as a meta-controller that searches a cognitive map of the task predicts. Click an end state to make it the goal.',
      eq: 'V<sub>take</sub> = R<sub>g</sub> γ<sup>Δ</sup>,  V<sub>relinquish</sub> = 1 (+ R<sub>g</sub> γ<sup>Δ</sup>)',
      links: [LAB.delay, REF.callaway, ['Planning efficiency, on our projects page', '/projects/#planning-efficiency']],
    },
  };

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  // A steady pseudo-random number for a seed, so hand-drawn wobbles stay the same each time the boards are drawn
  function rnd(n) {
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function jit(seed) {
    return [0, 1, 2, 3, 4, 5].map(function (k) {
      return rnd(seed * 7.13 + k);
    });
  }

  // Curves: a cubic from a parent straight down into a child, or a straight line
  function curve(ax, ay, bx, by) {
    var m = (by - ay) * 0.55;
    return [ax, ay, ax, ay + m, bx, by - m, bx, by];
  }

  function straight(ax, ay, bx, by) {
    return [ax, ay, ax + (bx - ax) / 3, ay + (by - ay) / 3, ax + ((bx - ax) * 2) / 3, ay + ((by - ay) * 2) / 3, bx, by];
  }

  function at(c, t) {
    var u = 1 - t;
    return {
      x: u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
      y: u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7],
    };
  }

  function heading(c, t) {
    var u = 1 - t;
    var dx = 3 * u * u * (c[2] - c[0]) + 6 * u * t * (c[4] - c[2]) + 3 * t * t * (c[6] - c[4]);
    var dy = 3 * u * u * (c[3] - c[1]) + 6 * u * t * (c[5] - c[3]) + 3 * t * t * (c[7] - c[5]);
    return Math.atan2(dy, dx);
  }

  // Marker strokes: along a curve, wobbling a little from side to side as a hand does (less on short strokes)
  function marker(g, c, j, t0, t1) {
    t0 = t0 || 0;
    t1 = t1 === undefined ? 1 : t1;
    var amp = 0.8 * Math.min(1, Math.hypot(c[6] - c[0], c[7] - c[1]) / 28);
    g.beginPath();
    for (var i = 0; i <= 16; i++) {
      var t = t0 + ((t1 - t0) * i) / 16;
      var p = at(c, t);
      var a = heading(c, t) + Math.PI / 2;
      var off = amp * (0.6 * Math.sin(2 * Math.PI * (t * (1 + j[0]) + j[1])) + 0.4 * Math.sin(2 * Math.PI * (t * (2.5 + j[2]) + j[3])));
      if (i) g.lineTo(p.x + off * Math.cos(a), p.y + off * Math.sin(a));
      else g.moveTo(p.x + off * Math.cos(a), p.y + off * Math.sin(a));
    }
    g.stroke();
  }

  function line(g, ax, ay, bx, by) {
    marker(g, straight(ax, ay, bx, by), jit(ax * 3.1 + ay * 1.7 + bx * 0.9 + by * 2.3));
  }

  // A polyline in marker, through points [[x, y], ...]
  function poly(g, pts) {
    for (var i = 1; i < pts.length; i++) line(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }

  // An arrowhead in marker: two short strokes meeting at t along a curve
  function chevron(g, c, t, size) {
    var p = at(c, t);
    var a = heading(c, t);
    g.beginPath();
    g.moveTo(p.x - size * Math.cos(a - 0.5), p.y - size * Math.sin(a - 0.5));
    g.lineTo(p.x, p.y);
    g.lineTo(p.x - size * Math.cos(a + 0.5), p.y - size * Math.sin(a + 0.5));
    g.stroke();
  }

  // A line with an arrowhead of the given size at its end
  function arrowLine(g, ax, ay, bx, by, size) {
    var c = straight(ax, ay, bx, by);
    marker(g, c, jit(ax + ay * 2 + bx * 3 + by * 5));
    chevron(g, c, 1, size);
  }

  // A circle drawn by hand: not quite round, its ends overlapping a little
  function circle(g, x, y, r, j) {
    var a0 = j[4] * Math.PI * 2;
    g.beginPath();
    for (var i = 0; i <= 24; i++) {
      var a = a0 + ((Math.PI * 2 + 0.45) * i) / 24;
      var rr = r * (1 + 0.07 * Math.sin(2 * a + j[5] * 6));
      if (i) g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
      else g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    g.stroke();
  }

  // A rectangle drawn by hand, its corners a little off (the path is left open for filling and stroking)
  function rect(g, x, y, w, h, j) {
    g.beginPath();
    g.moveTo(x + (j[0] - 0.5), y + (j[1] - 0.5));
    g.lineTo(x + w + (j[2] - 0.5), y + (j[3] - 0.5));
    g.lineTo(x + w + (j[4] - 0.5), y + h + (j[5] - 0.5));
    g.lineTo(x + (j[1] - 0.5), y + h + (j[0] - 0.5));
    g.closePath();
  }

  // Clears the ink under a shape, so lines drawn earlier do not show through it
  function wipe(g, fn) {
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 1;
    fn();
    g.fill();
    g.restore();
  }

  function layerOf(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // A five-pointed star drawn by hand (the path is left closed for filling and stroking)
  function star(g, x, y, r, j) {
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5 + (j[i % 6] - 0.5) * 0.1;
      var rr = (i % 2 ? r * 0.45 : r) * (1 + (j[(i + 3) % 6] - 0.5) * 0.1);
      if (i) g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
      else g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    g.closePath();
  }

  // A goal or a reward: a star, shaded in
  function goal(g, x, y, r, j) {
    wipe(g, function () {
      star(g, x, y, r + 1, j);
    });
    g.strokeStyle = g.fillStyle = STAR;
    star(g, x, y, r, j);
    g.globalAlpha = 0.5;
    g.fill();
    g.globalAlpha = 1;
    g.lineWidth = 1.5;
    g.stroke();
  }

  // A state: the ink cleared inside a circle, ink filling it from the bottom up to full (0 to 1), and its outline
  function state(g, x, y, r, full, j) {
    wipe(g, function () {
      g.beginPath();
      g.arc(x, y, r + 0.6, 0, Math.PI * 2);
    });
    if (full > 0) {
      g.save();
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.clip();
      g.globalAlpha = 0.55;
      g.fillRect(x - r, y + r - 2 * r * full, 2 * r, 2 * r * full);
      g.restore();
    }
    circle(g, x, y, r, j);
  }

  // An arrow from a circle of radius ra at a to one of radius rb at b, edge to edge
  function arrowBetween(g, a, b, ra, rb, size) {
    var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    var ux = (b[0] - a[0]) / d;
    var uy = (b[1] - a[1]) / d;
    arrowLine(g, a[0] + ux * ra, a[1] + uy * ra, b[0] - ux * rb, b[1] - uy * rb, size);
  }

  // ---- Drawings. Each is made at width DW from y = 0 down to its height h, and note names its card. hit(x, y) says
  // what a click there does: act changes the drawing, note opens the card on one of its parts ----

  // Planning with one's own world model: a head in profile with, inside it, a map of what leads to what (arrows as
  // thick as they are likely), a star for what is worth having, and a plan branching from a state, its best branch
  // bold. The map, the star and the plan each have a card, tied to the matching part of the home page's brain
  var HEAD = [
    [38, 116, 38, 104, 22, 96, 18, 74],
    [18, 74, 12, 40, 30, 8, 62, 8],
    [62, 8, 88, 8, 102, 26, 100, 46],
    [100, 46, 100, 52, 108, 60, 110, 66],
    [110, 66, 108, 70, 102, 70, 100, 72],
    [100, 72, 102, 78, 100, 82, 100, 84],
    [100, 84, 100, 92, 94, 96, 86, 96],
    [86, 96, 80, 96, 76, 100, 76, 116],
  ];
  var MAP = [[32, 44], [53, 30], [50, 60]];
  var ROUTES = [[0, 1, 2.6], [0, 2, 1.1], [1, 2, 1.8]];

  function WorldFigure() {
    this.h = 118;
    this.note = 'world';
  }

  WorldFigure.prototype.draw = function (g) {
    g.strokeStyle = g.fillStyle = INK;
    g.lineWidth = 2;
    HEAD.forEach(function (c, i) {
      marker(g, c, jit(i * 5 + 1));
    });
    ROUTES.forEach(function (r) {
      g.lineWidth = r[2];
      arrowBetween(g, MAP[r[0]], MAP[r[1]], 6.5, 7.5, 3.5);
    });
    g.lineWidth = 1.5;
    MAP.forEach(function (m, i) {
      state(g, m[0], m[1], 4.5, 0, jit(i + 40));
    });
    goal(g, 80, 30, 8.5, jit(77));
    var root = [67, 66];
    var best = [84, 86];
    var other = [55, 88];
    g.strokeStyle = INK;
    g.globalAlpha = 0.7;
    g.lineWidth = 1.3;
    marker(g, straight(root[0], root[1], other[0], other[1]), jit(91));
    g.globalAlpha = 1;
    g.strokeStyle = PICK;
    g.lineWidth = 2.6;
    marker(g, straight(root[0], root[1], best[0], best[1]), jit(92));
    g.strokeStyle = g.fillStyle = INK;
    g.lineWidth = 1.5;
    state(g, root[0], root[1], 3.6, 1, jit(93));
    g.lineWidth = 1.3;
    state(g, other[0], other[1], 3, 0, jit(94));
    g.strokeStyle = g.fillStyle = PICK;
    g.lineWidth = 1.5;
    state(g, best[0], best[1], 3.4, 1, jit(95));
  };

  WorldFigure.prototype.hit = function (x, y) {
    if (Math.hypot(x - 80, y - 30) < 13) return { note: 'world_r' };
    if (x > 50 && x < 92 && y > 58 && y < 94) return { note: 'world_q' };
    if (x > 22 && x < 62 && y > 20 && y < 68) return { note: 'world_p' };
    return null;
  };

  // A grid world: a plan from the dot to the star made with a construal that keeps only some obstacles (Ho et al.).
  // Click an obstacle to add it to the construal or leave it out; the plan is made again, and fails (a cross) if it
  // runs into one left out
  function GridFigure() {
    this.h = 96;
    this.note = 'construal';
    this.cols = 7;
    this.rows = 6;
    this.cell = 15;
    this.x0 = (DW - 7 * 15) / 2;
    this.y0 = 3;
    this.start = [0, 5];
    this.goal = [6, 5];
    this.obstacles = [
      { cells: [[3, 2], [3, 3], [3, 4], [3, 5]], on: true },
      { cells: [[4, 4], [5, 4]], on: false },
      { cells: [[5, 0], [6, 0]], on: false },
      { cells: [[1, 3], [1, 4]], on: false },
    ];
    this.plan();
  }

  GridFigure.prototype.blocked = function (c, r, construed) {
    return this.obstacles.some(function (o) {
      return (!construed || o.on) && o.cells.some(function (k) {
        return k[0] === c && k[1] === r;
      });
    });
  };

  // The shortest plan around the construed obstacles: distances back from the goal, then steps that bring it closer
  // (up, right, down, left, in that order of preference)
  GridFigure.prototype.plan = function () {
    var self = this;
    var dist = {};
    var key = function (c, r) {
      return c + ',' + r;
    };
    var queue = [this.goal];
    dist[key(this.goal[0], this.goal[1])] = 0;
    var moves = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    while (queue.length) {
      var p = queue.shift();
      moves.forEach(function (m) {
        var c = p[0] + m[0];
        var r = p[1] + m[1];
        if (c < 0 || r < 0 || c >= self.cols || r >= self.rows || self.blocked(c, r, true)) return;
        if (dist[key(c, r)] === undefined) {
          dist[key(c, r)] = dist[key(p[0], p[1])] + 1;
          queue.push([c, r]);
        }
      });
    }
    var path = [this.start];
    var here = this.start;
    while (dist[key(here[0], here[1])] > 0) {
      var next = null;
      for (var i = 0; i < moves.length && !next; i++) {
        var c = here[0] + moves[i][0];
        var r = here[1] + moves[i][1];
        if (dist[key(c, r)] === dist[key(here[0], here[1])] - 1) next = [c, r];
      }
      if (!next) break;
      path.push(next);
      here = next;
    }
    this.path = path;
    this.crashes = path.filter(function (k) {
      return self.blocked(k[0], k[1], false);
    });
  };

  GridFigure.prototype.cellXY = function (c, r) {
    return [this.x0 + c * this.cell, this.y0 + r * this.cell];
  };

  GridFigure.prototype.draw = function (g) {
    var self = this;
    var s = this.cell;
    g.strokeStyle = INK;
    g.globalAlpha = 0.25;
    g.lineWidth = 0.8;
    g.beginPath();
    for (var c = 0; c <= this.cols; c++) {
      g.moveTo(this.x0 + c * s, this.y0);
      g.lineTo(this.x0 + c * s, this.y0 + this.rows * s);
    }
    for (var r = 0; r <= this.rows; r++) {
      g.moveTo(this.x0, this.y0 + r * s);
      g.lineTo(this.x0 + this.cols * s, this.y0 + r * s);
    }
    g.stroke();
    g.globalAlpha = 1;
    g.lineWidth = 1.6;
    rect(g, this.x0, this.y0, this.cols * s, this.rows * s, jit(5));
    g.stroke();
    this.obstacles.forEach(function (o, k) {
      o.cells.forEach(function (cell, i) {
        var p = self.cellXY(cell[0], cell[1]);
        g.strokeStyle = g.fillStyle = INK;
        rect(g, p[0] + 2, p[1] + 2, s - 4, s - 4, jit(k * 13 + i));
        if (o.on) {
          g.globalAlpha = 0.6;
          g.fill();
          g.globalAlpha = 1;
          g.lineWidth = 1.5;
          g.stroke();
        } else {
          g.globalAlpha = 0.35;
          g.lineWidth = 1.2;
          g.setLineDash([2, 2.5]);
          g.stroke();
          g.setLineDash([]);
          g.globalAlpha = 1;
        }
      });
    });
    g.strokeStyle = PICK;
    g.lineWidth = 2.1;
    var pts = this.path.map(function (k) {
      var p = self.cellXY(k[0], k[1]);
      return [p[0] + s / 2, p[1] + s / 2];
    });
    var corners = pts.filter(function (p, i) {
      var a = pts[i - 1];
      var b = pts[i + 1];
      return !a || !b || (a[0] - p[0]) * (b[1] - p[1]) !== (a[1] - p[1]) * (b[0] - p[0]);
    });
    poly(g, corners);
    for (var i = 2; i < pts.length - 1; i += 3) {
      g.lineWidth = 1.4;
      chevron(g, straight(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]), 0.6, 3.6);
    }
    this.crashes.forEach(function (k) {
      var p = self.cellXY(k[0], k[1]);
      g.strokeStyle = PICK;
      g.lineWidth = 2.3;
      line(g, p[0] + 3, p[1] + 3, p[0] + s - 3, p[1] + s - 3);
      line(g, p[0] + s - 3, p[1] + 3, p[0] + 3, p[1] + s - 3);
    });
    var sp = this.cellXY(this.start[0], this.start[1]);
    var gp = this.cellXY(this.goal[0], this.goal[1]);
    g.strokeStyle = g.fillStyle = INK;
    g.lineWidth = 1.4;
    state(g, sp[0] + s / 2, sp[1] + s / 2, 4, 1, jit(60));
    goal(g, gp[0] + s / 2, gp[1] + s / 2, 5.5, jit(61));
  };

  GridFigure.prototype.hit = function (x, y) {
    var c = Math.floor((x - this.x0) / this.cell);
    var r = Math.floor((y - this.y0) / this.cell);
    var self = this;
    var o = null;
    this.obstacles.forEach(function (ob) {
      if (
        ob.cells.some(function (k) {
          return k[0] === c && k[1] === r;
        })
      )
        o = ob;
    });
    if (!o) return null;
    return {
      tip: o.on ? 'Click to leave this obstacle out of the construal' : 'Click to keep this obstacle in the construal',
      act: function () {
        o.on = !o.on;
        self.plan();
      },
    };
  };

  // Offline learning: at rest (the moon), the steps taken on the way to a reward (the star) are replayed backward (as
  // hops, the latest darkest), and each replayed step fills the state it leads back to with value. Click to replay the
  // next step
  function OfflineFigure() {
    this.h = 84;
    this.note = 'offline';
    this.xs = [12, 34, 56, 78, 103]; // the states along the path, then the reward
    this.y = 72;
    this.k = 2; // how many steps have been replayed
  }

  OfflineFigure.prototype.draw = function (g) {
    var xs = this.xs;
    var y = this.y;
    var i;
    g.fillStyle = INK;
    g.globalAlpha = 0.6;
    g.beginPath();
    g.arc(60, 19, 10, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    wipe(g, function () {
      g.beginPath();
      g.arc(65.5, 14.5, 9, 0, Math.PI * 2);
    });
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    line(g, xs[0], y, xs[4], y);
    for (i = 0; i < 4; i++) {
      g.strokeStyle = g.fillStyle = INK;
      g.lineWidth = 1.6;
      state(g, xs[i], y, 5.5, i >= 4 - this.k ? Math.pow(0.8, 4 - i) : 0, jit(i + 20));
    }
    goal(g, xs[4], y, 7.5, jit(29));
    g.strokeStyle = PICK;
    for (var m = 1; m <= this.k; m++) {
      var a = xs[5 - m];
      var b = xs[4 - m];
      var c = [a - 2, y - 10, a - 5, y - 30, b + 5, y - 30, b + 2, y - 10];
      g.globalAlpha = m === this.k ? 1 : 0.55;
      g.lineWidth = m === this.k ? 2.2 : 1.5;
      marker(g, c, jit(m * 9 + 3));
      chevron(g, c, 1, 4);
    }
    g.globalAlpha = 1;
  };

  OfflineFigure.prototype.hit = function () {
    var self = this;
    return {
      tip: this.k < 4 ? 'Click to replay the next step back' : 'Click to start again',
      act: function () {
        self.k = (self.k + 1) % 5;
      },
    };
  };

  // When to plan (Sharp & Eldar): a three-step decision tree whose paths cross over, with the goal at one end (the
  // star). A state is filled where the choice decides whether the goal is reached: plan there. It is dashed where both
  // moves keep the goal in reach: better to let chance choose, delaying planning. Click an end state to make it the goal
  var STEPS = {
    A: { at: [60, 8], kids: ['B', 'C'] },
    B: { at: [34, 36], kids: ['D', 'E'] },
    C: { at: [86, 36], kids: ['E', 'F'] },
    D: { at: [16, 64], kids: ['W', 'X'] },
    E: { at: [60, 64], kids: ['X', 'Y'] },
    F: { at: [104, 64], kids: ['Y', 'Z'] },
    W: { at: [8, 96], kids: [] },
    X: { at: [40, 96], kids: [] },
    Y: { at: [80, 96], kids: [] },
    Z: { at: [112, 96], kids: [] },
  };

  function WhenFigure() {
    this.h = 104;
    this.note = 'when';
    this.goal = 'X';
  }

  WhenFigure.prototype.reaches = function (k) {
    var self = this;
    return (
      k === this.goal ||
      STEPS[k].kids.some(function (c) {
        return self.reaches(c);
      })
    );
  };

  // How many of a state's moves keep the goal in reach
  WhenFigure.prototype.live = function (k) {
    var self = this;
    return STEPS[k].kids.filter(function (c) {
      return self.reaches(c);
    }).length;
  };

  WhenFigure.prototype.draw = function (g) {
    var self = this;
    Object.keys(STEPS).forEach(function (k, i) {
      var n = STEPS[k];
      var live = self.live(k);
      n.kids.forEach(function (c, m) {
        var b = STEPS[c].at;
        var cv = curve(n.at[0], n.at[1], b[0], b[1]);
        var on = live && self.reaches(c);
        g.strokeStyle = on ? PICK : INK;
        g.globalAlpha = on ? 0.95 : 0.4;
        g.lineWidth = on ? 1.9 : 1.3;
        marker(g, cv, jit(i * 4 + m + 70));
        g.lineWidth = 1.3;
        chevron(g, cv, 0.6, 3.5);
      });
    });
    g.globalAlpha = 1;
    Object.keys(STEPS).forEach(function (k, i) {
      var n = STEPS[k];
      var x = n.at[0];
      var y = n.at[1];
      if (!n.kids.length) {
        if (k === self.goal) {
          goal(g, x, y, 7, jit(i + 80));
          return;
        }
        wipe(g, function () {
          g.beginPath();
          g.rect(x - 4.5, y - 4.5, 9, 9);
        });
        g.strokeStyle = INK;
        g.globalAlpha = 0.7;
        g.lineWidth = 1.5;
        rect(g, x - 3.5, y - 3.5, 7, 7, jit(i + 80));
        g.stroke();
        g.globalAlpha = 1;
        return;
      }
      var live = self.live(k);
      if (live === 1) {
        g.strokeStyle = g.fillStyle = PICK;
        g.lineWidth = 1.8;
        state(g, x, y, 5.2, 1, jit(i + 80));
      } else if (live === 2) {
        g.strokeStyle = g.fillStyle = INK;
        g.lineWidth = 1.5;
        g.setLineDash([2, 2.4]);
        state(g, x, y, 5.2, 0, jit(i + 80));
        g.setLineDash([]);
      } else {
        g.strokeStyle = g.fillStyle = INK;
        g.globalAlpha = 0.4;
        g.lineWidth = 1.3;
        state(g, x, y, 4.6, 0, jit(i + 80));
        g.globalAlpha = 1;
      }
    });
  };

  WhenFigure.prototype.hit = function (x, y) {
    var self = this;
    var found = null;
    Object.keys(STEPS).forEach(function (k) {
      var n = STEPS[k];
      if (!n.kids.length && Math.hypot(n.at[0] - x, n.at[1] - y) < 9) found = k;
    });
    if (!found || found === this.goal) return null;
    return {
      tip: 'Click to make this the goal',
      act: function () {
        self.goal = found;
      },
    };
  };

  // ---- Panes ----

  function Pane(side, figures) {
    this.side = side;
    this.figures = figures;
    figures.forEach(function (f, k) {
      f.tilt = TILT[side][k];
      f.ink = COLOURS[side][k][0];
      f.pick = COLOURS[side][k][1];
    });
    this.on = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'glass-pane';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    // The button in the middle of the side that opens the board, and the × at its top that closes it
    this.open = false;
    this.pull = document.createElement('button');
    this.pull.type = 'button';
    this.pull.className = 'board-pull';
    this.pull.textContent = 'See what we’re working on';
    this.pull.addEventListener('click', function (e) {
      e.stopPropagation();
      self.roll(true, true);
    });
    document.body.appendChild(this.pull);
    this.shut = document.createElement('button');
    this.shut.type = 'button';
    this.shut.className = 'board-close';
    this.shut.textContent = '×';
    this.shut.setAttribute('aria-label', 'Close the board');
    this.shut.addEventListener('click', function (e) {
      e.stopPropagation();
      self.roll(false, true);
    });
    document.body.appendChild(this.shut);
    this.g = this.canvas.getContext('2d');
    var self = this;
    this.canvas.addEventListener('click', function (e) {
      e.stopPropagation();
      self.click(e);
    });
    this.canvas.addEventListener('mousemove', function (e) {
      var spot = self.locate(e);
      var hit = spot && spot.hit;
      self.canvas.style.cursor = spot ? 'pointer' : 'default';
      var tip = !spot ? '' : hit && hit.tip ? hit.tip : hit && hit.note ? NOTES[hit.note].title : 'Click for a description';
      if (self.canvas.title !== tip) self.canvas.title = tip;
    });
  }

  // One board the height of the canvas, with the drawings zigzagging from side to side down it, spread evenly, with as
  // much space between them as above the first and below the last. The equations go in the space left: the rows
  // between the drawings, and beside each drawing where there is room
  Pane.prototype.fit = function (x, w, top, h) {
    this.on = w >= MIN_PANE && h >= 320;
    this.canvas.style.display = this.on ? 'block' : 'none';
    this.pull.style.display = this.on && !this.open ? 'block' : 'none';
    this.shut.style.display = this.on && this.open ? 'block' : 'none';
    if (!this.on) return;
    this.pull.style.left = x + w / 2 + 'px';
    this.pull.style.top = top + h / 2 + 'px';
    this.pull.style.maxWidth = w - 8 + 'px';
    this.shut.style.left = x + w - 34 + 'px';
    this.shut.style.top = top + 8 + 'px';
    var st = this.canvas.style;
    st.left = x + 'px';
    st.top = top + 'px';
    st.width = w + 'px';
    st.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.layer = layerOf(this.canvas.width, this.canvas.height);
    var n = this.figures.length;
    var sum = 0;
    this.figures.forEach(function (f) {
      sum += f.h;
    });
    var room = w - 18;
    var size = Math.min(w, PANE) - 18;
    var scale = Math.min(SCALE, (size - 2 * PAD - 10) / DW, (h - (n + 1) * 40 - n * 2 * PAD) / sum);
    var pw = DW * scale + 2 * PAD;
    var gap = (h - sum * scale - n * 2 * PAD) / (n + 1);
    var y = gap;
    var stagger = STAGGER[this.side];
    this.figures.forEach(function (f, k) {
      var px = 9 + (room - pw) * stagger[k];
      var ph = f.h * scale + 2 * PAD;
      f.sheet = { x: px, y: y, w: pw, h: ph, tilt: (f.tilt * Math.PI) / 180 };
      f.at = { x: px + PAD, y: y + PAD, s: scale };
      y += ph + gap;
    });
    // Where the equations can go: rows across the board between the drawings, and rows beside each drawing
    var slots = [];
    var left = 16;
    var right = w - 16;
    var rows = function (top, bottom, x0, x1, step) {
      var k = Math.floor((bottom - top) / step);
      for (var i = 0; i < k; i++) slots.push({ x: x0, y: top + (bottom - top) * ((i + 0.5) / k), w: x1 - x0 });
    };
    var above = 40; // below the × that closes the board
    this.figures.forEach(function (f) {
      var p = f.sheet;
      rows(above, p.y, left, right, 27);
      if (p.x - left > 48) rows(p.y, p.y + p.h, left, p.x - 4, 25);
      else if (right - (p.x + p.w) > 48) rows(p.y, p.y + p.h, p.x + p.w + 4, right, 25);
      above = p.y + p.h;
    });
    rows(above, h - 16, left, right, 27);
    this.slots = slots;
    this.draw();
  };

  Pane.prototype.draw = function () {
    var g = this.g;
    var w = this.canvas.width / dpr;
    var h = this.canvas.height / dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    board(g, w, h);
    var lg = this.layer.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.clearRect(0, 0, this.layer.width, this.layer.height);
    lg.lineCap = 'round';
    lg.lineJoin = 'round';
    this.figures.forEach(function (f) {
      var p = f.sheet;
      lg.setTransform(dpr, 0, 0, dpr, 0, 0);
      lg.translate(p.x + p.w / 2, p.y + p.h / 2);
      lg.rotate(p.tilt);
      lg.translate(PAD - p.w / 2, PAD - p.h / 2);
      lg.scale(f.at.s, f.at.s);
      lg.globalAlpha = 1;
      lg.setLineDash([]);
      INK = f.ink;
      PICK = f.pick;
      f.draw(lg);
    });
    lg.setTransform(dpr, 0, 0, dpr, 0, 0);
    scrawl(lg, this.slots, EQUATIONS[this.side], this.side === 'left' ? 0 : 1);
    neon(g, this.layer);
  };

  // The equations, in a hurried hand, spread evenly down the board: in each space, the longest that still fits (smaller
  // if need be), each a little askew and shifted, in turn in the three colours, some underlined and some boxed
  function scrawl(g, slots, list, turn) {
    var n = Math.min(slots.length, list.length);
    var spread = [];
    for (var j = 0; j < n; j++) spread.push(slots[Math.floor(((j + 0.5) * slots.length) / n)]);
    var BASE = 17;
    g.textBaseline = 'middle';
    g.font = '600 ' + BASE + 'px ' + HAND;
    var pool = list.map(function (t) {
      return { t: t, w: g.measureText(t).width };
    });
    pool.sort(function (a, b) {
      return b.w - a.w;
    });
    spread.forEach(function (slot, i) {
      if (!pool.length) return;
      var k = 0;
      while (k < pool.length && pool[k].w > slot.w) k++;
      var size = BASE;
      if (k === pool.length) {
        k = pool.length - 1;
        size = (BASE * slot.w) / pool[k].w;
        if (size < 11) return;
      }
      var e = pool.splice(k, 1)[0];
      var tw = (e.w * size) / BASE;
      var x = slot.x + (slot.w - tw) * rnd(i * 3.1 + turn * 17);
      var c = [BLUE, GREEN, CORAL][(i + turn) % 3];
      g.save();
      g.translate(x, slot.y);
      g.rotate((rnd(i * 5.7 + turn * 11) - 0.5) * 0.09);
      g.font = '600 ' + size.toFixed(1) + 'px ' + HAND;
      g.fillStyle = g.strokeStyle = c;
      g.fillText(e.t, 0, 0);
      g.lineWidth = 1.3;
      g.lineCap = 'round';
      if (i % 4 === 1) {
        g.beginPath();
        g.moveTo(-2, size * 0.55);
        g.quadraticCurveTo(tw / 2, size * 0.7, tw + 3, size * 0.5);
        g.stroke();
      } else if (i % 5 === 3) {
        g.beginPath();
        g.moveTo(-4, -size * 0.6);
        g.lineTo(tw + 4, -size * 0.66);
        g.lineTo(tw + 5, size * 0.62);
        g.lineTo(-3, size * 0.66);
        g.closePath();
        g.stroke();
      }
      g.restore();
    });
  }

  // A path around a rectangle with rounded corners
  function rounded(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // The board: one navy the size of the canvas, its corners a little rounded
  function board(g, w, h) {
    rounded(g, 0, 0, w, h, 8);
    g.fillStyle = BOARD;
    g.fill();
  }

  // Neon marker on the board: the drawings and the writing, each with a soft glow of its own colour around it
  function neon(g, layer) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if ('filter' in g) {
      g.filter = 'blur(' + 1.5 * dpr + 'px)';
      g.globalAlpha = 0.5;
      g.drawImage(layer, 0, 0);
      g.filter = 'none';
    }
    g.globalAlpha = 1;
    g.drawImage(layer, 0, 0);
    g.restore();
  }

  // The drawing under the pointer, if any: what a click on it there does, and where the drawing is on the screen
  Pane.prototype.locate = function (e) {
    var box = this.canvas.getBoundingClientRect();
    var x = e.clientX - box.left;
    var y = e.clientY - box.top;
    for (var k = 0; k < this.figures.length; k++) {
      var f = this.figures[k];
      var p = f.sheet;
      // The pointer on the drawing, turned back with it
      var cx = p.x + p.w / 2;
      var cy = p.y + p.h / 2;
      var cos = Math.cos(p.tilt);
      var sin = Math.sin(p.tilt);
      var u = cx + (x - cx) * cos + (y - cy) * sin;
      var v = cy - (x - cx) * sin + (y - cy) * cos;
      if (u < p.x || v < p.y || u > p.x + p.w || v > p.y + p.h) continue;
      var a = f.at;
      var hit = f.hit ? f.hit((u - a.x) / a.s, (v - a.y) / a.s) : null;
      return { f: f, hit: hit, rect: { x: box.left + p.x, y: box.top + p.y, w: p.w, h: p.h } };
    }
    return null;
  };

  // A click on a drawing opens its card (or the card on the part clicked) and changes the drawing where it changes; a
  // second click on a drawing that does not change closes the card. A click between the drawings closes it too
  Pane.prototype.click = function (e) {
    var spot = this.locate(e);
    if (!spot) {
      note.close();
      this.figures.forEach(function (f) {
        if (f.clear) f.clear();
      });
      this.draw();
      return;
    }
    var hit = spot.hit;
    var key = (hit && hit.note) || spot.f.note;
    if (hit && hit.act) {
      hit.act(e.shiftKey);
      this.draw();
      if (note.key !== key) note.open(key, spot.rect, this.side);
    } else if (note.key === key) {
      note.close();
    } else {
      note.open(key, spot.rect, this.side);
    }
  };

  // Opens the board (out from the middle, if animate) or puts it away, and remembers which for the rest of the visit
  Pane.prototype.roll = function (open, animate) {
    var c = this.canvas.classList;
    if (!animate) c.add('is-instant');
    c.toggle('is-open', open);
    this.open = open;
    this.pull.style.display = this.on && !open ? 'block' : 'none';
    this.shut.style.display = this.on && open ? 'block' : 'none';
    if (!open) note.close();
    try {
      sessionStorage.setItem('board-' + this.side, open ? '1' : '');
    } catch (e) {}
    if (!animate) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          c.remove('is-instant');
        });
      });
    }
  };

  // ---- Cards: beside the drawing, level with it, with what it shows, its key equation and key papers ----

  var note = {
    el: null,
    key: null,
    open: function (key, at, side) {
      var n = NOTES[key];
      if (!n) return;
      if (!this.el) {
        this.el = document.createElement('div');
        this.el.className = 'glass-note';
        this.el.setAttribute('role', 'dialog');
        this.el.hidden = true;
        document.body.appendChild(this.el);
        var self = this;
        this.el.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (ev.target.closest('.gn-close')) self.close();
        });
        document.addEventListener('click', function () {
          self.close();
        });
        document.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') self.close();
        });
        window.addEventListener('scroll', function () {
          self.close();
        });
      }
      var home = document.querySelector('.wm-hero');
      this.el.innerHTML = '<button type="button" class="gn-close" aria-label="Close">×</button><strong></strong><p></p>';
      this.el.querySelector('strong').textContent = n.title;
      this.el.querySelector('p').textContent = n.text;
      if (n.eq) {
        var eq = document.createElement('p');
        eq.className = 'gn-eq';
        eq.innerHTML = n.eq; // written above, in this file
        this.el.appendChild(eq);
      }
      if (n.wm) {
        var a = document.createElement('a');
        a.className = 'gn-wm';
        a.href = (home ? '' : '/') + '#wm-' + n.wm;
        a.textContent = home ? 'Show it in the brain above' : 'See it in the brain on our home page';
        this.el.appendChild(a);
      }
      if (n.links && n.links.length) {
        var ul = document.createElement('ul');
        n.links.forEach(function (l) {
          var li = document.createElement('li');
          var link = document.createElement('a');
          link.href = l[1];
          link.textContent = l[0];
          li.appendChild(link);
          ul.appendChild(li);
        });
        this.el.appendChild(ul);
      }
      this.el.hidden = false;
      this.key = key;
      var w = this.el.offsetWidth;
      var h = this.el.offsetHeight;
      var left = side === 'left' ? at.x + at.w + 10 : at.x - w - 10;
      left = clamp(left, 8, window.innerWidth - w - 8);
      var top = clamp(at.y, 8, window.innerHeight - h - 8);
      this.el.style.left = left + 'px';
      this.el.style.top = top + 'px';
      // On the home page, the parts of the world model also open their part of the brain
      if (n.wm && home) {
        var part = home.querySelector('.wm-node[data-wm="' + n.wm + '"]');
        if (part) {
          setTimeout(function () {
            part.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }, 0);
        }
      }
    },
    close: function () {
      if (this.el) this.el.hidden = true;
      this.key = null;
    },
  };

  // ---- Set up ----

  var panes = [];

  // The boards go in the open space either side of the content box, near its text
  function fit() {
    var card = document.querySelector('.main-content > .content-card');
    if (!card) return;
    var first = card;
    var last = card;
    var lrect = first.getBoundingClientRect();
    var rrect = last.getBoundingClientRect();
    var W = document.documentElement.clientWidth;
    // From either edge of the window to the text in the box
    var box = { left: 0, right: W };
    var nav = document.getElementById('navbar');
    var top = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    var h = window.innerHeight - top;
    // The boards sit in the middle of the height, with room above and below them
    var m = Math.max(40, Math.round(h * 0.12));
    top += m;
    h -= 2 * m;
    var pl = lrect.left + parseFloat(getComputedStyle(first).paddingLeft);
    var pr = W - rrect.right + parseFloat(getComputedStyle(last).paddingRight) + (last.offsetWidth - last.clientWidth);
    var lw = Math.min(PANE + ZIG, Math.floor(pl - GAP));
    var rw = Math.min(PANE + ZIG, Math.floor(pr - GAP));
    var lx = Math.round(box.left + Math.max(0, pl - NEAR - lw));
    var rx = Math.round(box.right - Math.max(0, pr - NEAR - rw)) - rw;
    if (!panes.length) {
      panes = [
        new Pane('left', [new GridFigure(), new WhenFigure()]),
        new Pane('right', [new WorldFigure(), new OfflineFigure()]),
      ];
      panes.forEach(function (p) {
        var open = false;
        try {
          open = sessionStorage.getItem('board-' + p.side) === '1';
        } catch (e) {}
        p.roll(open, false);
      });
      // The equations are written in a handwriting font: once it has loaded, they are written again in it
      if (document.fonts && document.fonts.load) {
        document.fonts.load('600 17px Caveat').then(function () {
          panes.forEach(function (p) {
            if (p.on) p.draw();
          });
        });
      }
    }
    note.close();
    panes[0].fit(lx, lw, top, h);
    panes[1].fit(rx, rw, top, h);
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
