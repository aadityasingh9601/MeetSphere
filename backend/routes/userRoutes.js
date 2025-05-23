import { Router } from "express";
import userController from "../controllers/user.js";
import checkSession from "../utils/Middleware.js";

const router = Router();

router
  .route("/signup")
  .get(userController.renderSignUp)
  .post(userController.postSignUp);

router
  .route("/login")
  .get(userController.renderLogin)
  .post(userController.postLogin);

router.post("/logout", userController.postLogout);

router
  .route("/history")
  .get(checkSession, userController.showHistory)
  .post(userController.postHistory);

router.delete("/history/:id", userController.deleteHistory);

// module.exports = router;  we use this for common modules.

export default router; // we use this for es6 modules.
