(function () {
  var TIER_RADIUS = { major: 26, standard: 18, minor: 12 };
  var ROW_HEIGHT = 130;
  var COL_SPACING_TREE = 110;
  var GRID_COL_SPACING = 100;
  var GRID_ROW_HEIGHT = 110;
  var TOP_MARGIN = 60;

  function UnionFind(ids) {
    var parent = {};
    ids.forEach(function (id) { parent[id] = id; });
    this.find = function (id) {
      while (parent[id] !== id) { parent[id] = parent[parent[id]]; id = parent[id]; }
      return id;
    };
    this.union = function (a, b) {
      var ra = this.find(a), rb = this.find(b);
      if (ra !== rb) parent[ra] = rb;
    };
  }

  // Genealogy-tree layout for characters connected by "internal" edges
  // (both endpoints present in `nodes`). Returns {id: {x, y}} only for
  // characters reachable via at least one such edge — the caller routes
  // everyone else to computeGridLayout.
  function computeTreeLayout(nodes, edges) {
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    var parentsOf = {};
    var siblingGroups = new UnionFind(nodes.map(function (n) { return n.id; }));
    var connected = new Set();

    edges.forEach(function (e) {
      var a = e[0], b = e[1], type = e[2];
      if (!byId[a] || !byId[b]) return;
      if (type === 'parent' || type === 'descendant') {
        connected.add(a); connected.add(b);
        parentsOf[b] = parentsOf[b] || [];
        parentsOf[b].push(a);
      } else if (type === 'spouse' || type === 'sibling') {
        connected.add(a); connected.add(b);
        siblingGroups.union(a, b);
      }
      // any other type (e.g. "affinity") carries no generational
      // information and must not affect tree placement — it's still
      // drawn as a line by render-cluster.js (which doesn't filter by
      // type), just not used to compute rows/levels here.
    });

    if (connected.size === 0) return {};

    var level = {};
    connected.forEach(function (id) { level[id] = 0; });

    // Interleave parent-child relaxation with spouse/sibling group-leveling
    // until both agree in the same pass — a spouse's own ancestor chain can
    // push their partner's row down, which must then push that partner's
    // children down too, so relaxing once then grouping once is not enough.
    var bound = connected.size * 2 + 2;
    for (var pass = 0; pass < bound; pass++) {
      var changed = false;

      connected.forEach(function (id) {
        (parentsOf[id] || []).forEach(function (p) {
          if (connected.has(p) && level[p] + 1 > level[id]) {
            level[id] = level[p] + 1;
            changed = true;
          }
        });
      });

      var groupMaxLevel = {};
      connected.forEach(function (id) {
        var root = siblingGroups.find(id);
        groupMaxLevel[root] = Math.max(groupMaxLevel[root] === undefined ? -Infinity : groupMaxLevel[root], level[id]);
      });
      connected.forEach(function (id) {
        var target = groupMaxLevel[siblingGroups.find(id)];
        if (target > level[id]) { level[id] = target; changed = true; }
      });

      if (!changed) break;
    }

    var rows = {};
    nodes.forEach(function (n) {
      if (!connected.has(n.id)) return;
      var lvl = level[n.id];
      rows[lvl] = rows[lvl] || [];
      rows[lvl].push(n.id);
    });

    var positions = {};
    Object.keys(rows).forEach(function (lvlKey) {
      var ids = rows[lvlKey];
      var lvl = Number(lvlKey);
      var totalWidth = (ids.length - 1) * COL_SPACING_TREE;
      var startX = -totalWidth / 2;
      ids.forEach(function (id, i) {
        positions[id] = { x: startX + i * COL_SPACING_TREE, y: TOP_MARGIN + lvl * ROW_HEIGHT };
      });
    });
    return positions;
  }

  // Simple grid, sorted so major-tier characters land first (top-left).
  function computeGridLayout(nodes) {
    var order = { major: 0, standard: 1, minor: 2 };
    var sorted = nodes.slice().sort(function (a, b) {
      return (order[a.tier] === undefined ? 3 : order[a.tier]) - (order[b.tier] === undefined ? 3 : order[b.tier]);
    });
    var cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
    var positions = {};
    sorted.forEach(function (n, i) {
      var col = i % cols, row = Math.floor(i / cols);
      positions[n.id] = { x: col * GRID_COL_SPACING, y: row * GRID_ROW_HEIGHT };
    });
    return positions;
  }

  var Layout = {
    TIER_RADIUS: TIER_RADIUS,
    computeTreeLayout: computeTreeLayout,
    computeGridLayout: computeGridLayout
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Layout;
  } else {
    window.Layout = Layout;
  }
})();
