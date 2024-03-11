const express = require("express");
const app = express();
const server = require('http').Server(app);
var session = require('express-session');
const bodyParser = require('body-parser');
const io = require('socket.io')(server,{
    cors: {
        origin: "*"
    },
});
app.use(session({
    secret: 'sanskar',
    resave: true,
    saveUninitialized: true
}));
const {v4:uuidv4} = require('uuid');
const url = require('url');
const { ExpressPeerServer} = require('peer');
const path = require('path');

const peerServer = ExpressPeerServer(server, {debug:true}); //main peer server responsible for signaling as per webtrc
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 
app.use('/public', express.static(path.join(__dirname, "static")));
app.use('/peerjs', peerServer);

//this route will render i.e take u to main intro page index.html
app.get("/" , (req,res) =>{
    res.sendFile(path.join(__dirname, "static", "index.html"));
})

//this route is for those who want to host a meeting with an id and take to /join/meetingid
app.get("/join", (req,res) => {
    req.session.user = req.query.name;
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
        })
    );
    //res.redirect(`http://localhost:3000/join/${uuidv4()}`, {name: req.query.name});
})

//this route is for the ones who want to join hosted meeting by someone with an id "id"
app.get("/joinid", (req,res) => {
    /*res.redirect(
        url.format({
            pathname: req.query.meeting_id,
            query: req.query,
        })
    )*/
    req.session.user = req.query.name;
    res.redirect(`/join/${req.query.meeting_id}`);
    
})

//route to join a room by a user
app.get("/join/:room", (req,res) => {
    res.render("room", {roomid: req.params.room, username: req.session.user});
})

//Socket io server part
//when a user connects to socket.io server
io.on("connection", (socket)=>{
    socket.on("join-room", (roomid, id, name)=>{
        socket.join(roomid);
        setTimeout(()=>{
            socket.to(roomid).emit("user-connected", id, name);
        }, 1000);
        socket.on("messagesend", (msg)=>{
            console.log(msg);
            io.to(roomid).emit("createMessage", msg);
        })
        socket.on("tellname", (name)=>{
            console.log(name);
            io.to(roomid).emit("addName", name);
        })
        socket.on("disconnect", ()=>{
            socket.to(roomid).emit("user-disconnected", id);
        })
    })
});

server.listen(3000);