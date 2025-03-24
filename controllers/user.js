import httpStatus from "http-status";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import crypto from "crypto";
import userSchema from "../schema.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";

//let participants = [];

const renderSignUp = (req, res) => {
  res.render("users/signup.ejs");
};

const postSignUp = wrapAsync(async (req, res) => {
  const { name, username, password } = req.body;
  console.log(req.body);
  const { error } = userSchema.validate(req.body);
  console.log(error);

  if (error) {
    throw new ExpressError(httpStatus.BAD_REQUEST, "Validation failed");
  }
  if (!error) {
    let existingUser = await User.findOne({ username: username });

    if (existingUser) {
      req.flash("exists", "Username already exists!");
      res.redirect("/user/signup");
      // return res
      //   .status(httpStatus.FOUND)
      //   .json({ message: "Username already exists" });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser
      .save()
      .then((response) => {
        console.log(response);
        req.flash("success", "user registered successfully!");
        res.redirect("/user/login");
        // return (
        //   res
        //     // .status(httpStatus.CREATED)
        //     .json({ message: "User created successfully" })
        // );
      })
      .catch((err) => {
        console.log(err);
        req.flash("error", "User registration failed");
        // return res
        //   .status(httpStatus.INTERNAL_SERVER_ERROR)
        //   .json({ message: "Error saving user" });
      });
  }
});

const renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

const postLogin = wrapAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    // res.json({ message: "Please provide both username and password" });
    req.flash("missing", "Please provide both username and password");
    res.redirect("/user/login");
  }

  try {
    const user = await User.findOne({ username: username }); //Don't use User.find, else a array will be returned &error will occur.

    if (!user) {
      req.flash("notfound", "User doesn't exist.");
      res.redirect("/user/login");
    }

    const match = await bcrypt.compare(password, user.password);
    // console.log(match);

    if (match) {
      const token = crypto.randomBytes(20).toString("hex");
      console.log(token);
      user.token = token; //Assign a token to the user.

      //Storing information in our session.
      req.session.user = { username: user.username, userId: user._id };
      req.session.cookie.expires = new Date(Date.now() + 86400000);
      req.session.cookie.maxAge = 86400000;
      console.log(req.session);
      await user.save().then((res) => {
        console.log(res);
      });
      res.redirect("/lobby");
      //return res.status(httpStatus.OK).json({ token: token });
    }
    if (!match) {
      req.flash("wrong", "Incorrect Password");
      res.redirect("/user/login");
    }
  } catch (e) {
    console.log(e);
    // res.json({ message: "Something went wrong" });
  }
});

const postLogout = wrapAsync(async (req, res) => {
  //If user is logging out, destroy the session.
  if (req.session.user) {
    await req.session.destroy((err) => {
      if (err) {
        res.redirect("/");
      }
      res.redirect("/");
    });
  }
});

const showHistory = wrapAsync(async (req, res) => {
  const user = await User.findOne({
    username: req.session.user.username,
  }).populate("history");
  const meetings = user.history;

  res.render("users/history.ejs", { meetings });
});

const postHistory = wrapAsync(async (req, res) => {
  console.log("received");
  const { caller, room } = req.body;

  const user1 = await User.findOne({ username: caller[0] });
  const user2 = await User.findOne({ username: caller[1] });
  // console.log("executed");

  const newMeeting = new Meeting({
    meetingCode: room,
    participants: [caller[0], caller[1]],
  });
  await newMeeting.save().then((res) => {
    console.log(res);
  });

  user1.history.push(newMeeting);
  await user1.save();

  user2.history.push(newMeeting);
  await user2.save();
  //Save changes to the current user's database.
});

const deleteHistory = wrapAsync(async (req, res) => {
  const meetingId = req.params.id;

  //Delete the meetingId from the user's database.
  await User.findByIdAndUpdate(req.session.user.userId, {
    $pull: { history: meetingId },
  });

  const meeting = await Meeting.findById(meetingId);

  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  // If user already marked it as deleted, prevent duplicate entry
  if (meeting.deletedBy.includes(req.session.user.userId)) {
    return res.status(400).json({ message: "Already deleted by this user" });
  }

  //Add the user to the deletedBy array.
  meeting.deletedBy.push(req.session.user.userId);
  await meeting.save();

  //If both participants have deleted the meeting, delete it from the database too.
  if (meeting.participants.length === meeting.deletedBy.length) {
    await Meeting.deleteOne({ _id: meetingId });
    console.log("deleted meeting");
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
