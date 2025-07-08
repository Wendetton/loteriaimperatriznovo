// App.jsx - Versão Corrigida com Navegação Funcionando
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CaixaProvider } from './contexts/CaixaContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import CaixaIndividual from './components/caixas/CaixaIndividual'
import CaixaCentral from './components/caixas/CaixaCentral'
import './App.css'

// Componente principal da aplicação
function AppContent() {
  const { currentUser, loading } = useAuth()
  const [telaAtiva, setTelaAtiva] = useState('caixa-central')

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver logado, mostrar tela de login
  if (!currentUser) {
    console.log('Usuário não autenticado, mostrando tela de login')
    return <Login />
  }

  // Se estiver logado, mostrar aplicação principal
  console.log('Usuário autenticado:', currentUser.email, 'mostrando aplicação principal')

  // Função para renderizar conteúdo baseado na tela ativa
  const renderConteudo = () => {
    if (telaAtiva === 'caixa-central') {
      return <CaixaCentral />
    }
    
    if (telaAtiva.startsWith('caixa-')) {
      const numeroCaixa = parseInt(telaAtiva.split('-')[1])
      return <CaixaIndividual numeroCaixa={numeroCaixa} />
    }
    
    return <CaixaCentral />
  }

  return (
    <CaixaProvider>
      <Layout telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva}>
        {renderConteudo()}
      </Layout>
    </CaixaProvider>
  )
}

// Componente App principal com providers
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

