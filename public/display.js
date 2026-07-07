const socket = io();
const stage = document.getElementById('danmaku-stage');

const LANE_COUNT = 12; // 画面を縦に何段に分けてコメントを流すか

let laneIndex = 0;

socket.on('comment', ({ name, text }) => {
  const el = document.createElement('div');
  el.className = 'danmaku-comment';

  if (name) {
    const nameEl = document.createElement('span');
    nameEl.className = 'danmaku-name';
    nameEl.textContent = name;
    el.appendChild(nameEl);
  }

  const textEl = document.createElement('span');
  textEl.className = 'danmaku-text';
  textEl.textContent = text;
  el.appendChild(textEl);

  // レーンを順番に割り振ることで、複数コメントの縦方向の重なりを避ける
  const lane = laneIndex % LANE_COUNT;
  laneIndex += 1;
  el.style.top = `${(lane / LANE_COUNT) * 100}%`;

  // 長いコメントほど流れる時間を長くして、読み終える前に消えないようにする
  const duration = 10 + text.length * 0.12;
  el.style.animationDuration = `${duration}s`;

  stage.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
});

socket.on('stamp', ({ emoji }) => {
  const el = document.createElement('div');
  el.className = 'danmaku-stamp';
  el.textContent = emoji;

  const lane = laneIndex % LANE_COUNT;
  laneIndex += 1;
  el.style.top = `${(lane / LANE_COUNT) * 100}%`;
  el.style.animationDuration = '8s';

  stage.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
});
