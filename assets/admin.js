const STORAGE_KEY = "rpg-tally-data";
const HISTORY_KEY = "rpg-tally-history";

const CHARACTER_NAMES = [
  "John, Warlock of Oz",
  "Kim of House Kardar",
  "Magus Crumbslayer",
  "Ye of The West",
  "Sharon",
  "Joe Exquisite",
];

const defaultData = {
  values: [0, 0, 0, 0, 0, 0],
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
    const valuesSource = Array.isArray(parsed.values)
      ? parsed.values
      : Array.isArray(parsed.digits)
        ? parsed.digits
        : defaultData.values;

    return {
      values: valuesSource,
      changes: Array.isArray(parsed.changes) ? parsed.changes : defaultData.changes,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch (error) {
    return defaultData;
  }
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return { previousTotal: 0 };
    }
    return JSON.parse(raw);
  } catch (error) {
    return { previousTotal: 0 };
  }
};

const saveHistory = (previousTotal) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ previousTotal }));
};

const buildInputs = () => {
  const container = document.getElementById("digitInputs");
  container.innerHTML = "";

  for (let index = 0; index < 6; index += 1) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";

    const label = document.createElement("label");
    label.textContent = CHARACTER_NAMES[index] ?? `Character ${index + 1}`;

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.min = "0";
    valueInput.max = "100";
    valueInput.step = "1";
    valueInput.dataset.type = "value";
    valueInput.dataset.index = index;

    const changeLabel = document.createElement("label");
    changeLabel.textContent = "Change %";
    changeLabel.style.fontSize = "0.75rem";
    changeLabel.style.color = "#9aa1b2";

    const changeInput = document.createElement("input");
    changeInput.type = "number";
    changeInput.step = "0.1";
    changeInput.dataset.type = "change";
    changeInput.dataset.index = index;

    wrapper.append(label, valueInput, changeLabel, changeInput);
    container.appendChild(wrapper);
  }
};

const hydrateInputs = (data) => {
  document.querySelectorAll("input[data-type='value']").forEach((input) => {
    const index = Number(input.dataset.index);
    input.value = data.values[index] ?? 0;
  });
  document.querySelectorAll("input[data-type='change']").forEach((input) => {
    const index = Number(input.dataset.index);
    input.value = data.changes[index] ?? 0;
  });
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

const renderTrend = (currentTotal) => {
  const history = loadHistory();
  const previousTotal = Number(history.previousTotal ?? 0);

  const previousNumber = Number(previousTotal);
  const currentNumber = Number(currentTotal);
  const trendEl = document.getElementById("trendStatus");

  let trendLabel = "No Change";
  trendEl.className = "status-badge status-flat";

  if (currentNumber > previousNumber) {
    trendLabel = "Up";
    trendEl.className = "status-badge status-up";
  }

  if (currentNumber < previousNumber) {
    trendLabel = "Down";
    trendEl.className = "status-badge status-down";
  }

  trendEl.textContent = trendLabel;
  document.getElementById("previousTotal").textContent = previousTotal;
  document.getElementById("currentTotal").textContent = currentTotal;
};

const renderUpdatedAt = (timestamp) => {
  const updatedEl = document.getElementById("updatedAt");
  if (!timestamp) {
    updatedEl.textContent = "No updates yet.";
    return;
  }

  const formatted = new Date(timestamp).toLocaleString();
  updatedEl.textContent = `Last updated: ${formatted}`;
};

const collectFormValues = () => {
  const valueInputs = [...document.querySelectorAll("input[data-type='value']")];
  const changeInputs = [...document.querySelectorAll("input[data-type='change']")];

  const values = formatValues(valueInputs.map((input) => input.value));
  const changes = changeInputs.map((input) => Number(input.value) || 0);

  return { values, changes };
};

const persistData = () => {
  const existing = loadData();
  const history = loadHistory();
  const { values, changes } = collectFormValues();
  const currentTotal = computeTotal(values);

  if (existing.updatedAt) {
    saveHistory(existing.values ? computeTotal(existing.values) : history.previousTotal);
  }

  const payload = {
    values,
    changes,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  renderTrend(currentTotal);
  renderUpdatedAt(payload.updatedAt);
};

const resetData = () => {
  const values = [0, 0, 0, 0, 0, 0];
  const changes = [0, 0, 0, 0, 0, 0];
  const payload = { values, changes, updatedAt: new Date().toISOString() };
  const history = loadHistory();

  if (history.previousTotal !== undefined) {
    saveHistory(computeTotal(values));
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  hydrateInputs(payload);
  renderTrend(computeTotal(values));
  renderUpdatedAt(payload.updatedAt);
};

buildInputs();
const initialData = loadData();
hydrateInputs(initialData);
renderTrend(computeTotal(formatValues(initialData.values)));
renderUpdatedAt(initialData.updatedAt);

document.getElementById("saveButton").addEventListener("click", (event) => {
  event.preventDefault();
  persistData();
});

document.getElementById("resetButton").addEventListener("click", (event) => {
  event.preventDefault();
  resetData();
});
