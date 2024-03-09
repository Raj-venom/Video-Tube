import { Router } from "express";
import { healthcheck, healthcheckWithMessage } from "../controllers/healthcheck.controller.js"

const router = Router()

router.route('/').get(healthcheck)
router.route('/message/').post(healthcheckWithMessage)


export default router