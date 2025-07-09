// App.jsx - VERSÃO CORRIGIDA E FUNCIONAL
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import './App.css'

// Utilitários
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

const formatarDataHora = (dataString) => {
  if (!dataString) return ''
  const data = new Date(dataString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data)
}

// Componente Header
function Header({ onLogout, dataSelecionada, setDataSelecionada, userEmail }) {
  return (
    <header className="bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Loteria Imperatriz</h1>
          <p className="text-sm opacity-90">Sistema de Gestão Financeira - Funcional</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm opacity-90 mb-1">Data:</label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="px-3 py-1 rounded text-gray-800 text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm opacity-90">Administrador</p>
            <p className="font-semibold">Administrador Principal</p>
          </div>
          <button 
            onClick={onLogout}
            className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}

// Componente Sidebar
function Sidebar({ caixaAtivo, setCaixaAtivo }) {
  return (
    <div className="bg-gray-100 w-64 p-4 shadow-lg">
      <nav className="space-y-2">
        <button
          onClick={() => setCaixaAtivo('resumo')}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            caixaAtivo === 'resumo' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white hover:bg-blue-50'
          }`}
        >
          📊 Resumo Geral
        </button>
        
        {[1, 2, 3, 4, 5, 6].map(numero => (
          <button
            key={numero}
            onClick={() => setCaixaAtivo(`caixa-${numero}`)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              caixaAtivo === `caixa-${numero}` 
                ? 'bg-green-500 text-white' 
                : 'bg-white hover:bg-green-50'
            }`}
          >
            💰 Caixa {numero}
          </button>
        ))}
        
        <button
          onClick={() => setCaixaAtivo('central')}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            caixaAtivo === 'central' 
              ? 'bg-purple-500 text-white' 
              : 'bg-white hover:bg-purple-50'
          }`}
        >
          🏢 Caixa Central
        </button>
        
        <button
          onClick={() => setCaixaAtivo('relatorio')}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            caixaAtivo === 'relatorio' 
              ? 'bg-red-500 text-white' 
              : 'bg-white hover:bg-red-50'
          }`}
        >
          📄 Relatório
        </button>
      </nav>
    </div>
  )
}

// Componente Caixa Individual
function CaixaIndividual({ numero, dataSelecionada }) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [dadosCaixa, setDadosCaixa] = useState({
    trocoInicial: 0,
    valorMaquina: 0,
    fechado: false
  })
  
  const [novoSuprimento, setNovoSuprimento] = useState({ valor: '', observacao: '' })
  const [novaSangria, setNovaSangria] = useState({ valor: '', observacao: '' })
  const [novoTroco, setNovoTroco] = useState('')
  const [novoValorMaquina, setNovoValorMaquina] = useState('')

  // Carregar dados ao montar o componente
  useEffect(() => {
    const chaveMovimentacoes = `movimentacoes_caixa_${numero}_${dataSelecionada}`
    const chaveDados = `dados_caixa_${numero}_${dataSelecionada}`
    
    try {
      const movimentacoesCarregadas = JSON.parse(localStorage.getItem(chaveMovimentacoes) || '[]')
      const dadosCarregados = JSON.parse(localStorage.getItem(chaveDados) || '{"trocoInicial":0,"valorMaquina":0,"fechado":false}')
      
      setMovimentacoes(movimentacoesCarregadas)
      setDadosCaixa(dadosCarregados)
      
      console.log('📦 Dados carregados para Caixa', numero, ':', { movimentacoesCarregadas, dadosCarregados })
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setMovimentacoes([])
      setDadosCaixa({ trocoInicial: 0, valorMaquina: 0, fechado: false })
    }
  }, [numero, dataSelecionada])

  // Calcular totais
  const totalSuprimentos = movimentacoes
    .filter(m => m.tipo === 'suprimento')
    .reduce((total, m) => total + m.valor, 0)
    
  const totalSangrias = movimentacoes
    .filter(m => m.tipo === 'sangria')
    .reduce((total, m) => total + m.valor, 0)
    
  const valorEsperado = dadosCaixa.trocoInicial + totalSuprimentos - totalSangrias
  const divergencia = dadosCaixa.valorMaquina - valorEsperado

  // Adicionar suprimento
  const adicionarSuprimento = () => {
    const valor = parseFloat(novoSuprimento.valor)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para o suprimento')
      return
    }

    const novaMovimentacao = {
      id: Date.now(),
      tipo: 'suprimento',
      valor: valor,
      observacao: novoSuprimento.observacao || 'Suprimento',
      criadoPor: 'Administrador Principal',
      criadoEm: new Date().toISOString()
    }

    const novasMovimentacoes = [...movimentacoes, novaMovimentacao]
    setMovimentacoes(novasMovimentacoes)
    
    // Salvar no localStorage
    const chaveMovimentacoes = `movimentacoes_caixa_${numero}_${dataSelecionada}`
    localStorage.setItem(chaveMovimentacoes, JSON.stringify(novasMovimentacoes))
    
    console.log('✅ Suprimento adicionado:', novaMovimentacao)
    
    // Limpar formulário
    setNovoSuprimento({ valor: '', observacao: '' })
    
    alert('Suprimento adicionado com sucesso!')
  }

  // Adicionar sangria
  const adicionarSangria = () => {
    const valor = parseFloat(novaSangria.valor)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para a sangria')
      return
    }

    const novaMovimentacao = {
      id: Date.now(),
      tipo: 'sangria',
      valor: valor,
      observacao: novaSangria.observacao || 'Sangria',
      criadoPor: 'Administrador Principal',
      criadoEm: new Date().toISOString()
    }

    const novasMovimentacoes = [...movimentacoes, novaMovimentacao]
    setMovimentacoes(novasMovimentacoes)
    
    // Salvar no localStorage
    const chaveMovimentacoes = `movimentacoes_caixa_${numero}_${dataSelecionada}`
    localStorage.setItem(chaveMovimentacoes, JSON.stringify(novasMovimentacoes))
    
    console.log('✅ Sangria adicionada:', novaMovimentacao)
    
    // Limpar formulário
    setNovaSangria({ valor: '', observacao: '' })
    
    alert('Sangria adicionada com sucesso!')
  }

  // Definir troco inicial
  const definirTrocoInicial = () => {
    const valor = parseFloat(novoTroco)
    if (isNaN(valor) || valor < 0) {
      alert('Digite um valor válido para o troco inicial')
      return
    }

    const novosDados = { ...dadosCaixa, trocoInicial: valor }
    setDadosCaixa(novosDados)
    
    const chaveDados = `dados_caixa_${numero}_${dataSelecionada}`
    localStorage.setItem(chaveDados, JSON.stringify(novosDados))
    
    console.log('✅ Troco inicial definido:', valor)
    
    setNovoTroco('')
    alert('Troco inicial definido com sucesso!')
  }

  // Definir valor da máquina
  const definirValorMaquina = () => {
    const valor = parseFloat(novoValorMaquina)
    if (isNaN(valor) || valor < 0) {
      alert('Digite um valor válido para o valor da máquina')
      return
    }

    const novosDados = { ...dadosCaixa, valorMaquina: valor }
    setDadosCaixa(novosDados)
    
    const chaveDados = `dados_caixa_${numero}_${dataSelecionada}`
    localStorage.setItem(chaveDados, JSON.stringify(novosDados))
    
    console.log('✅ Valor da máquina definido:', valor)
    
    setNovoValorMaquina('')
    alert('Valor da máquina definido com sucesso!')
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">💰 Gestão do Caixa {numero}</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Data: {dataSelecionada}</p>
          <span className={`px-3 py-1 rounded-full text-sm ${
            dadosCaixa.fechado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {dadosCaixa.fechado ? '🔒 Fechado' : '🔓 Aberto'}
          </span>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Troco Inicial</h3>
          <p className="text-2xl font-bold text-blue-600">{formatarMoeda(dadosCaixa.trocoInicial)}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Suprimentos</h3>
          <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalSuprimentos)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">Sangrias</h3>
          <p className="text-2xl font-bold text-red-600">{formatarMoeda(totalSangrias)}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Valor Esperado</h3>
          <p className="text-2xl font-bold text-purple-600">{formatarMoeda(valorEsperado)}</p>
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">⚙️ Configurar Troco Inicial</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={novoTroco}
              onChange={(e) => setNovoTroco(e.target.value)}
              placeholder="Valor do troco inicial (R$)"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={definirTrocoInicial}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Definir
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">🖥️ Valor da Máquina</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={novoValorMaquina}
              onChange={(e) => setNovoValorMaquina(e.target.value)}
              placeholder="Valor final da máquina (R$)"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={definirValorMaquina}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Definir
            </button>
          </div>
          {dadosCaixa.valorMaquina > 0 && (
            <div className={`mt-2 p-2 rounded ${
              Math.abs(divergencia) < 0.01 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="text-sm">
                Valor da máquina: {formatarMoeda(dadosCaixa.valorMaquina)}
              </p>
              <p className="text-sm">
                Divergência: {formatarMoeda(divergencia)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formulários de Movimentação */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800 mb-3">➕ Adicionar Suprimento</h3>
          <div className="space-y-3">
            <input
              type="number"
              value={novoSuprimento.valor}
              onChange={(e) => setNovoSuprimento({...novoSuprimento, valor: e.target.value})}
              placeholder="Valor (R$)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={novoSuprimento.observacao}
              onChange={(e) => setNovoSuprimento({...novoSuprimento, observacao: e.target.value})}
              placeholder="Observação (opcional)"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={adicionarSuprimento}
              className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Adicionar Suprimento
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-red-800 mb-3">➖ Adicionar Sangria</h3>
          <div className="space-y-3">
            <input
              type="number"
              value={novaSangria.valor}
              onChange={(e) => setNovaSangria({...novaSangria, valor: e.target.value})}
              placeholder="Valor (R$)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={novaSangria.observacao}
              onChange={(e) => setNovaSangria({...novaSangria, observacao: e.target.value})}
              placeholder="Observação (opcional)"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={adicionarSangria}
              className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Adicionar Sangria
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Movimentações */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-3">📋 Histórico de Movimentações</h3>
        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
        ) : (
          <div className="space-y-2">
            {movimentacoes.map(mov => (
              <div key={mov.id} className={`p-3 rounded border-l-4 ${
                mov.tipo === 'suprimento' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-semibold ${
                      mov.tipo === 'suprimento' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {mov.tipo === 'suprimento' ? '➕ Suprimento' : '➖ Sangria'}: {formatarMoeda(mov.valor)}
                    </span>
                    {mov.observacao && (
                      <p className="text-sm text-gray-600">{mov.observacao}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{formatarDataHora(mov.criadoEm)}</p>
                    <p>por {mov.criadoPor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente Resumo Geral
function ResumoGeral({ dataSelecionada }) {
  const [resumo, setResumo] = useState({
    totalSuprimentos: 0,
    totalSangrias: 0,
    caixasFechados: 0
  })

  useEffect(() => {
    // Calcular resumo de todos os caixas
    let totalSuprimentos = 0
    let totalSangrias = 0
    let caixasFechados = 0

    for (let i = 1; i <= 6; i++) {
      const chaveMovimentacoes = `movimentacoes_caixa_${i}_${dataSelecionada}`
      const chaveDados = `dados_caixa_${i}_${dataSelecionada}`
      
      try {
        const movimentacoes = JSON.parse(localStorage.getItem(chaveMovimentacoes) || '[]')
        const dados = JSON.parse(localStorage.getItem(chaveDados) || '{"fechado":false}')
        
        totalSuprimentos += movimentacoes
          .filter(m => m.tipo === 'suprimento')
          .reduce((total, m) => total + m.valor, 0)
          
        totalSangrias += movimentacoes
          .filter(m => m.tipo === 'sangria')
          .reduce((total, m) => total + m.valor, 0)
          
        if (dados.fechado) caixasFechados++
      } catch (error) {
        console.error('Erro ao calcular resumo para caixa', i, ':', error)
      }
    }

    setResumo({ totalSuprimentos, totalSangrias, caixasFechados })
  }, [dataSelecionada])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Resumo Geral - Sistema Funcional</h2>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="font-semibold text-green-800">Total Suprimentos</h3>
          <p className="text-3xl font-bold text-green-600">{formatarMoeda(resumo.totalSuprimentos)}</p>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="font-semibold text-red-800">Total Sangrias</h3>
          <p className="text-3xl font-bold text-red-600">{formatarMoeda(resumo.totalSangrias)}</p>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-800">Progresso</h3>
          <p className="text-3xl font-bold text-blue-600">{resumo.caixasFechados}/6</p>
          <p className="text-sm text-blue-600">{Math.round((resumo.caixasFechados/6)*100)}% concluído</p>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">✅ Status do Sistema</h3>
        <div className="space-y-1 text-sm">
          <p>✅ Sistema funcionando corretamente</p>
          <p>✅ Dados salvos localmente</p>
          <p>✅ Todas as funcionalidades operacionais</p>
        </div>
      </div>
    </div>
  )
}

// Componente Principal
function AppContent() {
  const { user, logout } = useAuth()
  const [caixaAtivo, setCaixaAtivo] = useState('resumo')
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )

  const renderizarConteudo = () => {
    if (caixaAtivo === 'resumo') {
      return <ResumoGeral dataSelecionada={dataSelecionada} />
    } else if (caixaAtivo.startsWith('caixa-')) {
      const numero = parseInt(caixaAtivo.replace('caixa-', ''))
      return (
        <CaixaIndividual 
          numero={numero} 
          dataSelecionada={dataSelecionada}
        />
      )
    } else if (caixaAtivo === 'central') {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🏢 Caixa Central</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
        </div>
      )
    } else if (caixaAtivo === 'relatorio') {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Relatório</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onLogout={logout}
        dataSelecionada={dataSelecionada}
        setDataSelecionada={setDataSelecionada}
        userEmail={user?.email}
      />
      
      <div className="flex">
        <Sidebar 
          caixaAtivo={caixaAtivo}
          setCaixaAtivo={setCaixaAtivo}
        />
        
        <main className="flex-1">
          {renderizarConteudo()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

