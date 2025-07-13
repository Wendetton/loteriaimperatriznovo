// src/services/trocoService.js
import app, { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  limit
} from "firebase/firestore";

const trocoCol = collection(db, "troco");

export async function abrirTroco(caixaId, valorInicial) {
  const usuarioId = auth.currentUser.uid;
  const docRef = await addDoc(trocoCol, {
    caixaId,
    usuarioId,
    valorInicial: Number(valorInicial),
    dataAbertura: serverTimestamp(),
    valorAjuste: 0,
    motivoAjuste: "",
    dataAjuste: null,
    fechado: false,
    dataFechamento: null
  });
  return docRef.id;
}

export async function ajustarTroco(trocoId, valor, motivo) {
  const trocoRef = updateDoc;
  await updateDoc(
    // incrementa (+ ou –) o campo valorAjuste
    doc(db, "troco", trocoId),
    {
      valorAjuste: increment(Number(valor)),
      motivoAjuste: motivo,
      dataAjuste: serverTimestamp()
    }
  );
}

export async function fecharTroco(trocoId) {
  await updateDoc(doc(db, "troco", trocoId), {
    fechado: true,
    dataFechamento: serverTimestamp()
  });
}

export async function getTrocoAtivo(caixaId) {
  const q = query(
    trocoCol,
    where("caixaId", "==", caixaId),
    where("fechado", "==", false),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}
