import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  createGame,
  step,
  guardAt,
  tile,
  same,
  readSave,
  record,
} from "../src/game.js";
import { solve } from "./solver.js";
const names = { U: "up", D: "down", L: "left", R: "right", W: "wait" };
test("all authored maps have two files, legal adjacent patrol cycles and one start/exit", () => {
  for (const l of LEVELS) {
    assert.equal(l.rows.length, 7);
    assert(l.rows.every((r) => r.length === 9));
    assert.equal(l.files.length, 2);
    assert.equal(l.rows.join("").split("P").length, 2);
    assert.equal(l.rows.join("").split("E").length, 2);
    for (const path of l.patrols)
      path.forEach((p, i) => {
        assert.notEqual(tile(l, p), "#");
        const n = path[(i + 1) % path.length];
        assert.equal(Math.abs(p[0] - n[0]) + Math.abs(p[1] - n[1]), 1);
      });
  }
});
test("each operation has a complete deterministic solution under its turn limit", () => {
  for (const l of LEVELS) {
    const path = solve(l.id);
    assert(path, `No solution: ${l.name}`);
    let s = createGame(l.id);
    for (const c of path) s = step(s, names[c]);
    assert.equal(s.status, "won");
    assert.equal(s.files, 3);
    assert(s.turn <= l.limit);
    assert(same(s.p, l.exit));
  }
});
test("invalid level is rejected", () => {
  for (const id of [-1, 6, 1.5, "0", NaN])
    assert.throws(() => createGame(id), RangeError);
});
test("walls and invalid input do not consume a turn or mutate state", () => {
  const s = createGame();
  assert.strictEqual(step(s, "left"), s);
  assert.strictEqual(step(s, "up"), s);
  assert.strictEqual(step(s, "bad"), s);
  assert.deepEqual(s.p, [1, 1]);
});
test("wait advances one patrol phase without movement; input state is immutable", () => {
  const s = createGame(),
    n = step(s, "wait");
  assert.equal(n.turn, 1);
  assert.deepEqual(n.p, s.p);
  assert.equal(s.turn, 0);
  assert.deepEqual(guardAt(LEVELS[0], 0, 1).p, [6, 3]);
});
test("guard vision is exactly two cells forward and walls stop it", () => {
  const l = {
    patrols: [
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
      ],
    ],
    rows: ["#####", "#..##", "#...#", "#####"],
  };
  assert.deepEqual(guardAt(l, 0, 0).vision, [[2, 1]]);
  const g = guardAt(LEVELS[0], 0, 1);
  assert.deepEqual(g.vision, [
    [6, 4],
    [6, 5],
  ]);
});
test("walking into the guards old position is a collision even as it moves away", () => {
  const s = { ...createGame(), p: [5, 2] };
  const n = step(s, "down");
  assert.equal(n.status, "lost");
});
test("walking into the guards next position is a collision", () => {
  const s = { ...createGame(), p: [6, 2] };
  assert.equal(step(s, "down").status, "lost");
});
test("new direction of vision detects exposed agent", () => {
  const s = { ...createGame(), p: [6, 4] };
  assert.equal(step(s, "wait").status, "lost");
});
test("shadows prevent line of sight but do not prevent physical collision", () => {
  const s = { ...createGame(5), p: [1, 3], turn: 1 };
  assert.equal(step(s, "wait").status, "playing");
  const collision = { ...s, turn: 3 };
  assert.equal(step(collision, "wait").status, "lost");
});
test("archive cabins remain cover after collection", () => {
  const s = { ...createGame(3), p: [5, 1], turn: 0, files: 1 };
  const n = step(s, "wait");
  assert.equal(n.status, "playing");
  assert.equal(n.files, 1);
});
test("file collection is idempotent and exit alone is not victory", () => {
  let s = { ...createGame(), p: [1, 4] };
  s = step(s, "down");
  assert.equal(s.files, 1);
  s = step(s, "wait");
  assert.equal(s.files, 1);
  const n = step({ ...createGame(), p: [7, 2] }, "up");
  assert.equal(n.status, "playing");
});
test("turn budget ends play and result states cannot move", () => {
  const n = step({ ...createGame(), turn: 99 }, "wait");
  assert.equal(n.status, "lost");
  assert.match(n.reason, /100/);
  assert.strictEqual(step(n, "right"), n);
  const won = { ...createGame(), status: "won" };
  assert.strictEqual(step(won, "right"), won);
});
test("victory on final allowed turn takes precedence over timeout", () => {
  const n = step({ ...createGame(), p: [7, 2], turn: 99, files: 3 }, "up");
  assert.equal(n.status, "won");
  assert.equal(n.turn, 100);
});
test("fresh game resets position, resources and phase; states do not share positions", () => {
  const a = createGame(),
    b = createGame();
  a.p[0] = 4;
  assert.equal(b.p[0], 1);
  assert.equal(b.turn, 0);
  assert.equal(b.files, 0);
  assert.equal(b.status, "playing");
});
test("save parser rejects corrupt schema and bounds local fields", () => {
  for (const raw of ["bad", null, "null", "{}", '{"version":3}'])
    assert.equal(readSave(raw).unlocked, 0);
  const v = readSave(
    '{"version":1,"unlocked":100,"best":[-1,"2",101,5],"sound":"yes"}',
  );
  assert.equal(v.unlocked, 5);
  assert.deepEqual(v.best, [null, null, null, 5, null, null]);
  assert.equal(v.sound, false);
});
test("only victories unlock the next operation and best never worsens", () => {
  const base = readSave(null);
  assert.strictEqual(record(base, createGame()), base);
  const s = { ...createGame(), status: "won", turn: 20 };
  const next = record(base, s);
  assert.equal(next.unlocked, 1);
  assert.equal(next.best[0], 20);
  assert.equal(base.best[0], null);
  assert.equal(record(next, { ...s, turn: 25 }).best[0], 20);
  assert.equal(record(next, { ...s, turn: 15 }).best[0], 15);
});
test("finishing final operation caps unlocks at valid final index", () => {
  const v = record(readSave(null), {
    ...createGame(5),
    status: "won",
    turn: 30,
  });
  assert.equal(v.unlocked, 5);
  assert.equal(v.best[5], 30);
});
