//Middleware to check session data exists or not, to ensure user can't access the url directly.

const checkSession = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/user/login");
  }
  next();
};

export default checkSession;
