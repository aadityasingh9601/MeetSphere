import express, { urlencoded } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mongoose from "mongoose";
import videoRouter from "./routes/videoRoutes.js";
import userRouter from "./routes/userRoutes.js";
import session from "express-session";
import flash from "connect-flash";
import methodOverride from "method-override";
import dotenv from "dotenv";
import ejsMate from "ejs-mate";
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

main()
  .then((res) => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log(err));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://meetsphere.onrender.com",
    methods: ["GET", "POST"],
  },
});

//const allUsers = {}; //To store information of all users.
const roomData = {}; //To store information of all rooms and their users.

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.existMsg = req.flash("exists");
  res.locals.notfoundMsg = req.flash("notfound");
  res.locals.missingMsg = req.flash("missing");
  res.locals.wrongMsg = req.flash("wrong");
  res.locals.logoutErrMsg = req.flash("logouterr");
  res.locals.logoutSuccessMsg = req.flash("logoutsuccess");
  res.locals.currUser = req.session.user || null;
  next();
});

app.use("/", videoRouter);
app.use("/user", userRouter);

//Defining our error handling middleware.

app.use((err, req, res, next) => {
  let { status = "400", message = "Some error occured." } = err;
  console.log(err);
  res.status(status).render("error.ejs", { message });
  next(err);
});

//Handling socket connections.
io.on("connection", (socket) => {
  console.log(`a user connected with id ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  //Listening for room events.
  socket.on("msg", ({ room, msg, username }) => {
    console.log({ room, msg });
    io.to(room).emit("msg", msg, username); //Emitting to all connected users.
  });

  //Listening for the join-user and saving the user.
  socket.on("join-user", (username, room) => {
    // console.log(username);
    // console.log(room);
    socket.join(room);
    console.log(username, room);

    if (!roomData[room]) {
      roomData[room] = {};
    }

    //Store the userData into the room that they joined.
    roomData[room][username] = { username, id: socket.id };

    console.log(roomData);

    console.log(`Socket ${socket.id} joined room ${room}`);
    //allUsers[username] = { username, id: socket.id }; //Access allUsers key and set it's value.
    io.to(room).emit("joined", roomData[room]); //Informing all that new user joined.
    console.log("triggered");
  });

  //Listening for our offer sent by client and sending it to remote client(2nd client).
  socket.on("offer", ({ from, to, offer, data }) => {
    console.log({ from, to, offer });
    socket.to(data[to].id).emit("offer", { from, to, offer, data });
  });

  //Listening for answer sent by the remote client and sending it to local client(1st client).
  socket.on("answer", ({ from, to, answer, data }) => {
    console.log({ from, to, answer, data });
    socket.to(data[to].id).emit("answer", { from, to, answer, data });
  });

  //Listening for ice candidate(sent by the client) and sending it to the other client(2nd client).
  socket.on("icecandidate", (candidate) => {
    console.log(candidate);
    //broadcast to all clients.
    socket.emit("icecandidate", candidate);
  });

  //Listen for endCall events.
  socket.on("endcall", ({ from, to, data }) => {
    io.to(data[from].id).emit("endcall", { from, to, data });
  });

  socket.on("callEnded", (caller, room) => {
    const [from, to, data] = caller;
    io.to(data[from].id).emit("callEnded", caller);
    io.to(data[to].id).emit("callEnded", caller);
    socket.leave(room);
    roomData[room] = {};
    console.log(roomData);
  });
});

//server.listen to listen to socket http requests too,else it'll not work.
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
