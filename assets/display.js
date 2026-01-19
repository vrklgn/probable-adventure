const STORAGE_KEY = "rpg-tally-data";

const CHARACTER_NAMES = [
  "John Warlock of Oz",
  "Kim of House Kardar",
  "Magus Crumbslayer",
  "Ye of The West",
  "Sharon",
  "Joe Exquisite",
];

const defaultData = {
  values: [0, 0, 0, 0, 0, 0],
  changes: [0, 0, 0, 0, 0, 0],
  totalChange: 0,
  updatedAt: null,
};

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    const valuesSource = Array.isArray(parsed.values)
      ? parsed.values
      : Array.isArray(parsed.digits)
        ? parsed.digits
        : defaultData.values;

    return {
      values: valuesSource,
      changes: Array.isArray(parsed.changes) ? parsed.changes : defaultData.changes,
      totalChange: Number.isFinite(parsed.totalChange) ? parsed.totalChange : defaultData.totalChange,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch (error) {
    return defaultData;
  }
};

const clampValue = (value) => Math.min(100, Math.max(0, value));

const formatValues = (values) =>
  values.map((value) => {
    const numberValue = Number.parseInt(value, 10);
    if (Number.isNaN(numberValue)) {
      return 0;
    }
    return clampValue(numberValue);
  });

const computeTotal = (values) => values.reduce((sum, value) => sum + value, 0);

const renderMainNumber = (totalChange) => {
  const container = document.getElementById("mainNumber");
  container.innerHTML = "";

  const changeValue = Number(totalChange) || 0;
  const changeLabel = `${changeValue > 0 ? "+" : changeValue < 0 ? "-" : ""}${Math.abs(
    changeValue,
  ).toFixed(1)}%`;
  const symbol = changeValue > 0 ? "▲" : changeValue < 0 ? "▼" : "•";
  const styleClass =
    changeValue > 0 ? "main-up" : changeValue < 0 ? "main-down" : "main-flat";

  container.classList.remove("main-up", "main-down", "main-flat");
  container.classList.add(styleClass);

  const symbolEl = document.createElement("span");
  symbolEl.className = "main-symbol";
  symbolEl.textContent = symbol;

  const valueEl = document.createElement("span");
  valueEl.className = "main-value";
  valueEl.textContent = changeLabel;

  container.append(symbolEl, valueEl);
};

const buildNameFragments = (name) => {
  const [firstWord, ...restWords] = name.split(" ");
  if (restWords.length === 0) {
    return [document.createTextNode(firstWord)];
  }
  return [
    document.createTextNode(firstWord),
    document.createElement("br"),
    document.createTextNode(restWords.join(" ")),
  ];
};

const renderTicker = (changes) => {
  const tickerRow = document.getElementById("tickerRow");
  tickerRow.innerHTML = "";

  CHARACTER_NAMES.forEach((name, index) => {
    const card = document.createElement("div");
    card.className = "ticker-card";

    const charEl = document.createElement("div");
    charEl.className = "ticker-char";
    buildNameFragments(name).forEach((node) => {
      charEl.appendChild(node);
    });

    const changeValue = Number(changes[index] ?? 0);
    const changeEl = document.createElement("div");
    changeEl.className = "ticker-change";
    let label = "0.0%";

    if (Number.isFinite(changeValue) && changeValue !== 0) {
      label = `${changeValue > 0 ? "+" : "-"}${Math.abs(changeValue).toFixed(1)}%`;
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
  const values = formatValues(data.values);
  const totalChange = Number(data.totalChange ?? 0);
  renderMainNumber(totalChange);
  renderTicker(data.changes);
  document.title = `Adventurers Trend · ${totalChange.toFixed(1)}%`;
};

updateDisplay();
window.addEventListener("storage", updateDisplay);
setInterval(updateDisplay, 4000);
