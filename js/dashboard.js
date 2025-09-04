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
  deleteDoc,
  deleteField,
  increment
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
const postLoader = document.getElementById("post-loader");


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

  // ✅ Show name with badge if verified
  viewName.innerHTML = data.name
    ? `${data.name} ${data.verified ? '<i class="fa-solid fa-circle-check" style="color: green; font-size: 14px;" title="Verified"></i>' : ''}`
    : "Full Name";

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

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    const existingData = userSnap.exists() ? userSnap.data() : {};

    const newProfile = {
      name,
      department,
      level,
      profileImage
    };

    // ✅ Only add 'verified' if it already exists and is true
    if (existingData.verified === true) {
      newProfile.verified = true;
    }

    await setDoc(doc(db, "users", uid), newProfile, { merge: true });
    localStorage.setItem(profileKey, JSON.stringify({ ...existingData, ...newProfile }));
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


// ✅ Feed Upload
const postForm = document.getElementById("post-form");
const postCaption = document.getElementById("post-caption");
const postImage = document.getElementById("post-image");
const feedsContainer = document.getElementById("feeds-container");


async function uploadPostImage(file) {
  if (!file) {
    // No file provided — return null or a default image URL, if needed
    return null;
}

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
  const file = postImage.files[0]; // May be undefined if no image selected

  if (!caption) return alert("Please enter a caption.");

  postLoader.style.display = "block";

  try {
    // Upload image only if provided
    const imageUrl = file ? await uploadPostImage(file) : null;

    // Fetch user data from Firestore
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    // ✅ Create post in Firestore with verification status
    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      username: userData.name || user.displayName || "Student",
      userImage: userData.profileImage || user.photoURL || defaultImg,
      verified: userData.verified || false, // ✅ ADD THIS
      text: caption,
      imageUrl: imageUrl || null,
      likes: {},
      commentCount: 0,
      timestamp: serverTimestamp()
      
    });
    await notifyNewPost(userData.name || "Student", caption);
    postForm.reset();
    // Create the message element
const message = document.createElement('div');
message.textContent = 'Upload Successful';

// Style it using COOU Connect green
message.style.backgroundColor = '#00A651'; // Replace with exact COOU green if you have it
message.style.color = 'white';
message.style.padding = '12px 20px';
message.style.borderRadius = '8px';
message.style.fontFamily = 'Arial, sans-serif';
message.style.fontSize = '16px';
message.style.fontWeight = 'bold';
message.style.textAlign = 'center';
message.style.position = 'fixed';
message.style.top = '20px';
message.style.right = '20px';
message.style.zIndex = '1000';
message.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

// Add it to the page
document.body.appendChild(message);

// Optionally remove it after a few seconds
setTimeout(() => {
  message.remove();
}, 3000);

    await loadPosts(); // Refresh feed
  } catch (err) {
    console.error("Post upload failed:", err);
    message.textContent = 'Upload Successful';
  } finally {
    postLoader.style.display = "none";
  }
});


// ✅ Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, function (match) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escapeMap[match];
  });
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
    { label: 'second', secs: 1 }
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.secs);
    if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
  }
  return "Just now";
}


// 🔁 Load posts
  async function loadPosts() {
  const feedContainer = document.getElementById("post-feed");

feedsContainer.innerHTML = `
  <div class="feed-skeleton"></div>
  <div class="feed-skeleton"></div>
  <div class="feed-skeleton"></div>
`;
  try {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      feedContainer.innerHTML = "<center><p>No posts yet.</p></center>";
      return;
    }

    feedContainer.innerHTML = "";
    feedsContainer.style.display = "none";

    for (const docSnap of snapshot.docs) {
      const post = docSnap.data();
      const docId = docSnap.id;
      const isOwner = post.userId === auth.currentUser?.uid;
      const isLiked = post.likes && post.likes[auth.currentUser?.uid];
      const likeCount = post.likes ? Object.keys(post.likes).length : 0;
      const timeAgo = post.timestamp?.toDate ? timeSince(post.timestamp.toDate()) : "Just now";

      const temp = document.createElement("div");
      temp.innerHTML = `
        <div class="post-card" data-id="${docId}">
          <div class="post-header">
           <a href="profile.html?uid=${post.userId}">
  <img src="${post.userImage}" alt="User" class="post-user-img" />
</a>
<div class="post-user-details">
  <a href="profile.html?uid=${post.userId}" style="text-decoration: none; color: inherit;">
    <strong class="post-username">
      ${post.username}
      ${post.verified ? '<i class="fa-solid fa-circle-check" style="color: green; margin-left: 5px;"></i>' : ''}
    </strong>
  </a>
  <small class="timestamp">${timeAgo}</small>
</div>

            ${isOwner ? '<button class="delete-post-btn">🗑️</button>' : ""}
          </div>

          <img src="${post.imageUrl || ''}" alt="Post" class="post-img" />
          <p class="post-caption">${escapeHTML(post.text)}</p>

          <div class="post-actions">
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${docId}">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <span class="like-count" data-id="${docId}">${likeCount}</span>
            &nbsp;&nbsp;
            💬 <span class="comment-count">${post.commentCount || 0}</span>
          </div>

          <div class="comment-section collapsed">
            <div class="comment-input-area">
              <input class="comment-input" type="text" placeholder="Write a comment..." />
              <button class="send-comment-btn">Send</button>
              <button class="close-comment-btn">❌</button>
            </div>
            <div class="comment-list"></div>
          </div>
        </div>
      `;

      const postCard = temp.firstElementChild;
      feedContainer.appendChild(postCard);

      const commentList = postCard.querySelector(".comment-list");
      await loadComments(docId, commentList);
    }
  } catch (err) {
    console.error("Error loading posts:", err);
    feedContainer.innerHTML = "<p>Failed to load posts.</p>";
  }
}
//likes and comment
document.getElementById("post-feed").addEventListener("click", async (e) => {
  const user = auth.currentUser;
  if (!user) return;

  const postCard = e.target.closest(".post-card");
  const postId = postCard?.getAttribute("data-id");
  const commentSection = postCard?.querySelector(".comment-section");
  const commentList = commentSection?.querySelector(".comment-list");

  // ❤️ Like toggle
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) {
    await toggleLike(postId, user.uid);
    return;
  }

  // 👥 Show who liked
  const countSpan = e.target.closest(".like-count");
  if (countSpan) {
    const modal = document.getElementById("like-modal");
    const list = document.getElementById("like-user-list");
    list.innerHTML = "<li>Loading...</li>";
    modal.style.display = "flex";

    try {
      const postSnap = await getDoc(doc(db, "posts", postId));
      const data = postSnap.data();
      const likesObj = data.likes || {};
      const userIds = Object.keys(likesObj);

      if (userIds.length === 0) {
        list.innerHTML = "<li>No likes yet.</li>";
        return;
      }

      list.innerHTML = "";
      for (const uid of userIds) {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          const time = likesObj[uid]?.toDate ? likesObj[uid].toDate() : new Date();
          const ago = timeSince(time);
          const li = document.createElement("li");

          if (snap.exists()) {
            const u = snap.data();
            li.innerHTML = `
              <img src="${u.profileImage || defaultImg}" />
              <div>
                <strong>${u.name || "Student"}</strong>
                ${u.verified ? '<i class="fa-solid fa-circle-check" style="color:green"></i>' : ''}
                <br />
                <small>Liked ${ago}</small>
              </div>
            `;
          } else {
            li.innerHTML = `<strong>Unknown User</strong><br><small>Liked ${ago}</small>`;
          }

          list.appendChild(li);
        } catch {
          const li = document.createElement("li");
          li.textContent = "Failed to load user info.";
          list.appendChild(li);
        }
      }
    } catch {
      list.innerHTML = "<li>Failed to load likes.</li>";
    }
    return;
  }

  // 💬 Open comment section
  if (e.target.closest(".comment-count") || e.target.closest(".fa-comment")) {
    commentSection.classList.remove("collapsed");
    await loadComments(postId, commentList);
    return;
  }

  // ❌ Close comment section
  if (e.target.closest(".close-comment-btn")) {
    commentSection.classList.add("collapsed");
    return;
  }

  // 📝 Send comment
  if (e.target.closest(".send-comment-btn")) {
    const input = commentSection.querySelector(".comment-input");
    const text = input.value.trim();
    if (!text) return;

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user.uid,
        username: userData.name || user.displayName || "Student",
        userImage: userData.profileImage || user.photoURL || defaultImg,
        text,
        timestamp: serverTimestamp(),
        verified: userData.verified === true
      });

      await updateDoc(doc(db, "posts", postId), {
        commentCount: increment(1)
      });

      input.value = "";
      await loadComments(postId, commentList);
    } catch (err) {
      console.error("Failed to send comment:", err);
      alert("Failed to send comment.");
    }
    return;
  }

  // 🗑️ Delete comment
if (e.target.closest(".delete-comment-btn")) {
  const commentItem = e.target.closest(".comment-item");
  const commentId = commentItem?.getAttribute("data-cid");

  if (commentId && confirm("Delete this comment?")) {
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), {
        commentCount: increment(-1)
      });
      await loadComments(postId, commentList); // refresh comments
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment.");
    }
  }

  return;
}


  
});

// 💖 Firestore Like Toggle Function
async function toggleLike(postId, userId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const postData = postSnap.data();

  const likes = postData.likes || {};
  const alreadyLiked = likes[userId];
  const updatedLikes = { ...likes };

  if (alreadyLiked) {
    delete updatedLikes[userId];
  } else {
    updatedLikes[userId] = serverTimestamp();
  }

  await updateDoc(postRef, { likes: updatedLikes });

  // Update UI
  const likeCountEl = document.querySelector(`.like-count[data-id="${postId}"]`);
  if (likeCountEl) {
    likeCountEl.textContent = Object.keys(updatedLikes).length;
  }
}

// ✅ Modal Close
document.getElementById("close-like-modal")?.addEventListener("click", () => {
  document.getElementById("like-modal").style.display = "none";
});

// ✅ Load Comments
async function loadComments(postId, container) {
  container.innerHTML = "<p>Loading...</p>";

  try {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("timestamp", "desc") // newest first
    );
    const snapshot = await getDocs(q);

    const currentUser = auth.currentUser?.uid;
    const commentCountEl = document.querySelector(
      `.post-card[data-id="${postId}"] .comment-count`
    );

    // Update comment count
    if (commentCountEl) {
      commentCountEl.textContent = snapshot.size;
    }

    if (snapshot.empty) {
      container.innerHTML = "<p>No comments yet.</p>";
      return;
    }
container.innerHTML = "";
snapshot.forEach(doc => {
  const c = doc.data();
  const time = c.timestamp?.toDate ? timeSince(c.timestamp.toDate()) : "Just now";
  const commentId = doc.id;
  const isOwner = currentUser === c.userId;

  const commentHTML = `
  <div class="comment-item" data-post="${postId}" data-cid="${commentId}">
    <a href="profile.html?uid=${c.userId}" class="comment-user-link">
      <img src="${c.userImage || defaultImg}" class="comment-user-img" />
    </a>
    <div class="comment-content">
      <a href="profile.html?uid=${c.userId}" class="comment-user-name">
        ${c.username || "Student"} 
        ${c.verified ? '<i class="fa-solid fa-circle-check" style="color:green; margin-left: 3px;"></i>' : ""}
      </a>
      <p class="comment-text">${c.text}</p>
      <small class="comment-time">${time}</small>
    </div>
    ${isOwner ? `<button class="delete-comment-btn" title="Delete">🗑️</button>` : ""}
  </div>
`;

  
  container.innerHTML += commentHTML; // ✅ Safe since we build as string
});


    
  } catch (err) {
    console.error("Error loading comments:", err);
    container.innerHTML = "<p>Failed to load comments.</p>";
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


// ============================
// 📧 EMAILJS NOTIFICATIONS
// ============================
function sendEmailNotification(params) {
  return emailjs.send("service_elczufd", "template_8el5p9l", params)
    .then(res => console.log("✅ Email sent", res))
    .catch(err => console.error("❌ Email error", err));
}

// 🔔 Notify all users when someone posts
async function notifyNewPost(username, caption) {
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(userDoc => {
    const user = userDoc.data();
    if (user.email) {
      sendEmailNotification({
        to_email: user.email,
        from_name: username,
        message: `posted: "${caption}"`
      });
    }
  });
}

// 💬 Notify post owner when someone comments
async function notifyNewComment(postId, commenterName, commentText) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const postData = postSnap.data();
  const postOwnerId = postData.userId;

  if (auth.currentUser?.uid === postOwnerId) return; // don’t notify self

  const ownerRef = doc(db, "users", postOwnerId);
  const ownerSnap = await getDoc(ownerRef);

  if (ownerSnap.exists()) {
    const ownerEmail = ownerSnap.data().email;
    if (ownerEmail) {
      sendEmailNotification({
        to_email: ownerEmail,
        from_name: commenterName,
        message: `commented: "${commentText}" on your post`
      });
    }
  }
}

// ❤️ Notify post owner when someone likes
async function notifyNewLike(postId, likerName) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const postData = postSnap.data();
  const postOwnerId = postData.userId;

  if (auth.currentUser?.uid === postOwnerId) return; // don’t notify self

  const ownerRef = doc(db, "users", postOwnerId);
  const ownerSnap = await getDoc(ownerRef);

  if (ownerSnap.exists()) {
    const ownerEmail = ownerSnap.data().email;
    if (ownerEmail) {
      sendEmailNotification({
        to_email: ownerEmail,
        from_name: likerName,
        message: `liked your post`
      });
    }
  }
}

// 👥 Notify user when they get a friend request
async function notifyFriendRequest(fromUserName, toUserId) {
  const toUserRef = doc(db, "users", toUserId);
  const toUserSnap = await getDoc(toUserRef);

  if (toUserSnap.exists()) {
    const toEmail = toUserSnap.data().email;
    if (toEmail) {
      sendEmailNotification({
        to_email: toEmail,
        from_name: fromUserName,
        message: `sent you a friend request`
      });
    }
  }
}
