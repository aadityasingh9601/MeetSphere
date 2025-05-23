import { Router } from "express";
import videoController from "../controllers/video.js";
import checkSession from "../utils/Middleware.js";

const router = Router();

router.get("/", videoController.landing_page);

//Write lobby code here yourself.
router
  .route("/lobby")
  .get(checkSession, videoController.getLobby)

  .post(videoController.postLobby);

router.get("/session-info", videoController.session);

router.get("/videocall", checkSession, videoController.videocall);

// module.exports = router;  we use this for common modules.

export default router; // we use this for es6 modules.
