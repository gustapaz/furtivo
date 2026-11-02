export const DIRECTIONS = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
  wait: [0, 0],
};
const raw = [
  [
    "Entrada de serviço",
    "Aprenda a esperar. O foco laranja mostra o olhar atual; a marca tracejada é o próximo passo.",
    [
      "#########",
      "#P..#..E#",
      "#...#...#",
      "#.......#",
      "#..##...#",
      "#A.s...A#",
      "#########",
    ],
    [
      [
        [5, 3],
        [6, 3],
        [6, 4],
        [5, 4],
      ],
    ],
  ],
  [
    "Pátio cego",
    "Paredes interrompem o olhar. Use o corredor inferior para cruzar o pátio.",
    [
      "#########",
      "#P.A....#",
      "#.###.#.#",
      "#...s...#",
      "#.#.###.#",
      "#A.....E#",
      "#########",
    ],
    [
      [
        [5, 1],
        [6, 1],
        [7, 1],
        [6, 1],
      ],
      [
        [3, 3],
        [4, 3],
        [5, 3],
        [4, 3],
      ],
    ],
  ],
  [
    "Arquivo morto",
    "Uma sombra protege da visão, mas não de um encontro na mesma casa.",
    [
      "#########",
      "#P..#..A#",
      "#.#...#.#",
      "#.s.s...#",
      "#.#...#.#",
      "#A..#..E#",
      "#########",
    ],
    [
      [
        [3, 2],
        [4, 2],
        [5, 2],
        [4, 2],
      ],
      [
        [5, 4],
        [4, 4],
        [3, 4],
        [4, 4],
      ],
    ],
  ],
  [
    "Via expressa",
    "Duas patrulhas, um corredor. Observe o próximo passo antes de atravessar.",
    [
      "#########",
      "#P...A..#",
      "###.#.#.#",
      "#..s.s..#",
      "#.#.#.###",
      "#A.....E#",
      "#########",
    ],
    [
      [
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [6, 1],
        [5, 1],
        [4, 1],
      ],
      [
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 5],
        [3, 5],
        [2, 5],
      ],
    ],
  ],
  [
    "Zona de sombra",
    "Entre e saia do abrigo no tempo certo. Os dois arquivos estão em extremos opostos.",
    [
      "#########",
      "#P..#..A#",
      "#...s...#",
      "#.#.#.#.#",
      "#...s...#",
      "#A..#..E#",
      "#########",
    ],
    [
      [
        [2, 1],
        [3, 1],
        [3, 2],
        [2, 2],
      ],
      [
        [5, 4],
        [6, 4],
        [6, 5],
        [5, 5],
      ],
    ],
  ],
  [
    "Última transmissão",
    "Três patrulhas fecham o cerco. Recolha tudo e conclua a última operação.",
    [
      "#########",
      "#P..A...#",
      "#.#.#.#.#",
      "#s.s.s..#",
      "#.#.#.#.#",
      "#A.....E#",
      "#########",
    ],
    [
      [
        [5, 1],
        [6, 1],
        [7, 1],
        [6, 1],
      ],
      [
        [1, 3],
        [2, 3],
        [3, 3],
        [2, 3],
      ],
      [
        [5, 3],
        [6, 3],
        [7, 3],
        [6, 3],
      ],
    ],
  ],
];
export const LEVELS = raw.map(([name, hint, rows, patrols], id) => {
  let start, exit;
  const files = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "P") start = [x, y];
      if (c === "E") exit = [x, y];
      if (c === "A") files.push([x, y]);
    }),
  );
  return {
    id,
    name,
    hint,
    rows,
    patrols,
    start,
    exit,
    files,
    width: 9,
    height: 7,
    limit: 100,
  };
});
export const same = (a, b) => a[0] === b[0] && a[1] === b[1];
export const tile = (level, p) => level.rows[p[1]]?.[p[0]] ?? "#";
export function guardAt(level, index, turn) {
  const path = level.patrols[index],
    p = path[turn % path.length],
    next = path[(turn + 1) % path.length];
  const dx = Math.sign(next[0] - p[0]),
    dy = Math.sign(next[1] - p[1]);
  const vision = [];
  for (let n = 1; n <= 2; n++) {
    const q = [p[0] + dx * n, p[1] + dy * n];
    if (tile(level, q) === "#") break;
    vision.push(q);
  }
  return { p, next, vision, dx, dy };
}
export function createGame(id = 0) {
  if (!Number.isInteger(id) || !LEVELS[id])
    throw new RangeError("Operação inválida");
  return {
    level: id,
    p: [...LEVELS[id].start],
    turn: 0,
    files: 0,
    status: "playing",
    reason: "",
  };
}
export function step(state, action) {
  if (state.status !== "playing" || !DIRECTIONS[action]) return state;
  const level = LEVELS[state.level],
    d = DIRECTIONS[action],
    p = [state.p[0] + d[0], state.p[1] + d[1]];
  if (tile(level, p) === "#") return state;
  const turn = state.turn + 1;
  let files = state.files;
  level.files.forEach((q, i) => {
    if (same(p, q)) files |= 1 << i;
  });
  // Evaluate the crossing, then the patrol's new sight. Hiding never permits physical contact.
  const caught = level.patrols.some((_, i) => {
    const before = guardAt(level, i, state.turn),
      after = guardAt(level, i, turn);
    return (
      same(p, before.p) ||
      same(p, after.p) ||
      (!["s", "A"].includes(tile(level, p)) &&
        after.vision.some((q) => same(q, p)))
    );
  });
  const escaped =
    !caught && files === (1 << level.files.length) - 1 && same(p, level.exit);
  return {
    ...state,
    p,
    turn,
    files,
    status: caught
      ? "lost"
      : escaped
        ? "won"
        : turn >= level.limit
          ? "lost"
          : "playing",
    reason: caught
      ? "Você entrou no alcance de uma patrulha."
      : turn >= level.limit && !escaped
        ? "O canal fechou após 100 turnos."
        : "",
  };
}
export function readSave(raw) {
  const base = {
    version: 1,
    unlocked: 0,
    best: Array(6).fill(null),
    sound: false,
    reduced: false,
  };
  try {
    const v = JSON.parse(raw);
    if (v?.version !== 1) return base;
    return {
      ...base,
      unlocked: Number.isInteger(v.unlocked)
        ? Math.max(0, Math.min(5, v.unlocked))
        : 0,
      best: base.best.map((_, i) =>
        Number.isInteger(v.best?.[i]) && v.best[i] > 0 && v.best[i] <= 100
          ? v.best[i]
          : null,
      ),
      sound: v.sound === true,
      reduced: v.reduced === true,
    };
  } catch {
    return base;
  }
}
export function record(save, state) {
  if (state.status !== "won") return save;
  const best = [...save.best];
  best[state.level] = Math.min(best[state.level] ?? Infinity, state.turn);
  return {
    ...save,
    best,
    unlocked: Math.max(save.unlocked, Math.min(5, state.level + 1)),
  };
}
