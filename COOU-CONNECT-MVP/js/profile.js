import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
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

// ✅ DOM Elements
const photo = document.getElementById("profile-photo");
const name = document.getElementById("profile-name");
const dept = document.getElementById("profile-dept");
const level = document.getElementById("profile-level");
const status = document.getElementById("profile-status");
const loader = document.getElementById("profile-loader");
const container = document.getElementById("profile-container");
const friendBtn = document.getElementById("friend-btn");

// ✅ Default image
const defaultImg = "https://i.postimg.cc/FKRrnLbg/coou-connect-logo.jpg";

// ✅ Get UID from URL
const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  status.textContent = "Invalid profile.";
  loader.style.display = "none";
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "index.html");

    const localKey = `profile_${uid}`;
    const cachedData = localStorage.getItem(localKey);

    try {
      if (cachedData) {
        const data = JSON.parse(cachedData);
        displayProfile(data);
      }

      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        status.textContent = "User not found.";
        loader.style.display = "none";
        return;
      }

      const data = snap.data();
      localStorage.setItem(localKey, JSON.stringify(data));
      displayProfile(data);

      // ✅ Show friend UI
      await updateFriendUI(user);
    } catch (err) {
      console.error("Failed to load profile:", err);
      status.textContent = "Error loading profile.";
    } finally {
      loader.style.display = "none";
    }
  });
}

// ✅ Display profile info
function displayProfile(data) {
  photo.src = data.profileImage || defaultImg;
  name.innerHTML = `${data.name || "Student"} ${
    data.verified ? '<i class="fa-solid fa-circle-check" style="color: green;" title="Verified"></i>' : ""
  }`;
  dept.textContent = `Department: ${data.department || "N/A"}`;
  level.textContent = `Level: ${data.level || "N/A"}`;
  container.style.display = "block";
  status.textContent = "";
}

// ✅ Friend Logic
async function updateFriendUI(user) {
  if (!friendBtn) return;

  if (user.uid === uid) {
    friendBtn.style.display = "none";
    return;
  }

  const myFriendDoc = await getDoc(doc(db, "users", user.uid, "friends", uid));
  const theirFriendDoc = await getDoc(doc(db, "users", uid, "friends", user.uid));

  if (myFriendDoc.exists()) {
    const status = myFriendDoc.data().status;
    if (status === "accepted") {
      friendBtn.textContent = "Friends ✓";
      friendBtn.disabled = true;
    } else if (status === "pending") {
      friendBtn.textContent = "Cancel Request";
      friendBtn.onclick = () => removeFriendRequest(user.uid, uid, user);
    }
  } else if (theirFriendDoc.exists() && theirFriendDoc.data().status === "pending") {
    friendBtn.textContent = "Accept Request";
    friendBtn.onclick = () => acceptFriendRequest(user.uid, uid, user);
  } else {
    friendBtn.textContent = "Add Friend";
    friendBtn.onclick = () => sendFriendRequest(user.uid, uid, user);
  }
}

async function sendFriendRequest(fromUid, toUid, user) {
  await setDoc(doc(db, "users", fromUid, "friends", toUid), {
    status: "pending",
    from: fromUid,
    to: toUid,
    timestamp: serverTimestamp()
  });

  await setDoc(doc(db, "users", toUid, "friends", fromUid), {
    status: "pending",
    from: fromUid,
    to: toUid,
    timestamp: serverTimestamp()
  });

  updateFriendUI(user);
}

async function removeFriendRequest(fromUid, toUid, user) {
  await deleteDoc(doc(db, "users", fromUid, "friends", toUid));
  await deleteDoc(doc(db, "users", toUid, "friends", fromUid));
  updateFriendUI(user);
}

async function acceptFriendRequest(myUid, theirUid, user) {
  await updateDoc(doc(db, "users", myUid, "friends", theirUid), {
    status: "accepted"
  });

  await updateDoc(doc(db, "users", theirUid, "friends", myUid), {
    status: "accepted"
  });

  updateFriendUI(user);
}

// ✅ Back Button
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("go-back-btn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }
});
