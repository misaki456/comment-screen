const socket = io();

const history = document.getElementById('comment-history');
const form = document.getElementById('comment-form');
const nameInput = document.getElementById('name');
const textInput = document.getElementById('text');
const submitBtn = document.getElementById('submit-btn');
const charCount = document.getElementById('char-count');
const stampButtons = document.querySelectorAll('.stamp-btn');

const LIKED_KEY = 'comment-screen-liked-ids';

function getLikedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

const likedIds = getLikedIds();

function isScrolledToBottom() {
  return history.scrollHeight - history.scrollTop - history.clientHeight < 40;
}

function updateLikeButton(btn, likes, liked) {
  btn.dataset.likes = likes;
  btn.textContent = `${liked ? '♥' : '♡'} ${likes}`;
  btn.disabled = liked;
  btn.classList.toggle('liked', liked);
}

function createCommentEl(comment) {
  const el = document.createElement('div');
  el.className = 'chat-comment';
  el.dataset.id = comment.id;

  const nameEl = document.createElement('div');
  nameEl.className = 'chat-comment-name';
  nameEl.textContent = comment.name || '名無しさん';

  const textEl = document.createElement('p');
  textEl.className = 'chat-comment-text';
  textEl.textContent = comment.text;

  const likeBtn = document.createElement('button');
  likeBtn.className = 'like-btn';
  updateLikeButton(likeBtn, comment.likes, likedIds.has(comment.id));

  likeBtn.addEventListener('click', () => {
    if (likedIds.has(comment.id)) return;

    socket.emit('like', { id: comment.id });
    likedIds.add(comment.id);
    saveLikedIds(likedIds);
    updateLikeButton(likeBtn, Number(likeBtn.dataset.likes) + 1, true);
  });

  el.appendChild(nameEl);
  el.appendChild(textEl);
  el.appendChild(likeBtn);
  return el;
}

socket.on('init', (comments) => {
  history.innerHTML = '';
  comments.forEach((comment) => history.appendChild(createCommentEl(comment)));
  history.scrollTop = history.scrollHeight;
});

socket.on('comment', (comment) => {
  const shouldStickToBottom = isScrolledToBottom();
  history.appendChild(createCommentEl(comment));
  if (shouldStickToBottom) {
    history.scrollTop = history.scrollHeight;
  }
});

socket.on('like', ({ id, likes }) => {
  const el = history.querySelector(`.chat-comment[data-id="${id}"]`);
  if (!el) return;

  const btn = el.querySelector('.like-btn');
  updateLikeButton(btn, likes, likedIds.has(id));
});

textInput.addEventListener('input', () => {
  charCount.textContent = textInput.value.length;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = textInput.value.trim();
  if (!text) return;

  socket.emit('comment', {
    name: nameInput.value.trim(),
    text,
  });

  textInput.value = '';
  charCount.textContent = '0';

  // 連投を防ぐため、送信直後は1秒だけボタンを押せなくする
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.disabled = false;
  }, 1000);
});

stampButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    socket.emit('stamp', { emoji: btn.dataset.emoji });

    // スタンプの連打を防ぐため、押したボタンだけ0.5秒無効化する
    btn.disabled = true;
    setTimeout(() => {
      btn.disabled = false;
    }, 500);
  });
});
