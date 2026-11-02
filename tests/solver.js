import { LEVELS, createGame, step } from "../src/game.js";
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export function solve(id) {
  const level = LEVELS[id],
    period = level.patrols.reduce(
      (a, p) => (a * p.length) / gcd(a, p.length),
      1,
    );
  const initial = createGame(id),
    queue = [[initial, ""]],
    seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const [s, path] = queue[i];
    if (s.status === "won") return path;
    for (const [a, char] of [
      ["up", "U"],
      ["right", "R"],
      ["down", "D"],
      ["left", "L"],
      ["wait", "W"],
    ]) {
      const n = step(s, a);
      if (n === s || n.status === "lost") continue;
      const key = `${n.p}:${n.turn % period}:${n.files}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push([n, path + char]);
    }
  }
  return null;
}
if (process.argv[1]?.endsWith("solver.js"))
  for (const l of LEVELS) console.log(l.id, l.name, solve(l.id));
