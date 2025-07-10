import { initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, updateDoc, doc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

// ✅ DOM references
const tbody = document.querySelector("#user-table tbody");
const signoutBtn = document.getElementById("signout-btn");

// ✅ Auth check and role verification
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You must be signed in.");
    window.location.href = "index.html";
    return;
}

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      alert("User document not found.");
      window.location.href = "index.html";
      return;
}

    const userData = userDoc.data();
    if (userData.role!== "admin") {
      alert("Access denied. Admins only.");
      window.location.href = "index.html";
      return;
}

    // ✅ Load users if admin
    loadUsers();

} catch (error) {
    console.error("Error checking admin role:", error.message);
    alert("Something went wrong.");
}
});

// ✅ Load all users into the table
async function loadUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    tbody.innerHTML = "";

    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = document.createElement("tr");

      const badge = data.verified? " <span style='color:green;'>✅</span>": "";
row.innerHTML = `
  <td>${data.name || "N/A"}${badge}</td>
  <td>${data.email || "N/A"}</td>
  <td>${data.verified? "✅": "❌"}</td>
  <td>
  <button onclick="toggleVerification('${docSnap.id}', ${data.verified})">
    ${data.verified? "Unverify": "Verify"}
  </button>
</td>
`;



      tbody.appendChild(row);
});

} catch (error) {
    console.error("Error loading users:", error.message);
    alert("Failed to load users.");
}
}
loadUsers();
// ✅ Verify user
window.toggleVerification = async (uid, currentStatus) => {
  try {
    await updateDoc(doc(db, "users", uid), { verified:!currentStatus});
    alert(`User ${!currentStatus? "verified": "unverified"}!`);
    loadUsers();
} catch (error) {
    console.error("Error updating verification:", error.message);
    alert("Failed to update verification status.");
}
};

// ✅ Sign out
signoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
