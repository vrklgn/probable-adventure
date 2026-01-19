const STORAGE_KEY = "rpg-tally-data";

const defaultData = {
  digits: [0, 0, 0, 0, 0, 0],
  changes: [0, 0, 0, 0, 0, 0],
  updatedAt: null,
};

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    return {
      digits: Array.isArray(parsed.digits) ? parsed.digits : defaultData.digits,
      changes: Array.isArray(parsed.changes) ? parsed.changes : defaultData.changes,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch (error) {
    return defaultData;
  }
};

const formatTotal = (digits) => digits.join("");

const renderMainNumber = (digits) => {
  const container = document.getElementById("mainNumber");
  container.innerHTML = "";

  digits.forEach((digit) => {
    const block = document.createElement("div");
    block.className = "flip-digit";
    block.textContent = digit;
    container.appendChild(block);
  });
};

const renderTicker = (digits, changes) => {
  const tickerRow = document.getElementById("tickerRow");
  tickerRow.innerHTML = "";

  digits.forEach((digit, index) => {
    const card = document.createElement("div");
    card.className = "ticker-card";

    const charEl = document.createElement("div");
    charEl.className = "ticker-char";
    charEl.textContent = digit;

    const changeValue = Number(changes[index] ?? 0);
    const changeEl = document.createElement("div");
    changeEl.className = "ticker-change";
    let label = "0.0%";

    if (Number.isFinite(changeValue) && changeValue !== 0) {
      label = `${Math.abs(changeValue).toFixed(1)}%`;
      changeEl.classList.add(changeValue > 0 ? "ticker-up" : "ticker-down");
      changeEl.textContent = `${changeValue > 0 ? "▲" : "▼"} ${label}`;
    } else {
      changeEl.classList.add("ticker-flat");
      changeEl.textContent = `• ${label}`;
    }

    card.append(charEl, changeEl);
    tickerRow.appendChild(card);
  });
};

const updateDisplay = () => {
  const data = loadData();
  const digits = data.digits.map((digit) => String(digit).replace(/\D/g, "").padStart(1, "0").slice(0, 1));
  renderMainNumber(digits);
  renderTicker(digits, data.changes);
  document.title = `RPG Tally Counter · ${formatTotal(digits)}`;
};

updateDisplay();
window.addEventListener("storage", updateDisplay);
setInterval(updateDisplay, 4000);
