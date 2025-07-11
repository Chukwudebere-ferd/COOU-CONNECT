// ✅ Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


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
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ DOM References
const usernameSpan = document.getElementById("username");
const profileImg = document.querySelector(".nav-profile-img");
const tabButtons = document.querySelectorAll(".tabs button");
const navButtons = document.querySelectorAll(".bottom-nav button");
const content = document.getElementById("content");

const toggleProfileBtn = document.getElementById("toggle-profile");
const profileSection = document.getElementById("profile-section");
const signoutBtn = document.getElementById("signout-btn");

const viewBlock = document.getElementById("profile-view");
const editBlock = document.getElementById("profile-edit");
const editBtn = document.getElementById("edit-profile-btn");
const cancelBtn = document.getElementById("cancel-edit");

const profilePhoto = document.getElementById("profile-photo");
const viewName = document.getElementById("view-name");
const viewDept = document.getElementById("view-dept");
const viewLevel = document.getElementById("view-level");

const editForm = document.getElementById("edit-profile-form");
const editName = document.getElementById("edit-name");
const editDept = document.getElementById("edit-dept");
const editLevel = document.getElementById("edit-level");
const editImage = document.getElementById("edit-image");
const loader = document.getElementById("upload-loader");

const defaultImg = "https://i.postimg.cc/FKRrnLbg/coou-connect-logo.jpg";

// ✅ Cloudinary Config
const cloudName = "dvmgrq5zz";
let uploadPreset = "COOU PROFILE UPLOAD";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.secure_url;
}

// ✅ Toggle Profile Dropdown
toggleProfileBtn?.addEventListener("click", () => {
  profileSection.style.display = (profileSection.style.display === "block") ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (!profileSection.contains(e.target) && !toggleProfileBtn.contains(e.target)) {
    profileSection.style.display = "none";
  }
});

// ✅ Load Profile View
async function loadProfileView() {
  const uid = auth.currentUser.uid;
  const profileKey = `coouProfile_${uid}`;
  let data = JSON.parse(localStorage.getItem(profileKey) || "{}");

  if (!data.name) {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      data = docSnap.data();
      localStorage.setItem(profileKey, JSON.stringify(data));
    }
  }

  viewName.textContent = data.name || "Full Name";
  viewDept.textContent = data.department || "Department";
  viewLevel.textContent = data.level || "Level";
  profilePhoto.src = data.profileImage || defaultImg;
  profileImg.src = data.profileImage || defaultImg;
  usernameSpan.textContent = data.name || auth.currentUser.displayName || "Student";
}

// ✅ Edit Mode
editBtn?.addEventListener("click", () => {
  viewBlock.style.display = "none";
  editBlock.style.display = "block";
  editName.value = viewName.textContent;
  editDept.value = viewDept.textContent;
  editLevel.value = viewLevel.textContent;
});

cancelBtn?.addEventListener("click", () => {
  editBlock.style.display = "none";
  viewBlock.style.display = "block";
  profileSection.style.display = "none";
});

// ✅ Save Profile
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "block";

  const name = editName.value.trim();
  const department = editDept.value.trim();
  const level = editLevel.value.trim();
  const file = editImage.files[0];

  let profileImage = profilePhoto?.src || defaultImg;
  if (file) profileImage = await uploadToCloudinary(file);

  const uid = auth.currentUser.uid;
  const profileKey = `coouProfile_${uid}`;
  const newProfile = { name, department, level, profileImage };

  try {
    await setDoc(doc(db, "users", uid), newProfile, { merge: true });
    localStorage.setItem(profileKey, JSON.stringify(newProfile));
    await loadProfileView();
    editBlock.style.display = "none";
    viewBlock.style.display = "block";
    profileSection.style.display = "none";
  } catch (err) {
    alert("Failed to save profile.");
    console.error(err);
  } finally {
    loader.style.display = "none";
  }
});

// ✅ Sign Out
signoutBtn?.addEventListener("click", async () => {
  const uid = auth.currentUser?.uid;
  if (uid) localStorage.removeItem(`coouProfile_${uid}`);
  await signOut(auth);
  window.location.href = "index.html";
});

// ✅ Auth Listener
onAuthStateChanged(auth, async (user) => {
  if (user) await loadProfileView();
  else window.location.href = "index.html";
});

// ✅ Tabs & Navigation
function setActive(buttons, activeBtn) {
  buttons.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setActive(tabButtons, btn);
    const label = btn.textContent.trim();
    content.innerHTML = `<h2>${label}</h2><p>Loading ${label}...</p>`;
  });
});

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setActive(navButtons, btn);
    const label = btn.textContent.trim();
    content.innerHTML = `<h2>${label}</h2><p>You are now viewing ${label}.</p>`;
  });
});

// ✅ Feed Upload
const postForm = document.getElementById("post-form");
const postCaption = document.getElementById("post-caption");
const postImage = document.getElementById("post-image");
const postLoader = document.getElementById("post-loader");

async function uploadPostImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.secure_url;
}

postForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("You must be signed in to post.");

  const caption = postCaption.value.trim();
  const file = postImage.files[0];

  if (!caption || !file) return alert("Please enter caption and select image.");

  postLoader.style.display = "block";

  try {
    const imageUrl = await uploadPostImage(file);

    // Fetch user data from Firestore
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      username: userData.name || user.displayName || "Student",
      userImage: userData.profileImage || user.photoURL || defaultImg,
      text: caption,
      imageUrl,
      likes: [],
      comments: [],
      timestamp: serverTimestamp()
    });

    postForm.reset();
    alert("Post uploaded!");
    await loadPosts(); // Refresh feed
  } catch (err) {
    console.error("Post upload failed:", err);
    alert("Error uploading post.");
  } finally {
    postLoader.style.display = "none";
  }
});

// 🔁 Load posts
async function loadPosts() {
  const feedContainer = document.getElementById("post-feed");
  feedContainer.innerHTML = "<center><p>Loading posts...</p></center>";

  try {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      feedContainer.innerHTML = "<center><p>No posts yet.</p></center>";
      return;
    }

    feedContainer.innerHTML = ""; // Clear existing

    snapshot.forEach(doc => {
      const post = doc.data();

      const isOwner = post.userId === auth.currentUser?.uid;

const postHTML = `
  <div class="post-card" data-id="${doc.id}">
    <div class="post-header">
      <img src="${post.userImage}" alt="User" class="post-user-img" />
      <strong>${post.username}</strong>
      ${isOwner ? '<button class="delete-post-btn">🗑️</button>' : ""}
    </div>
    <img src="${post.imageUrl}" alt="Post" class="post-img" />
    <p class="post-caption">${post.text}</p>
    <div class="post-actions">
      ❤️ <span>0</span> &nbsp; 💬 <span>0</span>
    </div>
  </div>
`;

      feedContainer.innerHTML += postHTML;
    });

  } catch (err) {
    console.error("Error loading posts:", err);
    feedContainer.innerHTML = "<p>Failed to load posts.</p>";
  }
}
// ✅ Delegate click event to content container
  document.getElementById("content").addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-post-btn")) {
      const postCard = e.target.closest(".post-card");
      const postId = postCard.getAttribute("data-id");

      if (confirm("Delete this post?")) {
        try {
          await deleteDoc(doc(db, "posts", postId));
          alert("Post deleted.");
          await loadPosts(); // Re-render posts after deletion
        } catch (err) {
          console.error("Failed to delete post:", err);
          alert("Error deleting post.");
        }
      }
    }
  });


// ✅ Load posts on page load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadProfileView();
    await loadPosts(); // 🔥 load posts now
  } else {
    window.location.href = "index.html";
  }
});