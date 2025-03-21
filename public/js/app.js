let callBtn = document.querySelector("#callButton");
let localVideo = document.querySelector("#localVideo");
let remoteVideo = document.querySelector("#remoteVideo");
let input = document.getElementById("room");
let joinBtn = document.getElementById("joinButton");
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

let localStream;
let username;
let caller = [];
let stream;

const fetchData = async () => {
  await fetch("http://localhost:3000/session-info")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data.username.username);
      username = data.username.username;
      joinUser();
    })
    .catch((err) => {
      console.log(`Error fetching data ${err}`);
    });
};

fetchData();

const socket = io();

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
  let room = input.value;
  let msg = msgInput.value;
  socket.emit("msg", { room, msg }); //Emit our event to send the message.
  msgInput.value = "";
});

// Emit our event to the server to join the room.
joinBtn.addEventListener("click", () => {
  let room = input.value;
  socket.emit("joinroom", room);
});

endCallBtn.addEventListener("click", async () => {
  socket.emit("callEnded", caller);
});

const joinUser = () => {
  if (username !== "") {
    socket.emit("join-user", username); //Emit our event to join the user.
  }
  form.style.display = "none";
};

//Receiving messages from the server and showing in the chat box.

socket.on("msg", (msg) => {
  let li = document.createElement("li");
  li.textContent = msg;
  chats.appendChild(li);
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
socket.on("joined", (allUsers) => {
  console.log({ allUsers });
  const createMembers = () => {
    memberList.innerHTML = ""; //Clearing the member list,else users will get added multiple times.

    for (const user in allUsers) {
      let member = document.createElement("li");
      member.textContent = `${user}  ${user === username ? "(You)" : ""}`;
      member.style.backgroundColor = "lightblue";
      if (user !== username) {
        let callBtn = document.createElement("button");
        callBtn.textContent = "Call";
        callBtn.style.backgroundColor = "lightgreen";
        callBtn.addEventListener("click", () => {
          startCall(user);
        });
        member.appendChild(callBtn);
      }
      memberList.appendChild(member);
    }
  };
  createMembers();
});

//Listening for offer sent from the server to the remote device.
socket.on("offer", async ({ from, to, offer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(offer); //set remote description.

  const answer = await pc.createAnswer(); //creating our answer.
  await pc.setLocalDescription(answer); //setting answer as 2nd client local description.
  socket.emit("answer", { from: to, to: from, answer: pc.localDescription }); //Emitting the answer.
  caller = [from, to];
});

//Listening for answer sent from the server to the local device(device that sent the offer,received the reply .)
socket.on("answer", async ({ from, to, answer }) => {
  const pc = PeerConnection.getInstance();
  await pc.setRemoteDescription(answer); //Setting the received answer as remote description.
  caller = [to, from];
  //Showing our endcall button as our call starts.
  endCallBtn.style.display = "block";
  socket.emit("endcall", { from, to });
});

socket.on("endcall", ({ from, to }) => {
  endCallBtn.style.display = "block";
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
let startCall = async (user) => {
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
  });
};

let endCall = async () => {
  const pc = PeerConnection.getInstance();
  if (pc) {
    await pc.close();
    endCallBtn.style.display = "none";
  }
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

      // .then((stream) => {
      //   const audioTrack = stream.getAudioTracks()[0];
      //   const videoTrack = stream.getVideoTracks()[0];

      //   console.log(audioTrack);
      //   console.log(videoTrack);
      //   // audioTrack.enabled = true; // Mutes the audio
      //   // videoTrack.enabled = true; // Stops the video
      // })
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
