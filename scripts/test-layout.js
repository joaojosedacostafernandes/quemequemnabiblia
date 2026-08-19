// Plain-Node assertion script for js/layout.js (no test framework in this repo).
// Run: node scripts/test-layout.js
const Layout = require('../js/layout.js');

let failures = 0;
function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('FAIL:', msg, '\n  expected:', JSON.stringify(expected), '\n  actual:  ', JSON.stringify(actual));
    failures++;
  } else {
    console.log('ok:', msg);
  }
}
function assertTrue(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); failures++; }
  else { console.log('ok:', msg); }
}

// --- computeTreeLayout: simple 2-generation tree ---
// abraao -> isaac (parent), abraao spouse sara, isaac spouse rebeca (rebeca not in this set)
const nodes1 = [
  { id: 'abraao', tier: 'major' },
  { id: 'sara', tier: 'major' },
  { id: 'isaac', tier: 'major' }
];
const edges1 = [
  ['abraao', 'isaac', 'parent'],
  ['abraao', 'sara', 'spouse']
];
const pos1 = Layout.computeTreeLayout(nodes1, edges1);
assertTrue('abraao' in pos1 && 'sara' in pos1 && 'isaac' in pos1, 'all 3 nodes placed');
assertEqual(pos1.abraao.y, pos1.sara.y, 'spouses share the same row (y)');
assertTrue(pos1.isaac.y > pos1.abraao.y, 'child is on a lower row than parent (larger y)');
assertTrue(pos1.abraao.x !== pos1.sara.x, 'spouses do not share the same x');

// --- computeTreeLayout: node with no internal edge is excluded ---
const nodes2 = [{ id: 'a', tier: 'minor' }, { id: 'b', tier: 'minor' }, { id: 'c', tier: 'minor' }];
const edges2 = [['a', 'b', 'parent']];
const pos2 = Layout.computeTreeLayout(nodes2, edges2);
assertTrue('a' in pos2 && 'b' in pos2, 'connected nodes placed');
assertTrue(!('c' in pos2), 'unconnected node is absent from tree layout');

// --- computeTreeLayout: empty edges returns empty object ---
assertEqual(Layout.computeTreeLayout(nodes2, []), {}, 'no internal edges -> empty tree');

// --- computeTreeLayout: siblings share a row even with no shared parent in-set ---
const nodes3 = [{ id: 'x', tier: 'minor' }, { id: 'y', tier: 'minor' }];
const edges3 = [['x', 'y', 'sibling']];
const pos3 = Layout.computeTreeLayout(nodes3, edges3);
assertEqual(pos3.x.y, pos3.y.y, 'siblings share the same row (y)');

// --- computeTreeLayout: a spouse's own deeper ancestor chain must push
// their partner's children down too (regression: parent rendered above
// their own child when the group-leveling bump didn't propagate) ---
const nodes4 = [
  { id: 'isaac', tier: 'major' }, { id: 'jacob', tier: 'major' },
  { id: 'rebeca', tier: 'major' }, { id: 'betuel', tier: 'minor' }, { id: 'nacor', tier: 'minor' }
];
const edges4 = [
  ['isaac', 'jacob', 'parent'],
  ['isaac', 'rebeca', 'spouse'],
  ['betuel', 'rebeca', 'parent'],
  ['nacor', 'betuel', 'parent']
];
const pos4 = Layout.computeTreeLayout(nodes4, edges4);
assertEqual(pos4.isaac.y, pos4.rebeca.y, 'isaac and rebeca (spouses) share a row even though rebeca has her own deeper lineage');
assertTrue(pos4.jacob.y > pos4.isaac.y, 'jacob renders strictly below his father isaac, even after isaac was bumped down to match rebeca');

// --- computeGridLayout: major tier sorts first ---
const gridNodes = [
  { id: 'm1', tier: 'minor' },
  { id: 'maj1', tier: 'major' },
  { id: 's1', tier: 'standard' }
];
const gridPos = Layout.computeGridLayout(gridNodes);
assertTrue(Object.keys(gridPos).length === 3, 'all grid nodes placed');
assertTrue(gridPos.maj1.y <= gridPos.m1.y, 'major-tier lands at or before minor-tier (row order)');

console.log(failures === 0 ? '\nALL PASS' : '\n' + failures + ' FAILURE(S)');
process.exit(failures === 0 ? 0 : 1);
