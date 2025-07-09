// App.jsx - SISTEMA OTIMIZADO PARA ROTINA ESPECÍFICA DA LOTÉRICA
import { useState, useEffect, createContext, useContext } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './services/firebase'
import Login from './pages/Login'
import './App.css'

// Context para controle de data
const DataContext = createContext()

// Provider de Data
function DataProvider({ children }) {
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  return (
    <DataContext.Provider value={{ dataSelecionada, setDataSelecionada }}>
      {children}
    </DataContext.Provider>
  )
}

const useData = () => useContext(DataContext)

// Context para movimentações
const MovimentacoesContext = createContext()

// Provider de Movimentações
function MovimentacoesProvider({ children }) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [caixasData, setCaixasData] = useState({})
  const [caixaCentralData, setCaixaCentralData] = useState({})
  const [loading, setLoading] = useState(true)
  const { dataSelecionada } = useData()
  const { currentUser } = useAuth()

  // Carregar dados em tempo real
  useEffect(() => {
    if (!currentUser || !dataSelecionada) return

    setLoading(true)

    // Listener para movimentações
    const movQuery = query(
      collection(db, 'movimentacoes'),
      where('data', '==', dataSelecionada),
      where('excluido', '==', false),
      orderBy('criadoEm', 'desc')
    )

    const unsubscribeMovs = onSnapshot(movQuery, (snapshot) => {
      const movs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMovimentacoes(movs)
    })

    // Carregar dados dos caixas
    const carregarDadosCaixas = async () => {
      const dadosCaixas = {}
      for (let i = 1; i <= 6; i++) {
        const docRef = doc(db, 'caixas', `${dataSelecionada}_${i}`)
        const docSnap = await getDoc(docRef)
        dadosCaixas[i] = docSnap.exists() ? docSnap.data() : {
          data: dataSelecionada,
          caixa: i,
          trocoInicial: 0,
          valorMaquina: 0,
          fechado: false
        }
      }
      setCaixasData(dadosCaixas)
    }

    // Carregar dados do caixa central
    const carregarCaixaCentral = async () => {
      const docRef = doc(db, 'caixa_central', dataSelecionada)
      const docSnap = await getDoc(docRef)
      setCaixaCentralData(docSnap.exists() ? docSnap.data() : {
        data: dataSelecionada,
        valorInicial: 0,
        valorCarroForte: 0,
        valoresExtras: [],
        valorFinal: 0
      })
    }

    Promise.all([carregarDadosCaixas(), carregarCaixaCentral()]).then(() => {
      setLoading(false)
    })

    return () => {
      unsubscribeMovs()
    }
  }, [dataSelecionada, currentUser])

  // Adicionar movimentação
  const adicionarMovimentacao = async (dados) => {
    try {
      const movimentacao = {
        ...dados,
        data: dataSelecionada,
        criadoPor: currentUser.displayName || currentUser.email,
        criadoEm: serverTimestamp(),
        excluido: false
      }

      const docRef = doc(collection(db, 'movimentacoes'))
      await setDoc(docRef, movimentacao)
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error)
      return { success: false, error: error.message }
    }
  }

  // Excluir movimentação (apenas admins)
  const excluirMovimentacao = async (id, senhaConfirmacao) => {
    if (senhaConfirmacao !== 'matilde') {
      return { success: false, error: 'Senha de confirmação incorreta' }
    }

    try {
      const docRef = doc(db, 'movimentacoes', id)
      await updateDoc(docRef, {
        excluido: true,
        excluidoPor: currentUser.displayName || currentUser.email,
        excluidoEm: serverTimestamp()
      })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error)
      return { success: false, error: error.message }
    }
  }

  // Atualizar dados do caixa
  const atualizarCaixa = async (numeroCaixa, dados) => {
    try {
      const docRef = doc(db, 'caixas', `${dataSelecionada}_${numeroCaixa}`)
      await setDoc(docRef, {
        ...dados,
        data: dataSelecionada,
        caixa: numeroCaixa
      }, { merge: true })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar caixa:', error)
      return { success: false, error: error.message }
    }
  }

  // Fechar caixa
  const fecharCaixa = async (numeroCaixa, observacoes) => {
    try {
      const docRef = doc(db, 'caixas', `${dataSelecionada}_${numeroCaixa}`)
      await updateDoc(docRef, {
        fechado: true,
        fechadoPor: currentUser.displayName || currentUser.email,
        fechadoEm: serverTimestamp(),
        observacoesFechamento: observacoes
      })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      return { success: false, error: error.message }
    }
  }

  // Calcular totais por caixa
  const calcularTotaisCaixa = (numeroCaixa) => {
    const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa)
    const dadosCaixa = caixasData[numeroCaixa] || {}
    
    const suprimentos = movsCaixa.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0)
    const sangrias = movsCaixa.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + m.valor, 0)
    const cheques = movsCaixa.filter(m => m.tipo === 'cheque').reduce((acc, m) => acc + m.valor, 0)
    
    const trocoInicial = dadosCaixa.trocoInicial || 0
    const valorMaquina = dadosCaixa.valorMaquina || 0
    
    const valorEsperado = trocoInicial + suprimentos - sangrias
    const divergencia = valorMaquina - valorEsperado
    
    return {
      trocoInicial,
      suprimentos,
      sangrias,
      cheques,
      valorEsperado,
      valorMaquina,
      divergencia,
      temDivergencia: Math.abs(divergencia) > 0.01,
      fechado: dadosCaixa.fechado || false
    }
  }

  return (
    <MovimentacoesContext.Provider value={{
      movimentacoes,
      caixasData,
      caixaCentralData,
      loading,
      adicionarMovimentacao,
      excluirMovimentacao,
      atualizarCaixa,
      fecharCaixa,
      calcularTotaisCaixa
    }}>
      {children}
    </MovimentacoesContext.Provider>
  )
}

const useMovimentacoes = () => useContext(MovimentacoesContext)

// Utilitários
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

const formatarDataHora = (timestamp) => {
  if (!timestamp) return ''
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data)
}

// Componente Header
function Header({ onLogout, userEmail, tipoUsuario }) {
  const { dataSelecionada, setDataSelecionada } = useData()

  return (
    <header className="bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Loteria Imperatriz</h1>
          <p className="text-sm opacity-90">Sistema de Gestão Financeira</p>
        </div>
        
        {tipoUsuario === 'admin' && (
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
        )}
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm opacity-90">
              {tipoUsuario === 'admin' ? 'Administrador' : 'Operador'}
            </p>
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

// Componente para Operadores de Caixa
function CaixaOperador({ numeroCaixa }) {
  const { adicionarMovimentacao, calcularTotaisCaixa, movimentacoes } = useMovimentacoes()
  const { dataSelecionada } = useData()
  const [valorSuprimento, setValorSuprimento] = useState('')
  const [obsSuprimento, setObsSuprimento] = useState('')
  const [valorSangria, setValorSangria] = useState('')
  const [obsSangria, setObsSangria] = useState('')
  const [valorCheque, setValorCheque] = useState('')
  const [obsCheque, setObsCheque] = useState('')

  const totais = calcularTotaisCaixa(numeroCaixa)
  const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa)

  const handleAdicionarSuprimento = async () => {
    if (!valorSuprimento || parseFloat(valorSuprimento) <= 0) {
      alert('Por favor, insira um valor válido para o suprimento')
      return
    }

    const resultado = await adicionarMovimentacao({
      caixa: numeroCaixa,
      tipo: 'suprimento',
      valor: parseFloat(valorSuprimento),
      observacao: obsSuprimento
    })

    if (resultado.success) {
      setValorSuprimento('')
      setObsSuprimento('')
    } else {
      alert('Erro ao adicionar suprimento: ' + resultado.error)
    }
  }

  const handleAdicionarSangria = async () => {
    if (!valorSangria || parseFloat(valorSangria) <= 0) {
      alert('Por favor, insira um valor válido para a sangria')
      return
    }

    const resultado = await adicionarMovimentacao({
      caixa: numeroCaixa,
      tipo: 'sangria',
      valor: parseFloat(valorSangria),
      observacao: obsSangria
    })

    if (resultado.success) {
      setValorSangria('')
      setObsSangria('')
    } else {
      alert('Erro ao adicionar sangria: ' + resultado.error)
    }
  }

  const handleAdicionarCheque = async () => {
    if (!valorCheque || parseFloat(valorCheque) <= 0) {
      alert('Por favor, insira um valor válido para o cheque')
      return
    }

    const resultado = await adicionarMovimentacao({
      caixa: numeroCaixa,
      tipo: 'cheque',
      valor: parseFloat(valorCheque),
      observacao: obsCheque
    })

    if (resultado.success) {
      setValorCheque('')
      setObsCheque('')
    } else {
      alert('Erro ao adicionar cheque: ' + resultado.error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Resumo do Caixa */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            💰 Caixa {numeroCaixa} - {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Troco Inicial</h3>
              <p className="text-xl font-bold text-blue-600">{formatarMoeda(totais.trocoInicial)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Suprimentos</h3>
              <p className="text-xl font-bold text-green-600">{formatarMoeda(totais.suprimentos)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Sangrias</h3>
              <p className="text-xl font-bold text-red-600">{formatarMoeda(totais.sangrias)}</p>
            </div>
          </div>
        </div>

        {/* Formulários de Movimentação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Suprimento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-700">➕ Suprimento</h3>
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
                placeholder="Observação" 
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
            <h3 className="text-lg font-semibold mb-4 text-red-700">➖ Sangria</h3>
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
                placeholder="Observação" 
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

          {/* Cheque */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">📄 Cheque</h3>
            <div className="space-y-3">
              <input 
                type="number" 
                step="0.01"
                placeholder="Valor (R$)" 
                value={valorCheque}
                onChange={(e) => setValorCheque(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input 
                type="text" 
                placeholder="Observação" 
                value={obsCheque}
                onChange={(e) => setObsCheque(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <button 
                onClick={handleAdicionarCheque}
                className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Adicionar Cheque
              </button>
            </div>
          </div>
        </div>

        {/* Histórico de Movimentações */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Histórico do Dia</h3>
          {movsCaixa.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada hoje</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movsCaixa.map(mov => (
                <div key={mov.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className={`font-semibold ${
                      mov.tipo === 'suprimento' ? 'text-green-600' : 
                      mov.tipo === 'sangria' ? 'text-red-600' : 'text-purple-600'
                    }`}>
                      {mov.tipo === 'suprimento' ? '➕' : mov.tipo === 'sangria' ? '➖' : '📄'} 
                      {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                    </span>
                    <p className="text-sm text-gray-600">{mov.observacao}</p>
                    <p className="text-xs text-gray-500">
                      {formatarDataHora(mov.criadoEm)} - {mov.criadoPor}
                    </p>
                  </div>
                  <span className={`font-bold ${
                    mov.tipo === 'suprimento' ? 'text-green-600' : 
                    mov.tipo === 'sangria' ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    {formatarMoeda(mov.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Dashboard para Administradores
function DashboardAdmin() {
  const { 
    movimentacoes, 
    caixasData, 
    loading, 
    excluirMovimentacao, 
    atualizarCaixa, 
    fecharCaixa, 
    calcularTotaisCaixa 
  } = useMovimentacoes()
  const { dataSelecionada } = useData()
  const [telaAtiva, setTelaAtiva] = useState('resumo')
  const [senhaExclusao, setSenhaExclusao] = useState('')
  const [movParaExcluir, setMovParaExcluir] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  const handleExcluirMovimentacao = async () => {
    if (!movParaExcluir || !senhaExclusao) return

    const resultado = await excluirMovimentacao(movParaExcluir, senhaExclusao)
    
    if (resultado.success) {
      alert('Movimentação excluída com sucesso')
      setMovParaExcluir(null)
      setSenhaExclusao('')
    } else {
      alert('Erro: ' + resultado.error)
    }
  }

  const imprimirRelatorio = () => {
    window.print()
  }

  // Calcular resumo geral
  const calcularResumoGeral = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let totalCheques = 0
    let caixasFechados = 0
    let totalDivergencias = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotaisCaixa(i)
      totalSuprimentos += totais.suprimentos
      totalSangrias += totais.sangrias
      totalCheques += totais.cheques
      if (totais.fechado) caixasFechados++
      if (totais.temDivergencia) totalDivergencias += Math.abs(totais.divergencia)
    }

    return {
      totalSuprimentos,
      totalSangrias,
      totalCheques,
      caixasFechados,
      totalDivergencias,
      percentualFechamento: (caixasFechados / 6) * 100
    }
  }

  const resumoGeral = calcularResumoGeral()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação */}
      <nav className="bg-white shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'resumo', nome: 'Resumo Geral', icon: '📊' },
            { id: 'caixa-1', nome: 'Caixa 1', icon: '💰' },
            { id: 'caixa-2', nome: 'Caixa 2', icon: '💰' },
            { id: 'caixa-3', nome: 'Caixa 3', icon: '💰' },
            { id: 'caixa-4', nome: 'Caixa 4', icon: '💰' },
            { id: 'caixa-5', nome: 'Caixa 5', icon: '💰' },
            { id: 'caixa-6', nome: 'Caixa 6', icon: '💰' },
            { id: 'central', nome: 'Caixa Central', icon: '🏢' },
            { id: 'relatorio', nome: 'Relatório', icon: '📄' }
          ].map(opcao => {
            const numeroCaixa = opcao.id.includes('caixa-') ? parseInt(opcao.id.split('-')[1]) : null
            const totais = numeroCaixa ? calcularTotaisCaixa(numeroCaixa) : null
            const status = totais ? (totais.fechado ? '✅' : '⏳') : null
            
            return (
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
                {status && <span className="text-xs">{status}</span>}
                {totais && totais.temDivergencia && <span className="text-xs">⚠️</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="p-6">
        {telaAtiva === 'resumo' && (
          <div className="space-y-6">
            {/* Resumo Geral */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  📊 Resumo Geral - {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
                </h2>
                <button
                  onClick={imprimirRelatorio}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors"
                >
                  🖨️ Imprimir Relatório
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Total Suprimentos</h3>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(resumoGeral.totalSuprimentos)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800">Total Sangrias</h3>
                  <p className="text-2xl font-bold text-red-600">{formatarMoeda(resumoGeral.totalSangrias)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Total Cheques</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatarMoeda(resumoGeral.totalCheques)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Progresso</h3>
                  <p className="text-2xl font-bold text-blue-600">{resumoGeral.caixasFechados}/6</p>
                  <p className="text-sm text-blue-600">{resumoGeral.percentualFechamento.toFixed(0)}% concluído</p>
                </div>
              </div>

              {resumoGeral.totalDivergencias > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-yellow-800">⚠️ Atenção: Divergências Detectadas</h4>
                  <p className="text-yellow-700">Total de divergências: {formatarMoeda(resumoGeral.totalDivergencias)}</p>
                </div>
              )}

              {/* Status Detalhado dos Caixas */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Caixa</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Troco Inicial</th>
                      <th className="text-left p-2">Suprimentos</th>
                      <th className="text-left p-2">Sangrias</th>
                      <th className="text-left p-2">Cheques</th>
                      <th className="text-left p-2">Valor Esperado</th>
                      <th className="text-left p-2">Valor Máquina</th>
                      <th className="text-left p-2">Divergência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5,6].map(num => {
                      const totais = calcularTotaisCaixa(num)
                      return (
                        <tr key={num} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-semibold">Caixa {num}</td>
                          <td className="p-2">
                            {totais.fechado ? (
                              <span className="text-green-600 font-semibold">✅ Fechado</span>
                            ) : (
                              <span className="text-orange-600 font-semibold">⏳ Aberto</span>
                            )}
                          </td>
                          <td className="p-2 text-blue-600">{formatarMoeda(totais.trocoInicial)}</td>
                          <td className="p-2 text-green-600">{formatarMoeda(totais.suprimentos)}</td>
                          <td className="p-2 text-red-600">{formatarMoeda(totais.sangrias)}</td>
                          <td className="p-2 text-purple-600">{formatarMoeda(totais.cheques)}</td>
                          <td className="p-2 text-blue-600">{formatarMoeda(totais.valorEsperado)}</td>
                          <td className="p-2">{formatarMoeda(totais.valorMaquina)}</td>
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

            {/* Todas as Movimentações */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Todas as Movimentações do Dia</h3>
              {movimentacoes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {movimentacoes.map(mov => (
                    <div key={mov.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600">Caixa {mov.caixa}</span>
                          <span className={`font-semibold ${
                            mov.tipo === 'suprimento' ? 'text-green-600' : 
                            mov.tipo === 'sangria' ? 'text-red-600' : 'text-purple-600'
                          }`}>
                            {mov.tipo === 'suprimento' ? '➕' : mov.tipo === 'sangria' ? '➖' : '📄'} 
                            {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{mov.observacao}</p>
                        <p className="text-xs text-gray-500">
                          {formatarDataHora(mov.criadoEm)} - {mov.criadoPor}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          mov.tipo === 'suprimento' ? 'text-green-600' : 
                          mov.tipo === 'sangria' ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          {formatarMoeda(mov.valor)}
                        </span>
                        <button
                          onClick={() => setMovParaExcluir(mov.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="Excluir movimentação"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outras telas seriam implementadas aqui */}
        {telaAtiva.startsWith('caixa-') && telaAtiva !== 'caixa-central' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Gestão do {telaAtiva.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
            <p className="text-gray-600">Interface de administração para este caixa específico...</p>
          </div>
        )}
      </main>

      {/* Modal de Exclusão */}
      {movParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-4">
              Para excluir esta movimentação, digite a palavra-chave de confirmação:
            </p>
            <input
              type="password"
              placeholder="Digite: matilde"
              value={senhaExclusao}
              onChange={(e) => setSenhaExclusao(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMovParaExcluir(null)
                  setSenhaExclusao('')
                }}
                className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirMovimentacao}
                className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente principal da aplicação
function AppContent() {
  const { currentUser, loading, logout } = useAuth()

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

  if (!currentUser) {
    return <Login />
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Determinar tipo de usuário e caixa atribuído
  // Por enquanto, vamos assumir que todos são admins
  // Você pode implementar a lógica de usuários específica depois
  const tipoUsuario = 'admin' // ou 'operador'
  const caixaAtribuido = null // para operadores, seria o número do caixa

  return (
    <DataProvider>
      <MovimentacoesProvider>
        <div className="min-h-screen bg-gray-50">
          <Header 
            onLogout={handleLogout} 
            userEmail={currentUser.email}
            tipoUsuario={tipoUsuario}
          />
          
          {tipoUsuario === 'admin' ? (
            <DashboardAdmin />
          ) : (
            <CaixaOperador numeroCaixa={caixaAtribuido} />
          )}
        </div>
      </MovimentacoesProvider>
    </DataProvider>
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
