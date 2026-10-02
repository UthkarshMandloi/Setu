import { db } from "../src/lib/firebase";
import { collection, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

async function testConnection() {
  console.log("Testing Firestore connection...");
  try {
    const testRef = doc(collection(db, "_test_connection"), "ping");
    await setDoc(testRef, { timestamp: new Date().toISOString(), status: "ok" });
    console.log("Successfully wrote test document!");

    const snap = await getDoc(testRef);
    console.log("Read test document:", snap.data());

    await deleteDoc(testRef);
    console.log("Successfully cleaned up test document!");
    console.log("Firestore connection test passed!");
    process.exit(0);
  } catch (err: any) {
    console.error("Firestore test failed:", err.code, err.message);
    process.exit(1);
  }
}

testConnection();
