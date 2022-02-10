//imprting
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1295016",
    key: "bc5dd3aaeb6d9927aba9",
    secret: "58929f62b5844d5dc461",
    cluster: "eu",
    useTLS: true
  });
//middleware
app.use(express.json());

app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});
//DB config 
const connection_url = "mongodb+srv://admin:sYdgMaiRLLexE5X3@cluster0.mdb7d.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}); 

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");
    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on("change", (change) => {
        console.log(change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log("Error triggering pusher");
        }
    });
});
//api routes

app.get('/',(req,res)=>res.status(200).send('hello World'));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});
//listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));