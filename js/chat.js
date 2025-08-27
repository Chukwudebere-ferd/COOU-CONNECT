import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  orderBy,
  query,
  onSnapshot
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
const chatsContainer = document.getElementById("chats-container");


// ✅ Generate chatId
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

 
// ✅ Auth & Load Chat List
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  const myUid = user.uid;

 



try {
  // Get elements safely
  const chatsContainer = document.getElementById("chatsContainer");
  const chatList = document.getElementById("chatList");

  // Ensure elements exist
  if (!chatsContainer || !chatList) throw new Error("Missing containers");

  // Show skeleton loader
  chatsContainer.innerHTML = `
    <div class="chat-skeleton"></div>
    <div class="chat-skeleton"></div>
    <div class="chat-skeleton"></div>
  `;
  chatsContainer.style.display = "block";
  chatList.innerHTML = "";

  const friendsSnap = await getDocs(collection(db, "users", myUid, "friends"));
  const acceptedFriends = [];

  friendsSnap.forEach((doc) => {
    if (doc.data().status === "accepted") {
      acceptedFriends.push(doc.id);
    }
  });

  if (acceptedFriends.length === 0) {
    chatList.innerHTML = "<p>No chats yet.</p>";
    chatsContainer.style.display = "none";
    return;
  }

  for (const friendUid of acceptedFriends) {
    const chatId = getChatId(myUid, friendUid);
    const chatRef = doc(db, "chats", chatId);

    onSnapshot(chatRef, async (chatSnap) => {
      if (!chatSnap.exists()) return;

      const chatData = chatSnap.data();
      const lastMsg = chatData.lastMessage?.text || "Say hello!";
      const lastTime = chatData.lastTimestamp?.toDate().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }) || "";

      const friendSnap = await getDoc(doc(db, "users", friendUid));
      if (!friendSnap.exists()) return;
      const friend = friendSnap.data();

      const messagesSnap = await getDocs(
        query(
          collection(db, "chats", chatId, "messages"),
          orderBy("timestamp", "desc")
        )
      );

      let unreadCount = 0;
      messagesSnap.forEach((msg) => {
        const msgData = msg.data();
        if (msgData.from === friendUid && !msgData.readBy?.includes(myUid)) {
          unreadCount++;
        }
      });

      const oldItem = document.getElementById(`chat-${chatId}`);
      if (oldItem) oldItem.remove();

      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.id = `chat-${chatId}`;
      chatItem.onclick = () =>
        (window.location.href = `chatRoom.html?uid=${friendUid}&chat=${chatId}`);

      chatItem.innerHTML = `
        <img src="${friend.profileImage || './public/img/default.jpg'}" class="chat-user-img" />
        <div class="chat-details">
          <div class="chat-name">
            ${friend.name || "Student"}
            ${friend.verified ? '<i class="fa-solid fa-circle-check verified"></i>' : ''}
          </div>
          <div class="chat-snippet">${lastMsg}</div>
        </div>
        <div class="chat-time">
          ${lastTime}
          ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ""}
        </div>
      `;

      chatList.prepend(chatItem);
    });
  }

} catch (err) {
  console.error("Error loading chats:", err);
  const chatList = document.getElementById("chatList");
  if (chatList) chatList.innerHTML = "<p>Error loading chats</p>";
} finally {
  const chatsContainer = document.getElementById("chatsContainer");
  if (chatsContainer) chatsContainer.style.display = "none";
}
})
