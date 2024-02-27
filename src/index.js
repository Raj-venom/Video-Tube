import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";


dotenv.config({
    path: "./.env"
})

// Data Base connection
connectDB()

.then( () => {

    // check if app and mongoDb can talk or not

    app.on("error", (error) =>{
        console.log("app not able to talk to Db ERROR: ", error)
        throw error
    })

    app.get("/", (req, res) =>{
        res.send("<h1> This is home </h1>")
    })

    app.get("/profile", (req, res) =>{
        res.send("this is profile")
    })

    app.get("/data", (req, res) =>{
        
        res.json({ "user": 'raj singh' })
    })

    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })

    console.log(`http://localhost:${process.env.PORT}`)


})
.catch( (err) =>{
    console.log("MONGoDb conncetion Failed !!", err);
})



















/*
    // Another approach for  DB connections

    ; (async () => {

        try {

            const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

            console.log(`Database connected !   DB host: ${connectionInstance.connection.host}`)
            console.log(`\n\nDatabase connected !   DB host: ${connectionInstance.connection.collection}`)

        } catch (error) {
            console.error("MongoDB conncection errror: ", error)
            process.exit(1)
        }
    })()
*/