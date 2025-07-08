import { createContext, useContext, useState } from 'react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Função de login simulada para demonstração
  const login = async (email, password) => {
    try {
      setError('')
      setLoading(true)
      
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Validação simples para demonstração
      if (email && password) {
        setUser({ email })
      } else {
        setError('Email e senha são obrigatórios')
        throw new Error('Credenciais inválidas')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      if (!error.message.includes('Credenciais')) {
        setError('Erro ao fazer login')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      setUser(null)
    } catch (error) {
      console.error('Erro no logout:', error)
      setError('Erro ao fazer logout')
    }
  }

  // Função para criar usuário (para administração)
  const createUser = async (email, password) => {
    try {
      setError('')
      // Simular criação de usuário
      return { email }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      setError('Erro ao criar usuário')
      throw error
    }
  }

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

