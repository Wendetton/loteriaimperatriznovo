// Configuração do Firebase - Loteria Imperatriz
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Configuração do Firebase com credenciais de produção
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCneeNZGXmG2DFMAv_Fl5Zod148lPyOnRg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loteria-imperatriz-novo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loteria-imperatriz-novo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loteria-imperatriz-novo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "405842638383",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:405842638383:web:8670ecdb87efa717beb8da",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QN51Z512WY"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar serviços
export const auth = getAuth(app)
export const db = getFirestore(app)

// Inicializar Analytics apenas em produção
let analytics = null
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app)
}

export { analytics }
export default app