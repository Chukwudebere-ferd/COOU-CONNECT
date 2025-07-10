import { initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByuuRpHOfeWEcKl_oaob6V_tmnYyJ_vbU",
  authDomain: "coou-connect-75406.firebaseapp.com",
  projectId: "coou-connect-75406",
  storageBucket: "coou-connect-75406.appspot.com",
  messagingSenderId: "1070347911713",
  appId: "1:1070347911713:web:35c75b840a38f6cd7a1960"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const welcomeText = document.getElementById("welcome-text");
const signoutBtn = document.getElementById("signout-btn");

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"; // Redirect to login
    return;
}

   const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.exists()? userDoc.data(): {};
  const name = data.name || user.displayName || "User";
  const badge = data.verified? " <span style='color:green;'>✅</span>": "";

  welcomeText.innerHTML = `Welcome, ${name}${badge}!`;
});


// Sign out
signoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
