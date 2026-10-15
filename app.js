const palette = ["#ffb4a2", "#ffd86b", "#8edfc7", "#8dd7f0", "#b7a5ed", "#ffb27d"];
const storageKey = "menu-wheel-state-v1";
const defaultPresets = [
  { id: "campus", name: "학식 메뉴", items: [
    { name: "한식 뷔페", emoji: "🍚" }, { name: "돈까스", emoji: "🍛" }, { name: "비빔밥", emoji: "🥗" },
    { name: "라면·김밥", emoji: "🍜" }, { name: "샐러드", emoji: "🥬" }, { name: "제육덮밥", emoji: "🍳" },
  ] },
  { id: "street", name: "학교 앞 맛집", items: [
    { name: "떡볶이", emoji: "🍢" }, { name: "국밥", emoji: "🍲" }, { name: "마라탕", emoji: "🥘" },
    { name: "치킨", emoji: "🍗" }, { name: "햄버거", emoji: "🍔" }, { name: "쌀국수", emoji: "🍜" },
  ] },
  { id: "late", name: "자취방 야식", items: [
    { name: "치킨", emoji: "🍗" }, { name: "피자", emoji: "🍕" }, { name: "족발", emoji: "🍖" },
    { name: "라면", emoji: "🍜" }, { name: "곱창", emoji: "🥘" }, { name: "편의점 털기", emoji: "🍙" },
  ] },
].map((preset) => ({
  ...preset,
  items: preset.items.map((item, index) => ({ ...item, weight: 1, color: palette[index % palette.length] })),
}));

function createDefaultState() {
  return {
    presets: defaultPresets.map((preset) => ({ ...preset, items: preset.items.map((item) => ({ ...item })) })),
    currentPresetId: defaultPresets[0].id,
  };
}

function createId() {
  return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePreset(preset, index) {
  const fallback = defaultPresets[index % defaultPresets.length];
  const items = Array.isArray(preset?.items) ? preset.items.slice(0, 20).map((item, itemIndex) => ({
    name: String(item.name || "메뉴").trim().slice(0, 32) || "메뉴",
    emoji: String(item.emoji || "🍽️"),
    weight: Math.max(1, Math.min(20, Math.round(Number(item.weight) || 1))),
    color: /^#[\da-f]{6}$/i.test(item.color) ? item.color : palette[itemIndex % palette.length],
  })) : [];
  return {
    id: typeof preset.id === "string" && preset.id ? preset.id : createId(),
    name: String(preset.name || fallback.name).trim().slice(0, 32) || fallback.name,
    items: items.length >= 2 ? items : fallback.items.map((item) => ({ ...item })),
  };
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.presets) && saved.presets.length) {
      const restoredPresets = saved.presets.map(normalizePreset);
      const activePreset = restoredPresets.find((preset) => preset.id === saved.currentPresetId);
      return { presets: restoredPresets, currentPresetId: activePreset?.id || restoredPresets[0].id };
    }
  } catch {
    return createDefaultState();
  }
  return createDefaultState();
}

const savedState = loadSavedState();
let presets = savedState.presets;
let currentPresetId = savedState.currentPresetId;

const canvas = document.querySelector("#wheel");
const context = canvas.getContext("2d");
const menuList = document.querySelector("#menu-list");
const menuCaption = document.querySelector("#menu-caption");
const itemCount = document.querySelector("#item-count");
const spinButton = document.querySelector("#spin-button");
const spinHint = document.querySelector("#spin-hint");
const resultDialog = document.querySelector("#result-dialog");
const resultTitle = document.querySelector("#result-title");
const presetSelect = document.querySelector("#preset-select");
const deletePresetButton = document.querySelector("#delete-preset");
const savePresetForm = document.querySelector("#save-preset-form");
const newPresetName = document.querySelector("#new-preset-name");
const addItemForm = document.querySelector("#add-item-form");
const newItemName = document.querySelector("#new-item-name");

let rotation = 0;
let isSpinning = false;
let selectedIndex = 0;

function getCurrentPreset() {
  return presets.find((preset) => preset.id === currentPresetId) || presets[0];
}

function getItems() {
  return getCurrentPreset().items;
}

function saveState(message) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ presets, currentPresetId }));
    if (message) spinHint.textContent = message;
  } catch {
    spinHint.textContent = "저장 공간에 접근할 수 없어요.";
  }
}

function renderPresetOptions() {
  const options = presets.map((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    return option;
  });
  presetSelect.replaceChildren(...options);
  presetSelect.value = currentPresetId;
  deletePresetButton.disabled = presets.length <= 1;
}

function drawWheel() {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const size = bounds.width;
  canvas.width = Math.round(size * pixelRatio);
  canvas.height = Math.round(size * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);

  const items = getItems();
  const center = size / 2;
  const radius = size / 2 - 3;
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  const startAt = -Math.PI / 2 + rotation;
  let passedWeight = 0;

  items.forEach((item, index) => {
    const start = startAt + (passedWeight / totalWeight) * Math.PI * 2;
    const end = startAt + ((passedWeight + item.weight) / totalWeight) * Math.PI * 2;
    const slice = end - start;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = item.color;
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, .96)";
    context.lineWidth = 3;
    context.stroke();

    const middle = start + slice / 2;
    const textRadius = radius * 0.62;
    const fontSize = Math.max(11, Math.min(16, size * 0.041));
    context.save();
    context.translate(center + Math.cos(middle) * textRadius, center + Math.sin(middle) * textRadius);
    context.fillStyle = "#282849";
    context.font = `900 ${fontSize}px 'Apple SD Gothic Neo', sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const maxTextWidth = Math.min(size * 0.3, radius * Math.sin(slice / 2) * 1.55);
    const lines = [];
    let line = "";
    for (const character of item.name) {
      if (line && context.measureText(line + character).width > maxTextWidth) {
        lines.push(line.trim());
        line = character.trimStart();
      } else {
        line += character;
      }
    }
    if (line) lines.push(line.trim());
    const lineHeight = fontSize * 1.15;
    lines.forEach((text, lineIndex) => {
      const offset = (lineIndex - (lines.length - 1) / 2) * lineHeight;
      context.fillText(text, 0, offset, maxTextWidth);
    });
    context.restore();
    passedWeight += item.weight;
  });
}

function renderMenu() {
  const items = getItems();
  menuCaption.textContent = `${getCurrentPreset().name} 메뉴 · 가중치와 색상을 조정할 수 있어요`;
  itemCount.textContent = String(items.length);
  menuList.replaceChildren(...items.map((item, index) => {
    const row = document.createElement("li");
    row.className = "menu-item";
    row.dataset.index = String(index);

    const nameInput = document.createElement("input");
    nameInput.className = "item-name-input";
    nameInput.type = "text";
    nameInput.maxLength = 32;
    nameInput.value = item.name;
    nameInput.dataset.field = "name";
    nameInput.setAttribute("aria-label", `메뉴 ${index + 1} 이름`);

    const weightInput = document.createElement("input");
    weightInput.className = "item-weight-input";
    weightInput.type = "number";
    weightInput.min = "1";
    weightInput.max = "20";
    weightInput.step = "1";
    weightInput.value = String(item.weight);
    weightInput.dataset.field = "weight";
    weightInput.setAttribute("aria-label", `${item.name} 가중치`);

    const colorInput = document.createElement("input");
    colorInput.className = "item-color-input";
    colorInput.type = "color";
    colorInput.value = item.color;
    colorInput.dataset.field = "color";
    colorInput.setAttribute("aria-label", `${item.name} 색상`);

    const removeButton = document.createElement("button");
    removeButton.className = "item-remove-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.disabled = items.length <= 2;
    removeButton.setAttribute("aria-label", `${item.name} 삭제`);

    row.append(nameInput, weightInput, colorInput, removeButton);
    return row;
  }));
  newItemName.disabled = items.length >= 20;
  addItemForm.querySelector("button").disabled = items.length >= 20;
  drawWheel();
}

function chooseWinner() {
  const items = getItems();
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  let selectedWeight = Math.random() * totalWeight;
  for (let index = 0; index < items.length; index += 1) {
    selectedWeight -= items[index].weight;
    if (selectedWeight < 0) return index;
  }
  return items.length - 1;
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  spinButton.disabled = true;
  spinHint.textContent = "두근두근… 결과를 고르는 중!";
  selectedIndex = chooseWinner();

  const items = getItems();
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  const passedWeight = items.slice(0, selectedIndex).reduce((total, item) => total + item.weight, 0);
  const winnerCenter = ((passedWeight + items[selectedIndex].weight / 2) / totalWeight) * Math.PI * 2;
  const targetOffset = ((-winnerCenter - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const startRotation = rotation;
  const endRotation = rotation + Math.PI * 2 * 6 + targetOffset;
  const startTime = performance.now();
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 4200;

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (endRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation %= Math.PI * 2;
    isSpinning = false;
    spinButton.disabled = false;
    spinHint.textContent = "오늘의 메뉴가 정해졌어요!";
    resultTitle.textContent = getItems()[selectedIndex].name;
    resultDialog.showModal();
  }

  requestAnimationFrame(animate);
}

presetSelect.addEventListener("change", () => {
  if (isSpinning) return;
  currentPresetId = presetSelect.value;
  rotation = 0;
  renderMenu();
  saveState(`${getCurrentPreset().name} 프리셋을 불러왔어요.`);
});

savePresetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newPresetName.value.trim();
  if (!name) return;
  const source = getCurrentPreset();
  const preset = normalizePreset({ id: createId(), name: name.trim(), items: source.items.map((item) => ({ ...item })) }, presets.length);
  presets.push(preset);
  currentPresetId = preset.id;
  newPresetName.value = "";
  renderPresetOptions();
  renderMenu();
  saveState(`${preset.name} 프리셋을 저장했어요.`);
});

deletePresetButton.addEventListener("click", () => {
  if (presets.length <= 1) return;
  const removedName = getCurrentPreset().name;
  presets = presets.filter((preset) => preset.id !== currentPresetId);
  currentPresetId = presets[0].id;
  rotation = 0;
  renderPresetOptions();
  renderMenu();
  saveState(`${removedName} 프리셋을 삭제했어요.`);
});

addItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newItemName.value.trim();
  const items = getItems();
  if (!name || items.length >= 20) return;
  items.push({ name, emoji: "🍽️", weight: 1, color: palette[items.length % palette.length] });
  newItemName.value = "";
  renderMenu();
  saveState(`${name} 메뉴를 추가했어요.`);
});

menuList.addEventListener("input", (event) => {
  const input = event.target;
  const row = input.closest(".menu-item");
  if (!row || input.dataset.field !== "name") return;
  const item = getItems()[Number(row.dataset.index)];
  if (!item) return;
  item.name = input.value;
  drawWheel();
  saveState("");
});

menuList.addEventListener("change", (event) => {
  const input = event.target;
  const row = input.closest(".menu-item");
  if (!row) return;
  const item = getItems()[Number(row.dataset.index)];
  if (!item) return;

  if (input.dataset.field === "name") {
    item.name = input.value.trim().slice(0, 32) || "메뉴";
    renderMenu();
  } else if (input.dataset.field === "weight") {
    item.weight = Math.max(1, Math.min(20, Math.round(Number(input.value) || 1)));
    input.value = String(item.weight);
    drawWheel();
  } else if (input.dataset.field === "color") {
    item.color = input.value;
    drawWheel();
  }
  saveState("메뉴 변경사항을 저장했어요.");
});

menuList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".item-remove-button");
  if (!removeButton || getItems().length <= 2) return;
  const row = removeButton.closest(".menu-item");
  const [removedItem] = getItems().splice(Number(row.dataset.index), 1);
  renderMenu();
  saveState(`${removedItem.name} 메뉴를 삭제했어요.`);
});

spinButton.addEventListener("click", spin);
document.querySelector("#spin-again").addEventListener("click", () => {
  resultDialog.close();
  spin();
});
document.querySelector("#close-dialog").addEventListener("click", () => resultDialog.close());
document.querySelector("#dismiss-dialog").addEventListener("click", () => resultDialog.close());
resultDialog.addEventListener("click", (event) => {
  if (event.target === resultDialog) resultDialog.close();
});
window.addEventListener("resize", drawWheel);

renderPresetOptions();
renderMenu();