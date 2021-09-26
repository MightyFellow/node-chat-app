const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
} = require("../src/utils/users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath)); //to server up public folder

// let count = 0;
const greeting = "Welcome!!!";

io.on("connection", (socket) => {
  //to send an event from server to client we use emit
  //   socket.emit("countUpdated", count);

  //   //listen to the event from the client
  //   socket.on("increment", () => {
  //     count++;
  //     // socket.emit("countUpdated", count); //emit only emits event to only one specific connection
  //     io.emit("countUpdated", count); //emits event to all the connections or client
  //   });
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", greeting));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
    // io.to.emit, socket.broadcast.to.emit
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
    }
    callback();
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    const URL = `https://google.com/maps?q=${latitude},${longitude}`;
    if (user) {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage(user.username, URL)
      );
    }
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port http://localhost:${port}`);
});
