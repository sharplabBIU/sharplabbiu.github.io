// Glass panes along the left and right edges of the window (wider windows only), beside the text column: tall panes of
// glass with figures written on them in dark slate gray and dark red marker, as on a lab's glass board. Left: a decision
// tree, TD and Rescorla–Wagner learning, softmax choice, offline learning from memory. Right: the Bellman equation with
// an individual's world model, need and gain (Mattar & Daw), when to plan (Sharp & Eldar), and task construal in a grid
// world (Ho et al.). Terms with a dotted underline open a note on them, with key papers (on the home page, the terms of
// the Bellman equation also open the matching part of the world-model brain). The tree, the grid's obstacles and the
// softmax curves change when clicked. Two canvases fixed below the header, drawn again only when something changes.
(function () {
  'use strict';

  var SLATE = '#2f4f4f'; // dark slate gray
  var RED = '#8b0000'; // dark red
  var HAND = '"Klee One", "Comic Sans MS", cursive'; // handwriting
  var DW = 230; // the width the figures are drawn at, before scaling to the pane
  var GAP = 16; // between the panes and the text column
  var MIN_SIDE = 190; // the narrowest open space that gets a pane
  var REWARDS = [-2, -1, 0, 1, 2, 3, 4, 5];
  var STRENGTHS = [0.2, 0.45, 0.7, 0.95];

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Notes on the terms: what they are, how they relate to the field's key ideas, and key papers. "wm" names the part of
  // the home page's world-model brain that a term corresponds to
  var LAB = {
    anxiety: ['Sharp 2024, Anxiety involves altered planning (Trends Cogn Sci)', 'https://www.sciencedirect.com/science/article/pii/S1364661324002924'],
    worldModel: ['Sharp et al., A world-model theory of trait anxiety (PsyArXiv)', 'https://osf.io/preprints/psyarxiv/98ktg_v4'],
    direction: ['Sharp & Eldar 2024, forward and backward planning (Nat Hum Behav)', 'https://doi.org/10.1038/s41562-024-01930-8'],
    delay: ['Sharp & Eldar, Humans adaptively delay planning using cognitive maps (PsyArXiv)', 'https://osf.io/preprints/psyarxiv/8ubct_v5'],
    construal: ['Schiff & Sharp, anxiety and task generalization (Top Cogn Sci)', 'https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051'],
  };
  var REF = {
    suttonBarto: ['Sutton & Barto 2018, Reinforcement Learning: An Introduction', 'http://incompleteideas.net/book/the-book-2nd.html'],
    sutton1988: ['Sutton 1988, Learning to predict by the methods of temporal differences', 'https://doi.org/10.1007/BF00115009'],
    schultz: ['Schultz, Dayan & Montague 1997, A neural substrate of prediction and reward', 'https://doi.org/10.1126/science.275.5306.1593'],
    daw2006: ['Daw et al. 2006, Cortical substrates for exploratory decisions in humans', 'https://doi.org/10.1038/nature04766'],
    huys2016: ['Huys, Maia & Frank 2016, Computational psychiatry as a bridge to clinical applications', 'https://doi.org/10.1038/nn.4238'],
    huys2012: ['Huys et al. 2012, Bonsai trees in your head', 'https://doi.org/10.1371/journal.pcbi.1002410'],
    dawDayan: ['Daw & Dayan 2014, The algorithmic anatomy of model-based evaluation', 'https://doi.org/10.1098/rstb.2013.0478'],
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
    tree: {
      title: 'Planning as tree search',
      text:
        'Model-based planning looks ahead through a tree of possible actions (edges) and the states they lead to (nodes), adding up the rewards along each path. Full trees grow too fast to search, so people sample and prune only some branches. Click a leaf to change its reward (shift-click lowers it), an edge to change its causal strength, or a node to sample a path down from it.',
      links: [REF.huys2012, REF.dawDayan, LAB.direction],
    },
    value: {
      title: 'Value, V',
      text:
        'A node’s value is the best total reward reachable from it: each node takes the largest of its children’s values, down to the rewards at the leaves. This backup is the Bellman equation applied to a tree. The ink in each circle fills up with its value.',
      links: [REF.suttonBarto, REF.dawDayan],
    },
    strength: {
      title: 'Causal strength',
      text:
        'How reliably an action brings about the next state, drawn as the width of the edge. Sampling follows strong edges more often, so a path’s chance of being imagined depends on the beliefs about causes, not only on the rewards.',
      links: [REF.huys2012, LAB.worldModel],
    },
    rw: {
      title: 'Rescorla–Wagner rule',
      text:
        'Learning from prediction errors: the value V of a cue moves toward the reward r by a fraction α of the error (r − V). It explains blocking and other conditioning effects, but it treats each trial as one moment, with no notion of what comes next.',
      links: [['Rescorla & Wagner 1972, as covered in Sutton & Barto, ch. 14', REF.suttonBarto[1]]],
    },
    td: {
      title: 'Temporal-difference (TD) learning',
      text:
        'TD learning carries Rescorla–Wagner across time: the error δ compares the reward plus the discounted value of the next state, γV(s′), with the prediction V(s). Values then chain back from rewards to the states and cues that predict them. Dopamine neurons fire like δ.',
      links: [REF.sutton1988, REF.schultz, REF.suttonBarto],
    },
    delta: {
      title: 'Prediction error, δ',
      text: 'What happened (the reward, plus what is now expected) minus what was expected. Learning is driven by surprise: with no error there is nothing to learn.',
      links: [REF.schultz],
    },
    alpha: {
      title: 'Learning rate, α',
      text: 'How far each error moves the estimate, from 0 to 1. A high α follows recent outcomes; a low α averages over many. Models often fit it per person, and sometimes separately for gains and losses.',
      links: [REF.suttonBarto],
    },
    gamma: {
      title: 'Discount factor, γ',
      text: 'How much future value counts against immediate reward, from 0 to 1. Near 0 only the next reward matters; near 1 the far future counts almost as much.',
      links: [REF.suttonBarto],
    },
    softmax: {
      title: 'Softmax choice',
      text:
        'Turns values into choice probabilities: p(a) = e^βQ(a) / Σ e^βQ. With two options it is a logistic curve in the value difference: the bigger the difference, the more reliably the better option is chosen. Click a β on the graph to pick out its curve.',
      links: [REF.daw2006, REF.suttonBarto],
    },
    beta: {
      title: 'Inverse temperature, β',
      text:
        'How strongly values drive choice. With a high β the better option is almost always chosen (exploitation); at β = 0 choice is random. It trades exploration against exploitation and is fit per person in computational psychiatry.',
      links: [REF.daw2006, REF.huys2016],
    },
    dq: {
      title: 'Value difference',
      text: 'Q(a) − Q(b): how much better a is expected to be than b. At 0 the two are chosen equally often, whatever β.',
      links: [REF.suttonBarto],
    },
    offline: {
      title: 'Offline learning',
      text:
        'Learning without new experience, between decisions or during rest, by replaying memories or simulating with a model of the world. It lets a few experiences go a long way, for example updating the value of a route you are not on. Our lab studies how the seconds between choices shape it.',
      links: [REF.dyna, REF.momennejad, ['Offline learning, on our projects page', '/projects/#offline-learning']],
    },
    memory: {
      title: 'Memories of experience',
      text: 'Each experience can be stored as a transition: state, action, reward and next state, (s, a, r, s′). Stored transitions can be learned from again later, as if they had just happened.',
      links: [REF.dyna, REF.mattarDaw],
    },
    replay: {
      title: 'Replay',
      text:
        'Reactivating stored experiences offline, as hippocampal place cells do during rest and pauses, sometimes in reverse order. Each replayed transition updates values as a real one would: a Dyna-style backup.',
      links: [REF.fosterWilson, REF.momennejad, REF.mattarDaw],
    },
    qi: {
      wm: 'tasks',
      title: 'Q for person i',
      text:
        'The value person i expects from taking action a in state s and acting well afterwards, worked out by planning with their own world model. In the brain on the home page this is a task representation: built for the task at hand from the priors and goals above it.',
      links: [REF.dawNivDayan, LAB.worldModel],
    },
    ri: {
      wm: 'goals',
      title: 'Rewards for person i, rᵢ(s)',
      text:
        'What person i finds rewarding or threatening in each state. These come from their intrinsic goals (the goals in the home-page brain), so the same outcome can be worth different amounts to different people.',
      links: [LAB.worldModel],
    },
    pi: {
      wm: 'world',
      title: 'Transitions for person i, pᵢ(s′|s,a)',
      text:
        'Person i’s beliefs about what follows what: where action a leads from state s. They draw on causal knowledge about the world and about the self (what one’s actions can bring about) in the home-page brain. Overstating the chance of harm or understating control changes every plan built on them, as in anxiety.',
      links: [LAB.anxiety, LAB.worldModel],
    },
    max: {
      title: 'The max over a′',
      text:
        'Planning assumes you will choose the best action from the next state on, so the value of (s, a) includes the best value to be had afterwards. This recursion is Bellman’s principle of optimality.',
      links: [REF.suttonBarto],
    },
    indiv: {
      wm: 'model',
      title: 'i: one person’s world model',
      text:
        'The subscript i marks what is particular to one person. The equation is the same for everyone; what differs is the world model it is solved with: the transition beliefs pᵢ and the rewards rᵢ. The brain on the home page shows such a world model, and how biases in it, as in trait anxiety, reshape the tasks built from it.',
      links: [LAB.worldModel, LAB.anxiety],
    },
    evb: {
      title: 'Expected value of backup',
      text:
        'Mattar and Daw’s answer to which memory to replay, or which step to plan, next: the one whose update is expected to improve future reward the most. It factors into Gain × Need, and it reproduces forward replay before choices and reverse replay after rewards in the hippocampus.',
      links: [REF.mattarDaw],
    },
    gain: {
      title: 'Gain',
      text:
        'How much better you would act in state sₖ after the update: the change in the policy there, weighted by the new action values. Gain is high after a surprise, such as an unexpected reward or a new obstacle.',
      links: [REF.mattarDaw],
    },
    need: {
      title: 'Need',
      text:
        'How often you expect to be in state sₖ from now on, discounted by how far ahead: the successor representation of where you are. Need is high for the states just ahead, which favours planning forward before acting.',
      links: [REF.mattarDaw, REF.dayan1993, LAB.direction],
    },
    when: {
      title: 'When to plan',
      text:
        'In a three-step task, people could take control and plan the next move, or relinquish it: a random move plus a small sure reward. Planning paid only where it could find a way to the goal; elsewhere it was better to delay. People learned to delay planning adaptively, and a meta-controller that searches a cognitive map of the task explained this better than one that learns from outcomes.',
      links: [LAB.delay, REF.callaway, ['Planning efficiency, on our projects page', '/projects/#planning-efficiency']],
    },
    vtake: {
      title: 'Values of taking and relinquishing control',
      text:
        'Taking control is worth the goal reward R_g discounted over the Δ = 3 − d steps still to go, if planning found an action that reaches the goal (otherwise 0). Relinquishing is worth the sure reward of 1, plus the discounted goal reward when both actions reach the goal.',
      links: [LAB.delay],
    },
    pn: {
      title: 'What planning found, p⁽ⁿ⁾',
      text:
        'The probability that a limited number of rollouts over the cognitive map found n = 0, 1 or 2 actions that reach the goal. The chance of each control choice mixes the softmax of its value over these outcomes.',
      links: [LAB.delay, REF.lieder],
    },
    construal: {
      title: 'Task construal',
      text:
        'To plan, people build a simplified representation of the task, leaving out what hardly matters. In mazes, they attend to and remember the obstacles that change the best route and ignore the rest. We ask how anxiety distorts construals. Click an obstacle to add it to the construal or leave it out.',
      links: [REF.ho2022, LAB.anxiety, LAB.construal],
    },
    vor: {
      title: 'Value of representation',
      text:
        'VOR(c) = U(π_c) − C(c): how well the plan made with construal c does in the real task, minus the cost of representing c (each obstacle adds to it). The best construal balances the two, so obstacles that do not change the plan are ignored.',
      links: [REF.ho2022, REF.lieder],
    },
  };

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // A steady pseudo-random number for a seed, so hand-drawn wobbles stay the same each time the panes are drawn
  function rnd(n) {
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function jit(seed) {
    return [0, 1, 2, 3, 4, 5].map(function (k) {
      return rnd(seed * 7.13 + k);
    });
  }

  function signed(v) {
    return v > 0 ? '+' + v : v < 0 ? '−' + -v : '0';
  }

  function choose(weights) {
    var sum = 0;
    var i;
    for (i = 0; i < weights.length; i++) sum += weights[i];
    var u = Math.random() * sum;
    for (i = 0; i < weights.length; i++) {
      u -= weights[i];
      if (u <= 0) return i;
    }
    return weights.length - 1;
  }

  function stepIn(list, value, down) {
    var i = list.indexOf(value);
    if (i < 0) i = 0;
    return list[(i + (down ? list.length - 1 : 1)) % list.length];
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

  function distance(c, x, y) {
    var best = Infinity;
    for (var i = 0; i <= 20; i++) {
      var p = at(c, i / 20);
      best = Math.min(best, Math.hypot(p.x - x, p.y - y));
    }
    return best;
  }

  // Marker strokes: along a curve, wobbling a little from side to side as a hand does
  function marker(g, c, j, t0, t1) {
    t0 = t0 || 0;
    t1 = t1 === undefined ? 1 : t1;
    g.beginPath();
    for (var i = 0; i <= 16; i++) {
      var t = t0 + ((t1 - t0) * i) / 16;
      var p = at(c, t);
      var a = heading(c, t) + Math.PI / 2;
      var off = 0.8 * (0.6 * Math.sin(2 * Math.PI * (t * (1 + j[0]) + j[1])) + 0.4 * Math.sin(2 * Math.PI * (t * (2.5 + j[2]) + j[3])));
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

  // A line with an arrowhead at its end
  function arrowLine(g, ax, ay, bx, by) {
    var c = straight(ax, ay, bx, by);
    marker(g, c, jit(ax + ay * 2 + bx * 3 + by * 5));
    chevron(g, c, 1, 5);
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

  // Wipes the glass clear under a shape, so lines drawn earlier do not show through it
  function wipe(g, fn) {
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 1;
    fn();
    g.fill();
    g.restore();
  }

  // Handwriting. Text runs: "Q_{i}" puts i below the line, "γ^{t}" puts t above it
  function runs(str) {
    var out = [];
    var re = /([_^])\{([^}]*)\}/g;
    var last = 0;
    var m;
    while ((m = re.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index), s: 0 });
      out.push({ t: m[2], s: m[1] === '_' ? -1 : 1 });
      last = re.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last), s: 0 });
    return out;
  }

  function fontFor(size, s) {
    return '600 ' + (s ? size * 0.66 : size).toFixed(2) + 'px ' + HAND;
  }

  function measure(g, str, size) {
    var w = 0;
    runs(str).forEach(function (r) {
      g.font = fontFor(size, r.s);
      w += g.measureText(r.t).width;
    });
    return w;
  }

  // Writes in marker (the letters thickened by tracing their outlines with the nib); returns where the text ends
  function write(g, str, x, y, size) {
    g.save();
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    runs(str).forEach(function (r) {
      g.font = fontFor(size, r.s);
      g.lineWidth = size * (r.s ? 0.05 : 0.07);
      var dy = r.s < 0 ? size * 0.3 : r.s > 0 ? -size * 0.38 : 0;
      g.strokeText(r.t, x, y + dy);
      g.fillText(r.t, x, y + dy);
      x += g.measureText(r.t).width;
    });
    g.restore();
    return x;
  }

  // A line of text made of parts: strings, or [string, note] for a term that opens a note (dotted underline). Starts
  // at x, or is centred on x when centred
  function say(api, parts, x, y, size, color, centred) {
    var g = api.g;
    var total = 0;
    parts.forEach(function (p) {
      total += measure(g, typeof p === 'string' ? p : p[0], size);
    });
    if (centred) x -= total / 2;
    g.strokeStyle = g.fillStyle = color || SLATE;
    parts.forEach(function (p) {
      var str = typeof p === 'string' ? p : p[0];
      var w = measure(g, str, size);
      write(g, str, x, y, size);
      if (typeof p !== 'string') {
        g.save();
        g.globalAlpha = 0.75;
        g.lineWidth = 1.1;
        g.setLineDash([1.2, 2.6]);
        g.beginPath();
        g.moveTo(x + 1, y + size * 0.62);
        g.lineTo(x + w - 1, y + size * 0.62);
        g.stroke();
        g.restore();
        api.hot(x - 2, y - size * 0.7, w + 4, size * 1.5, { note: p[1] });
      }
      x += w;
    });
    return x;
  }

  // A figure's heading, in dark red
  function title(api, parts) {
    say(api, parts, DW / 2, 9, 12.5, RED, true);
  }

  function layerOf(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Lays a layer of ink (already in its colours) on the glass: first its shadow on the wall behind, then the ink, then
  // a darker rim where the wet ink pools at the edges and a gloss along their upper left
  function ink(g, layer, rim, gloss) {
    var off = layer.width * 2 + 50; // the layer is drawn off the canvas so only its shadow lands
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.shadowColor = 'rgba(15, 50, 50, 0.22)';
    g.shadowBlur = 2.5 * dpr;
    g.shadowOffsetX = off + 2.5 * dpr;
    g.shadowOffsetY = 3.5 * dpr;
    g.drawImage(layer, -off, 0);
    g.restore();

    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.94;
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
    var shine = layerOf(layer.width, layer.height);
    var sg = shine.getContext('2d');
    sg.drawImage(core, 0, 0);
    sg.globalCompositeOperation = 'destination-out';
    sg.drawImage(core, r, r);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = 'rgba(255, 255, 255, ' + gloss + ')';
    sg.fillRect(0, 0, shine.width, shine.height);
    g.drawImage(shine, 0, 0);
    g.restore();
  }

  // ---- Figures. Each is drawn at width DW from y = 0 down to its height h; hit(x, y) says what a click there does ----

  // A decision tree: two branches from the root (dark slate gray and dark red), leaves with rewards, edges as wide as
  // their causal strength. Click a leaf to change its reward, an edge its strength, a node to sample a path from it
  function TreeFigure() {
    this.h = 150;
    this.lit = [];
    this.end = null;
    var root = (this.root = this.node(null, SLATE));
    var first = Math.floor(Math.random() * 2);
    this.node(root, first ? SLATE : RED);
    this.node(root, first ? RED : SLATE);
    var want = 4 + Math.floor(Math.random() * 2);
    for (var tries = 0; tries < 40 && this.leaves().length < want; tries++) {
      var open = this.leaves().filter(function (n) {
        return n.depth < 3;
      });
      if (!open.length) break;
      var n = open[
        choose(
          open.map(function (m) {
            return 4 - m.depth;
          })
        )
      ];
      this.node(n, n.color);
      this.node(n, n.color);
    }
    this.backup(root);
    this.layout();
  }

  TreeFigure.prototype.node = function (parent, color) {
    var n = { parent: parent, kids: [], depth: parent ? parent.depth + 1 : 0, color: color, w: pick(STRENGTHS), r: pick(REWARDS) };
    n.v = n.r;
    n.j = [0, 0, 0, 0, 0, 0].map(Math.random);
    if (parent) parent.kids.push(n);
    return n;
  };

  TreeFigure.prototype.each = function (fn) {
    (function walk(n) {
      fn(n);
      n.kids.forEach(walk);
    })(this.root);
  };

  TreeFigure.prototype.leaves = function () {
    var out = [];
    this.each(function (n) {
      if (n.depth > 0 && !n.kids.length) out.push(n);
    });
    return out;
  };

  TreeFigure.prototype.backup = function (n) {
    var self = this;
    n.v = n.kids.length
      ? Math.max.apply(
          null,
          n.kids.map(function (k) {
            return self.backup(k);
          })
        )
      : n.r;
    return n.v;
  };

  TreeFigure.prototype.layout = function () {
    var order = this.leaves();
    var step = Math.min(150 / order.length, 34);
    var x0 = DW / 2 - (step * (order.length - 1)) / 2;
    order.forEach(function (n, i) {
      n.x = x0 + i * step;
    });
    (function place(n) {
      n.y = 34 + n.depth * 27;
      if (n.kids.length) {
        n.kids.forEach(place);
        n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      }
    })(this.root);
  };

  TreeFigure.prototype.draw = function (api) {
    var g = api.g;
    var lit = this.lit;
    title(api, ['planning: a ', ['decision tree', 'tree']]);
    this.each(function (n) {
      if (!n.parent) return;
      var on = lit.indexOf(n) >= 0;
      var c = curve(n.parent.x, n.parent.y, n.x, n.y);
      var width = 1.4 + 2.2 * n.w;
      g.strokeStyle = n.color;
      if (on) {
        g.globalAlpha = 0.2;
        g.lineWidth = width + 7;
        marker(g, c, n.j);
      }
      g.globalAlpha = on ? 1 : 0.55 + 0.4 * n.w;
      g.lineWidth = width + (on ? 1 : 0);
      marker(g, c, n.j);
      g.lineWidth = 1.5;
      chevron(g, c, 0.62, 3.6 + 1.6 * n.w);
    });
    g.globalAlpha = 1;
    var self = this;
    this.each(function (n) {
      g.strokeStyle = g.fillStyle = n.color;
      if (n.kids.length) {
        var r = n.parent ? 4.8 : 6.5;
        wipe(g, function () {
          g.beginPath();
          g.arc(n.x, n.y, r + 0.6, 0, Math.PI * 2);
        });
        var full = clamp((n.v + 2) / 7, 0, 1);
        if (full > 0) {
          g.save();
          g.beginPath();
          g.arc(n.x, n.y, r, 0, Math.PI * 2);
          g.clip();
          g.globalAlpha = 0.55;
          g.fillRect(n.x - r, n.y + r - 2 * r * full, 2 * r, 2 * r * full);
          g.restore();
        }
        g.lineWidth = n.parent ? 1.7 : 2;
        circle(g, n.x, n.y, r, n.j);
      } else {
        var s = 8.5;
        wipe(g, function () {
          g.beginPath();
          g.rect(n.x - s / 2 - 1, n.y - s / 2 - 1, s + 2, s + 2);
        });
        rect(g, n.x - s / 2, n.y - s / 2, s, s, n.j);
        g.globalAlpha = 0.12 + 0.7 * clamp((n.r + 2) / 7, 0, 1);
        g.fill();
        g.globalAlpha = 1;
        g.lineWidth = 1.6;
        g.stroke();
        say(api, [signed(n.r)], n.x, n.y + 13, 11, SLATE, true);
      }
    });
    if (this.end) {
      g.strokeStyle = this.end.color;
      g.lineWidth = 1.5;
      circle(g, this.end.x, this.end.y, 9, this.end.j);
    }
    var root = this.root;
    say(api, [['V', 'value'], ' ' + signed(root.v)], root.x + 11, root.y, 11.5);
    say(api, ['s'], root.x - 18, root.y, 12);
    say(api, ['edge width: ', ['causal strength', 'strength']], DW / 2, self.h - 6, 10, SLATE, true);
  };

  TreeFigure.prototype.hit = function (x, y) {
    var self = this;
    var found = null;
    var near = 9;
    this.each(function (n) {
      var leaf = !n.kids.length;
      var d = Math.hypot(n.x - x, n.y - y);
      if (leaf && Math.abs(n.x - x) < 9 && y > n.y - 7 && y < n.y + 19) d = Math.min(d, 1);
      if (d < near) {
        near = d;
        found = n;
      }
    });
    if (found) {
      var n = found;
      if (!n.kids.length) {
        return {
          tip: 'Reward ' + signed(n.r) + ': click to raise it, shift-click to lower it',
          act: function (down) {
            n.r = stepIn(REWARDS, n.r, down);
            self.backup(self.root);
          },
        };
      }
      return {
        tip: (n.parent ? 'Value ' : 'V ') + signed(n.v) + ': click to sample a path from here',
        act: function () {
          self.sample(n);
        },
      };
    }
    near = 5;
    this.each(function (m) {
      if (!m.parent) return;
      var d = distance(curve(m.parent.x, m.parent.y, m.x, m.y), x, y);
      if (d < near) {
        near = d;
        found = m;
      }
    });
    if (found) {
      var e = found;
      return {
        tip: 'Causal strength ' + e.w.toFixed(2) + ': click to strengthen it, shift-click to weaken it',
        act: function (down) {
          e.w = stepIn(STRENGTHS, e.w, down);
        },
      };
    }
    return null;
  };

  // A path down from a node, choosing among the children by causal strength and value
  TreeFigure.prototype.sample = function (n) {
    this.lit = [];
    while (n.kids.length) {
      n = n.kids[
        choose(
          n.kids.map(function (k) {
            return k.w * Math.exp(0.45 * k.v);
          })
        )
      ];
      this.lit.push(n);
    }
    this.end = n;
  };

  TreeFigure.prototype.clear = function () {
    this.lit = [];
    this.end = null;
  };

  // TD learning against the Rescorla–Wagner rule
  function LearningFigure() {
    this.h = 96;
  }

  LearningFigure.prototype.draw = function (api) {
    title(api, ['learning: ', ['TD', 'td'], ' vs ', ['Rescorla–Wagner', 'rw']]);
    var x = 14;
    say(api, [['RW', 'rw'], ':   V ← V + ', ['α', 'alpha'], ['(r − V)', 'delta']], x, 32, 12.5);
    say(api, [['TD', 'td'], ':   ', ['δ', 'delta'], ' = r + ', ['γ', 'gamma'], 'V(s′) − V(s)'], x, 54, 12.5);
    say(api, ['          V(s) ← V(s) + αδ'], x, 74, 12.5);
    say(api, ['TD adds what comes next: γV(s′)'], DW / 2, 91, 10, RED, true);
  };

  // Softmax choice between a and b, for three inverse temperatures. Click a β to pick out its curve
  function SoftmaxFigure() {
    this.h = 148;
    this.betas = [0.5, 1, 3];
    this.pick = 2;
    this.box = { x: 42, y: 44, w: 150, h: 78 };
  }

  SoftmaxFigure.prototype.draw = function (api) {
    var g = api.g;
    var b = this.box;
    title(api, ['choice: ', ['softmax', 'softmax']]);
    say(api, ['p(a) = 1 / (1 + e^{−β[Q(a) − Q(b)]})'], DW / 2, 27, 11.5, SLATE, true);
    g.strokeStyle = SLATE;
    g.lineWidth = 1.5;
    arrowLine(g, b.x, b.y + b.h, b.x + b.w + 8, b.y + b.h);
    arrowLine(g, b.x, b.y + b.h, b.x, b.y - 6);
    g.lineWidth = 1;
    g.globalAlpha = 0.5;
    g.setLineDash([2, 3]);
    g.beginPath();
    g.moveTo(b.x, b.y);
    g.lineTo(b.x + b.w, b.y);
    g.moveTo(b.x + b.w / 2, b.y);
    g.lineTo(b.x + b.w / 2, b.y + b.h);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
    say(api, ['1'], b.x - 8, b.y, 10, SLATE, true);
    say(api, ['0'], b.x - 8, b.y + b.h, 10, SLATE, true);
    say(api, ['p(a)'], b.x - 22, b.y + b.h / 2, 10.5, SLATE, true);
    say(api, ['0'], b.x + b.w / 2, b.y + b.h + 9, 10, SLATE, true);
    say(api, [['Q(a) − Q(b)', 'dq']], b.x + b.w / 2, b.y + b.h + 21, 10.5, SLATE, true);
    var self = this;
    this.betas.forEach(function (beta, k) {
      var on = k === self.pick;
      var pts = [];
      for (var i = 0; i <= 24; i++) {
        var d = -4 + (8 * i) / 24;
        pts.push([b.x + (b.w * i) / 24, b.y + b.h - b.h / (1 + Math.exp(-beta * d))]);
      }
      g.strokeStyle = on ? RED : SLATE;
      g.globalAlpha = on ? 1 : 0.6;
      g.lineWidth = on ? 2.6 : 1.6;
      for (var p = 1; p < pts.length; p++) marker(g, straight(pts[p - 1][0], pts[p - 1][1], pts[p][0], pts[p][1]), jit(k * 31 + p));
      g.globalAlpha = 1;
      var ly = b.y - 2 + k * 15;
      say(api, [['β', 'beta'], ' = ' + beta], b.x + b.w + 6, ly + 16, 10.5, on ? RED : SLATE);
    });
  };

  SoftmaxFigure.prototype.hit = function (x, y) {
    var b = this.box;
    var self = this;
    for (var k = 0; k < this.betas.length; k++) {
      var ly = b.y - 2 + k * 15 + 16;
      if (x > b.x + b.w + 4 && x < b.x + b.w + 50 && Math.abs(y - ly) < 7) {
        var kk = k;
        return {
          tip: 'Pick out the curve for β = ' + this.betas[k],
          act: function () {
            self.pick = kk;
          },
        };
      }
    }
    return null;
  };

  // Offline learning: experience goes into memory, and memories replayed at rest update the values
  function OfflineFigure() {
    this.h = 120;
  }

  OfflineFigure.prototype.draw = function (api) {
    var g = api.g;
    title(api, [['offline learning', 'offline'], ' from memory']);
    var boxes = [
      { x: 16, y: 26, w: 84, label: 'experience' },
      { x: 130, y: 26, w: 84, label: ['memory', 'memory'] },
      { x: 130, y: 66, w: 84, label: ['replay', 'replay'] },
      { x: 16, y: 66, w: 84, label: 'values Q' },
    ];
    boxes.forEach(function (bx, k) {
      g.strokeStyle = k === 2 ? RED : SLATE;
      g.lineWidth = 1.6;
      rect(g, bx.x, bx.y, bx.w, 24, jit(k * 11 + 3));
      g.stroke();
      say(api, [bx.label], bx.x + bx.w / 2, bx.y + 12, 11, k === 2 ? RED : SLATE, true);
    });
    g.strokeStyle = SLATE;
    g.lineWidth = 1.5;
    arrowLine(g, 102, 38, 127, 38);
    g.strokeStyle = RED;
    arrowLine(g, 172, 52, 172, 63);
    arrowLine(g, 128, 78, 103, 78);
    g.strokeStyle = SLATE;
    arrowLine(g, 58, 64, 58, 53);
    say(api, ['at rest'], 172, 96, 9.5, RED, true);
    say(api, ['each replayed (s,a,r,s′): Q ← Q + αδ'], DW / 2, 112, 10.5, SLATE, true);
  };

  // The Bellman equation for one person's world model
  function BellmanFigure() {
    this.h = 98;
  }

  BellmanFigure.prototype.draw = function (api) {
    title(api, ['planning with ', ['person i’s world model', 'indiv']]);
    say(api, [['Q_{i}(s,a)', 'qi'], ' = ', ['r_{i}(s)', 'ri']], 12, 34, 13);
    say(api, ['+ ', ['γ', 'gamma'], ' Σ_{s′} ', ['p_{i}(s′|s,a)', 'pi'], ' ', ['max', 'max'], '_{a′} ', ['Q_{i}(s′,a′)', 'qi']], DW / 2, 58, 11.5, SLATE, true);
    say(api, [['i', 'indiv'], ': one person’s world model, as in the brain'], DW / 2, 82, 10, RED, true);
    say(api, ['on our home page'], DW / 2, 95, 10, RED, true);
  };

  // Need and gain: which step to replay or plan next (Mattar & Daw)
  function NeedGainFigure() {
    this.h = 104;
  }

  NeedGainFigure.prototype.draw = function (api) {
    title(api, ['how to plan: ', ['need × gain', 'evb']]);
    say(api, [['EVB', 'evb'], '(s_{k}) = ', ['Gain', 'gain'], ' × ', ['Need', 'need']], DW / 2, 32, 13, SLATE, true);
    say(api, [['Gain', 'gain'], ' = Σ_{a} [π_{new} − π_{old}](a|s_{k}) Q_{new}(s_{k},a)'], DW / 2, 56, 10.5, SLATE, true);
    say(api, [['Need', 'need'], ' = Σ_{t} ', ['γ', 'gamma'], '^{t} P(s_{t} = s_{k})'], DW / 2, 78, 11.5, SLATE, true);
    say(api, ['replay where it helps most (Mattar & Daw)'], DW / 2, 98, 9.5, RED, true);
  };

  // When to plan: take control and plan now, or relinquish it (Sharp & Eldar)
  function WhenFigure() {
    this.h = 112;
  }

  WhenFigure.prototype.draw = function (api) {
    title(api, [['when to plan', 'when'], ' (Sharp & Eldar)']);
    say(api, [['V_{take}', 'vtake'], ' = R_{g} ', ['γ', 'gamma'], '^{Δ}     Δ = 3 − d'], 14, 32, 12);
    say(api, [['V_{relinquish}', 'vtake'], ' = 1  (+ R_{g} γ^{Δ})'], 14, 53, 12);
    say(api, ['P(ã) = Σ_{n} ', ['p^{(n)}', 'pn'], ' ', ['σ', 'softmax'], '(Q^{(n)}(ã))'], 14, 76, 12);
    say(api, ['plan now (take control), or delay?'], DW / 2, 102, 10, RED, true);
  };

  // A grid world: a plan to the goal made with a construal that keeps only some obstacles (Ho et al.). Click an
  // obstacle to add it to the construal or leave it out; the plan is made again, and fails if it runs into one left out
  function GridFigure() {
    this.h = 174;
    this.cols = 8;
    this.rows = 6;
    this.cell = 17;
    this.x0 = (DW - 8 * 17) / 2;
    this.y0 = 22;
    this.start = [0, 5];
    this.goal = [7, 5];
    this.obstacles = [
      { cells: [[3, 2], [3, 3], [3, 4], [3, 5]], on: true },
      { cells: [[5, 3], [6, 3]], on: false },
      { cells: [[6, 0], [7, 0]], on: false },
      { cells: [[0, 0], [1, 0]], on: false },
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

  GridFigure.prototype.draw = function (api) {
    var g = api.g;
    var self = this;
    var s = this.cell;
    title(api, [['task construal', 'construal'], ' in a grid world']);
    g.strokeStyle = SLATE;
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
        g.strokeStyle = g.fillStyle = SLATE;
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
    g.strokeStyle = RED;
    g.lineWidth = 2.2;
    var pts = this.path.map(function (k) {
      var p = self.cellXY(k[0], k[1]);
      return [p[0] + s / 2, p[1] + s / 2];
    });
    poly(g, pts);
    for (var i = 2; i < pts.length; i += 3) {
      g.lineWidth = 1.5;
      chevron(g, straight(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]), 0.6, 4);
    }
    this.crashes.forEach(function (k) {
      var p = self.cellXY(k[0], k[1]);
      g.strokeStyle = RED;
      g.lineWidth = 2.4;
      line(g, p[0] + 3, p[1] + 3, p[0] + s - 3, p[1] + s - 3);
      line(g, p[0] + s - 3, p[1] + 3, p[0] + 3, p[1] + s - 3);
    });
    var sp = this.cellXY(this.start[0], this.start[1]);
    var gp = this.cellXY(this.goal[0], this.goal[1]);
    say(api, ['S'], sp[0] + s / 2, sp[1] + s / 2, 11, SLATE, true);
    say(api, ['G'], gp[0] + s / 2, gp[1] + s / 2, 11, RED, true);
    var kept = this.obstacles.filter(function (o) {
      return o.on;
    }).length;
    var y = this.y0 + this.rows * s;
    say(api, [['VOR', 'vor'], '(c) = U(π_{c}) − C(c)'], DW / 2, y + 16, 11.5, SLATE, true);
    say(
      api,
      [kept + ' of ' + this.obstacles.length + ' obstacles kept: ' + (this.crashes.length ? 'the plan runs into one ✗' : (this.path.length - 1) + ' steps ✓')],
      DW / 2,
      y + 34,
      9.5,
      RED,
      true
    );
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
      tip: o.on ? 'Obstacle in the construal: click to leave it out' : 'Obstacle left out of the construal: click to keep it',
      act: function () {
        o.on = !o.on;
        self.plan();
      },
    };
  };

  // ---- Panes ----

  function Pane(side, figures) {
    this.side = side;
    this.figures = figures;
    this.on = false;
    this.hots = [];
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'glass-pane';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d');
    var self = this;
    this.canvas.addEventListener('click', function (e) {
      e.stopPropagation();
      self.click(self.target(e), e);
    });
    this.canvas.addEventListener('mousemove', function (e) {
      var t = self.target(e);
      self.canvas.style.cursor = t ? 'pointer' : 'default';
      var tip = t ? t.tip || 'Click for a note on ' + NOTES[t.note].title : '';
      if (self.canvas.title !== tip) self.canvas.title = tip;
    });
  }

  // The pane runs the full height of the canvas against the window's edge, as wide as the open space allows; the
  // figures are scaled to fit it and spread down it
  Pane.prototype.fit = function (x, w, top, h) {
    this.on = w >= MIN_SIDE && h >= 360;
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
    this.w = w;
    this.h = h;
    var pw = w - 4;
    this.pane = { x: this.side === 'left' ? 0 : w - pw, w: pw };
    var sum = 0;
    this.figures.forEach(function (f) {
      sum += f.h;
    });
    var pad = 16;
    var scale = Math.min(1.3, (pw - 18) / DW, (h - 2 * pad - 18 * (this.figures.length - 1)) / sum);
    var gap = clamp((h - 2 * pad - sum * scale) / (this.figures.length - 1), 10, 70);
    var y = (h - (sum * scale + gap * (this.figures.length - 1))) / 2;
    var x0 = this.pane.x + (pw - DW * scale) / 2;
    this.figures.forEach(function (f) {
      f.at = { x: x0, y: y, s: scale };
      y += f.h * scale + gap;
    });
    this.draw();
  };

  Pane.prototype.draw = function () {
    var g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawGlass();
    var lg = this.layer.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.clearRect(0, 0, this.layer.width, this.layer.height);
    lg.lineCap = 'round';
    lg.lineJoin = 'round';
    var hots = (this.hots = []);
    this.figures.forEach(function (f) {
      var a = f.at;
      lg.setTransform(dpr * a.s, 0, 0, dpr * a.s, dpr * a.x, dpr * a.y);
      lg.globalAlpha = 1;
      f.draw({
        g: lg,
        hot: function (x, y, w, h, t) {
          hots.push({ x: a.x + x * a.s, y: a.y + y * a.s, w: w * a.s, h: h * a.s, t: t });
        },
      });
    });
    ink(g, this.layer, 0.28, 0.4);
  };

  // A tall pane of glass against the window's edge, faintly cyan, its cut edge a little green, with a soft shadow on
  // the wall behind it, toward the text
  Pane.prototype.drawGlass = function () {
    var g = this.g;
    var p = this.pane;
    g.save();
    g.shadowColor = 'rgba(20, 60, 60, 0.18)';
    g.shadowBlur = 14;
    g.shadowOffsetX = this.side === 'left' ? 3 : -3;
    g.shadowOffsetY = 4;
    var tint = g.createLinearGradient(p.x, 0, p.x + p.w, this.h);
    tint.addColorStop(0, 'rgba(234, 249, 249, 0.96)');
    tint.addColorStop(1, 'rgba(214, 238, 238, 0.96)');
    g.fillStyle = tint;
    g.fillRect(p.x, 0, p.w, this.h);
    g.restore();
    g.strokeStyle = 'rgba(40, 110, 100, 0.35)';
    g.lineWidth = 1;
    g.beginPath();
    var edge = this.side === 'left' ? p.x + p.w - 0.5 : p.x + 0.5;
    g.moveTo(edge, 0);
    g.lineTo(edge, this.h);
    g.stroke();
  };

  // What a click at the pointer does: a term's note, else the figure's own action there
  Pane.prototype.target = function (e) {
    var box = this.canvas.getBoundingClientRect();
    var x = e.clientX - box.left;
    var y = e.clientY - box.top;
    for (var i = 0; i < this.hots.length; i++) {
      var h = this.hots[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        var t = h.t;
        t.rect = { x: box.left + h.x, y: box.top + h.y, w: h.w, h: h.h };
        return t;
      }
    }
    for (var k = 0; k < this.figures.length; k++) {
      var f = this.figures[k];
      if (!f.hit) continue;
      var a = f.at;
      var fx = (x - a.x) / a.s;
      var fy = (y - a.y) / a.s;
      if (fx < 0 || fy < 0 || fx > DW || fy > f.h) continue;
      var hit = f.hit(fx, fy);
      if (hit) return hit;
    }
    return null;
  };

  Pane.prototype.click = function (t, e) {
    if (t && t.note) {
      note.open(t.note, t.rect, this.side);
      return;
    }
    note.close();
    if (t && t.act) {
      t.act(e.shiftKey);
    } else {
      this.figures.forEach(function (f) {
        if (f.clear) f.clear();
      });
    }
    this.draw();
  };

  // ---- Notes: a card beside the term, with what it is, how it relates to the field and key papers ----

  var note = {
    el: null,
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
      var html = '<button type="button" class="gn-close" aria-label="Close">×</button><strong></strong><p></p>';
      this.el.innerHTML = html;
      this.el.querySelector('strong').textContent = n.title;
      this.el.querySelector('p').textContent = n.text;
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
      var w = this.el.offsetWidth;
      var h = this.el.offsetHeight;
      var left = side === 'left' ? at.x + at.w + 12 : at.x - w - 12;
      left = clamp(left, 8, window.innerWidth - w - 8);
      var top = clamp(at.y - 12, 8, window.innerHeight - h - 8);
      this.el.style.left = left + 'px';
      this.el.style.top = top + 'px';
      // On the home page, the Bellman equation's terms also open their part of the world-model brain
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
    },
  };

  // ---- Set up ----

  var panes = [];

  // The open space either side of the text column: the content box's side padding, less a gap
  function fit() {
    var card = document.querySelector('.main-content > .content-card');
    if (!card) return;
    var cs = getComputedStyle(card);
    var box = card.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    var h = window.innerHeight - top;
    var lw = Math.floor(parseFloat(cs.paddingLeft) - GAP);
    var rw = Math.floor(parseFloat(cs.paddingRight) - GAP);
    if (!panes.length) {
      panes = [
        new Pane('left', [new TreeFigure(), new LearningFigure(), new SoftmaxFigure(), new OfflineFigure()]),
        new Pane('right', [new BellmanFigure(), new NeedGainFigure(), new WhenFigure(), new GridFigure()]),
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
  if (document.fonts && document.fonts.load) {
    document.fonts.load('600 12px "Klee One"', 'sVQγδαβπσΣΔ′ã⁽⁾').then(function () {
      panes.forEach(function (p) {
        if (p.on) p.draw();
      });
    });
  }
})();
