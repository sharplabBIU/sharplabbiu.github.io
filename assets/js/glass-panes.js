// Small sheets of paper down the left and right edges of the window (wider windows only), beside the text column,
// taped to the wall, tilted a little and staggered from side to side, each with a drawing on it in dark slate gray (as
// the text) and orange marker, and no writing. Left, how to predict and plan: forward and backward prediction (successor and
// predecessor representations, Sharp & Eldar), planning with one's own world model, and task construal in a grid world
// (Ho et al.). Right, when and what to plan: offline learning by replay, need and gain (Mattar & Daw), and when to plan (Sharp &
// Eldar). Clicking a drawing opens a card describing it, with key papers, and most drawings also change when clicked
// (on the home page, the parts of the world model open the matching part of the brain). Two canvases fixed below the
// header, drawn again only when something changes.
(function () {
  'use strict';

  var INK = '#2f4f4f'; // dark slate gray, as the text
  var ORANGE = '#e07020'; // orange, deep enough to show on the paper
  var DW = 120; // the width the drawings are made at, before scaling to the sheet
  var PANE = 140; // the widest the space for the sheets on each side gets
  var MIN_PANE = 112; // the narrowest space that gets sheets
  var GAP = 16; // between that space and the text column
  var SCALE = 0.75; // the largest the drawings are drawn, of DW
  var PAD = 9; // the paper around a drawing
  var STAGGER = { left: [0, 1, 0.4], right: [0.6, 0, 1] }; // where each sheet sits, from side to side, in its space
  var TILT = { left: [-1.4, 1.1, -0.7], right: [1.2, -0.9, 1.5] }; // and how far it is turned, in degrees

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // The cards: what each drawing shows, how it relates to the field's key ideas, its key equation and key papers. "wm"
  // names the part of the home page's world-model brain that a drawing corresponds to
  var LAB = {
    anxiety: ['Sharp 2024, Anxiety involves altered planning (Trends Cogn Sci)', 'https://www.sciencedirect.com/science/article/pii/S1364661324002924'],
    worldModel: ['Sharp et al., A world-model theory of trait anxiety (PsyArXiv)', 'https://osf.io/preprints/psyarxiv/98ktg_v4'],
    direction: ['Sharp & Eldar 2024, Humans adaptively deploy forward and backward prediction (Nat Hum Behav)', 'https://doi.org/10.1038/s41562-024-01930-8'],
    delay: ['Sharp & Eldar, Humans adaptively delay planning using cognitive maps (PsyArXiv)', 'https://osf.io/preprints/psyarxiv/8ubct_v5'],
    construal: ['Schiff & Sharp, anxiety and task generalization (Top Cogn Sci)', 'https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051'],
  };
  var REF = {
    suttonBarto: ['Sutton & Barto 2018, Reinforcement Learning: An Introduction', 'http://incompleteideas.net/book/the-book-2nd.html'],
    dawNivDayan: ['Daw, Niv & Dayan 2005, Uncertainty-based competition between prefrontal and striatal systems', 'https://doi.org/10.1038/nn1560'],
    dyna: ['Sutton 1991, Dyna, an integrated architecture for learning, planning, and reacting', 'https://doi.org/10.1145/122344.122377'],
    momennejad: ['Momennejad et al. 2018, Offline replay supports planning in human reinforcement learning', 'https://doi.org/10.7554/eLife.32548'],
    fosterWilson: ['Foster & Wilson 2006, Reverse replay of behavioural sequences in hippocampal place cells', 'https://doi.org/10.1038/nature04587'],
    mattarDaw: ['Mattar & Daw 2018, Prioritized memory access explains planning and hippocampal replay', 'https://doi.org/10.1038/s41593-018-0232-z'],
    dayan1993: ['Dayan 1993, The successor representation', 'https://doi.org/10.1162/neco.1993.5.4.613'],
    callaway: ['Callaway et al. 2022, Rational use of cognitive resources in human planning', 'https://doi.org/10.1038/s41562-022-01332-8'],
    lieder: ['Lieder & Griffiths 2020, Resource-rational analysis', 'https://doi.org/10.1017/S0140525X1900061X'],
    ho2022: ['Ho et al. 2022, People construct simplified mental representations to plan', 'https://doi.org/10.1038/s41586-022-04743-9'],
  };
  var NOTES = {
    predict: {
      title: 'Forward and backward prediction',
      text:
        'Two ways to predict with a map of the world. From a state (filled), the successor representation predicts which states will follow it, and how soon (gray); the predecessor representation predicts which states came before it (orange). Each circle fills with how much that state is expected, discounted by how many steps away it is. Which is more efficient depends on the world: where paths diverge, possible futures outnumber the present, so it pays to predict backward from a goal to what leads to it; where paths converge, it pays to predict forward. People adapt accordingly, using more backward prediction where paths diverge and more forward prediction where they converge. Click a state to predict from it.',
      eq: 'M<sub>SR</sub>(s,s′) = E[ Σ<sub>t</sub> γ<sup>t</sup> 𝟙(s<sub>t</sub> = s′) | s<sub>0</sub> = s ]<br>M<sub>PR</sub>(s,s′) = E[ Σ<sub>t</sub> γ<sup>t</sup> 𝟙(s<sub>−t</sub> = s′) | s<sub>0</sub> = s ]',
      links: [LAB.direction, REF.dayan1993],
    },
    world: {
      wm: 'model',
      title: 'Planning with one’s own world model',
      text:
        'Each person plans with their own model of the world: beliefs about what leads to what (the map, its arrows as thick as they are likely) and about what is worth having (the star). Planning looks ahead through this model and takes the best action at each step (the orange branch). The equation is the same for everyone; what differs is the model it is solved with, as in the brain on our home page, and biases in it, as in anxiety, reshape every plan. Click the map, the star or the branches for each part.',
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
        'The value person i expects from taking action a in state s and acting well afterwards, worked out with their own world model; the plan takes the best action (the orange branch). In the brain on our home page this is a task representation, built for the task at hand from the beliefs and goals above it.',
      eq: 'π<sub>i</sub>(s) = argmax<sub>a</sub> Q<sub>i</sub>(s,a)',
      links: [REF.dawNivDayan, LAB.worldModel],
    },
    construal: {
      title: 'Task construal',
      text:
        'To plan, people build a simplified representation of the task, keeping only what matters. Here the plan from the dot to the star (orange) keeps the wall in its way and ignores the obstacles drawn dashed, which do not change the best route. Representing more costs effort, so the best construal trades how well its plan does against its cost. We ask how anxiety distorts construals. Click an obstacle to keep it or leave it out: leave out the wall and the plan runs into it.',
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
    needgain: {
      title: 'What to replay or plan: need × gain',
      text:
        'Mattar and Daw’s answer to which memory to replay, or which step to plan, next: the one whose update would improve future reward the most. That is the product of gain, how much better one would act in that state after the update (high next to a newly found reward, the star), and need, how often one expects to be there (the larger circles, near you, the filled dot). The orange ring marks the winner. Click a state to move yourself there.',
      eq: 'EVB(s<sub>k</sub>) = Gain(s<sub>k</sub>) × Need(s<sub>k</sub>)',
      links: [REF.mattarDaw, REF.dayan1993, LAB.direction],
    },
    when: {
      title: 'When to plan',
      text:
        'In our task people moved three steps down a decision tree toward a goal (the star). At each step they could plan the move themselves, or let the computer choose at random for a small sure reward. Planning pays only where the choice decides whether the goal is reached (orange); where both moves keep the goal in reach (dashed), it is better to delay. People learned to delay planning adaptively, as a meta-controller that searches a cognitive map of the task predicts. Click an end state to make it the goal.',
      eq: 'V<sub>take</sub> = R<sub>g</sub> γ<sup>Δ</sup>,  V<sub>relinquish</sub> = 1 (+ R<sub>g</sub> γ<sup>Δ</sup>)',
      links: [LAB.delay, REF.callaway, ['Planning efficiency, on our projects page', '/projects/#planning-efficiency']],
    },
  };

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  // A steady pseudo-random number for a seed, so hand-drawn wobbles stay the same each time the sheets are drawn
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

  // Lays a layer of ink (already in its colours) on the paper, a little darker at the edges of the strokes, where a
  // marker's ink soaks in most
  function ink(g, layer, rim) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.92;
    g.drawImage(layer, 0, 0);
    g.globalAlpha = 1;
    var r = Math.max(1, Math.round(0.8 * dpr));
    var core = layerOf(layer.width, layer.height);
    var cg = core.getContext('2d');
    cg.drawImage(layer, 0, 0);
    cg.globalCompositeOperation = 'destination-in';
    [[r, 0], [-r, 0], [0, r], [0, -r]].forEach(function (o) {
      cg.drawImage(layer, o[0], o[1]);
    });
    var edge = layerOf(layer.width, layer.height);
    var eg = edge.getContext('2d');
    eg.drawImage(layer, 0, 0);
    eg.globalCompositeOperation = 'destination-out';
    eg.drawImage(core, 0, 0);
    eg.globalCompositeOperation = 'source-in';
    eg.fillStyle = 'rgba(0, 0, 0, ' + rim + ')';
    eg.fillRect(0, 0, edge.width, edge.height);
    g.drawImage(edge, 0, 0);
    g.restore();
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

  // A goal or a reward: a star in pale orange
  function goal(g, x, y, r, j) {
    wipe(g, function () {
      star(g, x, y, r + 1, j);
    });
    g.strokeStyle = g.fillStyle = ORANGE;
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

  // Forward and backward prediction (Sharp & Eldar): states in rows, time running down, paths converging into the
  // middle and diverging after it. From the state predicted from (filled), the successor representation runs forward
  // to the states that follow it (dark slate gray) and the predecessor representation backward to the states that came
  // before it (orange), each state filling with how much it is expected there, discounted by the steps away. Click a
  // state to predict from it
  var ROWS = [[22, 60, 98], [40, 80], [60], [40, 80], [22, 60, 98]];
  var MOVES = [[0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8], [6, 9], [7, 9], [7, 10]];
  var GAMMA = 0.85;

  function PredictFigure() {
    this.h = 104;
    this.note = 'predict';
    this.from = 5;
    var states = (this.states = []);
    ROWS.forEach(function (xs, k) {
      xs.forEach(function (x) {
        states.push({ x: x, y: 8 + k * 22, k: k, next: [], prev: [], j: jit(x * 1.3 + k * 17) });
      });
    });
    MOVES.forEach(function (m) {
      states[m[0]].next.push(m[1]);
      states[m[1]].prev.push(m[0]);
    });
    // How likely each state is, starting from the top row at random and moving down at random
    states.forEach(function (s) {
      s.p = s.k
        ? s.prev.reduce(function (sum, a) {
            return sum + states[a].p / states[a].next.length;
          }, 0)
        : 1 / ROWS[0].length;
    });
  }

  // The successor representation from the state predicted from (ahead) and the predecessor representation (behind):
  // the discounted chance of being in each state so many steps after it, or of having been in it so many steps before
  PredictFigure.prototype.predict = function () {
    var states = this.states;
    var f = this.from;
    var ahead = states.map(function () {
      return 0;
    });
    var behind = ahead.slice();
    ahead[f] = behind[f] = 1;
    for (var i = f + 1; i < states.length; i++) {
      states[i].prev.forEach(function (a) {
        ahead[i] += (GAMMA * ahead[a]) / states[a].next.length;
      });
    }
    for (var k = f - 1; k >= 0; k--) {
      var s = states[k];
      s.next.forEach(function (b) {
        behind[k] += (GAMMA * behind[b] * s.p) / s.next.length / states[b].p;
      });
    }
    return { ahead: ahead, behind: behind };
  };

  PredictFigure.prototype.draw = function (g) {
    var states = this.states;
    var f = this.from;
    var r = this.predict();
    g.lineWidth = 1.4;
    MOVES.forEach(function (m) {
      var a = states[m[0]];
      var b = states[m[1]];
      if (r.ahead[m[0]] && r.ahead[m[1]]) {
        g.strokeStyle = INK;
        arrowBetween(g, [a.x, a.y], [b.x, b.y], 6.5, 7.5, 3.2);
      } else if (r.behind[m[0]] && r.behind[m[1]]) {
        g.strokeStyle = ORANGE;
        arrowBetween(g, [b.x, b.y], [a.x, a.y], 6.5, 7.5, 3.2);
      } else {
        g.strokeStyle = INK;
        g.globalAlpha = 0.3;
        line(g, a.x, a.y, b.x, b.y);
        g.globalAlpha = 1;
      }
    });
    states.forEach(function (s, i) {
      var full = r.ahead[i] || r.behind[i];
      g.strokeStyle = g.fillStyle = i !== f && r.behind[i] ? ORANGE : INK;
      g.globalAlpha = full ? 1 : 0.45;
      g.lineWidth = i === f ? 1.8 : 1.3;
      state(g, s.x, s.y, i === f ? 6.5 : 5.5, full, s.j);
      g.globalAlpha = 1;
    });
  };

  PredictFigure.prototype.hit = function (x, y) {
    var self = this;
    for (var i = 0; i < this.states.length; i++) {
      var s = this.states[i];
      if (Math.hypot(s.x - x, s.y - y) <= 10) {
        var k = i;
        return {
          tip: 'Click to predict from this state',
          act: function () {
            self.from = k;
          },
        };
      }
    }
    return null;
  };

  // Planning with one's own world model: a head in profile with, inside it, a map of what leads to what (arrows as
  // thick as they are likely), a star for what is worth having, and a plan branching from a state, its best branch in
  // orange. The map, the star and the plan each have a card, tied to the matching part of the home page's brain
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
    g.strokeStyle = ORANGE;
    g.lineWidth = 2.6;
    marker(g, straight(root[0], root[1], best[0], best[1]), jit(92));
    g.strokeStyle = g.fillStyle = INK;
    g.lineWidth = 1.5;
    state(g, root[0], root[1], 3.6, 1, jit(93));
    g.lineWidth = 1.3;
    state(g, other[0], other[1], 3, 0, jit(94));
    g.strokeStyle = g.fillStyle = ORANGE;
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
  // Click an obstacle to add it to the construal or leave it out; the plan is made again, and fails (an orange cross) if it
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
    g.strokeStyle = ORANGE;
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
      g.strokeStyle = ORANGE;
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

  // Offline learning: at rest (the moon), the steps taken on the way to a reward (the star) are replayed backward (orange
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
    g.strokeStyle = ORANGE;
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

  // Need and gain (Mattar & Daw): states on a grid, as large as they are needed (how soon and how often one expects to
  // be there from where one is, the filled dot), orange arrows into a newly found reward (the star) from the states where
  // an update would gain the most, and an orange ring on the state to replay next, where need × gain is largest. Click a
  // state to move there
  function NeedGainFigure() {
    this.h = 90;
    this.note = 'needgain';
    this.cols = 5;
    this.rows = 4;
    this.sp = 24;
    this.x0 = 12;
    this.y0 = 10;
    this.star = [4, 0];
    this.you = [0, 3];
  }

  NeedGainFigure.prototype.xy = function (c, r) {
    return [this.x0 + c * this.sp, this.y0 + r * this.sp];
  };

  NeedGainFigure.prototype.cells = function () {
    var out = [];
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (c === this.star[0] && r === this.star[1]) continue;
        var far = Math.abs(c - this.star[0]) + Math.abs(r - this.star[1]);
        var need = Math.pow(0.72, Math.abs(c - this.you[0]) + Math.abs(r - this.you[1]));
        out.push({ c: c, r: r, need: need, gain: Math.pow(0.3, far - 1), next: far === 1, size: 2.2 + 4.2 * need });
      }
    }
    return out;
  };

  NeedGainFigure.prototype.draw = function (g) {
    var self = this;
    var cells = this.cells();
    var sp = this.xy(this.star[0], this.star[1]);
    g.strokeStyle = INK;
    g.globalAlpha = 0.3;
    g.lineWidth = 1;
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        var p = this.xy(c, r);
        if (c + 1 < this.cols) line(g, p[0], p[1], p[0] + this.sp, p[1]);
        if (r + 1 < this.rows) line(g, p[0], p[1], p[0], p[1] + this.sp);
      }
    }
    g.globalAlpha = 1;
    var best = cells[0];
    cells.forEach(function (k) {
      if (k.need * k.gain > best.need * best.gain) best = k;
      if (!k.next) return;
      g.strokeStyle = ORANGE;
      g.lineWidth = 1.6;
      arrowBetween(g, self.xy(k.c, k.r), sp, k.size + 1.5, 9, 3.5);
    });
    cells.forEach(function (k) {
      var p = self.xy(k.c, k.r);
      var you = k.c === self.you[0] && k.r === self.you[1];
      wipe(g, function () {
        g.beginPath();
        g.arc(p[0], p[1], k.size + 0.6, 0, Math.PI * 2);
      });
      g.strokeStyle = g.fillStyle = INK;
      g.globalAlpha = you ? 1 : 0.1 + 0.4 * k.need;
      g.beginPath();
      g.arc(p[0], p[1], you ? k.size - 2.2 : k.size, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 1.3;
      circle(g, p[0], p[1], k.size, jit(k.c * 7 + k.r * 3 + 50));
    });
    goal(g, sp[0], sp[1], 7.5, jit(57));
    var bp = this.xy(best.c, best.r);
    g.strokeStyle = ORANGE;
    g.lineWidth = 2;
    circle(g, bp[0], bp[1], best.size + 4.5, jit(58));
  };

  NeedGainFigure.prototype.hit = function (x, y) {
    var c = Math.round((x - this.x0) / this.sp);
    var r = Math.round((y - this.y0) / this.sp);
    var p = this.xy(c, r);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows || Math.hypot(p[0] - x, p[1] - y) > 10) return null;
    if (c === this.star[0] && r === this.star[1]) return null;
    var self = this;
    return {
      tip: 'Click to move yourself here',
      act: function () {
        self.you = [c, r];
      },
    };
  };

  // When to plan (Sharp & Eldar): a three-step decision tree whose paths cross over, with the goal at one end (the
  // star). A state is orange where the choice decides whether the goal is reached: plan there. It is dashed where both
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
        g.strokeStyle = on ? ORANGE : INK;
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
        g.strokeStyle = g.fillStyle = ORANGE;
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
    this.on = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'glass-pane';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
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

  // Each drawing on a sheet of its own, the sheets staggered from side to side and spread evenly down the canvas, with as
  // much space between them as above the first and below the last. Room is left around them for their shadows, which
  // fall down and to the right
  Pane.prototype.fit = function (x, w, top, h) {
    this.on = w >= MIN_PANE && h >= 320;
    this.canvas.style.display = this.on ? 'block' : 'none';
    if (!this.on) return;
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
    var scale = Math.min(SCALE, (room - 2 * PAD - 10) / DW, (h - (n + 1) * 40 - n * 2 * PAD) / sum);
    var pw = DW * scale + 2 * PAD;
    var gap = (h - sum * scale - n * 2 * PAD) / (n + 1);
    var y = gap;
    var stagger = STAGGER[this.side];
    var tilt = TILT[this.side];
    this.figures.forEach(function (f, k) {
      var px = 6 + (room - pw) * stagger[k];
      var ph = f.h * scale + 2 * PAD;
      f.sheet = { x: px, y: y, w: pw, h: ph, tilt: (tilt[k] * Math.PI) / 180 };
      f.at = { x: px + PAD, y: y + PAD, s: scale };
      y += ph + gap;
    });
    this.draw();
  };

  Pane.prototype.draw = function () {
    var g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.figures.forEach(function (f) {
      sheet(g, f.sheet);
    });
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
      f.draw(lg);
    });
    ink(g, this.layer, 0.15);
  };

  // The paper's grain: faint flecks, light and dark, the same each time
  var grain;
  function grainOf(g) {
    if (!grain) {
      grain = layerOf(96, 96);
      var gg = grain.getContext('2d');
      var img = gg.createImageData(96, 96);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = rnd(i * 0.37);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v < 0.5 ? 110 : 255;
        img.data[i + 3] = Math.round(Math.abs(v - 0.5) * 70);
      }
      gg.putImageData(img, 0, 0);
    }
    return g.createPattern(grain, 'repeat');
  }

  // A small sheet of paper taped to the wall by its top edge, turned a little: its lower corners curl away from the
  // wall, so its shadow shows most under them, and it has a faint grain
  function sheet(g, p) {
    var w = p.w;
    var h = p.h;
    g.save();
    g.translate(p.x + w / 2, p.y + h / 2);
    g.rotate(p.tilt);
    g.translate(-w / 2, -h / 2);
    g.save();
    g.shadowColor = 'rgba(60, 45, 25, 0.3)';
    g.shadowBlur = 6;
    g.shadowOffsetY = 3;
    g.fillStyle = '#f8eedb';
    g.beginPath();
    g.moveTo(2, 2);
    g.lineTo(w - 2, 2);
    g.lineTo(w - 0.5, h + 2);
    g.quadraticCurveTo(w / 2, h - 4, 0.5, h + 2);
    g.closePath();
    g.fill();
    g.restore();
    var face = g.createLinearGradient(0, 0, w, h);
    face.addColorStop(0, '#fef8ec');
    face.addColorStop(1, '#f9efdc');
    g.fillStyle = face;
    g.fillRect(0, 0, w, h);
    g.fillStyle = grainOf(g);
    g.fillRect(0, 0, w, h);
    var curl = g.createLinearGradient(0, h - 12, 0, h);
    curl.addColorStop(0, 'rgba(120, 95, 60, 0)');
    curl.addColorStop(1, 'rgba(120, 95, 60, 0.07)');
    g.fillStyle = curl;
    g.fillRect(0, h - 12, w, 12);
    g.strokeStyle = 'rgba(150, 125, 90, 0.3)';
    g.lineWidth = 0.5;
    g.strokeRect(0.25, 0.25, w - 0.5, h - 0.5);
    // The tape: a translucent strip across the top edge, its ends torn
    g.translate(w / 2, 0);
    g.rotate(-2.5 * p.tilt);
    g.shadowColor = 'rgba(60, 45, 25, 0.15)';
    g.shadowBlur = 1.5;
    g.shadowOffsetY = 0.5;
    g.fillStyle = 'rgba(218, 210, 186, 0.85)';
    var tw = 13;
    var th = 4.5;
    g.beginPath();
    g.moveTo(-tw, -th);
    g.lineTo(tw, -th);
    g.lineTo(tw - 1.2, -th / 2);
    g.lineTo(tw, 0);
    g.lineTo(tw - 1.2, th / 2);
    g.lineTo(tw, th);
    g.lineTo(-tw, th);
    g.lineTo(-tw + 1.2, th / 2);
    g.lineTo(-tw, 0);
    g.lineTo(-tw + 1.2, -th / 2);
    g.closePath();
    g.fill();
    g.restore();
  }

  // The sheet under the pointer, if any: what a click on its drawing there does, and where the sheet is on the screen
  Pane.prototype.locate = function (e) {
    var box = this.canvas.getBoundingClientRect();
    var x = e.clientX - box.left;
    var y = e.clientY - box.top;
    for (var k = 0; k < this.figures.length; k++) {
      var f = this.figures[k];
      var p = f.sheet;
      // The pointer on the sheet, turned back with it
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
  // second click on a drawing that does not change closes the card. A click between the sheets closes it too
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

  // ---- Cards: beside the sheet, level with the drawing, with what it shows, its key equation and key papers ----

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

  // The sheets go in the open space either side of the text column (the content box's side padding, less a gap)
  function fit() {
    var card = document.querySelector('.main-content > .content-card');
    if (!card) return;
    var cs = getComputedStyle(card);
    var box = card.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    var h = window.innerHeight - top;
    var lw = Math.min(PANE, Math.floor(parseFloat(cs.paddingLeft) - GAP));
    var rw = Math.min(PANE, Math.floor(parseFloat(cs.paddingRight) - GAP));
    if (!panes.length) {
      panes = [
        new Pane('left', [new PredictFigure(), new WorldFigure(), new GridFigure()]),
        new Pane('right', [new OfflineFigure(), new NeedGainFigure(), new WhenFigure()]),
      ];
    }
    note.close();
    panes[0].fit(Math.round(box.left), lw, top, h);
    panes[1].fit(Math.round(box.right) - rw, rw, top, h);
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
