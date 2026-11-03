// Decision trees in the open space on either side of the text column (wider windows only), in dark slate gray and
// dark red, drawn on two canvases fixed behind the content, below the header. Each side has a column of narrow trees,
// one under another, linked by the transitions from one tree's leaves to the next tree's root (s₀, s₁, ...). The trees
// keep their shape; what changes is on them.
// Value: the reward at each leaf, how full each node is (its backed-up value) and V beside each root.
// Sampling: a dot runs down a sampled path, lighting it up (the arrows on the edges give the direction of sampling),
// then carries the leaf's reward back up; from the leaf linked to the next tree it also runs on down the link.
// Causal strength: the width of each edge, which grows on the paths sampled and fades on the others, settling back
// over time. Now and then a leaf's reward changes, and the values and the links to the next tree follow it.
(function () {
  'use strict';

  var COLORS = ['#2f4f4f', '#8b0000']; // dark slate gray and dark red, one for each branch from a root
  var INK = '#2f4f4f'; // dark slate gray: roots and labels
  var FONT = '600 9.5px Inter, "Helvetica Neue", Arial, sans-serif';
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  var DEPTH = 3; // levels below the root
  var GAP = 16; // between the trees and the text column
  var MIN_SIDE = 120; // the narrowest open space that gets trees
  var MAX_SPAN = 120; // the widest a tree gets
  var REWARDS = [-2, -1, 0, 1, 2, 3, 4, 5];
  var VMIN = -2;
  var VMAX = 5;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  // Exponential approach to a target, at a rate per second
  function ease(cur, target, rate, dt) {
    return target + (cur - target) * Math.exp(-rate * dt);
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  // How full a node is drawn for a value
  function level(v) {
    return clamp((v - VMIN) / (VMAX - VMIN), 0, 1);
  }

  function signed(v, digits) {
    var s = Math.abs(v).toFixed(digits);
    if (Number(s) === 0) return s;
    return (v > 0 ? '+' : '−') + s;
  }

  function subscript(k) {
    return String(k)
      .split('')
      .map(function (d) {
        return SUB[d];
      })
      .join('');
  }

  // A random index, in proportion to the weights
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

  // Cubic curve from a parent down to a child: straight down out of the parent, straight down into the child
  function curve(ax, ay, bx, by) {
    var m = (by - ay) * 0.55;
    return [ax, ay, ax, ay + m, bx, by - m, bx, by];
  }

  function at(c, t) {
    var u = 1 - t;
    var a = u * u * u;
    var b = 3 * u * u * t;
    var d = 3 * u * t * t;
    var e = t * t * t;
    return { x: a * c[0] + b * c[2] + d * c[4] + e * c[6], y: a * c[1] + b * c[3] + d * c[5] + e * c[7] };
  }

  function heading(c, t) {
    var u = 1 - t;
    var dx = 3 * u * u * (c[2] - c[0]) + 6 * u * t * (c[4] - c[2]) + 3 * t * t * (c[6] - c[4]);
    var dy = 3 * u * u * (c[3] - c[1]) + 6 * u * t * (c[5] - c[3]) + 3 * t * t * (c[7] - c[5]);
    return Math.atan2(dy, dx);
  }

  function stroke(g, c) {
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    g.stroke();
  }

  // Arrowhead at t along a curve, pointing along it
  function arrow(g, c, t, size) {
    var p = at(c, t);
    var a = heading(c, t);
    g.save();
    g.translate(p.x, p.y);
    g.rotate(a);
    g.beginPath();
    g.moveTo(size, 0);
    g.lineTo(-size * 0.8, size * 0.75);
    g.lineTo(-size * 0.8, -size * 0.75);
    g.closePath();
    g.fill();
    g.restore();
  }

  // Tree nodes; a node fades in where it stands
  function Node(parent, color) {
    this.parent = parent;
    this.kids = [];
    this.depth = parent ? parent.depth + 1 : 0;
    this.color = color;
    this.w0 = rand(0.3, 0.9); // causal strength of the edge from the parent, at rest
    this.w = this.w0; // and as it is now
    this.r = pick(REWARDS); // reward, at a leaf
    this.v = this.r; // value, backed up from the leaves
    this.vs = this.r; // value as drawn, easing to v
    this.x = this.tx = 0;
    this.y = this.ty = 0;
    this.a = 0; // opacity
    this.hot = 0; // highlight of the edge from the parent, after a sample runs down it
    if (parent) parent.kids.push(this);
  }

  Node.prototype.each = function (fn) {
    fn(this);
    this.kids.forEach(function (k) {
      k.each(fn);
    });
  };

  // One tree: a root with a dark slate gray branch and a dark red one, and as many leaves as the width allows
  function Tree(forest, k, now) {
    this.forest = forest;
    this.k = k;
    this.root = new Node(null, INK);
    this.walking = false;
    this.nextSample = now + rand(0.4, 3.5);
    this.nextShift = now + rand(5, 12);
    this.lx = this.ly = this.mx = this.my = null; // where the links to the next tree start, easing to the leaves
    var max = forest.maxLeaves;
    var first = Math.floor(Math.random() * COLORS.length);
    for (var i = 0; i < 2; i++) new Node(this.root, COLORS[(first + i) % COLORS.length]);
    var want = Math.round(rand(Math.max(3, max * 0.7), max));
    for (var tries = 0; tries < 40 && this.leaves().length < want; tries++) {
      var open = this.leaves().filter(function (n) {
        return n.depth < DEPTH;
      });
      if (!open.length) break;
      var n = open[
        choose(
          open.map(function (m) {
            return 4 - m.depth;
          })
        )
      ];
      new Node(n, n.color);
      new Node(n, n.color);
    }
    this.backup(this.root);
  }

  Tree.prototype.leaves = function () {
    var out = [];
    this.root.each(function (n) {
      if (n.depth > 0 && !n.kids.length) out.push(n);
    });
    return out;
  };

  // Values from the leaves up: a leaf's reward, or the best of the node's children
  Tree.prototype.backup = function (n) {
    n.v = n.kids.length
      ? Math.max.apply(
          null,
          n.kids.map(function (k) {
            return this.backup(k);
          }, this)
        )
      : n.r;
    n.vs = n.v;
    return n.v;
  };

  // Leaves evenly spaced across the span, each parent centred over its children
  Tree.prototype.layout = function (cx, span, y0, gy) {
    var order = this.leaves();
    var step = Math.min(span / Math.max(order.length, 1), 26);
    var x0 = cx - (step * (order.length - 1)) / 2;
    order.forEach(function (n, i) {
      n.tx = x0 + i * step;
    });
    (function place(n) {
      n.ty = y0 + n.depth * gy;
      if (n.kids.length) {
        n.kids.forEach(place);
        n.tx = (n.kids[0].tx + n.kids[n.kids.length - 1].tx) / 2;
      }
    })(this.root);
  };

  // A path down the tree, choosing among the children by causal strength and value
  Tree.prototype.sample = function () {
    var path = [this.root];
    var n = this.root;
    while (n.kids.length) {
      n = n.kids[
        choose(
          n.kids.map(function (k) {
            return k.w * Math.exp(0.45 * k.v);
          })
        )
      ];
      path.push(n);
    }
    return path;
  };

  // The leaves the links to the next tree start from: the best leaf, and the second best
  Tree.prototype.exits = function () {
    return this.leaves().sort(function (a, b) {
      return b.v - a.v;
    });
  };

  Tree.prototype.update = function (dt, now) {
    this.root.each(function (n) {
      n.x = ease(n.x, n.tx, 4, dt);
      n.y = ease(n.y, n.ty, 4, dt);
      n.a = ease(n.a, 1, 3, dt);
      n.vs = ease(n.vs, n.v, 3, dt);
      n.w = ease(n.w, n.w0, 0.04, dt);
      n.hot = Math.max(0, n.hot - dt / 3);
    });
    if (this.forest.trees[this.k + 1]) {
      var exits = this.exits();
      var second = exits[1] || exits[0];
      this.exit = exits[0];
      this.lcol = exits[0].color;
      this.mcol = second.color;
      this.lx = this.lx === null ? exits[0].x : ease(this.lx, exits[0].x, 4, dt);
      this.ly = this.ly === null ? exits[0].y : ease(this.ly, exits[0].y, 4, dt);
      this.mx = this.mx === null ? second.x : ease(this.mx, second.x, 4, dt);
      this.my = this.my === null ? second.y : ease(this.my, second.y, 4, dt);
    }
    if (now >= this.nextShift) {
      this.shift();
      this.nextShift = now + rand(6, 12);
    }
    if (now >= this.nextSample && !this.walking) {
      this.start();
      this.nextSample = now + rand(2.2, 4.5);
    }
  };

  // A leaf's reward changes (the label flashes); the values above it follow as the tree is sampled
  Tree.prototype.shift = function () {
    var leaf = pick(this.leaves());
    var r = leaf.r;
    while (r === leaf.r) r = pick(REWARDS);
    leaf.r = leaf.v = r;
    this.forest.pulses.push({ x: leaf.x, y: leaf.y, color: leaf.color, t: 0 });
  };

  Tree.prototype.start = function () {
    this.walking = true;
    this.forest.add({ kind: 'down', tree: this, path: this.sample(), i: 0, t: 0 });
  };

  // One side of the text column
  function Forest(side) {
    this.side = side;
    this.trees = [];
    this.walkers = [];
    this.pulses = [];
    this.first = 0;
    this.on = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dtree';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d');
  }

  Forest.prototype.fit = function (x, w, top, h, first, now) {
    this.on = w >= MIN_SIDE && h >= 200;
    this.canvas.style.display = this.on ? 'block' : 'none';
    if (!this.on) return;
    var s = this.canvas.style;
    s.left = x + 'px';
    s.top = top + 'px';
    s.width = w + 'px';
    s.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.w = w;
    this.h = h;
    this.first = first;
    this.span = Math.min(w - 24, MAX_SPAN);
    this.maxLeaves = clamp(Math.floor(this.span / 24), 3, 5);
    var count = Math.max(1, Math.floor((h - 16) / 180));
    this.block = (h - 16) / count;
    this.gy = clamp((this.block - 72) / DEPTH, 22, 46);
    var fresh = count !== this.trees.length;
    if (fresh) {
      this.trees = [];
      this.walkers = [];
      for (var k = 0; k < count; k++) this.trees.push(new Tree(this, k, now));
    }
    this.trees.forEach(this.place, this);
    // new trees start in place and fade in
    if (fresh) {
      this.trees.forEach(function (t) {
        t.root.each(function (n) {
          n.x = n.tx;
          n.y = n.ty;
        });
      });
    }
  };

  Forest.prototype.place = function (tree) {
    tree.layout(this.w / 2, this.span, 8 + tree.k * this.block + 20, this.gy);
  };

  // Snap to the layout, for a still picture
  Forest.prototype.settle = function () {
    this.trees.forEach(function (t) {
      t.root.each(function (n) {
        n.x = n.tx;
        n.y = n.ty;
        n.a = 1;
        n.vs = n.v;
      });
      t.update(0, -1);
    });
  };

  // A new moving dot (those started while the dots are being moved join them afterwards)
  Forest.prototype.add = function (wk) {
    (this.adding || this.walkers).push(wk);
  };

  Forest.prototype.update = function (dt, now) {
    this.trees.forEach(function (t) {
      t.update(dt, now);
    });
    this.adding = [];
    this.walkers = this.walkers
      .filter(function (wk) {
        return this.step(wk, dt);
      }, this)
      .concat(this.adding);
    this.adding = null;
    this.pulses = this.pulses.filter(function (p) {
      p.t += dt / 0.9;
      return p.t < 1;
    });
  };

  // Moves a dot along; false once it has finished
  Forest.prototype.step = function (wk, dt) {
    wk.t += dt * (wk.kind === 'down' ? 2.4 : wk.kind === 'up' ? 4 : 1.3);
    if (wk.t < 1) return true;
    wk.t = 0;
    var path = wk.path;
    var tree = wk.tree;
    if (wk.kind === 'down') {
      path[wk.i + 1].hot = 1;
      wk.i++;
      if (wk.i < path.length - 1) return true;
      this.arrive(wk);
      return false;
    }
    if (wk.kind === 'up') {
      var m = path[path.length - 2 - wk.i];
      m.v += 0.5 * (wk.g - m.v);
      wk.i++;
      if (wk.i < path.length - 1) return true;
      tree.walking = false;
      return false;
    }
    var next = this.trees[tree.k + 1];
    if (next && !next.walking) next.start();
    return false;
  };

  // A sample has reached a leaf: the edges it took get stronger and their siblings weaker, the reward goes back up
  // the tree, and from the leaf linked to the next tree a dot runs on down the link
  Forest.prototype.arrive = function (wk) {
    var path = wk.path;
    var leaf = path[path.length - 1];
    var g = leaf.r;
    this.pulses.push({ x: leaf.x, y: leaf.y, color: leaf.color, t: 0 });
    path.slice(1).forEach(function (n) {
      n.w += (g >= 1 ? 0.2 : 0.06) * (1 - n.w);
      n.parent.kids.forEach(function (s) {
        if (s !== n) s.w = Math.max(0.15, s.w * 0.93);
      });
    });
    this.add({ kind: 'up', tree: wk.tree, path: path, i: 0, t: 0, g: g, color: leaf.color });
    if (leaf === wk.tree.exit && this.trees[wk.tree.k + 1]) {
      this.add({ kind: 'link', tree: wk.tree, t: 0, color: leaf.color });
    }
  };

  Forest.prototype.draw = function (now) {
    var g = this.g;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    this.trees.forEach(function (t) {
      this.drawLinks(t, now);
    }, this);
    this.trees.forEach(this.drawEdges, this);
    this.trees.forEach(this.drawNodes, this);
    this.walkers.forEach(this.drawWalker, this);
    this.pulses.forEach(function (p) {
      g.globalAlpha = 0.8 * (1 - p.t);
      g.strokeStyle = p.color;
      g.lineWidth = 1.3;
      g.beginPath();
      g.arc(p.x, p.y, 4 + 12 * p.t, 0, Math.PI * 2);
      g.stroke();
    });
    g.globalAlpha = 1;
  };

  // (starting below the leaf's reward)
  Forest.prototype.linkCurve = function (t, second) {
    var next = this.trees[t.k + 1];
    return curve(second ? t.mx : t.lx, (second ? t.my : t.ly) + 19, next.root.x, next.root.y);
  };

  // Links to the next tree: dashes flowing down from the best leaf, and fainter ones from the second best
  Forest.prototype.drawLinks = function (t, now) {
    if (!this.trees[t.k + 1] || t.lx === null) return;
    var g = this.g;
    [true, false].forEach(function (second) {
      var c = this.linkCurve(t, second);
      g.strokeStyle = g.fillStyle = second ? t.mcol : t.lcol;
      g.globalAlpha = second ? 0.3 : 0.6;
      g.lineWidth = second ? 0.9 : 1.3;
      g.setLineDash(second ? [2, 5] : [4, 5]);
      g.lineDashOffset = -now * (second ? 10 : 16);
      stroke(g, c);
      g.setLineDash([]);
      arrow(g, c, 0.86, second ? 2.6 : 3.4);
    }, this);
  };

  // Edges: width and depth of colour for causal strength, an arrow for the direction of sampling, and a glow on
  // the paths just sampled
  Forest.prototype.drawEdges = function (t) {
    var g = this.g;
    t.root.each(function (n) {
      if (!n.parent || n.a < 0.01) return;
      var c = curve(n.parent.x, n.parent.y, n.x, n.y);
      var width = 0.6 + 1.7 * n.w;
      g.strokeStyle = g.fillStyle = n.color;
      if (n.hot > 0) {
        g.globalAlpha = 0.18 * n.hot * n.a;
        g.lineWidth = width + 4.5;
        stroke(g, c);
      }
      g.globalAlpha = n.a * Math.max(0.3 + 0.45 * n.w, n.hot);
      g.lineWidth = width + n.hot;
      stroke(g, c);
      arrow(g, c, 0.6, 2.2 + 1.2 * n.w + 0.8 * n.hot);
    });
  };

  // Nodes: each filled to its value; leaves square, with their reward under them; roots labelled s with V beside
  Forest.prototype.drawNodes = function (t) {
    var g = this.g;
    var label = this.first + t.k;
    g.font = FONT;
    g.textBaseline = 'middle';
    t.root.each(function (n) {
      if (n.a < 0.01) return;
      var root = !n.parent;
      g.lineWidth = root ? 1.5 : 1.2;
      g.strokeStyle = n.color;
      if (n.kids.length) {
        var r = root ? 5.2 : 3.9;
        g.globalAlpha = n.a;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(n.x, n.y, r, 0, Math.PI * 2);
        g.fill();
        g.save();
        g.clip();
        g.fillStyle = n.color;
        g.globalAlpha = n.a * 0.6;
        var full = level(n.vs);
        g.fillRect(n.x - r, n.y + r - 2 * r * full, 2 * r, 2 * r * full);
        g.restore();
        g.stroke();
      } else {
        var s = 7;
        g.globalAlpha = n.a;
        g.fillStyle = '#ffffff';
        g.fillRect(n.x - s / 2, n.y - s / 2, s, s);
        g.fillStyle = n.color;
        g.globalAlpha = n.a * (0.15 + 0.75 * level(n.r));
        g.fillRect(n.x - s / 2, n.y - s / 2, s, s);
        g.globalAlpha = n.a;
        g.strokeRect(n.x - s / 2, n.y - s / 2, s, s);
        g.fillStyle = INK;
        g.globalAlpha = n.a * 0.85;
        g.textAlign = 'center';
        g.fillText(signed(n.r, 0), n.x, n.y + 12);
      }
      if (root) {
        g.globalAlpha = n.a * 0.85;
        g.fillStyle = INK;
        g.textAlign = 'right';
        g.fillText('s' + subscript(label), n.x - 9, n.y);
        g.textAlign = 'left';
        g.fillText('V ' + signed(n.vs, 1), n.x + 9, n.y);
      }
    });
  };

  // The moving dots: down a sampled path (with a short trail), back up carrying the reward, or along a link
  Forest.prototype.drawWalker = function (wk) {
    var g = this.g;
    var p;
    var c;
    var col = wk.color;
    if (wk.kind === 'down') {
      var a = wk.path[wk.i];
      var b = wk.path[wk.i + 1];
      c = curve(a.x, a.y, b.x, b.y);
      col = b.color;
      for (var j = 4; j >= 1; j--) {
        var tt = smooth(wk.t) - 0.07 * j;
        if (tt < 0) continue;
        p = at(c, tt);
        g.globalAlpha = 0.55 - 0.1 * j;
        g.fillStyle = col;
        g.beginPath();
        g.arc(p.x, p.y, 3 - 0.4 * j, 0, Math.PI * 2);
        g.fill();
      }
      p = at(c, smooth(wk.t));
    } else if (wk.kind === 'up') {
      var L = wk.path.length;
      var lo = wk.path[L - 1 - wk.i];
      var hi = wk.path[L - 2 - wk.i];
      c = curve(hi.x, hi.y, lo.x, lo.y);
      p = at(c, 1 - smooth(wk.t));
      g.globalAlpha = 1;
      g.fillStyle = '#ffffff';
      g.strokeStyle = col;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.font = FONT;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(signed(wk.g, 0), p.x + 6, p.y - 1);
      return;
    } else {
      if (!this.trees[wk.tree.k + 1] || wk.tree.lx === null) return;
      c = this.linkCurve(wk.tree, false);
      p = at(c, smooth(wk.t));
    }
    var glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11);
    glow.addColorStop(0, col);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = 0.55;
    g.fillStyle = glow;
    g.beginPath();
    g.arc(p.x, p.y, 11, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = col;
    g.beginPath();
    g.arc(p.x, p.y, 3.3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    g.fill();
  };

  // Set up

  var sides = [];
  var running = false;
  var last = 0;

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
    var now = performance.now() / 1000;
    if (!sides.length) sides = [new Forest('left'), new Forest('right')];
    sides[0].fit(Math.round(box.left), lw, top, h, 0, now);
    sides[1].fit(Math.round(box.right) - rw, rw, top, h, sides[0].on ? sides[0].trees.length : 0, now);
    if (reduce) {
      sides.forEach(function (f) {
        if (!f.on) return;
        f.settle();
        f.draw(0);
      });
    } else if (!running && (sides[0].on || sides[1].on)) {
      running = true;
      last = now;
      requestAnimationFrame(frame);
    }
  }

  function frame(ms) {
    var now = ms / 1000;
    var gap = now - last;
    var dt = Math.min(0.05, Math.max(0, gap));
    last = now;
    // after a pause (a hidden tab, say), the trees carry on where they were rather than all changing at once
    if (gap > 0.25) {
      sides.forEach(function (f) {
        f.trees.forEach(function (t) {
          t.nextSample += gap;
          t.nextShift += gap;
        });
      });
    }
    var any = false;
    sides.forEach(function (f) {
      if (!f.on) return;
      any = true;
      f.update(dt, now);
      f.draw(now);
    });
    if (any) requestAnimationFrame(frame);
    else running = false;
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
