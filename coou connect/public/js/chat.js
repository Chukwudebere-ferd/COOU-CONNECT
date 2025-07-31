import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  orderBy,
  query
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
const chatList = document.getElementById("chat-list");
const loader = document.getElementById("chat-loader");

function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function formatTime(timestamp) {
  const date = timestamp.toDate();
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// ✅ Load chats with accepted friends
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");

  loader.style.display = "block";
  chatList.innerHTML = "";

  try {
    const myUid = user.uid;

    // ✅ Fetch accepted friends
    const friendsSnap = await getDocs(collection(db, "users", myUid, "friends"));

    const acceptedFriends = [];
    friendsSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === "accepted") {
        acceptedFriends.push(doc.id);
      }
    });

    if (acceptedFriends.length === 0) {
      chatList.innerHTML = "<p>No chats yet. Add some friends!</p>";
      loader.style.display = "none";
      return;
    }

    const chatItems = [];

    for (const friendUid of acceptedFriends) {
      const chatId = getChatId(myUid, friendUid);
      const chatDocRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatDocRef);

      if (!chatSnap.exists()) continue;

      const chatData = chatSnap.data();

      // ✅ Get friend user data
      const friendSnap = await getDoc(doc(db, "users", friendUid));
      if (!friendSnap.exists()) continue;

      const friend = friendSnap.data();

      // ✅ Extract data
      const lastMsg = chatData.lastMessage?.text || "Say hello!";
      const time = chatData.lastTimestamp ? formatTime(chatData.lastTimestamp) : "";
      const unreadCount = chatData.unread?.[myUid] || 0;

      chatItems.push({
        friendUid,
        chatId,
        friend,
        lastMsg,
        time,
        unreadCount,
        lastTimestamp: chatData.lastTimestamp?.toMillis() || 0
      });
    }

    // ✅ Sort by last timestamp DESC
    chatItems.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    // ✅ Render chats
    chatItems.forEach(item => {
      const chatEl = document.createElement("div");
      chatEl.className = "chat-item";
      chatEl.onclick = () =>
        window.location.href = `chatRoom.html?uid=${item.friendUid}&chat=${item.chatId}`;

      chatEl.innerHTML = `
        <img src="${item.friend.profileImage || './public/img/default.jpg'}" class="chat-user-img" />
        <div class="chat-details">
          <div class="chat-name">
            ${item.friend.name || "Student"}
            ${item.friend.verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}
          </div>
          <div class="chat-snippet">${item.lastMsg}</div>
        </div>
        <div class="chat-time">
          ${item.time}
          ${item.unreadCount > 0 ? `<span class="unread-badge">${item.unreadCount}</span>` : ""}
        </div>
      `;

      chatList.appendChild(chatEl);
    });

    if (chatItems.length === 0) {
      chatList.innerHTML = "<p>No chats yet.</p>";
    }

    loader.style.display = "none";
  } catch (err) {
    console.error("Error loading chats:", err);
    loader.style.display = "none";
    chatList.innerHTML = "<p>Error loading chats.</p>";
  }
});
