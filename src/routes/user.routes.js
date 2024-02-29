import { Router } from "express";
import { registerUser} from "../controllers/user.controller.js";

// this is "userRouter = router" , as we have exported in default we can use another name to import.  in our case we have imported router as userRouter
const router = Router()

router.route("/register").post(registerUser)







export default router