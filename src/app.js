import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"




const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Data comes in diffrent form in backends: like in json, body, form, url
// Following to accept the type of data we want to accept to backend

// Accepting json
app.use(express.json({ limit: "16kb" }))

// handle data from url :like %20 for space using url encoder
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// if want to store data in server, usually stores for temperory for this app
app.use(express.static("public")) // public =  files from the "public" directory.

// helps in CRUD operation to user cookies from server, like accessing cookies of user
app.use(cookieParser())


// Router import 
import userRouter from "./routes/user.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"




//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)


export default app 