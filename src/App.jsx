// App.jsx - VERSÃO DE EMERGÊNCIA SIMPLIFICADA
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import './App.css'

// Componente de Header Simples
function HeaderSimples({ onLogout, userEmail }) {
  return (
    <header className="bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Loteria Imperatriz</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Olá, {userEmail}</span>
          <button 
            onClick={onLogout}
            className="bg-teal-700 hover:bg-teal-800 px-3 py-1 rounded text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}

// Componente de Navegação Simples
function NavegacaoSimples({ telaAtiva, setTelaAtiva }) {
  const opcoes = [
    { id: 'caixa-central', nome: 'Caixa Central' },
    { id: 'caixa-1', nome: 'Caixa 1' },
    { id: 'caixa-2', nome: 'Caixa 2' },
    { id: 'caixa-3', nome: 'Caixa 3' },
    { id: 'caixa-4', nome: 'Caixa 4' },
    { id: 'caixa-5', nome: 'Caixa 5' },
    { id: 'caixa-6', nome: 'Caixa 6' }
  ]

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="flex flex-wrap gap-2">
        {opcoes.map(opcao => (
          <button
            key={opcao.id}
            onClick={() => setTelaAtiva(opcao.id)}
            className={`px-4 py-2 rounded transition-colors ${
              telaAtiva === opcao.id 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {opcao.nome}
          </button>
        ))}
      </div>
    </nav>
  )
}

// Componente de Conteúdo Simples
function ConteudoSimples({ telaAtiva }) {
  const renderizarConteudo = () => {
    if (telaAtiva === 'caixa-central') {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Caixa Central</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Suprimentos</h3>
              <p className="text-2xl font-bold text-blue-600">R$ 0,00</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Total Sangrias</h3>
              <p className="text-2xl font-bold text-red-600">R$ 0,00</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Saldo Final</h3>
              <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Status dos Caixas</h3>
            <div className="space-y-2">
              {[1,2,3,4,5,6].map(num => (
                <div key={num} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Caixa {num}</span>
                  <span className="text-green-600 font-semibold">Operacional</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    const numeroCaixa = telaAtiva.split('-')[1]
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Caixa {numeroCaixa}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Saldo Inicial</h3>
            <p className="text-xl font-bold text-blue-600">R$ 0,00</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Suprimentos</h3>
            <p className="text-xl font-bold text-green-600">R$ 0,00</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Sangrias</h3>
            <p className="text-xl font-bold text-red-600">R$ 0,00</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Adicionar Suprimento</h3>
            <div className="space-y-3">
              <input 
                type="number" 
                placeholder="Valor (R$)" 
                className="w-full p-2 border rounded"
              />
              <input 
                type="text" 
                placeholder="Observação" 
                className="w-full p-2 border rounded"
              />
              <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                Adicionar Suprimento
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Adicionar Sangria</h3>
            <div className="space-y-3">
              <input 
                type="number" 
                placeholder="Valor (R$)" 
                className="w-full p-2 border rounded"
              />
              <input 
                type="text" 
                placeholder="Observação" 
                className="w-full p-2 border rounded"
              />
              <button className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700">
                Adicionar Sangria
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Fechamento do Caixa</h3>
          <div className="flex gap-3">
            <input 
              type="number" 
              placeholder="Valor final da máquina (R$)" 
              className="flex-1 p-2 border rounded"
            />
            <button className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
              Fechar Caixa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {renderizarConteudo()}
    </div>
  )
}

// Componente principal da aplicação
function AppContent() {
  const { currentUser, loading, logout } = useAuth()
  const [telaAtiva, setTelaAtiva] = useState('caixa-central')

  // Mostrar loading
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

  // Se não estiver logado, mostrar login
  if (!currentUser) {
    console.log('🔐 Usuário não autenticado, mostrando tela de login')
    return <Login />
  }

  // Se estiver logado, mostrar aplicação
  console.log('✅ Usuário autenticado:', currentUser.email, 'mostrando aplicação principal')

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderSimples 
        onLogout={handleLogout} 
        userEmail={currentUser.email} 
      />
      <NavegacaoSimples 
        telaAtiva={telaAtiva} 
        setTelaAtiva={setTelaAtiva} 
      />
      <ConteudoSimples telaAtiva={telaAtiva} />
    </div>
  )
}

// App principal
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
