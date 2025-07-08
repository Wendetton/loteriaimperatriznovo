import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth'
import { auth } from '../services/firebase'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Função de login
  const login = async (email, password) => {
    try {
      setError('')
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('Erro no login:', error)
      setError(getErrorMessage(error.code))
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Erro no logout:', error)
      setError('Erro ao fazer logout')
    }
  }

  // Função para criar usuário (para administração)
  const createUser = async (email, password) => {
    try {
      setError('')
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  // Função para traduzir códigos de erro do Firebase
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado'
      case 'auth/wrong-password':
        return 'Senha incorreta'
      case 'auth/invalid-email':
        return 'Email inválido'
      case 'auth/user-disabled':
        return 'Usuário desabilitado'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde'
      case 'auth/email-already-in-use':
        return 'Email já está em uso'
      case 'auth/weak-password':
        return 'Senha muito fraca'
      default:
        return 'Erro de autenticação'
    }
  }

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    login,
    logout,
    createUser,
    loading,
    error,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

