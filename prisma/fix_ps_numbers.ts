import { db } from "../src/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

async function fixPsNumbers() {
  const colRef = collection(db, "problems");
  const snap = await getDocs(colRef);
  const docs = snap.docs.sort((a, b) => String(a.data().createdAt || "").localeCompare(String(b.data().createdAt || "")));

  let idx = 1;
  for (const d of docs) {
    const data = d.data();
    await updateDoc(doc(db, "problems", d.id), { psNumber: idx });
    console.log(`Updated problem ${d.id} (${data.title.substring(0, 30)}...) with psNumber ${idx}`);
    idx++;
  }
  console.log("Finished assigning psNumbers!");
  process.exit(0);
}

fixPsNumbers().catch(console.error);
