const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_LENGTH = 100;
const MAX_COMMENTS = 200;
const ALLOWED_STAMPS = ['👍', '❤️', '😂', '😮', '👏'];

// いいねの対象にするため、投稿されたコメントを直近MAX_COMMENTS件だけメモリ上に保持する
const comments = [];
let nextId = 1;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  // 一覧ページを開いたときに、今までの投稿を復元できるようにする
  socket.emit('init', comments);

  socket.on('comment', (data) => {
    // 誰でも投稿できる仕様のため、クライアントの入力チェックを信用せずサーバー側でも整形する
    const name = typeof data?.name === 'string' ? data.name.trim().slice(0, 20) : '';
    const text = typeof data?.text === 'string' ? data.text.trim().slice(0, MAX_LENGTH) : '';

    if (!text) return;

    const comment = { id: nextId++, name, text, likes: 0 };
    comments.push(comment);
    if (comments.length > MAX_COMMENTS) {
      comments.shift();
    }

    io.emit('comment', comment);
  });

  socket.on('like', (data) => {
    const id = Number(data?.id);
    const comment = comments.find((c) => c.id === id);
    if (!comment) return;

    comment.likes += 1;
    io.emit('like', { id: comment.id, likes: comment.likes });
  });

  socket.on('stamp', (data) => {
    // スタンプは決められた絵文字のみ許可し、一覧には残さずその場で流すだけにする
    const emoji = typeof data?.emoji === 'string' ? data.emoji : '';
    if (!ALLOWED_STAMPS.includes(emoji)) return;

    io.emit('stamp', { emoji });
  });
});

server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
