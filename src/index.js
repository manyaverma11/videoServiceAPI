//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

const port = process.env.PORT || 3000;

dotenv.config({ path: "./env" });

connectDB();

/*

import express from "express"
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=> {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(port, () => {
            console.log(`App is listening on port ${port}`)
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
}) ()

*/
