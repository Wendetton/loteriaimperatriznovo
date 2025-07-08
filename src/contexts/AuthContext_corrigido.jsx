// AuthContext.jsx - Versão Corrigida para Produção
import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function login(email, password) {
    try {
      setError('')
      setLoading(true)
      console.log('Tentando fazer login com:', email)
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Login bem-sucedido:', result.user.email)
      
      return result
    } catch (error) {
      console.error('Erro no login:', error)
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao fazer login'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado'
          break
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido'
          break
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet'
          break
        default:
          errorMessage = error.message || 'Email ou senha incorretos'
      }
      
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      setError('')
      await signOut(auth)
      console.log('Logout realizado com sucesso')
    } catch (error) {
      console.error('Erro no logout:', error)
      setError('Erro ao fazer logout')
    }
  }

  useEffect(() => {
    console.log('Configurando listener de autenticação...')
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Estado de autenticação mudou:', user ? user.email : 'Não logado')
      setCurrentUser(user)
      setLoading(false)
    }, (error) => {
      console.error('Erro no listener de autenticação:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    logout,
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

