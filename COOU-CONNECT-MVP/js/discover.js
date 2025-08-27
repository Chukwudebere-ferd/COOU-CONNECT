import {
  getFirestore, collection, getDocs, addDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyByuuRpHOfeWEcKl_oaob6V_tmnYyJ_vbU",
  authDomain: "coou-connect-75406.firebaseapp.com",
  projectId: "coou-connect-75406",
  storageBucket: "coou-connect-75406.appspot.com",
  messagingSenderId: "1070347911713",
  appId: "1:1070347911713:web:35c75b840a38f6cd7a1960"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

const discoverList = document.getElementById('discover-list');
const discoverInput = document.getElementById('discover-input');
const postBtn = document.getElementById('post-discover-btn');
const postForm = document.getElementById('discover-post-form');

let currentUser = null;

// Check auth and get verified status
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    const userSnap = await getDocs(query(collection(db, 'users')));
    const userData = userSnap.docs.find(doc => doc.id === user.uid)?.data();

    if (!userData?.verified) {
      postForm.style.display = "none";
    }

    loadDiscoverPosts();
  } else {
    window.location.href = '/login.html';
  }
});

async function loadDiscoverPosts() {
  discoverList.innerHTML = '<div class="skeleton-post"></div>';

  const q = query(collection(db, "discover"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  let html = '';
  snapshot.forEach(doc => {
    const data = doc.data();
    html += `
      <div class="discover-post">
        <strong>${data.name || "User"}</strong><br/>
        <small>${new Date(data.timestamp?.seconds * 1000).toLocaleString()}</small>
        <p>${data.text}</p>
      </div>
    `;
  });

  discoverList.innerHTML = html || "<p>No discover posts yet.</p>";
}

// Posting
postBtn.onclick = async () => {
  const text = discoverInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "discover"), {
    userId: currentUser.uid,
    text,
    timestamp: serverTimestamp(),
    name: currentUser.displayName || "User"
  });

  discoverInput.value = '';
  loadDiscoverPosts();
};
