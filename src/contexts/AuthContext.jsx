// AuthContext.jsx - Versão Final com Navegação Corrigida
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
      console.log('🔐 Iniciando login para:', email)
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login bem-sucedido para:', result.user.email)
      
      // Forçar atualização do estado
      setCurrentUser(result.user)
      
      return result
    } catch (error) {
      console.error('❌ Erro no login:', error)
      
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
        case 'auth/invalid-credential':
          errorMessage = 'Credenciais inválidas'
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
      setLoading(true)
      console.log('🚪 Fazendo logout...')
      
      await signOut(auth)
      console.log('✅ Logout realizado com sucesso')
      
      // Forçar limpeza do estado
      setCurrentUser(null)
      
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      setError('Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔄 Configurando listener de autenticação...')
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        console.log('🔄 Estado de autenticação mudou:', user ? `✅ ${user.email}` : '❌ Não logado')
        
        setCurrentUser(user)
        setLoading(false)
        
        // Log adicional para debug
        if (user) {
          console.log('👤 Usuário logado:', {
            email: user.email,
            uid: user.uid,
            emailVerified: user.emailVerified
          })
        }
      }, 
      (error) => {
        console.error('❌ Erro no listener de autenticação:', error)
        setCurrentUser(null)
        setLoading(false)
        setError('Erro na autenticação')
      }
    )

    // Cleanup function
    return () => {
      console.log('🧹 Removendo listener de autenticação')
      unsubscribe()
    }
  }, [])

  // Log do estado atual para debug
  useEffect(() => {
    console.log('📊 Estado atual do Auth:', {
      currentUser: currentUser ? currentUser.email : null,
      loading,
      error
    })
  }, [currentUser, loading, error])

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

