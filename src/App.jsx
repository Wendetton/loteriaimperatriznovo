// App.jsx - VERSÃO COMPLETA E FUNCIONAL
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

const formatarData = (data) => {
  return new Intl.DateTimeFormat('pt-BR').format(data || new Date())
}

// Hook para dados dos caixas
function useDadosCaixas() {
  const [dados, setDados] = useState(() => {
    const dadosSalvos = localStorage.getItem('loteria-dados')
    if (dadosSalvos) {
      return JSON.parse(dadosSalvos)
    }
    
    const hoje = new Date().toISOString().split('T')[0]
    const dadosIniciais = {
      dataAtual: hoje,
      caixas: {}
    }
    
    for (let i = 1; i <= 6; i++) {
      dadosIniciais.caixas[i] = {
        saldoInicial: 0,
        suprimentos: [],
        sangrias: [],
        valorFinalMaquina: 0,
        fechado: false,
        observacoes: '',
        movimentacoes: []
      }
    }
    
    return dadosIniciais
  })

  const salvarDados = (novosDados) => {
    setDados(novosDados)
    localStorage.setItem('loteria-dados', JSON.stringify(novosDados))
  }

  const adicionarMovimentacao = (numeroCaixa, tipo, valor, observacao) => {
    const novosDados = { ...dados }
    const caixa = novosDados.caixas[numeroCaixa]
    
    const movimentacao = {
      id: Date.now(),
      tipo,
      valor: parseFloat(valor),
      observacao,
      timestamp: new Date().toISOString(),
      usuario: 'Usuário Atual'
    }

    if (tipo === 'suprimento') {
      caixa.suprimentos.push(movimentacao)
    } else if (tipo === 'sangria') {
      caixa.sangrias.push(movimentacao)
    }

    caixa.movimentacoes.push(movimentacao)
    salvarDados(novosDados)
  }

  const fecharCaixa = (numeroCaixa, valorFinal, observacoes) => {
    const novosDados = { ...dados }
    const caixa = novosDados.caixas[numeroCaixa]
    
    caixa.valorFinalMaquina = parseFloat(valorFinal)
    caixa.observacoes = observacoes
    caixa.fechado = true
    
    const movimentacao = {
      id: Date.now(),
      tipo: 'fechamento',
      valor: parseFloat(valorFinal),
      observacao: `Fechamento do caixa: ${observacoes}`,
      timestamp: new Date().toISOString(),
      usuario: 'Usuário Atual'
    }
    
    caixa.movimentacoes.push(movimentacao)
    salvarDados(novosDados)
  }

  const calcularTotais = (numeroCaixa) => {
    const caixa = dados.caixas[numeroCaixa]
    const totalSuprimentos = caixa.suprimentos.reduce((acc, s) => acc + s.valor, 0)
    const totalSangrias = caixa.sangrias.reduce((acc, s) => acc + s.valor, 0)
    const saldoCalculado = caixa.saldoInicial + totalSuprimentos - totalSangrias
    const divergencia = caixa.valorFinalMaquina - saldoCalculado
    
    return {
      totalSuprimentos,
      totalSangrias,
      saldoCalculado,
      divergencia,
      temDivergencia: Math.abs(divergencia) > 0.01
    }
  }

  return {
    dados,
    salvarDados,
    adicionarMovimentacao,
    fecharCaixa,
    calcularTotais
  }
}

// Componente Header
function Header({ onLogout, userEmail }) {
  return (
    <header className="bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Loteria Imperatriz</h1>
          <p className="text-sm opacity-90">Sistema de Gestão Financeira</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm opacity-90">Usuário</p>
            <p className="font-semibold">{userEmail}</p>
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

// Componente Navegação
function Navegacao({ telaAtiva, setTelaAtiva, dados }) {
  const opcoes = [
    { id: 'caixa-central', nome: 'Caixa Central', icon: '🏢' },
    { id: 'caixa-1', nome: 'Caixa 1', icon: '💰' },
    { id: 'caixa-2', nome: 'Caixa 2', icon: '💰' },
    { id: 'caixa-3', nome: 'Caixa 3', icon: '💰' },
    { id: 'caixa-4', nome: 'Caixa 4', icon: '💰' },
    { id: 'caixa-5', nome: 'Caixa 5', icon: '💰' },
    { id: 'caixa-6', nome: 'Caixa 6', icon: '💰' }
  ]

  const getStatusCaixa = (id) => {
    if (id === 'caixa-central') return null
    const num = parseInt(id.split('-')[1])
    const caixa = dados.caixas[num]
    return caixa.fechado ? '✅' : '⏳'
  }

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="flex flex-wrap gap-2">
        {opcoes.map(opcao => (
          <button
            key={opcao.id}
            onClick={() => setTelaAtiva(opcao.id)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              telaAtiva === opcao.id 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>{opcao.icon}</span>
            <span>{opcao.nome}</span>
            {getStatusCaixa(opcao.id) && (
              <span className="text-xs">{getStatusCaixa(opcao.id)}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

// Componente Caixa Central
function CaixaCentral({ dados, calcularTotais }) {
  const calcularResumoGeral = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let totalDivergencias = 0
    let caixasFechados = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotais(i)
      totalSuprimentos += totais.totalSuprimentos
      totalSangrias += totais.totalSangrias
      totalDivergencias += Math.abs(totais.divergencia)
      if (dados.caixas[i].fechado) caixasFechados++
    }

    return {
      totalSuprimentos,
      totalSangrias,
      saldoFinal: totalSuprimentos - totalSangrias,
      totalDivergencias,
      caixasFechados,
      percentualFechamento: (caixasFechados / 6) * 100
    }
  }

  const resumo = calcularResumoGeral()

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Resumo Geral - {formatarData()}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Total Suprimentos</h3>
            <p className="text-2xl font-bold text-green-600">{formatarMoeda(resumo.totalSuprimentos)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Total Sangrias</h3>
            <p className="text-2xl font-bold text-red-600">{formatarMoeda(resumo.totalSangrias)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Saldo Final</h3>
            <p className="text-2xl font-bold text-blue-600">{formatarMoeda(resumo.saldoFinal)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Progresso</h3>
            <p className="text-2xl font-bold text-purple-600">{resumo.caixasFechados}/6</p>
            <p className="text-sm text-purple-600">{resumo.percentualFechamento.toFixed(0)}% concluído</p>
          </div>
        </div>

        {resumo.totalDivergencias > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800">⚠️ Atenção: Divergências Detectadas</h4>
            <p className="text-yellow-700">Total de divergências: {formatarMoeda(resumo.totalDivergencias)}</p>
          </div>
        )}
      </div>

      {/* Status Detalhado dos Caixas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Status Detalhado dos Caixas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Caixa</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Suprimentos</th>
                <th className="text-left p-2">Sangrias</th>
                <th className="text-left p-2">Saldo Calculado</th>
                <th className="text-left p-2">Valor Máquina</th>
                <th className="text-left p-2">Divergência</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6].map(num => {
                const caixa = dados.caixas[num]
                const totais = calcularTotais(num)
                return (
                  <tr key={num} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-semibold">Caixa {num}</td>
                    <td className="p-2">
                      {caixa.fechado ? (
                        <span className="text-green-600 font-semibold">✅ Fechado</span>
                      ) : (
                        <span className="text-orange-600 font-semibold">⏳ Aberto</span>
                      )}
                    </td>
                    <td className="p-2 text-green-600">{formatarMoeda(totais.totalSuprimentos)}</td>
                    <td className="p-2 text-red-600">{formatarMoeda(totais.totalSangrias)}</td>
                    <td className="p-2 text-blue-600">{formatarMoeda(totais.saldoCalculado)}</td>
                    <td className="p-2">{formatarMoeda(caixa.valorFinalMaquina)}</td>
                    <td className="p-2">
                      {totais.temDivergencia ? (
                        <span className="text-red-600 font-semibold">
                          ⚠️ {formatarMoeda(totais.divergencia)}
                        </span>
                      ) : (
                        <span className="text-green-600">✅ OK</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Componente Caixa Individual
function CaixaIndividual({ numeroCaixa, dados, adicionarMovimentacao, fecharCaixa, calcularTotais }) {
  const [valorSuprimento, setValorSuprimento] = useState('')
  const [obsSuprimento, setObsSuprimento] = useState('')
  const [valorSangria, setValorSangria] = useState('')
  const [obsSangria, setObsSangria] = useState('')
  const [valorFinal, setValorFinal] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')

  const caixa = dados.caixas[numeroCaixa]
  const totais = calcularTotais(numeroCaixa)

  const handleAdicionarSuprimento = () => {
    if (!valorSuprimento || parseFloat(valorSuprimento) <= 0) {
      alert('Por favor, insira um valor válido para o suprimento')
      return
    }
    
    adicionarMovimentacao(numeroCaixa, 'suprimento', valorSuprimento, obsSuprimento)
    setValorSuprimento('')
    setObsSuprimento('')
  }

  const handleAdicionarSangria = () => {
    if (!valorSangria || parseFloat(valorSangria) <= 0) {
      alert('Por favor, insira um valor válido para a sangria')
      return
    }
    
    adicionarMovimentacao(numeroCaixa, 'sangria', valorSangria, obsSangria)
    setValorSangria('')
    setObsSangria('')
  }

  const handleFecharCaixa = () => {
    if (!valorFinal || parseFloat(valorFinal) < 0) {
      alert('Por favor, insira o valor final da máquina')
      return
    }

    if (window.confirm('Tem certeza que deseja fechar este caixa? Esta ação não pode ser desfeita.')) {
      fecharCaixa(numeroCaixa, valorFinal, obsFechamento)
      setValorFinal('')
      setObsFechamento('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header do Caixa */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">💰 Caixa {numeroCaixa}</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Data: {formatarData()}</p>
            <p className={`font-semibold ${caixa.fechado ? 'text-green-600' : 'text-orange-600'}`}>
              {caixa.fechado ? '✅ Fechado' : '⏳ Aberto'}
            </p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Saldo Inicial</h3>
            <p className="text-xl font-bold text-blue-600">{formatarMoeda(caixa.saldoInicial)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Suprimentos</h3>
            <p className="text-xl font-bold text-green-600">{formatarMoeda(totais.totalSuprimentos)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Sangrias</h3>
            <p className="text-xl font-bold text-red-600">{formatarMoeda(totais.totalSangrias)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Saldo Calculado</h3>
            <p className="text-xl font-bold text-purple-600">{formatarMoeda(totais.saldoCalculado)}</p>
          </div>
        </div>

        {/* Divergência */}
        {caixa.fechado && totais.temDivergencia && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800">⚠️ Divergência Detectada</h4>
            <p className="text-yellow-700">
              Diferença entre valor calculado e valor da máquina: {formatarMoeda(totais.divergencia)}
            </p>
          </div>
        )}
      </div>

      {/* Operações */}
      {!caixa.fechado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Suprimento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-700">➕ Adicionar Suprimento</h3>
            <div className="space-y-3">
              <input 
                type="number" 
                step="0.01"
                placeholder="Valor (R$)" 
                value={valorSuprimento}
                onChange={(e) => setValorSuprimento(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input 
                type="text" 
                placeholder="Observação (opcional)" 
                value={obsSuprimento}
                onChange={(e) => setObsSuprimento(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button 
                onClick={handleAdicionarSuprimento}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Adicionar Suprimento
              </button>
            </div>
          </div>

          {/* Sangria */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-700">➖ Adicionar Sangria</h3>
            <div className="space-y-3">
              <input 
                type="number" 
                step="0.01"
                placeholder="Valor (R$)" 
                value={valorSangria}
                onChange={(e) => setValorSangria(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <input 
                type="text" 
                placeholder="Observação (opcional)" 
                value={obsSangria}
                onChange={(e) => setObsSangria(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button 
                onClick={handleAdicionarSangria}
                className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Adicionar Sangria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fechamento do Caixa */}
      {!caixa.fechado && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-teal-700">🔒 Fechamento do Caixa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              type="number" 
              step="0.01"
              placeholder="Valor final da máquina (R$)" 
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <input 
              type="text" 
              placeholder="Observações do fechamento" 
              value={obsFechamento}
              onChange={(e) => setObsFechamento(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <button 
              onClick={handleFecharCaixa}
              className="bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
            >
              Fechar Caixa
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Movimentações */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Histórico de Movimentações</h3>
        {caixa.movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {caixa.movimentacoes.slice().reverse().map(mov => (
              <div key={mov.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className={`font-semibold ${
                    mov.tipo === 'suprimento' ? 'text-green-600' : 
                    mov.tipo === 'sangria' ? 'text-red-600' : 'text-teal-600'
                  }`}>
                    {mov.tipo === 'suprimento' ? '➕' : mov.tipo === 'sangria' ? '➖' : '🔒'} 
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                  <p className="text-sm text-gray-600">{mov.observacao}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(mov.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={`font-bold ${
                  mov.tipo === 'suprimento' ? 'text-green-600' : 
                  mov.tipo === 'sangria' ? 'text-red-600' : 'text-teal-600'
                }`}>
                  {formatarMoeda(mov.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal da aplicação
function AppContent() {
  const { currentUser, loading, logout } = useAuth()
  const [telaAtiva, setTelaAtiva] = useState('caixa-central')
  const { dados, adicionarMovimentacao, fecharCaixa, calcularTotais } = useDadosCaixas()

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  // Login
  if (!currentUser) {
    return <Login />
  }

  // Logout
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Renderizar conteúdo
  const renderizarConteudo = () => {
    if (telaAtiva === 'caixa-central') {
      return <CaixaCentral dados={dados} calcularTotais={calcularTotais} />
    }
    
    const numeroCaixa = parseInt(telaAtiva.split('-')[1])
    return (
      <CaixaIndividual 
        numeroCaixa={numeroCaixa}
        dados={dados}
        adicionarMovimentacao={adicionarMovimentacao}
        fecharCaixa={fecharCaixa}
        calcularTotais={calcularTotais}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} userEmail={currentUser.email} />
      <Navegacao telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} dados={dados} />
      <main className="p-6">
        {renderizarConteudo()}
      </main>
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
