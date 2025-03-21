import express, { urlencoded } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mongoose from "mongoose";
import appRouter from "./routes/appRoutes.js";
import userRouter from "./routes/userRoutes.js";
import session from "express-session";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/videoConference");
}

main()
  .then((res) => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log(err));

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

let user;
const allUsers = {}; //To store information of all users.

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "tillu",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use("/", appRouter);
app.use("/user", userRouter);

//Handling socket connections.
io.on("connection", (socket) => {
  console.log(`a user connected with id ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  //Listening for room events.
  socket.on("joinroom", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  //Listening for msg events.
  socket.on("msg", ({ room, msg }) => {
    console.log({ room, msg });
    io.to(room).emit("msg", msg); //Emitting to all connected users.
  });

  //Listening for the join-user and saving the user.
  socket.on("join-user", (username) => {
    allUsers[username] = { username, id: socket.id }; //Access allUsers key and set it's value.
    io.emit("joined", allUsers); //Informing all that new user joined.
  });

  //Listening for our offer sent by client and sending it to remote client(2nd client).
  socket.on("offer", ({ from, to, offer }) => {
    console.log({ from, to, offer });
    socket.to(allUsers[to].id).emit("offer", { from, to, offer });
  });

  //Listening for answer sent by the remote client and sending it to local client(1st client).
  socket.on("answer", ({ from, to, answer }) => {
    console.log({ from, to, answer });
    socket.to(allUsers[to].id).emit("answer", { from, to, answer });
  });

  socket.on("endcall", ({ from, to }) => {
    io.to(allUsers[from].id).emit("endcall", { from, to });
  });

  socket.on("callEnded", (caller) => {
    const [from, to] = caller;
    io.to(allUsers[from].id).emit("callEnded", caller);
    io.to(allUsers[to].id).emit("callEnded", caller);
  });

  //Listening for ice candidate(sent by the client) and sending it to the other client(2nd client).
  socket.on("icecandidate", (candidate) => {
    console.log(candidate);
    //broadcast to all clients.
    socket.emit("icecandidate", candidate);
  });

  //Listen for endCall events.
});

//server.listen to listen to socket http requests too,else it'll not work.
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
