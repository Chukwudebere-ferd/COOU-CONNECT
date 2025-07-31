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
  deleteDoc,
  increment
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";



import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

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
const uploadBtn = document.getElementById("upload-btn");
const imageInput = document.getElementById("image-input");

let chatId, partnerId, currentUser, typingTimeout, replyToMsg = null;

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
  if (!text && !replyToMsg) return;

  const msg = {
    text,
    from: currentUser.uid,
    timestamp: serverTimestamp(),
    type: "text",
    replyTo: replyToMsg || null
  };

 await updateDoc(doc(db, "chats", chatId), {
  lastMessage: msg,
  lastTimestamp: serverTimestamp(),
  [`unread.${partnerId}`]: increment(1) // 👈 Increments their unread
});

  input.value = "";
  replyToMsg = null;
  clearReplyUI();
  setTypingStatus(false);
};

uploadBtn.onclick = () => imageInput.click();

imageInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (event) => {
    const base64String = event.target.result;

    const msg = {
      text: base64String,
      from: currentUser.uid,
      timestamp: serverTimestamp(),
      type: "image"
    };

    await addDoc(collection(db, "chats", chatId, "messages"), msg);
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: msg,
      lastTimestamp: serverTimestamp()
    });

    imageInput.value = "";
  };

  reader.readAsDataURL(file);
};


function watchMessages() {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const msgId = docSnap.id;
      const mine = msg.from === currentUser.uid;

      const div = document.createElement("div");
      div.className = mine ? "message sent" : "message received";

      let content = "";

      if (msg.replyTo) {
        content += `<div class="reply-preview">Replying to: ${msg.replyTo.text?.slice(0, 30) || "Image"}</div>`;
      }

      content += msg.type === "image"
        ? `<img src="${msg.text}" class="chat-img" />`
        : msg.text;

      content += `<span class="timestamp">${msg.timestamp ? formatTime(msg.timestamp) : ""}</span>`;

      div.innerHTML = content;

      // Reply on click
      div.onclick = () => {
        if (!mine) {
          replyToMsg = msg;
          showReplyUI(msg);
        }
      };

      // Delete on long press (if mine)
      if (mine) {
        div.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          confirmDelete(msgId);
        });

        div.addEventListener("touchstart", (e) => {
          let pressTimer = setTimeout(() => confirmDelete(msgId), 800);
          div.addEventListener("touchend", () => clearTimeout(pressTimer));
        });
      }

      messagesContainer.appendChild(div);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function showReplyUI(msg) {
  const preview = document.createElement("div");
  preview.id = "reply-preview";
  preview.innerHTML = `
    Replying to: <strong>${msg.text?.slice(0, 40) || "Image"}</strong>
    <button onclick="document.getElementById('reply-preview').remove()">❌</button>
  `;
  input.parentNode.insertBefore(preview, input);
}

function clearReplyUI() {
  const el = document.getElementById("reply-preview");
  if (el) el.remove();
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
   // Mark messages as read
      await updateDoc(doc(db, "chats", chatId), {
      [`unread.${user.uid}`]: 0
    });


  const partnerSnap = await getDoc(doc(db, "users", partnerId));
  const partner = partnerSnap.data();

  partnerHeader.innerHTML = `
    <img src="${partner.profileImage || './public/img/default.jpg'}" class="partner-img" />
    <div>
      <strong>${partner.name || "Student"}</strong>
      ${partner.verified ? '<i class="fa-solid fa-circle-check" style="color: green;"></i>' : ''}
      <div class="status">Online</div>
    </div>
  `;

  watchMessages();
  watchTyping();
});
