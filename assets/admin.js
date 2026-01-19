const STORAGE_KEY = "rpg-tally-data";
const HISTORY_KEY = "rpg-tally-history";

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

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return { previousTotal: "000000" };
    }
    return JSON.parse(raw);
  } catch (error) {
    return { previousTotal: "000000" };
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
    label.textContent = `Digit ${index + 1}`;

    const digitInput = document.createElement("input");
    digitInput.type = "text";
    digitInput.maxLength = 1;
    digitInput.dataset.type = "digit";
    digitInput.dataset.index = index;

    const changeLabel = document.createElement("label");
    changeLabel.textContent = "Change %";
    changeLabel.style.fontSize = "0.75rem";
    changeLabel.style.color = "#9aa1b2";

    const changeInput = document.createElement("input");
    changeInput.type = "number";
    changeInput.step = "0.1";
    changeInput.dataset.type = "change";
    changeInput.dataset.index = index;

    wrapper.append(label, digitInput, changeLabel, changeInput);
    container.appendChild(wrapper);
  }
};

const hydrateInputs = (data) => {
  document.querySelectorAll("input[data-type='digit']").forEach((input) => {
    const index = Number(input.dataset.index);
    input.value = data.digits[index] ?? 0;
  });
  document.querySelectorAll("input[data-type='change']").forEach((input) => {
    const index = Number(input.dataset.index);
    input.value = data.changes[index] ?? 0;
  });
};

const formatDigits = (values) => values.map((value) => String(value).replace(/\D/g, "").padStart(1, "0").slice(0, 1));

const computeTotal = (digits) => digits.join("");

const renderTrend = (currentTotal) => {
  const history = loadHistory();
  const previousTotal = history.previousTotal ?? "000000";

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
  const digitInputs = [...document.querySelectorAll("input[data-type='digit']")];
  const changeInputs = [...document.querySelectorAll("input[data-type='change']")];

  const digits = formatDigits(digitInputs.map((input) => input.value));
  const changes = changeInputs.map((input) => Number(input.value) || 0);

  return { digits, changes };
};

const persistData = () => {
  const existing = loadData();
  const history = loadHistory();
  const { digits, changes } = collectFormValues();
  const currentTotal = computeTotal(digits);

  if (existing.updatedAt) {
    saveHistory(existing.digits ? computeTotal(existing.digits) : history.previousTotal);
  }

  const payload = {
    digits,
    changes,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  renderTrend(currentTotal);
  renderUpdatedAt(payload.updatedAt);
};

const resetData = () => {
  const digits = [0, 0, 0, 0, 0, 0];
  const changes = [0, 0, 0, 0, 0, 0];
  const payload = { digits, changes, updatedAt: new Date().toISOString() };
  const history = loadHistory();

  if (history.previousTotal !== undefined) {
    saveHistory(computeTotal(digits));
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  hydrateInputs(payload);
  renderTrend(computeTotal(digits));
  renderUpdatedAt(payload.updatedAt);
};

buildInputs();
const initialData = loadData();
hydrateInputs(initialData);
renderTrend(computeTotal(formatDigits(initialData.digits)));
renderUpdatedAt(initialData.updatedAt);

document.getElementById("saveButton").addEventListener("click", (event) => {
  event.preventDefault();
  persistData();
});

document.getElementById("resetButton").addEventListener("click", (event) => {
  event.preventDefault();
  resetData();
});
