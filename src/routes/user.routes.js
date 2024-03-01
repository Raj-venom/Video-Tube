import Router from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


// this is "userRouter = router" , as we have exported in default we can use another name to import.  in our case we have imported router as userRouter
const router = Router()


// router.route("/register").post(registerUser)


router.route("/register").post(
    
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)





export default router 