import { initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByuuRpHOfeWEcKl_oaob6V_tmnYyJ_vbU",
  authDomain: "coou-connect-75406.firebaseapp.com",
  projectId: "coou-connect-75406",
  storageBucket: "coou-connect-75406.appspot.com",
  messagingSenderId: "1070347911713",
  appId: "1:1070347911713:web:35c75b840a38f6cd7a1960"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Form toggling
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const showLoginBtn = document.querySelector(".show-login");
const showRegisterBtn = document.querySelector(".show-register");

showLoginBtn.addEventListener("click", () => {
  registerForm.style.display = "none";
  loginForm.style.display = "flex";
});

showRegisterBtn.addEventListener("click", () => {
  loginForm.style.display = "none";
  registerForm.style.display = "flex";
});

// ✅ Button references
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");

// ✅ Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role: "user",
      verified: false,
      createdAt: new Date().toISOString()
});
// Create the message element
const message = document.createElement('div');
message.textContent = 'Registration successful! Please log in.';

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

    registerForm.reset();
    registerForm.style.display = "none";
    loginForm.style.display = "flex";

} catch (error) {
  message.textContent = 'Registration failed: ' + error.message;
} finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
}
});

// ✅ Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔍 Get Firestore user document
    const userDoc = await getDoc(doc(db, "users", user.uid));

    let userData = {};
    if (userDoc.exists()) {
      userData = userDoc.data();
}

    const userInfo = {
      uid: user.uid,
      name: userData.name || user.displayName || "User",
      email: user.email,
      role: userData.role || "user",
      verified: userData.verified || false
};

    localStorage.setItem("coouUser", JSON.stringify(userInfo));

    // 🚀 Redirect
    if (userInfo.role === "admin") {
      window.location.href = "admin.html";
} else {
      window.location.href = "dashboard.html";
}

} catch (error) {
  message.textContent = 'Login failed: ' + error.message;
} finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
}
});