for (const widget of document.querySelectorAll("[data-tabs]")) {
  const tabs = [...widget.querySelectorAll("[role=tab]")];
  function select(tab) {
    for (const item of tabs) {
      item.setAttribute("aria-selected", String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        item !== tab;
    }
    widget.style.setProperty("--active", tabs.indexOf(tab));
  }
  widget.addEventListener("click", (event) => {
    const tab = event.target.closest("[role=tab]");
    if (tab) select(tab);
  });
  widget.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next]);
    tabs[next].focus();
  });
}

const get = (id) => document.getElementById(id);
get("password").addEventListener("input", (event) => {
  const value = event.target.value;
  const rules = {
    length: value.length >= 8,
    number: /\d/.test(value),
    letter: /[A-Z]/.test(value),
  };
  for (const item of get("rules").children) {
    const met = rules[item.dataset.rule];
    item.toggleAttribute("data-met", met);
    const base = item.textContent.split(" — ")[0];
    item.textContent = base + (met ? " — met" : " — still needed");
  }
});

const duration = get("duration");
function setDuration(value) {
  const rounded = Math.min(
    900,
    Math.max(15, Math.round((value || 15) / 15) * 15),
  );
  duration.value = rounded;
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  const text = [
    minutes && minutes + (minutes === 1 ? " minute" : " minutes"),
    seconds && seconds + " seconds",
  ];
  get("duration-label").value = text.filter(Boolean).join(" ");
}
duration.addEventListener("change", () => setDuration(duration.valueAsNumber));
get("decrease").addEventListener("click", () =>
  setDuration(duration.valueAsNumber - 15),
);
get("increase").addEventListener("click", () =>
  setDuration(duration.valueAsNumber + 15),
);

document
  .querySelector("[data-toggle-wave]")
  .addEventListener("click", (event) => {
    const enabled = event.currentTarget.getAttribute("aria-pressed") !== "true";
    event.currentTarget.setAttribute("aria-pressed", String(enabled));
    document.querySelector(".wave").hidden = !enabled;
    get("loading-status").textContent = enabled ? "Loading preview" : "Ready";
  });

const canvas = get("waveform");
const ctx = canvas.getContext("2d");
const record = get("record");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let started = 0;
let frame = 0;
let lastSecond = -1;
function paint(t) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#1d527c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 3) {
    const signal =
      Math.sin(x * 0.08 + t * 0.006) * Math.cos(x * 0.018 - t * 0.004);
    const y = canvas.height / 2 + signal * 28;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
function tick(t) {
  const ms = t - started;
  const tenth = Math.floor(ms / 100);
  if (tenth !== lastSecond) {
    get("elapsed").value = (tenth / 10).toFixed(1) + " s";
    lastSecond = tenth;
  }
  if (!reduced.matches) paint(ms);
  frame = requestAnimationFrame(tick);
}
paint(0);
record.addEventListener("click", () => {
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
    record.setAttribute("aria-pressed", "false");
    record.textContent = "Record";
    return;
  }
  started = performance.now();
  lastSecond = -1;
  record.setAttribute("aria-pressed", "true");
  record.textContent = "Stop";
  frame = requestAnimationFrame(tick);
});

const process = get("process");
const cancel = get("cancel-process");
const progress = get("process-progress");
let worker;
function endProcess(message) {
  clearInterval(worker);
  worker = undefined;
  process.disabled = false;
  cancel.hidden = true;
  get("process-status").value = message;
}
process.addEventListener("click", () => {
  if (worker !== undefined) return;
  progress.value = 0;
  progress.hidden = false;
  process.disabled = true;
  cancel.hidden = false;
  cancel.focus();
  get("process-status").value = "Preparing a local preview";
  worker = setInterval(() => {
    progress.value += 10;
    if (progress.value === 100) {
      const restore = document.activeElement === cancel;
      endProcess("Preview prepared");
      if (restore) process.focus();
    }
  }, 90);
});
cancel.addEventListener("click", () => {
  endProcess("Preparation cancelled");
  progress.hidden = true;
  process.focus();
});

get("copy").addEventListener("click", async () => {
  const code = [...get("copy").closest(".tabs").querySelectorAll("pre")]
    .find((panel) => !panel.hidden)
    .textContent.trim();
  try {
    await navigator.clipboard.writeText(code);
    get("copy-status").value = "Command copied";
  } catch {
    get("copy-status").value = "Select and copy the visible command.";
  }
});
for (const radio of document.querySelectorAll("[name=range]")) {
  radio.addEventListener("change", () => {
    get("selected-range").textContent = "Showing " + radio.value.toLowerCase();
  });
}
get("otp").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
  event.target.value = digits;
  for (const [i, slot] of [
    ...document.querySelectorAll(".digits span"),
  ].entries())
    slot.textContent = digits[i] ?? "";
  get("otp-status").value = digits.length === 6 ? "Code entered" : "";
});

const list = get("reorder");
function place(row, before, focus) {
  list.insertBefore(row, before);
  focus.focus();
  get("order-status").value = [...list.children]
    .map((item) => item.querySelector("span").textContent)
    .join(", ");
}
list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-move]");
  if (!button) return;
  const row = button.closest("li");
  const up = Number(button.dataset.move) < 0;
  const neighbor = up ? row.previousElementSibling : row.nextElementSibling;
  if (neighbor) place(row, up ? neighbor : neighbor.nextElementSibling, button);
});
for (const handle of list.querySelectorAll(".handle")) {
  let droppedOn;
  let pointer;
  const row = handle.closest("li");
  function clear() {
    droppedOn?.removeAttribute("data-drop");
    droppedOn = undefined;
    pointer = undefined;
  }
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || pointer !== undefined) return;
    pointer = event.pointerId;
    handle.setPointerCapture(pointer);
  });
  handle.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointer) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("#reorder li");
    droppedOn?.removeAttribute("data-drop");
    droppedOn = target && target !== row ? target : undefined;
    droppedOn?.setAttribute("data-drop", "");
  });
  handle.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointer) return;
    const target = droppedOn;
    clear();
    if (target) {
      const after =
        event.clientY >
        target.getBoundingClientRect().top + target.offsetHeight / 2;
      place(row, after ? target.nextElementSibling : target, handle);
    }
  });
  handle.addEventListener("pointercancel", clear);
  handle.addEventListener("lostpointercapture", clear);
}
