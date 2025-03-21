import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";
let room;

const home = (req, res) => {
  res.render("home.ejs");
};

const getLobby = (req, res) => {
  res.render("lobby.ejs");
};

const postLobby = (req, res) => {
  room = req.body.room;
  res.redirect("/videocall");
};

const videocall = (req, res) => {
  res.render("videocall.ejs");
};

const session = (req, res) => {
  // Respond with specific session data
  res.json({ username: req.session.user, room });
  // Include any other non-sensitive data you need to expose
};

export default { home, getLobby, postLobby, videocall, session };
