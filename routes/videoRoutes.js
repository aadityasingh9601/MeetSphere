import express from "express";
import { Router } from "express";
import videoController from "../controllers/video.js";

const router = Router();

router.get("/", videoController.landing_page);

//Write lobby code here yourself.
router
  .route("/lobby")
  .get(videoController.getLobby)

  .post(videoController.postLobby);

router.get("/session-info", videoController.session);

router.get("/videocall", videoController.videocall);

// module.exports = router;  we use this for common modules.

export default router; // we use this for es6 modules.
