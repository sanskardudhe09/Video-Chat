
const socket = io('*', transports = ["websocket", "polling"]);
const chat_window = document.getElementById('chat_window');
const user_videos = document.getElementById('user_videos');
const myvideo = document.createElement('video');
const main_chat = document.getElementById('main_chat');
var userId = "";
main_chat.hidden = true;
myvideo.muted = true;
var otheruser = "";

window.onload = ()=>{
    $(document).ready(()=>{
        $('#modalindex').modal("show");
    })
}
var peer = new Peer( {
    path: "/peerjs",
    port: 3000
})

let myvideostream;
let peers = {}, currentPeer = [];
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

//func to send and handle messages on message chat window
const sendmessage = (text)=>{
    if(event.key === "Enter" && text.value != ""){
        socket.emit("messagesend", myname + ":  " + text.value);
        text.value = "";
        chat_window.scrollTop = chat_window.scrollHeight;
    }
}
navigator.mediaDevices.getUserMedia({
    audio: true,
    video:true,
}).then((stream)=>{
    myvideostream = stream;
    addVideoStream(myvideo, stream, myname);
    peer.on("call", (call)=>{
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", function(remotestream){
            addVideoStream(video, remotestream, otheruser);
        })
    });
    socket.on("user-connected", (id, username)=>{
        userId = id;
        connectNewUser(id, stream, username);
        socket.emit("tellname", myname);
    })
    socket.on("user-disconnected", (id)=>{
        //console.log(peers) //for debugging purpose
        if(peers[id]) peers[id].close();
    })
})
peer.on("open", (id)=>{
    socket.emit("join-room", roomId, id, myname);
})
//when a user gets a call;

const showchat = () => {
    if(main_chat.hidden == false){
        main_chat.hidden = true;
    }else{
        main_chat.hidden = false;
    }
};

const showinvite = ()=> {
    $("#modalindex").modal("show");
}

const closemodal = () => {
    $("#modalindex").modal("hide");
}

const copy = async () => {
    const roomid = document.getElementById("roomid").innerText;
    //making a copy of meeting id so that the host can make other users join the meet
    await navigator.clipboard.writeText(roomId);
}

socket.on("addName", (name)=>{
    otheruser = name;
    //console.log(name);
})

socket.on("createMessage", (msg) => {
    var ul = document.getElementById("messages");
    var li = document.createElement("li");
    li.className = "user_message";
    li.appendChild(document.createTextNode(msg));
    ul.append(li);
})
const muteUnmuteAudio = () => {
    const enabled_audio = myvideostream.getAudioTracks()[0].enabled;
    if(enabled_audio){
        myvideostream.getAudioTracks()[0].enabled = false;  //mute audio
        document.getElementById("mic").style.color = "red";
    }else{
        myvideostream.getAudioTracks()[0].enabled = true;  //unmute audio
        document.getElementById("mic").style.color = "white";
    }
}

const muteUnmuteVideo = () => {
    const enabled_video = myvideostream.getVideoTracks()[0].enabled;
    if(enabled_video){
        myvideostream.getVideoTracks()[0].enabled = false; //close the video
        document.getElementById("video").style.color = "red";
    }else{
        myvideostream.getVideoTracks()[0].enabled = true;  //turn on the video
        document.getElementById("video").style.color = "white";
    }
}


const connectNewUser = (userId, userStream, myname) => {
    const call = peer.call(userId, userStream);  //calling the other user id with our stream
    //console.log("I called " + userId);
    const video = document.createElement("video");
    call.on("stream", (userstream)=>{
        addVideoStream(video, userstream, myname);
    })
    call.on("close", ()=>{
        video.remove();
        removeIdleVideos();
    })
    peers[userId] =  call;
    currentPeer.push(call.peerConnection);
}

const removeIdleVideos = () => {
    let allvideos = user_videos.getElementsByTagName("div");
    for(let i = 0; i < allvideos.length; i++){
        let len = allvideos[i].getElementsByTagName("video").length;
        //console.log(allvideos[i]);
        if(len == 0){
            allvideos[i].remove();
        }
    }
    let len = document.getElementsByTagName("video").length;
    if(len > 1){
        for(let i = 0; i < len; i++){
            document.getElementsByTagName("video")[i].style.width = ((100 / len) + 25) + "%";
            //console.log(document.getElementsByClassName("user_video")[i]);
        }
    }
}
const addVideoStream = (videoEle, stream, name) => {
    videoEle.srcObject = stream;
    videoEle.addEventListener("loadedmetadata", ()=>{
        videoEle.play();
    })
    const h1 = document.createElement("h1");
    const h1name = document.createTextNode(name);
    h1.appendChild(h1name);
    const userVideo = document.createElement("div");
    userVideo.classList.add("user_video");
    //userVideo.appendChild(h1);
    userVideo.append(videoEle);
    userVideo.appendChild(h1);
    user_videos.appendChild(userVideo);
    //console.log(user_videos);
    removeIdleVideos();
    /*let len = document.getElementsByTagName("video").length;
    if(len > 1){
        for(let i = 0; i < len; i++){
            document.getElementsByClassName("user_video")[i].style.width = (100 / len) + "%";
            console.log(document.getElementsByClassName("user_video")[i]);
        }
    }*/
}