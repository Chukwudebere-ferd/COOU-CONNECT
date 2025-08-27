import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByuuRpHOfeWEcKl_oaob6V_tmnYyJ_vbU",
  authDomain: "coou-connect-75406.firebaseapp.com",
  projectId: "coou-connect-75406",
  storageBucket: "coou-connect-75406.appspot.com",
  messagingSenderId: "1070347911713",
  appId: "1:1070347911713:web:35c75b840a38f6cd7a1960"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ DOM
const messagesContainer = document.getElementById("messages");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("message-input");
const typingIndicator = document.getElementById("typing-indicator");
const partnerHeader = document.getElementById("chat-partner");

// 📷 Image upload input
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// 📷 Upload button
const addImageBtn = document.createElement("button");
addImageBtn.textContent = "📷";
addImageBtn.onclick = () => fileInput.click();
document.querySelector(".chat-input-bar").appendChild(addImageBtn);

let chatId, partnerId, currentUser, typingTimeout, replyingTo = null;

const urlParams = new URLSearchParams(window.location.search);
chatId = urlParams.get("chat");
partnerId = urlParams.get("uid");

function formatTime(timestamp) {
  const date = timestamp.toDate();
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function setTypingStatus(isTyping) {
  if (!currentUser) return;
  await setDoc(doc(db, "chats", chatId, "typing", currentUser.uid), {
    typing: isTyping,
    timestamp: serverTimestamp()
  });
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    text,
    from: currentUser.uid,
    timestamp: serverTimestamp(),
    type: "text"
  };

  if (replyingTo) msg.replyTo = replyingTo;

  await sendMessage(msg);

  input.value = "";
  replyingTo = null;
  document.querySelector(".reply-preview")?.remove();
  setTypingStatus(false);
};

// ✅ Auto send image after selecting
fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const msg = {
      text: reader.result,
      from: currentUser.uid,
      timestamp: serverTimestamp(),
      type: "image"
    };

    if (replyingTo) msg.replyTo = replyingTo;

    await sendMessage(msg);
    replyingTo = null;
    document.querySelector(".reply-preview")?.remove();
  };
  reader.readAsDataURL(file);
  fileInput.value = "";
};

async function sendMessage(msg) {
  await addDoc(collection(db, "chats", chatId, "messages"), msg);
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: {
      text: msg.type === "image" ? "[Image]" : msg.text
    },
    lastTimestamp: serverTimestamp()
  });
}
messagesContainer.innerHTML = "";
for (let i = 0; i < 3; i++) {
  const skeleton = document.createElement("div");
  skeleton.className = "message skeleton";
  messagesContainer.appendChild(skeleton);
}


function watchMessages() {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, async (snapshot) => {
    messagesContainer.innerHTML = "";

    for (const docSnap of snapshot.docs) {
      const msg = docSnap.data();
      const msgId = docSnap.id;

      const msgDiv = document.createElement("div");
      msgDiv.className = msg.from === currentUser.uid ? "message sent" : "message received";

      // ✅ Reply
      let replyHTML = "";
      if (msg.replyTo) {
        const replySnap = await getDoc(doc(db, "chats", chatId, "messages", msg.replyTo));
        if (replySnap.exists()) {
          const replyData = replySnap.data();
          replyHTML = `<div class="reply-block"><small>Replying to: ${replyData.text?.substring(0, 30) || "[Image]"}</small></div>`;
        }
      }

      msgDiv.innerHTML = `
        ${replyHTML}
        ${msg.type === "image"
          ? `<img src="${msg.text}" class="chat-img" />`
          : `<p>${msg.text}</p>`}
        <span class="timestamp">${msg.timestamp ? formatTime(msg.timestamp) : ""}</span>
      `;
      

      // ✅ Delete own message
      if (msg.from === currentUser.uid) {
        msgDiv.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          confirmDelete(msgId);
        });

        msgDiv.addEventListener("touchstart", () => {
          let pressTimer = setTimeout(() => confirmDelete(msgId), 800);
          msgDiv.addEventListener("touchend", () => clearTimeout(pressTimer));
        });
      }

      // ✅ Reply on double click
     msgDiv.addEventListener("dblclick", () => {
  replyingTo = msgId;

  // Remove existing if any
  document.querySelector(".reply-preview")?.remove();

  const replyBox = document.createElement("div");
  replyBox.className = "reply-preview";
  replyBox.innerHTML = `
    <div class="reply-text">
      <strong>Replying:</strong> ${msg.text?.substring(0, 40) || "[Image]"}
    </div>
    <button class="cancel-reply">❌</button>
  `;

  input.parentNode.insertBefore(replyBox, input);

  replyBox.querySelector(".cancel-reply").onclick = () => {
    replyBox.remove();
    replyingTo = null;
  };
});


      messagesContainer.appendChild(msgDiv);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // ✅ Mark messages as read
    await updateDoc(doc(db, "chats", chatId), {
      [`read.${currentUser.uid}`]: serverTimestamp()
    });
  });
}

async function confirmDelete(msgId) {
  if (confirm("Delete this message?")) {
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
  }
}

function watchTyping() {
  onSnapshot(doc(db, "chats", chatId, "typing", partnerId), (snap) => {
    const data = snap.data();
    typingIndicator.style.display = data?.typing ? "block" : "none";
  });
}

input.addEventListener("input", () => {
  setTypingStatus(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    setTypingStatus(false);
  }, 2000);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  currentUser = user;

  const partnerSnap = await getDoc(doc(db, "users", partnerId));
  const partner = partnerSnap.data();

  partnerHeader.innerHTML = `
    <img src="${partner.profileImage || './public/img/default.jpg'}" class="partner-img" />
    <div>
      <strong>${partner.name || "Student"}</strong>
      ${partner.verified ? '<i class="fa-solid fa-circle-check" style="color: green;"></i>' : ""}
      <div class="status">Online</div>
    </div>
  `;

  watchMessages();
  watchTyping();
});
