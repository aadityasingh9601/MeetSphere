import httpStatus from "http-status";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import userSchema from "../schema.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";

//let participants = [];

const renderSignUp = (req, res) => {
  res.render("users/signup.ejs");
};

const postSignUp = wrapAsync(async (req, res) => {
  const { name, username, password } = req.body;
  const { error } = userSchema.validate(req.body);
  console.log(error);
  if (error) {
    //throw new ExpressError(httpStatus.BAD_REQUEST, "Validation failed");
    req.flash("wrong", error.details[0].message);
    return res.redirect("/user/signup");
  }

  let existingUser = await User.findOne({ username: username });

  if (existingUser) {
    req.flash("exists", "User already exists!");
    return res.redirect("/user/signup");
  }

  let hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name: name,
    username: username,
    password: hashedPassword,
  });

  await newUser.save();
  req.flash("success", "User registered successfully!");
  res.redirect("/user/login");
  // return (
  //   res
  //     // .status(httpStatus.CREATED)
  //     .json({ message: "User created successfully" })
  // );
});

const renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

const postLogin = wrapAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash("missing", "Please provide both username and password");
    return res.redirect("/user/login");
  }

  const user = await User.findOne({ username: username });
  if (!user) {
    req.flash("notfound", "User doesn't exist.");
    return res.redirect("/user/login");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    req.flash("wrong", "Incorrect Password");
    return res.redirect("/user/login");
  }

  //Storing information in our session. We're just modifiying the session here, an empty session is
  //already created by the app.use session middleware and the session id is stored in the browser, as
  //it's the default behavior of express sessions, here we're just modifying our session, so, don't get
  //confused, how cookie is created and session object is created without every logging in.
  req.session.user = { username: user.username, userId: user._id };
  req.session.cookie.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
  await user.save();
  res.redirect("/lobby");
});

const postLogout = wrapAsync(async (req, res) => {
  //If there's no session, there's nothing to log out of.
  if (!req.session) {
    return res.redirect("/user/login");
  }
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Could not log out.");
    }
    res.clearCookie("connect.sid");
    res.redirect("/user/login");
  });
});

const showHistory = wrapAsync(async (req, res) => {
  const user = await User.findOne({
    username: req.session.user.username,
  }).populate({
    path: "history",
    options: { sort: { date: -1 } },
  });
  const meetings = user.history;

  res.render("users/history.ejs", { meetings });
});

const postHistory = wrapAsync(async (req, res) => {
  const { caller, room } = req.body;
  const user1 = await User.findOne({ username: caller[0] });
  const user2 = await User.findOne({ username: caller[1] });
  const newMeeting = new Meeting({
    meetingCode: room,
    participants: [caller[0], caller[1]],
  });
  await newMeeting.save();

  user1.history.push(newMeeting);
  await user1.save();

  user2.history.push(newMeeting);
  await user2.save();
});

const deleteHistory = wrapAsync(async (req, res) => {
  const meetingId = req.params.id;
  //Delete the meetingId from the user's database.
  await User.findByIdAndUpdate(req.session.user.userId, {
    $pull: { history: meetingId },
  });
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  if (meeting.deletedBy.includes(req.session.user.userId)) {
    return res.status(400).json({ message: "Already deleted by this user" });
  }

  meeting.deletedBy.push(req.session.user.userId);
  await meeting.save();
  //If both participants have deleted the meeting, delete it from the database too.
  if (meeting.participants.length === meeting.deletedBy.length) {
    await Meeting.deleteOne({ _id: meetingId });
  }
  res.redirect("/user/history");
});

export default {
  renderSignUp,
  postSignUp,
  renderLogin,
  postLogin,
  postLogout,
  showHistory,
  postHistory,
  deleteHistory,
};
