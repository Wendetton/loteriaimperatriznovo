// App.jsx - SISTEMA COMPLETO E CORRIGIDO
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

// SUPER ADMIN EMAIL
const SUPER_ADMIN_EMAIL = 'feazegoncalves@gmail.com'

// Context para controle de data
const DataContext = createContext()

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

function MovimentacoesProvider({ children }) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [caixasData, setCaixasData] = useState({})
  const [caixaCentralData, setCaixaCentralData] = useState({})
  const [usuarios, setUsuarios] = useState([])
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

    // Carregar usuários (apenas para super admin)
    if (currentUser.email === SUPER_ADMIN_EMAIL) {
      const carregarUsuarios = async () => {
        const usuariosSnap = await getDocs(collection(db, 'usuarios'))
        const usuariosList = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setUsuarios(usuariosList)
      }
      carregarUsuarios()
    }

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

  // Excluir movimentação
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
      
      // Atualizar estado local
      setCaixasData(prev => ({
        ...prev,
        [numeroCaixa]: { ...prev[numeroCaixa], ...dados }
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar caixa:', error)
      return { success: false, error: error.message }
    }
  }

  // Atualizar caixa central
  const atualizarCaixaCentral = async (dados) => {
    try {
      const docRef = doc(db, 'caixa_central', dataSelecionada)
      await setDoc(docRef, {
        ...dados,
        data: dataSelecionada
      }, { merge: true })
      
      setCaixaCentralData(prev => ({ ...prev, ...dados }))
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar caixa central:', error)
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

  // Criar usuário
  const criarUsuario = async (dadosUsuario) => {
    try {
      const docRef = doc(collection(db, 'usuarios'))
      await setDoc(docRef, {
        ...dadosUsuario,
        criadoPor: currentUser.email,
        criadoEm: serverTimestamp(),
        ativo: true
      })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
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
      usuarios,
      loading,
      adicionarMovimentacao,
      excluirMovimentacao,
      atualizarCaixa,
      atualizarCaixaCentral,
      fecharCaixa,
      criarUsuario,
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
            <p className="text-sm opacity-90">
              {userEmail === SUPER_ADMIN_EMAIL ? 'Super Admin' : 'Administrador'}
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

// Componente Gestão de Caixa Individual (Admin)
function GestaCaixaIndividual({ numeroCaixa }) {
  const { 
    adicionarMovimentacao, 
    calcularTotaisCaixa, 
    movimentacoes, 
    atualizarCaixa, 
    fecharCaixa,
    caixasData 
  } = useMovimentacoes()
  const { dataSelecionada } = useData()
  
  const [trocoInicial, setTrocoInicial] = useState('')
  const [valorMaquina, setValorMaquina] = useState('')
  const [valorSuprimento, setValorSuprimento] = useState('')
  const [obsSuprimento, setObsSuprimento] = useState('')
  const [valorSangria, setValorSangria] = useState('')
  const [obsSangria, setObsSangria] = useState('')
  const [valorCheque, setValorCheque] = useState('')
  const [obsCheque, setObsCheque] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')

  const totais = calcularTotaisCaixa(numeroCaixa)
  const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa)
  const dadosCaixa = caixasData[numeroCaixa] || {}

  // Carregar valores iniciais
  useEffect(() => {
    setTrocoInicial(dadosCaixa.trocoInicial || '')
    setValorMaquina(dadosCaixa.valorMaquina || '')
  }, [dadosCaixa])

  const handleAtualizarTrocoInicial = async () => {
    if (!trocoInicial || parseFloat(trocoInicial) < 0) {
      alert('Por favor, insira um valor válido para o troco inicial')
      return
    }

    const resultado = await atualizarCaixa(numeroCaixa, { trocoInicial: parseFloat(trocoInicial) })
    if (resultado.success) {
      alert('Troco inicial atualizado com sucesso!')
    } else {
      alert('Erro ao atualizar troco inicial: ' + resultado.error)
    }
  }

  const handleAtualizarValorMaquina = async () => {
    if (!valorMaquina || parseFloat(valorMaquina) < 0) {
      alert('Por favor, insira um valor válido para o valor da máquina')
      return
    }

    const resultado = await atualizarCaixa(numeroCaixa, { valorMaquina: parseFloat(valorMaquina) })
    if (resultado.success) {
      alert('Valor da máquina atualizado com sucesso!')
    } else {
      alert('Erro ao atualizar valor da máquina: ' + resultado.error)
    }
  }

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

  const handleFecharCaixa = async () => {
    if (!dadosCaixa.valorMaquina || dadosCaixa.valorMaquina === 0) {
      alert('Por favor, defina o valor da máquina antes de fechar o caixa')
      return
    }

    if (window.confirm('Tem certeza que deseja fechar este caixa? Esta ação não pode ser desfeita.')) {
      const resultado = await fecharCaixa(numeroCaixa, obsFechamento)
      if (resultado.success) {
        alert('Caixa fechado com sucesso!')
        setObsFechamento('')
      } else {
        alert('Erro ao fechar caixa: ' + resultado.error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header do Caixa */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">💰 Gestão do Caixa {numeroCaixa}</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Data: {new Date(dataSelecionada).toLocaleDateString('pt-BR')}</p>
            <p className={`font-semibold ${totais.fechado ? 'text-green-600' : 'text-orange-600'}`}>
              {totais.fechado ? '✅ Fechado' : '⏳ Aberto'}
            </p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Valor Esperado</h3>
            <p className="text-xl font-bold text-purple-600">{formatarMoeda(totais.valorEsperado)}</p>
          </div>
        </div>

        {/* Configurações do Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">⚙️ Configurar Troco Inicial</h3>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.01"
                placeholder="Valor do troco inicial (R$)" 
                value={trocoInicial}
                onChange={(e) => setTrocoInicial(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                disabled={totais.fechado}
              />
              <button 
                onClick={handleAtualizarTrocoInicial}
                disabled={totais.fechado}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Definir
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">🖥️ Valor da Máquina</h3>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.01"
                placeholder="Valor final da máquina (R$)" 
                value={valorMaquina}
                onChange={(e) => setValorMaquina(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-gray-500"
                disabled={totais.fechado}
              />
              <button 
                onClick={handleAtualizarValorMaquina}
                disabled={totais.fechado}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400"
              >
                Definir
              </button>
            </div>
          </div>
        </div>

        {/* Divergência */}
        {dadosCaixa.valorMaquina > 0 && totais.temDivergencia && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-yellow-800">⚠️ Divergência Detectada</h4>
            <p className="text-yellow-700">
              Diferença entre valor esperado e valor da máquina: {formatarMoeda(totais.divergencia)}
            </p>
          </div>
        )}
      </div>

      {/* Operações */}
      {!totais.fechado && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h3 className="text-lg font-semibold mb-4 text-purple-700">📄 Adicionar Cheque</h3>
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
      )}

      {/* Fechamento do Caixa */}
      {!totais.fechado && dadosCaixa.valorMaquina > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-teal-700">🔒 Fechamento do Caixa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {movsCaixa.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
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
  )
}

// Componente Caixa Central
function CaixaCentral() {
  const { 
    caixaCentralData, 
    atualizarCaixaCentral, 
    calcularTotaisCaixa 
  } = useMovimentacoes()
  const { dataSelecionada } = useData()
  
  const [valorInicial, setValorInicial] = useState('')
  const [valorCarroForte, setValorCarroForte] = useState('')
  const [valorExtra, setValorExtra] = useState('')
  const [obsExtra, setObsExtra] = useState('')
  const [valorFinal, setValorFinal] = useState('')

  // Carregar valores iniciais
  useEffect(() => {
    setValorInicial(caixaCentralData.valorInicial || '')
    setValorCarroForte(caixaCentralData.valorCarroForte || '')
    setValorFinal(caixaCentralData.valorFinal || '')
  }, [caixaCentralData])

  const handleAtualizarValorInicial = async () => {
    if (!valorInicial || parseFloat(valorInicial) < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const resultado = await atualizarCaixaCentral({ valorInicial: parseFloat(valorInicial) })
    if (resultado.success) {
      alert('Valor inicial atualizado com sucesso!')
    } else {
      alert('Erro: ' + resultado.error)
    }
  }

  const handleAtualizarCarroForte = async () => {
    if (!valorCarroForte || parseFloat(valorCarroForte) < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const resultado = await atualizarCaixaCentral({ valorCarroForte: parseFloat(valorCarroForte) })
    if (resultado.success) {
      alert('Valor do carro forte atualizado com sucesso!')
    } else {
      alert('Erro: ' + resultado.error)
    }
  }

  const handleAdicionarValorExtra = async () => {
    if (!valorExtra || parseFloat(valorExtra) === 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const novoValorExtra = {
      valor: parseFloat(valorExtra),
      observacao: obsExtra,
      criadoEm: new Date().toISOString()
    }

    const valoresExtrasAtualizados = [...(caixaCentralData.valoresExtras || []), novoValorExtra]
    
    const resultado = await atualizarCaixaCentral({ valoresExtras: valoresExtrasAtualizados })
    if (resultado.success) {
      setValorExtra('')
      setObsExtra('')
      alert('Valor extra adicionado com sucesso!')
    } else {
      alert('Erro: ' + resultado.error)
    }
  }

  const handleAtualizarValorFinal = async () => {
    if (!valorFinal || parseFloat(valorFinal) < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const resultado = await atualizarCaixaCentral({ valorFinal: parseFloat(valorFinal) })
    if (resultado.success) {
      alert('Valor final atualizado com sucesso!')
    } else {
      alert('Erro: ' + resultado.error)
    }
  }

  // Calcular totais de todos os caixas
  const calcularTotaisGerais = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let totalCheques = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotaisCaixa(i)
      totalSuprimentos += totais.suprimentos
      totalSangrias += totais.sangrias
      totalCheques += totais.cheques
    }

    return { totalSuprimentos, totalSangrias, totalCheques }
  }

  const totaisGerais = calcularTotaisGerais()
  const totalValoresExtras = (caixaCentralData.valoresExtras || []).reduce((acc, v) => acc + v.valor, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🏢 Caixa Central - {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
        </h2>
        
        {/* Resumo do Caixa Central */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Valor Inicial</h3>
            <p className="text-xl font-bold text-blue-600">{formatarMoeda(caixaCentralData.valorInicial)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Carro Forte</h3>
            <p className="text-xl font-bold text-red-600">{formatarMoeda(caixaCentralData.valorCarroForte)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Valores Extras</h3>
            <p className="text-xl font-bold text-purple-600">{formatarMoeda(totalValoresExtras)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Valor Final</h3>
            <p className="text-xl font-bold text-green-600">{formatarMoeda(caixaCentralData.valorFinal)}</p>
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">💰 Valor Inicial do Dia</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01"
              placeholder="Valor inicial (R$)" 
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleAtualizarValorInicial}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Definir
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-700">🚚 Valor Carro Forte</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01"
              placeholder="Valor carro forte (R$)" 
              value={valorCarroForte}
              onChange={(e) => setValorCarroForte(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button 
              onClick={handleAtualizarCarroForte}
              className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Definir
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-700">➕ Valor Extra</h3>
          <div className="space-y-3">
            <input 
              type="number" 
              step="0.01"
              placeholder="Valor extra (R$)" 
              value={valorExtra}
              onChange={(e) => setValorExtra(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input 
              type="text" 
              placeholder="Observação" 
              value={obsExtra}
              onChange={(e) => setObsExtra(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={handleAdicionarValorExtra}
              className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-700">🏁 Valor Final do Dia</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01"
              placeholder="Valor final (R$)" 
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <button 
              onClick={handleAtualizarValorFinal}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Definir
            </button>
          </div>
        </div>
      </div>

      {/* Resumo dos Caixas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Resumo dos Caixas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Total Suprimentos Enviados</h4>
            <p className="text-xl font-bold text-green-600">{formatarMoeda(totaisGerais.totalSuprimentos)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800">Total Sangrias Recebidas</h4>
            <p className="text-xl font-bold text-red-600">{formatarMoeda(totaisGerais.totalSangrias)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800">Total Cheques</h4>
            <p className="text-xl font-bold text-purple-600">{formatarMoeda(totaisGerais.totalCheques)}</p>
          </div>
        </div>
      </div>

      {/* Valores Extras */}
      {(caixaCentralData.valoresExtras || []).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Valores Extras</h3>
          <div className="space-y-2">
            {caixaCentralData.valoresExtras.map((extra, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{extra.observacao}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(extra.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={`font-bold ${extra.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarMoeda(extra.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente Relatório
function Relatorio() {
  const { movimentacoes, calcularTotaisCaixa, caixasData, caixaCentralData } = useMovimentacoes()
  const { dataSelecionada } = useData()

  const imprimirRelatorio = () => {
    window.print()
  }

  const calcularResumoGeral = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let totalCheques = 0
    let caixasFechados = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotaisCaixa(i)
      totalSuprimentos += totais.suprimentos
      totalSangrias += totais.sangrias
      totalCheques += totais.cheques
      if (totais.fechado) caixasFechados++
    }

    return { totalSuprimentos, totalSangrias, totalCheques, caixasFechados }
  }

  const resumoGeral = calcularResumoGeral()

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header do Relatório */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border">
        <div className="flex justify-between items-center mb-4 print:mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📄 Relatório Diário</h1>
            <p className="text-lg text-gray-600">Loteria Imperatriz</p>
            <p className="text-sm text-gray-500">Data: {new Date(dataSelecionada).toLocaleDateString('pt-BR')}</p>
          </div>
          <button
            onClick={imprimirRelatorio}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors print:hidden"
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <div className="bg-green-50 p-4 rounded-lg print:border print:bg-white">
            <h3 className="font-semibold text-green-800 text-sm">Total Suprimentos</h3>
            <p className="text-lg font-bold text-green-600">{formatarMoeda(resumoGeral.totalSuprimentos)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg print:border print:bg-white">
            <h3 className="font-semibold text-red-800 text-sm">Total Sangrias</h3>
            <p className="text-lg font-bold text-red-600">{formatarMoeda(resumoGeral.totalSangrias)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg print:border print:bg-white">
            <h3 className="font-semibold text-purple-800 text-sm">Total Cheques</h3>
            <p className="text-lg font-bold text-purple-600">{formatarMoeda(resumoGeral.totalCheques)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg print:border print:bg-white">
            <h3 className="font-semibold text-blue-800 text-sm">Caixas Fechados</h3>
            <p className="text-lg font-bold text-blue-600">{resumoGeral.caixasFechados}/6</p>
          </div>
        </div>
      </div>

      {/* Detalhamento por Caixa */}
      {[1,2,3,4,5,6].map(numeroCaixa => {
        const totais = calcularTotaisCaixa(numeroCaixa)
        const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa)
        
        return (
          <div key={numeroCaixa} className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:break-inside-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💰 Caixa {numeroCaixa}</h3>
            
            {/* Resumo do Caixa */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-sm">
              <div>
                <span className="font-semibold">Troco Inicial:</span>
                <p className="text-blue-600 font-bold">{formatarMoeda(totais.trocoInicial)}</p>
              </div>
              <div>
                <span className="font-semibold">Suprimentos:</span>
                <p className="text-green-600 font-bold">{formatarMoeda(totais.suprimentos)}</p>
              </div>
              <div>
                <span className="font-semibold">Sangrias:</span>
                <p className="text-red-600 font-bold">{formatarMoeda(totais.sangrias)}</p>
              </div>
              <div>
                <span className="font-semibold">Valor Esperado:</span>
                <p className="text-purple-600 font-bold">{formatarMoeda(totais.valorEsperado)}</p>
              </div>
              <div>
                <span className="font-semibold">Valor Máquina:</span>
                <p className={`font-bold ${totais.temDivergencia ? 'text-red-600' : 'text-green-600'}`}>
                  {formatarMoeda(totais.valorMaquina)}
                  {totais.temDivergencia && <span className="text-xs block">⚠️ Divergência: {formatarMoeda(totais.divergencia)}</span>}
                </p>
              </div>
            </div>

            {/* Movimentações */}
            {movsCaixa.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Movimentações:</h4>
                <div className="space-y-1">
                  {movsCaixa.map(mov => (
                    <div key={mov.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded print:bg-gray-100">
                      <div>
                        <span className={`font-semibold ${
                          mov.tipo === 'suprimento' ? 'text-green-600' : 
                          mov.tipo === 'sangria' ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                        </span>
                        {mov.observacao && <span className="text-gray-600"> - {mov.observacao}</span>}
                        <span className="text-gray-500 block">{formatarDataHora(mov.criadoEm)} - {mov.criadoPor}</span>
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
              </div>
            )}
          </div>
        )
      })}

      {/* Caixa Central */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border">
        <h3 className="text-lg font-bold text-gray-800 mb-3">🏢 Caixa Central</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">Valor Inicial:</span>
            <p className="text-blue-600 font-bold">{formatarMoeda(caixaCentralData.valorInicial)}</p>
          </div>
          <div>
            <span className="font-semibold">Carro Forte:</span>
            <p className="text-red-600 font-bold">{formatarMoeda(caixaCentralData.valorCarroForte)}</p>
          </div>
          <div>
            <span className="font-semibold">Valores Extras:</span>
            <p className="text-purple-600 font-bold">
              {formatarMoeda((caixaCentralData.valoresExtras || []).reduce((acc, v) => acc + v.valor, 0))}
            </p>
          </div>
          <div>
            <span className="font-semibold">Valor Final:</span>
            <p className="text-green-600 font-bold">{formatarMoeda(caixaCentralData.valorFinal)}</p>
          </div>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6">✍️ Assinaturas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-semibold">Responsável Caixa Central</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-semibold">Supervisor</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-semibold">Gerente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente Gestão de Usuários (apenas para super admin)
function GestaoUsuarios() {
  const { usuarios, criarUsuario } = useMovimentacoes()
  const [novoUsuario, setNovoUsuario] = useState({
    email: '',
    nome: '',
    tipo: 'admin',
    caixaAtribuido: ''
  })

  const handleCriarUsuario = async () => {
    if (!novoUsuario.email || !novoUsuario.nome) {
      alert('Por favor, preencha email e nome')
      return
    }

    if (novoUsuario.tipo === 'operador' && !novoUsuario.caixaAtribuido) {
      alert('Por favor, selecione um caixa para o operador')
      return
    }

    const dadosUsuario = {
      ...novoUsuario,
      caixaAtribuido: novoUsuario.tipo === 'operador' ? parseInt(novoUsuario.caixaAtribuido) : null
    }

    const resultado = await criarUsuario(dadosUsuario)
    if (resultado.success) {
      alert('Usuário criado com sucesso!')
      setNovoUsuario({ email: '', nome: '', tipo: 'admin', caixaAtribuido: '' })
    } else {
      alert('Erro ao criar usuário: ' + resultado.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Gestão de Usuários</h2>
        
        {/* Criar Novo Usuário */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">➕ Criar Novo Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Nome completo"
              value={novoUsuario.nome}
              onChange={(e) => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
              className="p-3 border rounded-lg"
            />
            <select
              value={novoUsuario.tipo}
              onChange={(e) => setNovoUsuario(prev => ({ ...prev, tipo: e.target.value, caixaAtribuido: '' }))}
              className="p-3 border rounded-lg"
            >
              <option value="admin">Administrador</option>
              <option value="operador">Operador de Caixa</option>
            </select>
            {novoUsuario.tipo === 'operador' && (
              <select
                value={novoUsuario.caixaAtribuido}
                onChange={(e) => setNovoUsuario(prev => ({ ...prev, caixaAtribuido: e.target.value }))}
                className="p-3 border rounded-lg"
              >
                <option value="">Selecione o caixa</option>
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>Caixa {num}</option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleCriarUsuario}
            className="mt-4 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Criar Usuário
          </button>
        </div>

        {/* Lista de Usuários */}
        <div>
          <h3 className="text-lg font-semibold mb-4">📋 Usuários Cadastrados</h3>
          {usuarios.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map(usuario => (
                <div key={usuario.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{usuario.nome}</p>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                    <p className="text-xs text-gray-500">
                      {usuario.tipo === 'admin' ? 'Administrador' : `Operador - Caixa ${usuario.caixaAtribuido}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
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

// Dashboard para Administradores
function DashboardAdmin() {
  const { 
    movimentacoes, 
    loading, 
    excluirMovimentacao, 
    calcularTotaisCaixa 
  } = useMovimentacoes()
  const { currentUser } = useAuth()
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

  // Renderizar conteúdo baseado na tela ativa
  const renderizarConteudo = () => {
    if (telaAtiva === 'resumo') {
      return (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Resumo Geral</h2>
            
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
      )
    }

    if (telaAtiva.startsWith('caixa-') && telaAtiva !== 'caixa-central') {
      const numeroCaixa = parseInt(telaAtiva.split('-')[1])
      return <GestaCaixaIndividual numeroCaixa={numeroCaixa} />
    }

    if (telaAtiva === 'central') {
      return <CaixaCentral />
    }

    if (telaAtiva === 'relatorio') {
      return <Relatorio />
    }

    if (telaAtiva === 'usuarios' && currentUser.email === SUPER_ADMIN_EMAIL) {
      return <GestaoUsuarios />
    }

    return <div>Tela não encontrada</div>
  }

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
            { id: 'relatorio', nome: 'Relatório', icon: '📄' },
            ...(currentUser.email === SUPER_ADMIN_EMAIL ? [{ id: 'usuarios', nome: 'Usuários', icon: '👥' }] : [])
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
        {renderizarConteudo()}
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

  return (
    <DataProvider>
      <MovimentacoesProvider>
        <div className="min-h-screen bg-gray-50">
          <Header 
            onLogout={handleLogout} 
            userEmail={currentUser.email}
            tipoUsuario="admin"
          />
          
          <DashboardAdmin />
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
