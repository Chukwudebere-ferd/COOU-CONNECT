import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

// ✅ Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyByuuRpHOfeWEcKl_oaob6V_tmnYyJ_vbU",
  authDomain: "coou-connect-75406.firebaseapp.com",
  projectId: "coou-connect-75406",
  storageBucket: "coou-connect-75406.appspot.com",
  messagingSenderId: "1070347911713",
  appId: "1:1070347911713:web:35c75b840a38f6cd7a1960",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM
const container = document.getElementById("users-container");
const searchInput = document.getElementById("user-search");

let allUsers = [];
let globalFriendMap = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  await fetchUsers(user);
});

// ✅ Fetch users
async function fetchUsers(currentUser) {
  container.innerHTML = `<div class="user-card skeleton"><div class="user-img"></div><div class="line short"></div><div class="line"></div></div>`;

  const usersSnap = await getDocs(collection(db, "users"));
  const friendSnap = await getDocs(collection(db, "users", currentUser.uid, "friends"));

  const friends = {};
  friendSnap.forEach((doc) => {
    friends[doc.id] = doc.data();
  });
  globalFriendMap = friends;

  allUsers = [];

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (docSnap.id !== currentUser.uid && data.role !== "admin") {
      allUsers.push({ uid: docSnap.id, ...data });
    }
  });

  // 🧠 Sort: Verified first, then received requests
  const sorted = [...allUsers].sort((a, b) => {
    const friendA = friends[a.uid];
    const friendB = friends[b.uid];

    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;

    if (friendA?.to === currentUser.uid && friendA?.status === "pending") return -1;
    if (friendB?.to === currentUser.uid && friendB?.status === "pending") return 1;

    return 0;
  });

  renderUsers(sorted, friends);
}

// ✅ Render
function renderUsers(users, friendMap) {
  container.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "user-card";

    const userInfo = document.createElement("div");
    userInfo.className = "user-info";

    const img = document.createElement("img");
    img.src = user.profileImage || "./public/img/default.jpg";
    img.className = "user-img";

    const infoText = document.createElement("div");
    infoText.innerHTML = `
      <div class="user-name">${user.name || "Student"}
        ${user.verified ? '<i class="fa-solid fa-circle-check" style="color: green;"></i>' : ""}
      </div>
      <small>${user.department || "Unknown Dept"}</small>
    `;

    userInfo.appendChild(img);
    userInfo.appendChild(infoText);

    const actionBtn = document.createElement("button");
    const relation = friendMap[user.uid];

    if (relation?.status === "accepted") {
      actionBtn.className = "chat-btn";
      actionBtn.innerHTML = '<i class="fa-solid fa-comments"></i>';
      actionBtn.title = "Chat";
      actionBtn.onclick = () => (window.location.href = `chat.html?uid=${user.uid}`);
    } else {
      actionBtn.className = "connect-btn";

      if (relation?.status === "pending") {
        if (relation.to === auth.currentUser.uid) {
          actionBtn.textContent = "Accept";
          actionBtn.onclick = () => acceptFriendRequest(user.uid);
        } else {
          actionBtn.textContent = "Cancel";
          actionBtn.onclick = () => removeFriend(user.uid);
        }
      } else {
        actionBtn.textContent = "Connect";
        actionBtn.onclick = () => sendFriendRequest(user.uid);
      }
    }

    card.appendChild(userInfo);
    card.appendChild(actionBtn);
    container.appendChild(card);
  });
}

// ✅ Request Functions
async function sendFriendRequest(toUid) {
  const fromUid = auth.currentUser.uid;
  await setDoc(doc(db, "users", fromUid, "friends", toUid), {
    status: "pending",
    from: fromUid,
    to: toUid,
    timestamp: serverTimestamp(),
  });
  await setDoc(doc(db, "users", toUid, "friends", fromUid), {
    status: "pending",
    from: fromUid,
    to: toUid,
    timestamp: serverTimestamp(),
  });
  await fetchUsers(auth.currentUser);
}

async function removeFriend(uid) {
  const myUid = auth.currentUser.uid;
  await deleteDoc(doc(db, "users", myUid, "friends", uid));
  await deleteDoc(doc(db, "users", uid, "friends", myUid));
  await fetchUsers(auth.currentUser);
}

async function acceptFriendRequest(uid) {
  const myUid = auth.currentUser.uid;

  // 1. Update friend status for both users
  await updateDoc(doc(db, "users", myUid, "friends", uid), { status: "accepted" });
  await updateDoc(doc(db, "users", uid, "friends", myUid), { status: "accepted" });

  // 2. Create a chat doc if it doesn't exist
  const chatId = myUid < uid ? `${myUid}_${uid}` : `${uid}_${myUid}`;
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [myUid, uid],
      createdAt: serverTimestamp(),
      lastMessage: {
        text: "Say hello!",
        senderId: myUid,
        timestamp: serverTimestamp(),
      },
      lastTimestamp: serverTimestamp()
    });
  }

  // Refresh UI
  await fetchUsers(auth.currentUser);
}


// ✅ Live Search
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(keyword) || u.department?.toLowerCase().includes(keyword)
  );

  renderUsers(filtered, globalFriendMap);
});
