//Middleware to check session data exists or not, to ensure user can't access the url directly.

const checkSession = (req, res, next) => {
  console.log("triggered");
  console.log(req.session);
  console.log(req.session.user);
  if (!req.session.user) {
    console.log("No session data");
    res.redirect("/user/login");
  }
  next();
};

export default checkSession;
