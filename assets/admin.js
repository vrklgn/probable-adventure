const STORAGE_KEY = "rpg-tally-data";
const HISTORY_KEY = "rpg-tally-history";

const CHARACTER_NAMES = [
  "John - Ozzy",
  "Kim",
  "Magus",
  "Ye",
  "Sharon",
  "Joe",
];

const defaultData = {
  values: [0, 0, 0, 0, 0, 0],
  changes: [0, 0, 0, 0, 0, 0],
  totalChange: 0,
  previousValues: [0, 0, 0, 0, 0, 0],
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
      previousValues: Array.isArray(parsed.previousValues)
        ? parsed.previousValues
        : defaultData.previousValues,
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

    wrapper.append(label, valueInput);
    container.appendChild(wrapper);
  }
};

const hydrateInputs = (data) => {
  document.querySelectorAll("input[data-type='value']").forEach((input) => {
    const index = Number(input.dataset.index);
    input.value = data.values[index] ?? 0;
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

const computeChangePercent = (previous, current) => {
  const previousNumber = Number(previous);
  const currentNumber = Number(current);

  if (!Number.isFinite(previousNumber) || !Number.isFinite(currentNumber)) {
    return 0;
  }

  if (previousNumber === 0) {
    return currentNumber === 0 ? 0 : 100;
  }

  return ((currentNumber - previousNumber) / previousNumber) * 100;
};

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

  const values = formatValues(valueInputs.map((input) => input.value));

  return { values };
};

const persistData = () => {
  const existing = loadData();
  const history = loadHistory();
  const { values } = collectFormValues();
  const currentTotal = computeTotal(values);
  const previousValues = formatValues(existing.values ?? defaultData.values);
  const changes = values.map((value, index) =>
    computeChangePercent(previousValues[index] ?? 0, value),
  );
  const totalChange = computeChangePercent(computeTotal(previousValues), currentTotal);

  if (existing.updatedAt) {
    saveHistory(existing.values ? computeTotal(existing.values) : history.previousTotal);
  }

  const payload = {
    values,
    changes,
    totalChange,
    previousValues,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  renderTrend(currentTotal);
  renderUpdatedAt(payload.updatedAt);
};

const resetData = () => {
  const values = [0, 0, 0, 0, 0, 0];
  const changes = [0, 0, 0, 0, 0, 0];
  const payload = {
    values,
    changes,
    totalChange: 0,
    previousValues: values,
    updatedAt: new Date().toISOString(),
  };
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
