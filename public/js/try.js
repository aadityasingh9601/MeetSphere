let callBtn = document.querySelector("#callButton");
let localVideo = document.querySelector("#localVideo");
let remoteVideo = document.querySelector("#remoteVideo");
// let input = document.getElementById("room");
// let joinBtn = document.getElementById("joinButton");
let msgInput = document.querySelector(".msginput");
let sendBtn = document.querySelector(".send");
let chats = document.querySelector(".chats");
let memberList = document.querySelector("#memberList");
let endCallBtn = document.querySelector("#endCallBtn");
let video = document.querySelector("#video");
let videoo = document.querySelector("#videoo");
let audio = document.querySelector("#audio");
let audioo = document.querySelector("#audioo");
let chatBox = document.querySelector(".chatBox");
let chatBtn = document.querySelector("#chatBtn");
let screen = document.querySelector("#screen");
let ham = document.querySelector(".ham");
let members = document.querySelector(".members");

let localStream;
let username;
let caller = [];
let stream;

let room;

const fetchData = async () => {
  await fetch("http://localhost:3000/session-info")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data.username.username);
      console.log(data.room);
      username = data.username.username;
      room = data.room;
      joinUser();
    })
    .catch((err) => {
      console.log(`Error fetching data ${err}`);
    });
};

fetchData();

const socket = io();

ham.addEventListener("click", () => {
  console.log("clicked");
  members.classList.toggle("remove");
});

screen.addEventListener("click", () => {
  captureScreen();
});

chatBtn.addEventListener("click", () => {
  chatBox.classList.toggle("remove");
});

video.addEventListener("click", () => {
  video.classList.add("remove");
  videoo.classList.add("add");
  handleVideo();
});

videoo.addEventListener("click", () => {
  video.classList.remove("remove");
  videoo.classList.remove("add");
  handleVideo();
});

audio.addEventListener("click", () => {
  audio.classList.add("remove");
  audioo.classList.add("add");
  handleAudio();
});

audioo.addEventListener("click", () => {
  audio.classList.remove("remove");
  audioo.classList.remove("add");
  handleAudio();
});

sendBtn.addEventListener("click", () => {
  let msg = msgInput.value;
  socket.emit("msg", { room, msg, username }); //Emit our event to send the message.
  msgInput.value = "";
});

endCallBtn.addEventListener("click", async () => {
  socket.emit("callEnded", caller, room);
  let dataa = { caller, room };
  await fetch("http://localhost:3000/user/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataa),
  });
});

const joinUser = () => {
  console.log(room);
  if (username !== "") {
    socket.emit("join-user", username, room); //Emit our event to join the user.
  }
};

//Receiving messages from the server and showing in the chat box.

socket.on("msg", (msg, sender) => {
  let chat = document.createElement("div");
  let name = document.createElement("p");
  let message = document.createElement("div");
  chat.appendChild(name);
  chat.appendChild(message);
  name.textContent = sender;
  // if (sender === username) {
  //   chat.classList.add = "positioned";
  // }
  name.style.color = "purple";
  name.style.fontWeight = "bold";
  message.textContent = msg;
  chat.classList.add("chat");
  chats.appendChild(chat);
});

//WebRTC functionality starts here.

//Creating our function that will create the peerConnection instance for us.
const PeerConnection = (function () {
  let peerConnection;

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    peerConnection = new RTCPeerConnection(config);

    //add our local stream to the peerConnection.
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    //listen for our remote stream and add to the peerConnection.
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    //listen for ice candidates.
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("icecandidate", event.candidate); //Emit our ice candidate(Public IP address)
      }
    };
    return peerConnection;
  };

  return {
    getInstance: () => {
      if (!peerConnection) {
        peerConnection = createPeerConnection();
      }
      return peerConnection;
    },
  };
})();

//handling socket events.

//Problem is in this code , event listener is called multiple times for each user, so fix the ui and this first.
socket.on("joined", (data) => {
  console.log({ data });
  const createMembers = () => {
    memberList.innerHTML = ""; //Clearing the member list,else users will get added multiple times.

    for (const user in data) {
      let member = document.createElement("li");
      member.textContent = `${user}  ${user === username ? "(You)" : ""}`;
      member.style.backgroundColor = "lightblue";

      if (user !== username) {
        let callBtn = document.createElement("button");
        callBtn.textContent = "Call";
        callBtn.style.backgroundColor = "green";
        callBtn.addEventListener("click", () => {
          startCall(user, data);
        });
        member.appendChild(callBtn);
      }
      memberList.appendChild(member);
    }
  };
  createMembers();
});

//Listening for offer sent from the server to the remote device.
socket.on("offer", async ({ from, to, offer, data }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(offer); //set remote description.

  const answer = await pc.createAnswer(); //creating our answer.
  await pc.setLocalDescription(answer); //setting answer as 2nd client local description.
  socket.emit("answer", {
    from: to,
    to: from,
    answer: pc.localDescription,
    data: data,
  }); //Emitting the answer.
  caller = [from, to, data];
});

//Listening for answer sent from the server to the local device(device that sent the offer,received the reply .)
socket.on("answer", async ({ from, to, answer, data }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(answer); //Setting the received answer as remote description.
  caller = [to, from, data];
  //Showing our endcall button as our call starts.
  endCallBtn.style.display = "inline";
  socket.emit("endcall", { from, to, data });
});

socket.on("endcall", ({ from, to, data }) => {
  endCallBtn.style.display = "inline";
});

socket.on("callEnded", (caller) => {
  endCall();
});

//Listening for ice candidates sent from the server to the local device.
socket.on("icecandidate", async (candidate) => {
  const pc = PeerConnection.getInstance();
  await pc.addIceCandidate(new RTCIceCandidate(candidate)); //Adding received ice candidate to peerConnection.
});

//StartCall function.
let startCall = async (user, data) => {
  console.log("Calling...");
  const pc = PeerConnection.getInstance();
  const offer = pc.createOffer(); //Creating our offer.
  console.log({ offer });
  await pc.setLocalDescription(offer); //Setting our offer as local description.

  //Sending our offer to the signalling server.
  socket.emit("offer", {
    from: username,
    to: user,
    offer: pc.localDescription,
    data: data,
  });
};

let endCall = async () => {
  const pc = PeerConnection.getInstance();
  if (pc) {
    await pc.close();
    endCallBtn.style.display = "none";
  }
  window.location.href = "http://localhost:3000/lobby";
};

//Function to get our local stream and set it.
let startMyVideo = async () => {
  //Getting our stream from local device.
  try {
    stream = await navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true },
        video: {
          width: { ideal: 1920 }, // Requesting a width of 1920 pixels
          height: { ideal: 1080 }, // Requesting a height of 1080 pixels
        },
      })

      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    console.log(stream);
    localStream = stream;
    localVideo.srcObject = stream;
  } catch (e) {
    console.log(e);
  }
};

//Function to get our screen stream and share it.

let isSharingScreen = false;
let screenStream;

const captureScreen = async () => {
  if (!isSharingScreen) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      let screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track in PeerConnection
      const sender = PeerConnection.getInstance()
        .getSenders()
        .find((s) => s.track.kind === "video");
      sender.replaceTrack(screenTrack);

      isSharingScreen = true;

      // When user stops sharing, revert to webcam
      screenTrack.onended = () => stopSharingScreen();
    } catch (error) {
      console.error("Error accessing screen share:", error);
    }
  } else {
    stopSharingScreen();
  }
};

const stopSharingScreen = async () => {
  let videoTrack = localStream.getVideoTracks()[0];

  // Replace back the video track
  const sender = PeerConnection.getInstance()
    .getSenders()
    .find((s) => s.track.kind === "video");
  sender.replaceTrack(videoTrack);

  screenStream.getTracks().forEach((track) => track.stop());

  isSharingScreen = false;
};

// Add event listener
screen.addEventListener("click", captureScreen);

// Control audio and video tracks.
let handleVideo = () => {
  const videoTrack = stream.getVideoTracks()[0];

  videoTrack.enabled = !videoTrack.enabled; //Stops and unstops the video.
};

let handleAudio = () => {
  const audioTrack = stream.getAudioTracks()[0];

  audioTrack.enabled = !audioTrack.enabled; // Mutes and unmutes the audio.
};

startMyVideo();
