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

// ✅ Toggle logic
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

// ✅ Buttons for loading feedback
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");

// ✅ Register user and save to Firestore
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
      createdAt: new Date().toISOString()
});

    alert("Registration successful now login!");
    registerForm.reset();
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
} catch (error) {
    alert("Registration failed: " + error.message);
} finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
}
});

// ✅ Login user
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔍 Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists()? userDoc.data().role: "user";

    const userInfo = {
      uid: user.uid,
      name: userData.name || user.displayName || "User",
      email: user.email,
      role: userData.role || "user",
      verified: userData.verified || false
};

// ✅ Save to localStorage
localStorage.setItem("coouUser", JSON.stringify(userInfo));


    // 🚀 Redirect based on role
    if (role === "admin") {
      window.location.href = "admin.html";
} else {
      window.location.href = "dashboard.html";
}

} catch (error) {
    alert("Login failed: " + error.message);
} finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
}
});

