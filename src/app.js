import {
  LEVELS,
  createGame,
  step,
  guardAt,
  tile,
  same,
  readSave,
  record,
} from "./game.js";
const KEY = "furtivo.save.v1";
const actions = {
  ArrowUp: "up",
  w: "up",
  ArrowRight: "right",
  d: "right",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
  " ": "wait",
};
const svg = (body) =>
  `<svg viewBox="0 0 720 560" role="img" aria-label="Mapa da operação: agente branco, patrulhas numeradas, visão com trama laranja e próximos passos tracejados">${body}</svg>`;
class FurtivoGame extends HTMLElement {
  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    this.save = readSave(this.load());
    this.state = createGame();
    this.paused = false;
    this.innerHTML = `<header><a class="brand" href="./" aria-label="Furtivo início">F<span>↗</span></a><span class="eyebrow">CENTRAL DE OPERAÇÕES<br>CANAL LOCAL / 06 FREQUÊNCIAS</span><nav><button id="help">Como jogar <b>?</b></button><button id="sound" aria-pressed="false">Som: não</button><button id="motion" aria-pressed="false">Reduzir movimento</button></nav></header>
   <main><section class="title-band"><div><p class="eyebrow">TÁTICA DE INFILTRAÇÃO / SEM TEMPO REAL</p><h1>FURTIVO<span>/06</span></h1></div><p class="manifesto">A cidade observa.<br><strong>Escolha o ponto cego.</strong></p></section>
   <section class="console"><div class="channel"><span class="live-dot"></span><span id="operation"></span><span class="channel-right">VISÃO AÉREA · MALHA 09 × 07</span></div>
    <div class="play-layout"><section class="map-wrap"><div class="map-head"><span id="map-label"></span><span>↑ NORTE</span></div><div id="field" tabindex="0" role="group" aria-label="Campo de jogo. Use setas ou WASD; Espaço espera um turno."></div><div class="map-foot"><span>● VOCÊ</span><span>▧ ABRIGO</span><span>▱ ARQUIVO</span><span>↗ SAÍDA</span></div></section>
    <aside><div class="telemetry"><p class="eyebrow">SINAL DO AGENTE</p><h2 id="signal">NÃO DETECTADO</h2><div class="stats"><div><span>TURNO</span><strong id="turn">00<small>/100</small></strong></div><div><span>ARQUIVOS</span><strong id="files">0<small>/2</small></strong></div></div></div>
      <p id="hint" class="hint"></p><p id="status" role="status" aria-live="polite"></p><div class="controls" aria-label="Mover agente"><button data-action="up" aria-label="Mover para cima">↑</button><button data-action="left" aria-label="Mover para esquerda">←</button><button data-action="wait" aria-label="Esperar um turno">Ⅱ</button><button data-action="right" aria-label="Mover para direita">→</button><button data-action="down" aria-label="Mover para baixo">↓</button></div><p class="keys">SETAS / WASD PARA MOVER<br>ESPAÇO OU Ⅱ PARA ESPERAR</p>
      <div class="tools"><button id="pause">Pausar <span>P</span></button><button id="restart">Reiniciar <span>↻</span></button></div><div class="record"><span>MELHOR LOCAL</span><strong id="best">—</strong></div></aside></div>
   </section><section class="operations"><div><h2>SELECIONE A FREQUÊNCIA</h2><p>Conclua uma operação para abrir a seguinte.</p></div><div id="levels"></div></section></main><footer><span>FURTIVO / UM PASSO DE CADA VEZ.</span><span>Sem conta. Recordes só neste dispositivo.</span></footer>
   <dialog id="dialog" aria-labelledby="dialog-title"><form method="dialog"><button class="close" aria-label="Fechar diálogo">×</button></form><p class="eyebrow" id="dialog-tag"></p><h2 id="dialog-title"></h2><div id="dialog-body"></div><button id="dialog-action" class="primary"></button></dialog>`;
    this.onClick = (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      if (button.dataset.action) this.move(button.dataset.action);
      if (button.dataset.level !== undefined) {
        this.begin(Number(button.dataset.level));
        this.q("#field").focus();
      }
      if (button.id === "restart") this.begin(this.state.level);
      if (button.id === "help") this.open("help");
      if (button.id === "pause") this.open("pause");
      if (button.id === "sound") {
        this.save.sound = !this.save.sound;
        this.persist();
        this.preferences();
        this.beep("step");
      }
      if (button.id === "motion") {
        this.save.reduced = !this.save.reduced;
        this.persist();
        this.preferences();
      }
      if (button.id === "dialog-action") {
        const mode = this.mode;
        this.q("#dialog").close();
        this.paused = false;
        if (mode === "won")
          this.begin(this.state.level === 5 ? 0 : this.state.level + 1);
        if (mode === "lost") this.begin(this.state.level);
        this.q("#field").focus();
      }
    };
    this.onKey = (e) => {
      if (e.key === "Escape" && this.q("#dialog").open) {
        e.preventDefault();
        this.q("#dialog").close();
        this.paused = false;
        return;
      }
      if (this.q("#dialog").open) return;
      if (e.target.closest("#field") && actions[e.key]) {
        e.preventDefault();
        if (!e.repeat) this.move(actions[e.key]);
      }
      if (e.key.toLowerCase() === "p" && e.target.closest("#field")) {
        e.preventDefault();
        this.open("pause");
      }
    };
    this.onBlur = () => {
      if (this.state.status === "playing" && !this.q("#dialog").open)
        this.open("pause");
    };
    this.onVisibility = () => {
      if (document.hidden) this.onBlur();
    };
    this.addEventListener("click", this.onClick);
    this.addEventListener("keydown", this.onKey);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.q("#dialog").addEventListener("close", () => {
      this.paused = false;
      this.render();
      this.q("#field").focus();
    });
    this.preferences();
    this.render();
  }
  disconnectedCallback() {
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.removeEventListener("click", this.onClick);
    this.removeEventListener("keydown", this.onKey);
    this.audio?.close();
    this.ready = false;
  }
  q(s) {
    return this.querySelector(s);
  }
  load() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.save));
    } catch {
      /* Play remains available without persistence. */
    }
  }
  preferences() {
    this.classList.toggle("reduced", this.save.reduced);
    this.q("#sound").textContent = `Som: ${this.save.sound ? "sim" : "não"}`;
    this.q("#sound").setAttribute("aria-pressed", this.save.sound);
    this.q("#motion").setAttribute("aria-pressed", this.save.reduced);
  }
  begin(id) {
    if (id > this.save.unlocked) return;
    this.state = createGame(id);
    this.paused = false;
    if (this.q("#dialog").open) this.q("#dialog").close();
    this.render();
  }
  move(action) {
    if (this.paused || this.q("#dialog").open) return;
    const prev = this.state,
      next = step(prev, action);
    if (next === prev) {
      this.q("#status").textContent = "Parede à frente. O turno não avançou.";
      return;
    }
    this.state = next;
    this.beep(
      next.status === "lost"
        ? "lost"
        : next.files !== prev.files
          ? "file"
          : "step",
    );
    if (next.status === "won") {
      this.save = record(this.save, next);
      this.persist();
      this.beep("won");
    }
    this.render();
    if (next.status !== "playing") this.open(next.status);
  }
  beep(kind) {
    if (!this.save.sound) return;
    try {
      this.audio ??= new AudioContext();
      this.audio.resume().catch(() => {});
      const o = this.audio.createOscillator(),
        g = this.audio.createGain();
      o.connect(g);
      g.connect(this.audio.destination);
      o.type = "sine";
      o.frequency.value = { step: 220, file: 660, won: 880, lost: 100 }[kind];
      g.gain.setValueAtTime(0.045, this.audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.12);
      o.start();
      o.stop(this.audio.currentTime + 0.13);
    } catch {
      /* Sound is optional. */
    }
  }
  open(mode) {
    this.mode = mode;
    this.paused = true;
    const level = LEVELS[this.state.level];
    const content = {
      help: [
        "MANUAL DE CAMPO",
        "Passe despercebido.",
        `<ol><li>Recolha os dois arquivos <b>▱</b> e alcance a saída <b>↗</b>.</li><li>Mover ou esperar faz cada patrulha avançar uma casa. Parede não gasta turno.</li><li>A trama laranja mostra a visão atual: duas casas à frente, bloqueada por paredes. O contorno tracejado indica o próximo passo. Depois de sua ação, a patrulha anda e olha na nova direção.</li><li>Sombras hachuradas e cabines de arquivo escondem da visão, mesmo após coletar. Entrar na casa atual ou seguinte de uma patrulha sempre causa alarme.</li><li>Use setas/WASD no mapa ou botões. Espaço/Ⅱ espera; P pausa. Em 100 turnos, o canal fecha.</li></ol><p>Sem corrida contra o relógio. Planeje cada passo. Progresso e recordes são locais; a tentativa atual não é salva.</p>`,
        "Entendido, voltar",
      ],
      pause: [
        "TRANSMISSÃO SUSPENSA",
        "Tempo para pensar.",
        `<p>A operação está pausada. Nenhuma patrulha se move sem sua ação.</p><p>${level.name} · turno ${this.state.turn}.</p>`,
        "Retomar operação",
      ],
      lost: [
        "SINAL INTERCEPTADO",
        this.state.reason.includes("100")
          ? "Canal encerrado."
          : "Você foi visto.",
        `<p>${this.state.reason}</p><p>Estude a direção e o próximo passo das patrulhas. A mesma operação pode ser repetida sem limite.</p>`,
        "Tentar novamente",
      ],
      won: [
        this.state.level === 5 ? "CAMPANHA CONCLUÍDA" : "TRANSMISSÃO RECEBIDA",
        this.state.level === 5 ? "Invisível até o fim." : "Arquivo entregue.",
        `<p>${level.name}: dois arquivos recuperados em <strong>${this.state.turn} turnos</strong>.</p><p>${this.state.level === 5 ? "As seis operações estão liberadas. Volte aos mapas para melhorar seus recordes locais." : "Nova frequência liberada. O próximo setor tem outra configuração de patrulhas."}</p>`,
        this.state.level === 5
          ? "Voltar à primeira operação"
          : "Próxima operação",
      ],
    }[mode];
    this.q("#dialog-tag").textContent = content[0];
    this.q("#dialog-title").textContent = content[1];
    this.q("#dialog-body").innerHTML = content[2];
    this.q("#dialog-action").textContent = content[3];
    this.q("#dialog").showModal();
    this.q("#dialog-action").focus();
  }
  render() {
    const s = this.state,
      l = LEVELS[s.level],
      guards = l.patrols.map((_, i) => guardAt(l, i, s.turn));
    let body = `<defs><pattern id="shadow" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M0 8L8 0M6 10L10 6" stroke="#789aff" stroke-width="2"/></pattern><pattern id="sight" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#ffad86"/></pattern></defs>`;
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 9; x++) {
        const t = tile(l, [x, y]),
          X = x * 80,
          Y = y * 80;
        body += `<g transform="translate(${X} ${Y})"><rect x="1" y="1" width="78" height="78" rx="1" class="${t === "#" ? "wall" : "floor"}"/>`;
        if (t === "#") {
          body += `<path d="M10 65H65V12" class="wall-detail"/>`;
        }
        if (t === "s" || t === "A")
          body +=
            '<rect x="9" y="9" width="62" height="62" fill="url(#shadow)" opacity=".55"/>';
        if (
          t === "A" &&
          !(s.files & (1 << l.files.findIndex((p) => same(p, [x, y]))))
        )
          body +=
            '<path d="M23 25h14l5 6h17v24H23z" class="file-icon"/><path d="M29 39h24M29 46h14" stroke="#142a9b" stroke-width="3"/>';
        if (t === "E")
          body += `<path d="M26 54l28-28m-22 0h22v22" class="exit-icon"/><text x="40" y="70" text-anchor="middle" class="exit-label">${s.files === 3 ? "ABERTA" : "SAÍDA"}</text>`;
        body += "</g>";
      }
    guards.forEach((g) =>
      g.vision.forEach((p) => {
        body += `<rect x="${p[0] * 80 + 3}" y="${p[1] * 80 + 3}" width="74" height="74" fill="#ff7444" opacity=".23"/><rect x="${p[0] * 80 + 3}" y="${p[1] * 80 + 3}" width="74" height="74" fill="url(#sight)"/>`;
      }),
    );
    guards.forEach((g, i) => {
      body += `<rect x="${g.next[0] * 80 + 13}" y="${g.next[1] * 80 + 13}" width="54" height="54" rx="27" class="next-mark"/><g class="guard" transform="translate(${g.p[0] * 80 + 40} ${g.p[1] * 80 + 40})"><circle r="23"/><path d="M-12-8h24v15h-24z"/><text y="6" text-anchor="middle">${i + 1}</text><path d="M${g.dx * 28 - g.dy * 6} ${g.dy * 28 + g.dx * 6}L${g.dx * 36} ${g.dy * 36}L${g.dx * 28 + g.dy * 6} ${g.dy * 28 - g.dx * 6}" class="direction"/></g>`;
    });
    body += `<g class="agent ${s.status === "lost" ? "caught" : ""}" transform="translate(${s.p[0] * 80 + 40} ${s.p[1] * 80 + 40})"><circle r="29" class="agent-ring"/><path d="M0-20l18 31-18-7-18 7z"/><circle cy="19" r="3"/></g>`;
    this.q("#field").innerHTML = svg(body);
    const previous = this.lastRendered;
    if (
      previous?.level === s.level &&
      previous.turn !== s.turn &&
      !this.save.reduced &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const animate = (element, from, to) =>
        element?.animate(
          [
            {
              transform: `translate(${from[0] * 80 + 40}px,${from[1] * 80 + 40}px)`,
            },
            {
              transform: `translate(${to[0] * 80 + 40}px,${to[1] * 80 + 40}px)`,
            },
          ],
          { duration: 190, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      animate(this.q(".agent"), previous.p, s.p);
      this.querySelectorAll(".guard").forEach((element, i) =>
        animate(element, guardAt(l, i, previous.turn).p, guards[i].p),
      );
    }
    this.lastRendered = s;
    this.q("#operation").textContent =
      `OPERAÇÃO ${String(s.level + 1).padStart(2, "0")} / ${l.name.toUpperCase()}`;
    this.q("#map-label").textContent =
      `SETOR ${String.fromCharCode(65 + s.level)} / ${guards.length} PATRULHA${guards.length > 1 ? "S" : ""}`;
    this.q("#turn").innerHTML =
      `${String(s.turn).padStart(2, "0")}<small>/100</small>`;
    const files = s.files.toString(2).replaceAll("0", "").length;
    this.q("#files").innerHTML = `${files}<small>/2</small>`;
    this.q("#signal").textContent =
      s.status === "lost"
        ? "SINAL INTERCEPTADO"
        : s.status === "won"
          ? "EXTRAÇÃO CONCLUÍDA"
          : ["s", "A"].includes(tile(l, s.p))
            ? "AGENTE OCULTO"
            : "NÃO DETECTADO";
    this.q("#hint").textContent = l.hint;
    this.q("#status").textContent =
      `Posição ${s.p[0] + 1}, ${s.p[1] + 1}. Turno ${s.turn}. ${files} de 2 arquivos. ${s.status === "playing" ? "Planeje seu próximo passo." : s.status === "won" ? "Operação concluída." : "Alarme."}`;
    this.q("#best").textContent =
      this.save.best[s.level] === null
        ? "—"
        : `${this.save.best[s.level]} turnos`;
    this.q("#levels").innerHTML = LEVELS.map(
      (level, i) =>
        `<button data-level="${i}" ${i > this.save.unlocked ? "disabled" : ""} aria-current="${i === s.level ? "step" : "false"}"><span>0${i + 1}</span><strong>${level.name}</strong><small>${i > this.save.unlocked ? "BLOQUEADA" : this.save.best[i] !== null ? `${this.save.best[i]} TURNOS · ✓` : "DISPONÍVEL"}</small></button>`,
    ).join("");
  }
}
customElements.define("furtivo-game", FurtivoGame);
