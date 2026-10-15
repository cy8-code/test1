const palette = ["#ffb4a2", "#ffd86b", "#8edfc7", "#8dd7f0", "#b7a5ed", "#ffb27d"];

const presets = {
  campus: {
    caption: "든든하고 맛있는 학식 메뉴",
    items: [
      { name: "한식 뷔페", tag: "든든 한식", emoji: "🍚" },
      { name: "돈까스", tag: "바삭바삭", emoji: "🍛" },
      { name: "비빔밥", tag: "건강 한 끼", emoji: "🥗" },
      { name: "라면·김밥", tag: "분식", emoji: "🍜" },
      { name: "샐러드", tag: "가벼운 한 끼", emoji: "🥬" },
      { name: "제육덮밥", tag: "매콤 메뉴", emoji: "🍳" },
    ],
  },
  street: {
    caption: "학교 앞에서 찾는 인기 메뉴",
    items: [
      { name: "떡볶이", tag: "분식", emoji: "🍢" },
      { name: "국밥", tag: "뜨끈 한 그릇", emoji: "🍲" },
      { name: "마라탕", tag: "얼얼하게", emoji: "🥘" },
      { name: "치킨", tag: "바삭바삭", emoji: "🍗" },
      { name: "햄버거", tag: "든든하게", emoji: "🍔" },
      { name: "쌀국수", tag: "따뜻한 면", emoji: "🍜" },
    ],
  },
  late: {
    caption: "야식은 역시 참기 어렵지",
    items: [
      { name: "치킨", tag: "국민 야식", emoji: "🍗" },
      { name: "피자", tag: "같이 먹자", emoji: "🍕" },
      { name: "족발", tag: "쫄깃 메뉴", emoji: "🍖" },
      { name: "라면", tag: "후루룩", emoji: "🍜" },
      { name: "곱창", tag: "오늘은 특별히", emoji: "🥘" },
      { name: "편의점 털기", tag: "골라 담기", emoji: "🍙" },
    ],
  },
};

const canvas = document.querySelector("#wheel");
const context = canvas.getContext("2d");
const menuList = document.querySelector("#menu-list");
const menuCaption = document.querySelector("#menu-caption");
const itemCount = document.querySelector("#item-count");
const spinButton = document.querySelector("#spin-button");
const spinHint = document.querySelector("#spin-hint");
const resultDialog = document.querySelector("#result-dialog");
const resultTitle = document.querySelector("#result-title");

let currentPreset = "campus";
let rotation = 0;
let isSpinning = false;
let selectedIndex = 0;

function getItems() {
  return presets[currentPreset].items;
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
  const slice = (Math.PI * 2) / items.length;
  const startAt = -Math.PI / 2 + rotation;

  items.forEach((item, index) => {
    const start = startAt + slice * index;
    const end = start + slice;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = palette[index % palette.length];
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, .96)";
    context.lineWidth = 3;
    context.stroke();

    const middle = start + slice / 2;
    const textRadius = radius * 0.67;
    const fontSize = Math.max(11, Math.min(16, size * 0.041));
    context.save();
    context.translate(center + Math.cos(middle) * textRadius, center + Math.sin(middle) * textRadius);
    context.rotate(middle + Math.PI / 2);
    context.fillStyle = "#282849";
    context.font = `900 ${fontSize}px 'Apple SD Gothic Neo', sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const label = item.name.length > 7 ? `${item.name.slice(0, 6)}…` : item.name;
    context.fillText(label, 0, 0, size * 0.25);
    context.restore();
  });
}

function renderMenu() {
  const items = getItems();
  menuCaption.textContent = presets[currentPreset].caption;
  itemCount.textContent = String(items.length);
  menuList.replaceChildren(...items.map((item, index) => {
    const row = document.createElement("li");
    row.className = "menu-item";
    row.innerHTML = `<span class="menu-color" style="--item-color:${palette[index % palette.length]}"></span><span class="menu-name">${item.emoji} ${item.name}</span><span class="menu-tag">${item.tag}</span>`;
    return row;
  }));
  drawWheel();
}

function chooseWinner() {
  return Math.floor(Math.random() * getItems().length);
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  spinButton.disabled = true;
  spinHint.textContent = "두근두근… 결과를 고르는 중!";
  selectedIndex = chooseWinner();

  const slice = (Math.PI * 2) / getItems().length;
  const targetOffset = ((-(selectedIndex + 0.5) * slice - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
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

document.querySelectorAll(".preset-chip").forEach((button) => {
  button.addEventListener("click", () => {
    if (isSpinning || button.dataset.preset === currentPreset) return;
    currentPreset = button.dataset.preset;
    rotation = 0;
    document.querySelectorAll(".preset-chip").forEach((chip) => {
      const isActive = chip === button;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    spinHint.textContent = "버튼을 눌러 오늘의 메뉴를 골라보세요";
    renderMenu();
  });
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

renderMenu();