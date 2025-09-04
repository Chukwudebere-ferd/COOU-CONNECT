import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = { /* your same config */ };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

let latestPostId = null;

function startPostWatcher() {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));

  onSnapshot(q, async (snapshot) => {
    const newPost = snapshot.docs[0];
    if (!newPost) return;

    const data = newPost.data();

    // avoid duplicate sends in this session
    if (latestPostId === newPost.id) return;
    latestPostId = newPost.id;

    // only send if not yet notified
    if (data.notified) return;

    await notifyAllUsers(data.username || "Student", data.text || "New post");

    // mark post as notified so no other clients re-send
    await updateDoc(doc(db, "posts", newPost.id), { notified: true });
  });
}

async function notifyAllUsers(posterName, postContent) {
  const usersSnap = await getDocs(collection(db, "users"));
  const tasks = [];

  usersSnap.forEach((uDoc) => {
    const user = uDoc.data();
    const to = user?.email?.trim();
    if (!to) return;

    const params = {
      to_email: to,
      from_name: "COOU Connect",
      message: `${posterName} just posted: "${postContent}"`
    };

    const p = emailjs
      .send("service_elczufd", "template_8el5p9l", params)
      .then(() => console.log("📩 Sent to:", to))
      .catch((err) => console.error("❌ Email failed:", err));

    tasks.push(p);
  });

  await Promise.allSettled(tasks);
}

export { startPostWatcher, notifyAllUsers as notifyNewPost };
