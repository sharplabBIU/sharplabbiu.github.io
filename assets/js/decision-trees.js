// Decision trees in the open space on either side of the text column (wider windows only), in dark slate gray and
// dark red, drawn on two canvases fixed below the header beside the content. Each side has a column of narrow trees,
// one under another, linked by the transitions from one tree's best two leaves to the next tree's root (s₀, s₁, ...).
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
  var FONT = '600 9.5px Inter, "Helvetica Neue", Arial, sans-serif';
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

  function stroke(g, c) {
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    g.stroke();
  }

  // Arrowhead at t along a curve, pointing along it
  function arrow(g, c, t, size) {
    var p = at(c, t);
    g.save();
    g.translate(p.x, p.y);
    g.rotate(heading(c, t));
    g.beginPath();
    g.moveTo(size, 0);
    g.lineTo(-size * 0.8, size * 0.75);
    g.lineTo(-size * 0.8, -size * 0.75);
    g.closePath();
    g.fill();
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
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    this.trees.forEach(this.drawLinks, this);
    this.trees.forEach(this.drawEdges, this);
    this.trees.forEach(this.drawNodes, this);
    this.ends.forEach(function (n) {
      g.globalAlpha = 0.8;
      g.strokeStyle = n.color;
      g.lineWidth = 1.3;
      g.beginPath();
      g.arc(n.x, n.y, 8, 0, Math.PI * 2);
      g.stroke();
    });
    g.globalAlpha = 1;
  };

  // Links to the next tree: dashed, from the best leaf, and fainter from the second best (starting below the reward)
  Forest.prototype.drawLinks = function (t) {
    var next = this.trees[t.k + 1];
    if (!next) return;
    var g = this.g;
    var exits = t.exits();
    [1, 0].forEach(function (which) {
      var leaf = exits[which];
      var lit = this.litLinks.some(function (l) {
        return l[0] === t && l[1] === which;
      });
      var c = curve(leaf.x, leaf.y + 19, next.root.x, next.root.y);
      g.strokeStyle = g.fillStyle = leaf.color;
      g.globalAlpha = lit ? 1 : which ? 0.3 : 0.6;
      g.lineWidth = lit ? 2 : which ? 0.9 : 1.3;
      g.setLineDash(lit ? [6, 3] : which ? [2, 5] : [4, 5]);
      stroke(g, c);
      g.setLineDash([]);
      arrow(g, c, 0.86, lit ? 4 : which ? 2.6 : 3.4);
    }, this);
  };

  // Edges: width and depth of colour for causal strength, an arrow for the direction of sampling, and a glow on
  // the lit path
  Forest.prototype.drawEdges = function (t) {
    var g = this.g;
    var lit = this.lit;
    t.root.each(function (n) {
      if (!n.parent) return;
      var on = lit.indexOf(n) >= 0;
      var c = curve(n.parent.x, n.parent.y, n.x, n.y);
      var width = 0.6 + 1.7 * n.w;
      g.strokeStyle = g.fillStyle = n.color;
      if (on) {
        g.globalAlpha = 0.2;
        g.lineWidth = width + 4.5;
        stroke(g, c);
      }
      g.globalAlpha = on ? 1 : 0.3 + 0.45 * n.w;
      g.lineWidth = width + (on ? 1 : 0);
      stroke(g, c);
      arrow(g, c, 0.6, 2.2 + 1.2 * n.w + (on ? 0.8 : 0));
    });
  };

  // Nodes: each filled to its value; leaves square, with their reward under them; roots labelled s with V beside
  Forest.prototype.drawNodes = function (t) {
    var g = this.g;
    var label = this.first + t.k;
    g.font = FONT;
    g.textBaseline = 'middle';
    t.root.each(function (n) {
      var root = !n.parent;
      g.globalAlpha = 1;
      g.lineWidth = root ? 1.5 : 1.2;
      g.strokeStyle = n.color;
      if (n.kids.length) {
        var r = root ? 5.2 : 3.9;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(n.x, n.y, r, 0, Math.PI * 2);
        g.fill();
        g.save();
        g.clip();
        g.fillStyle = n.color;
        g.globalAlpha = 0.6;
        var full = level(n.v);
        g.fillRect(n.x - r, n.y + r - 2 * r * full, 2 * r, 2 * r * full);
        g.restore();
        g.stroke();
      } else {
        var s = 7;
        g.fillStyle = '#ffffff';
        g.fillRect(n.x - s / 2, n.y - s / 2, s, s);
        g.fillStyle = n.color;
        g.globalAlpha = 0.15 + 0.75 * level(n.r);
        g.fillRect(n.x - s / 2, n.y - s / 2, s, s);
        g.globalAlpha = 1;
        g.strokeRect(n.x - s / 2, n.y - s / 2, s, s);
        g.fillStyle = INK;
        g.globalAlpha = 0.85;
        g.textAlign = 'center';
        g.fillText(signed(n.r), n.x, n.y + 12);
      }
      if (root) {
        g.globalAlpha = 0.85;
        g.fillStyle = INK;
        g.textAlign = 'right';
        g.fillText('s' + subscript(label), n.x - 9, n.y);
        g.textAlign = 'left';
        g.fillText('V ' + signed(n.v), n.x + 9, n.y);
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
