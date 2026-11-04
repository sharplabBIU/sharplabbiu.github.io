// Decision trees in the open space on either side of the text column (wider windows only), written in dark slate gray
// and dark red marker on a tall pane of glass, as on a lab's glass board: two canvases fixed below the header beside
// the content. Each side has a column of narrow trees, one under another, linked by the transitions from one tree's
// best two leaves to the next tree's root (s₀, s₁, ...). The strokes are a little wobbly, as drawn by hand, wet and
// glossy, with a darker rim where the ink pools and a faint shadow on the wall behind the glass.
// Value: the reward at each leaf, how full each node is (its value: the best reward below it) and V beside each root.
// Edge width is causal strength, and the arrows give the direction of sampling.
// The trees stay still until clicked:
//   a leaf: raise its reward (shift-click: lower it); the values above it and the links to the next tree follow
//   an edge: strengthen it (shift-click: weaken it)
//   a node or root: sample a path down from it, by causal strength and value, and light it up; when the path reaches
//     a leaf linked to the next tree, it carries on down the link and through that tree
//   anywhere else on the trees: put the lit path out
(function () {
  'use strict';

  var COLORS = ['#2f4f4f', '#8b0000']; // dark slate gray and dark red, one for each branch from a root
  var INK = '#2f4f4f'; // dark slate gray: roots and labels
  var HAND = '"Klee One", "Comic Sans MS", cursive'; // handwriting, for the labels
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  var DEPTH = 3; // levels below the root
  var GAP = 16; // between the trees and the text column
  var MIN_SIDE = 120; // the narrowest open space that gets trees
  var MAX_SPAN = 120; // the widest a tree gets
  var REWARDS = [-2, -1, 0, 1, 2, 3, 4, 5];
  var STRENGTHS = [0.2, 0.45, 0.7, 0.95]; // causal strength, in the steps a click moves it
  var VMIN = -2;
  var VMAX = 5;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  // How full a node is drawn for a value
  function level(v) {
    return clamp((v - VMIN) / (VMAX - VMIN), 0, 1);
  }

  function signed(v) {
    return v > 0 ? '+' + v : v < 0 ? '−' + -v : '0';
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

  // The next step up or down a list of steps, going round
  function stepIn(list, value, down) {
    var i = list.indexOf(value);
    if (i < 0) {
      i = 0;
      while (i < list.length - 1 && list[i] < value) i++;
    }
    return list[(i + (down ? list.length - 1 : 1)) % list.length];
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

  // How close a point is to a curve
  function distance(c, x, y) {
    var best = Infinity;
    for (var i = 0; i <= 20; i++) {
      var p = at(c, i / 20);
      best = Math.min(best, Math.hypot(p.x - x, p.y - y));
    }
    return best;
  }

  // A marker stroke along a curve, wobbling a little from side to side as a hand does (the wobble is the node's own,
  // so it stays the same each time the trees are drawn)
  function marker(g, c, j, t0, t1) {
    t0 = t0 || 0;
    t1 = t1 === undefined ? 1 : t1;
    var steps = 16;
    g.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = t0 + ((t1 - t0) * i) / steps;
      var p = at(c, t);
      var a = heading(c, t) + Math.PI / 2;
      var off = 0.9 * (0.6 * Math.sin(2 * Math.PI * (t * (1 + j[0]) + j[1])) + 0.4 * Math.sin(2 * Math.PI * (t * (2.5 + j[2]) + j[3])));
      var x = p.x + off * Math.cos(a);
      var y = p.y + off * Math.sin(a);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
  }

  // Dashes in marker along a curve, each its own short stroke
  function dashes(g, c, j, dash, gap) {
    var len = 0;
    var prev = at(c, 0);
    var marks = [0];
    for (var i = 1; i <= 60; i++) {
      var p = at(c, i / 60);
      len += Math.hypot(p.x - prev.x, p.y - prev.y);
      marks.push(len);
      prev = p;
    }
    function tAt(d) {
      for (var k = 1; k < marks.length; k++) if (marks[k] >= d) return (k - 1 + (d - marks[k - 1]) / (marks[k] - marks[k - 1] || 1)) / 60;
      return 1;
    }
    for (var d = 0; d < len * 0.9; d += dash + gap) marker(g, c, j, tAt(d), tAt(Math.min(d + dash, len * 0.9)));
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

  // A square drawn by hand, its corners a little off
  function square(g, x, y, s, j) {
    var h = s / 2;
    var pts = [
      [x - h + (j[0] - 0.5), y - h + (j[1] - 0.5)],
      [x + h + (j[2] - 0.5), y - h + (j[3] - 0.5)],
      [x + h + (j[4] - 0.5), y + h + (j[5] - 0.5)],
      [x - h + (j[1] - 0.5), y + h + (j[0] - 0.5)],
    ];
    g.beginPath();
    pts.forEach(function (p, i) {
      if (i) g.lineTo(p[0], p[1]);
      else g.moveTo(p[0], p[1]);
    });
    g.closePath();
    return pts;
  }

  // Handwriting in marker: the letters thickened by tracing their outlines with the nib
  function write(g, str, x, y, size, align) {
    g.font = '600 ' + size + 'px ' + HAND;
    g.textAlign = align || 'left';
    g.lineWidth = size * 0.07;
    g.strokeText(str, x, y);
    g.fillText(str, x, y);
  }

  function layerOf(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Lays the layer of ink (already in its colours) on the glass: first its shadow on the wall behind, then the ink,
  // then a darker rim where the wet ink pools at the edges and a gloss along their upper left
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
    // the ink pulled in from its edges by about a pixel
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

  function Node(parent, color) {
    this.parent = parent;
    this.kids = [];
    this.depth = parent ? parent.depth + 1 : 0;
    this.color = color;
    this.w = pick(STRENGTHS); // causal strength of the edge from the parent
    this.r = pick(REWARDS); // reward, at a leaf
    this.v = this.r; // value: the best reward below
    this.x = 0;
    this.y = 0;
    this.j = [0, 0, 0, 0, 0, 0].map(Math.random); // its own wobble, for drawing it by hand
    if (parent) parent.kids.push(this);
  }

  Node.prototype.each = function (fn) {
    fn(this);
    this.kids.forEach(function (k) {
      k.each(fn);
    });
  };

  // One tree: a root with a dark slate gray branch and a dark red one, and as many leaves as the width allows
  function Tree(forest, k) {
    this.forest = forest;
    this.k = k;
    this.root = new Node(null, INK);
    var max = forest.maxLeaves;
    var first = Math.floor(Math.random() * COLORS.length);
    for (var i = 0; i < 2; i++) new Node(this.root, COLORS[(first + i) % COLORS.length]);
    var want = Math.round(Math.max(3, max * 0.7) + Math.random() * (max - Math.max(3, max * 0.7)));
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
    return n.v;
  };

  // Leaves evenly spaced across the span, each parent centred over its children
  Tree.prototype.layout = function (cx, span, y0, gy) {
    var order = this.leaves();
    var step = Math.min(span / Math.max(order.length, 1), 26);
    var x0 = cx - (step * (order.length - 1)) / 2;
    order.forEach(function (n, i) {
      n.x = x0 + i * step;
    });
    (function place(n) {
      n.y = y0 + n.depth * gy;
      if (n.kids.length) {
        n.kids.forEach(place);
        n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      }
    })(this.root);
  };

  // The leaves the links to the next tree start from: the best leaf, and the second best
  Tree.prototype.exits = function () {
    var leaves = this.leaves().sort(function (a, b) {
      return b.v - a.v;
    });
    return [leaves[0], leaves[1] || leaves[0]];
  };

  // One side of the text column
  function Forest(side) {
    this.side = side;
    this.trees = [];
    this.lit = []; // nodes whose edge from the parent is on the lit path
    this.litLinks = []; // [tree, which link (0 best, 1 second best)] on the lit path
    this.ends = []; // leaves where the lit path stops in each tree
    this.first = 0;
    this.on = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dtree';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d');
    var self = this;
    this.canvas.addEventListener('click', function (e) {
      self.click(self.hit(e), e.shiftKey);
    });
    this.canvas.addEventListener('mousemove', function (e) {
      var h = self.hit(e);
      self.canvas.style.cursor = h ? 'pointer' : 'default';
      var tip = h ? self.tip(h) : '';
      if (self.canvas.title !== tip) self.canvas.title = tip;
    });
  }

  Forest.prototype.fit = function (x, w, top, h, first) {
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
    var pw = Math.min(w - 12, this.span + 52);
    this.pane = { x: Math.round((w - pw) / 2), y: 6, w: Math.round(pw), h: h - 12 };
    this.layer = layerOf(this.canvas.width, this.canvas.height);
    this.maxLeaves = clamp(Math.floor(this.span / 24), 3, 5);
    var count = Math.max(1, Math.floor((h - 16) / 180));
    var block = (h - 16) / count;
    var gy = clamp((block - 72) / DEPTH, 22, 46);
    if (count !== this.trees.length) {
      this.trees = [];
      this.clear();
      for (var k = 0; k < count; k++) this.trees.push(new Tree(this, k));
    }
    this.trees.forEach(function (t) {
      t.layout(w / 2, this.span, 8 + t.k * block + 20, gy);
    }, this);
    this.draw();
  };

  // What is under the pointer: a node (or a leaf, its reward included), else an edge
  Forest.prototype.hit = function (e) {
    var box = this.canvas.getBoundingClientRect();
    var x = e.clientX - box.left;
    var y = e.clientY - box.top;
    var found = null;
    var near = 9;
    this.trees.forEach(function (t) {
      t.root.each(function (n) {
        var leaf = !n.kids.length;
        var d = Math.hypot(n.x - x, n.y - y);
        if (leaf && Math.abs(n.x - x) < 9 && y > n.y - 7 && y < n.y + 18) d = Math.min(d, 1);
        if (d < near) {
          near = d;
          found = { kind: !n.parent ? 'root' : leaf ? 'leaf' : 'node', node: n, tree: t };
        }
      });
    });
    if (found) return found;
    near = 5;
    this.trees.forEach(function (t) {
      t.root.each(function (n) {
        if (!n.parent) return;
        var d = distance(curve(n.parent.x, n.parent.y, n.x, n.y), x, y);
        if (d < near) {
          near = d;
          found = { kind: 'edge', node: n, tree: t };
        }
      });
    });
    return found;
  };

  Forest.prototype.tip = function (h) {
    var n = h.node;
    if (h.kind === 'leaf') return 'Reward ' + signed(n.r) + ': click to raise it, shift-click to lower it';
    if (h.kind === 'edge') {
      return 'Causal strength ' + n.w.toFixed(2) + ': click to strengthen it, shift-click to weaken it';
    }
    if (h.kind === 'root') return 's' + subscript(this.first + h.tree.k) + ', V ' + signed(n.v) + ': click to sample a path';
    return 'Value ' + signed(n.v) + ': click to sample a path from here';
  };

  Forest.prototype.click = function (h, down) {
    if (!h) {
      this.clear();
    } else if (h.kind === 'leaf') {
      h.node.r = stepIn(REWARDS, h.node.r, down);
      h.tree.backup(h.tree.root);
    } else if (h.kind === 'edge') {
      h.node.w = stepIn(STRENGTHS, h.node.w, down);
    } else {
      this.clear();
      this.sample(h.tree, h.node);
    }
    this.draw();
  };

  Forest.prototype.clear = function () {
    this.lit = [];
    this.litLinks = [];
    this.ends = [];
  };

  // A path down from a node, choosing among the children by causal strength and value; from a leaf linked to the next
  // tree it carries on down the link and through that tree
  Forest.prototype.sample = function (tree, n) {
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
    this.ends.push(n);
    var next = this.trees[tree.k + 1];
    var which = tree.exits().indexOf(n);
    if (next && which >= 0) {
      this.litLinks.push([tree, which]);
      this.sample(next, next.root);
    }
  };

  Forest.prototype.draw = function () {
    var g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawGlass();
    var lg = this.layer.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.clearRect(0, 0, this.layer.width, this.layer.height);
    lg.setTransform(dpr, 0, 0, dpr, 0, 0);
    lg.lineCap = 'round';
    lg.lineJoin = 'round';
    this.trees.forEach(function (t) {
      this.drawLinks(lg, t);
    }, this);
    this.trees.forEach(function (t) {
      this.drawEdges(lg, t);
    }, this);
    this.trees.forEach(function (t) {
      this.drawNodes(lg, t);
    }, this);
    this.ends.forEach(function (n) {
      lg.globalAlpha = 1;
      lg.strokeStyle = n.color;
      lg.lineWidth = 1.5;
      circle(lg, n.x, n.y, 9, n.j);
    });
    ink(g, this.layer, 0.28, 0.4);
  };

  // A tall pane of glass, faintly cyan, with its cut edge a little green and a soft shadow on the wall behind it
  Forest.prototype.drawGlass = function () {
    var g = this.g;
    var p = this.pane;
    g.save();
    g.shadowColor = 'rgba(20, 60, 60, 0.18)';
    g.shadowBlur = 14;
    g.shadowOffsetX = 3;
    g.shadowOffsetY = 6;
    var tint = g.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    tint.addColorStop(0, 'rgba(234, 249, 249, 0.95)');
    tint.addColorStop(1, 'rgba(214, 238, 238, 0.95)');
    g.fillStyle = tint;
    g.fillRect(p.x, p.y, p.w, p.h);
    g.restore();
    g.strokeStyle = 'rgba(40, 110, 100, 0.35)';
    g.lineWidth = 1;
    g.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  };

  // Links to the next tree: dashed, from the best leaf, and fainter from the second best (starting below the reward)
  Forest.prototype.drawLinks = function (g, t) {
    var next = this.trees[t.k + 1];
    if (!next) return;
    var exits = t.exits();
    [1, 0].forEach(function (which) {
      var leaf = exits[which];
      var lit = this.litLinks.some(function (l) {
        return l[0] === t && l[1] === which;
      });
      var c = curve(leaf.x, leaf.y + 20, next.root.x, next.root.y - 8);
      g.strokeStyle = leaf.color;
      g.globalAlpha = lit ? 1 : which ? 0.45 : 0.8;
      g.lineWidth = lit ? 2.4 : which ? 1.3 : 1.7;
      if (lit) {
        g.globalAlpha = 0.2;
        g.lineWidth = 7;
        marker(g, c, leaf.j);
        g.globalAlpha = 1;
        g.lineWidth = 2.4;
      }
      dashes(g, c, leaf.j, lit ? 7 : which ? 2.5 : 5, lit ? 3 : 5);
      chevron(g, c, 0.93, lit ? 5 : 4);
    }, this);
  };

  // Edges: width for causal strength, a chevron for the direction of sampling, and a wide wash of ink under the lit
  // path, as a highlighter would leave
  Forest.prototype.drawEdges = function (g, t) {
    var lit = this.lit;
    t.root.each(function (n) {
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
  };

  // Nodes: circles wiped clear inside and filled with ink to their value; leaves squares, shaded by their reward,
  // with it written under them; roots labelled s with V beside them
  Forest.prototype.drawNodes = function (g, t) {
    var label = this.first + t.k;
    g.textBaseline = 'middle';
    t.root.each(function (n) {
      var root = !n.parent;
      g.globalAlpha = 1;
      g.strokeStyle = g.fillStyle = n.color;
      if (n.kids.length) {
        var r = root ? 6.5 : 4.8;
        g.globalCompositeOperation = 'destination-out';
        g.beginPath();
        g.arc(n.x, n.y, r + 0.6, 0, Math.PI * 2);
        g.fill();
        g.globalCompositeOperation = 'source-over';
        var full = level(n.v);
        if (full > 0) {
          g.save();
          g.beginPath();
          g.arc(n.x, n.y, r, 0, Math.PI * 2);
          g.clip();
          g.globalAlpha = 0.55;
          g.fillRect(n.x - r, n.y + r - 2 * r * full, 2 * r, 2 * r * full);
          g.restore();
        }
        g.lineWidth = root ? 2 : 1.7;
        circle(g, n.x, n.y, r, n.j);
      } else {
        var s = 8.5;
        g.globalCompositeOperation = 'destination-out';
        g.fillRect(n.x - s / 2 - 1, n.y - s / 2 - 1, s + 2, s + 2);
        g.globalCompositeOperation = 'source-over';
        square(g, n.x, n.y, s, n.j);
        g.globalAlpha = 0.12 + 0.7 * level(n.r);
        g.fill();
        g.globalAlpha = 1;
        g.lineWidth = 1.6;
        g.stroke();
        g.strokeStyle = g.fillStyle = INK;
        write(g, signed(n.r), n.x, n.y + 14, 11.5, 'center');
      }
      if (root) {
        g.strokeStyle = g.fillStyle = INK;
        write(g, 's', n.x - 18, n.y - 1, 12.5, 'right');
        write(g, String(label), n.x - 17, n.y + 4, 8.5, 'left');
        write(g, 'V ' + signed(n.v), n.x + 11, n.y, 11.5, 'left');
      }
    });
  };

  // Set up

  var sides = [];

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
    if (!sides.length) sides = [new Forest('left'), new Forest('right')];
    sides[0].fit(Math.round(box.left), lw, top, h, 0);
    sides[1].fit(Math.round(box.right) - rw, rw, top, h, sides[0].on ? sides[0].trees.length : 0);
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('600 12px "Klee One"', 's V+−0123456789').then(function () {
      sides.forEach(function (f) {
        if (f.on) f.draw();
      });
    });
  }
})();
