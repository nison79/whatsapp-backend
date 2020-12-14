// importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'

import Pusher from 'pusher'

import cors from 'cors'

//app config

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1123024",
    key: "97e3b4bea456b061e2a6",
    secret: "5850671c5719800686ff",
    cluster: "eu",
    useTLS: true
});





//middleware
app.use(express.json());
app.use(cors());



//DB config
const connection_url = 'mongodb+srv://admin:MvaVKgn0VZRn5I9v@cluster0.d2icb.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url , {
    userCreateIndex:true,
    userNewParser:true,
    useUnifiedTopology:true
});



//????
const db = mongoose.connection

db.once('open' , () => {
    console.log('db connected');

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch();

    changeStream.on('change' , (change) => {
        console.log('A change occured' , change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages' , 'inserted',
            
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }
    });
});



//api routes
app.get('/' , (req,res) => res.status(200).send('hello there'));


app.get('/messages/sync' , (req ,res) =>{
    Messages.find((err,data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    });
});


app.post('/messages/new' , (req ,res ) => {
    const dbMessage = req.body

    Messages.create(dbMessage , (err , data ) => {
        if (err) {
            res.status(500).send(err)
        }else {
            res.status(201).send(data)
        }
    });
});



//listen
app.listen(port, () =>console.log(`Listening on localhost:${port}`));


