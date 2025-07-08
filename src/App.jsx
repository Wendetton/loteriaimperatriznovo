import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CaixaProvider } from './contexts/CaixaContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import CaixaIndividual from './components/caixas/CaixaIndividual'
import CaixaCentral from './components/caixas/CaixaCentral'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()
  const [caixaAtivo, setCaixaAtivo] = useState('central')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderizarConteudo = () => {
    if (caixaAtivo === 'central') {
      return <CaixaCentral />
    } else {
      const numeroCaixa = parseInt(caixaAtivo.replace('caixa-', ''))
      return <CaixaIndividual numeroCaixa={numeroCaixa} />
    }
  }

  return (
    <CaixaProvider>
      <Layout 
        caixaAtivo={caixaAtivo} 
        onCaixaChange={setCaixaAtivo}
      >
        {renderizarConteudo()}
      </Layout>
    </CaixaProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

