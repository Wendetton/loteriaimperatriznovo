// App.jsx - VERSÃO DEFINITIVAMENTE CORRIGIDA
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
  onSnapshot,
  deleteDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore'
import { db } from './services/firebase'
import Login from './pages/Login'
import './App.css'

// ========================================
// 📧 CONFIGURAÇÃO DE USUÁRIOS
// ========================================
const USUARIOS_CONFIGURADOS = {
  // ADMINISTRADORES (acesso completo)
  'feazegoncalves@gmail.com': { tipo: 'admin', nome: 'Administrador Principal' },
  'admin@loteriaimperatriz.com': { tipo: 'admin', nome: 'Administrador' },
  
  // OPERADORES DE CAIXA (acesso limitado ao próprio caixa)
  'caixa1@loteriaimperatriz.com': { tipo: 'operador', caixa: 1, nome: 'Operador Caixa 1' },
  'caixa2@loteriaimperatriz.com': { tipo: 'operador', caixa: 2, nome: 'Operador Caixa 2' },
  'caixa3@loteriaimperatriz.com': { tipo: 'operador', caixa: 3, nome: 'Operador Caixa 3' },
  'caixa4@loteriaimperatriz.com': { tipo: 'operador', caixa: 4, nome: 'Operador Caixa 4' },
  'caixa5@loteriaimperatriz.com': { tipo: 'operador', caixa: 5, nome: 'Operador Caixa 5' },
  'caixa6@loteriaimperatriz.com': { tipo: 'operador', caixa: 6, nome: 'Operador Caixa 6' },
}

const obterDadosUsuario = (email) => {
  return USUARIOS_CONFIGURADOS[email] || null
}

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

// Context para movimentações - VERSÃO CORRIGIDA
const MovimentacoesContext = createContext()

function MovimentacoesProvider({ children }) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [caixasData, setCaixasData] = useState({})
  const [caixaCentralData, setCaixaCentralData] = useState({})
  const [loading, setLoading] = useState(true)
  const { dataSelecionada } = useData()
  const { currentUser } = useAuth()

  // Função para gerar ID único
  const gerarId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Carregar dados em tempo real - VERSÃO SIMPLIFICADA
  useEffect(() => {
    if (!currentUser || !dataSelecionada) return

    console.log('🔄 Carregando dados para:', dataSelecionada)
    setLoading(true)

    // Carregar movimentações do localStorage como backup
    const carregarMovimentacoesLocal = () => {
      const key = `movimentacoes_${dataSelecionada}`
      const dados = localStorage.getItem(key)
      if (dados) {
        const movs = JSON.parse(dados)
        console.log('📦 Movimentações do localStorage:', movs)
        setMovimentacoes(movs)
      }
    }

    // Carregar dados dos caixas do localStorage
    const carregarCaixasLocal = () => {
      const dadosCaixas = {}
      for (let i = 1; i <= 6; i++) {
        const key = `caixa_${dataSelecionada}_${i}`
        const dados = localStorage.getItem(key)
        dadosCaixas[i] = dados ? JSON.parse(dados) : {
          data: dataSelecionada,
          caixa: i,
          trocoInicial: 0,
          valorMaquina: 0,
          fechado: false
        }
      }
      console.log('📦 Dados dos caixas do localStorage:', dadosCaixas)
      setCaixasData(dadosCaixas)
    }

    // Carregar caixa central do localStorage
    const carregarCaixaCentralLocal = () => {
      const key = `caixa_central_${dataSelecionada}`
      const dados = localStorage.getItem(key)
      const dadosCentral = dados ? JSON.parse(dados) : {
        data: dataSelecionada,
        valorInicial: 0,
        valorCarroForte: 0,
        valoresExtras: [],
        valorFinal: 0
      }
      console.log('📦 Dados do caixa central do localStorage:', dadosCentral)
      setCaixaCentralData(dadosCentral)
    }

    // Carregar dados locais primeiro
    carregarMovimentacoesLocal()
    carregarCaixasLocal()
    carregarCaixaCentralLocal()

    // Tentar carregar do Firebase (sem bloquear se falhar)
    const carregarDoFirebase = async () => {
      try {
        // Carregar movimentações do Firebase
        const movQuery = query(
          collection(db, 'movimentacoes'),
          where('data', '==', dataSelecionada)
        )
        
        const unsubscribe = onSnapshot(movQuery, (snapshot) => {
          const movs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })).filter(mov => !mov.excluido)
          
          console.log('🔥 Movimentações do Firebase:', movs)
          setMovimentacoes(movs)
          
          // Salvar no localStorage
          const key = `movimentacoes_${dataSelecionada}`
          localStorage.setItem(key, JSON.stringify(movs))
        }, (error) => {
          console.error('❌ Erro ao carregar movimentações do Firebase:', error)
        })

        // Carregar dados dos caixas do Firebase
        for (let i = 1; i <= 6; i++) {
          try {
            const docRef = doc(db, 'caixas', `${dataSelecionada}_${i}`)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
              const dados = docSnap.data()
              setCaixasData(prev => ({ ...prev, [i]: dados }))
              
              // Salvar no localStorage
              const key = `caixa_${dataSelecionada}_${i}`
              localStorage.setItem(key, JSON.stringify(dados))
            }
          } catch (error) {
            console.error(`❌ Erro ao carregar caixa ${i}:`, error)
          }
        }

        // Carregar caixa central do Firebase
        try {
          const docRef = doc(db, 'caixa_central', dataSelecionada)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const dados = docSnap.data()
            setCaixaCentralData(dados)
            
            // Salvar no localStorage
            const key = `caixa_central_${dataSelecionada}`
            localStorage.setItem(key, JSON.stringify(dados))
          }
        } catch (error) {
          console.error('❌ Erro ao carregar caixa central:', error)
        }

        return unsubscribe
      } catch (error) {
        console.error('❌ Erro geral do Firebase:', error)
        return null
      }
    }

    carregarDoFirebase().then((unsubscribe) => {
      setLoading(false)
      return unsubscribe
    })

    // Cleanup não é necessário pois estamos usando localStorage como backup
  }, [dataSelecionada, currentUser])

  // Adicionar movimentação - VERSÃO CORRIGIDA
  const adicionarMovimentacao = async (dados) => {
    try {
      console.log('➕ Adicionando movimentação:', dados)
      
      const agora = new Date()
      const movimentacao = {
        id: gerarId(),
        ...dados,
        data: dataSelecionada,
        criadoPor: currentUser.displayName || currentUser.email,
        criadoEm: agora.toISOString(),
        timestamp: agora.getTime(),
        excluido: false
      }

      console.log('📝 Movimentação criada:', movimentacao)

      // Salvar no localStorage PRIMEIRO (garantia)
      const key = `movimentacoes_${dataSelecionada}`
      const movsExistentes = JSON.parse(localStorage.getItem(key) || '[]')
      const novasMovs = [...movsExistentes, movimentacao]
      localStorage.setItem(key, JSON.stringify(novasMovs))
      
      // Atualizar estado local IMEDIATAMENTE
      setMovimentacoes(prev => {
        const novaLista = [...prev, movimentacao]
        console.log('🔄 Estado atualizado:', novaLista)
        return novaLista
      })

      // Tentar salvar no Firebase (sem bloquear se falhar)
      try {
        await addDoc(collection(db, 'movimentacoes'), movimentacao)
        console.log('✅ Salvo no Firebase com sucesso')
      } catch (firebaseError) {
        console.error('⚠️ Erro ao salvar no Firebase (usando localStorage):', firebaseError)
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao adicionar movimentação:', error)
      return { success: false, error: error.message }
    }
  }

  // Excluir movimentação
  const excluirMovimentacao = async (id, senhaConfirmacao) => {
    if (senhaConfirmacao !== 'matilde') {
      return { success: false, error: 'Senha de confirmação incorreta' }
    }

    try {
      console.log('🗑️ Excluindo movimentação:', id)
      
      // Atualizar localStorage
      const key = `movimentacoes_${dataSelecionada}`
      const movs = JSON.parse(localStorage.getItem(key) || '[]')
      const movsAtualizadas = movs.filter(mov => mov.id !== id)
      localStorage.setItem(key, JSON.stringify(movsAtualizadas))
      
      // Atualizar estado
      setMovimentacoes(prev => prev.filter(mov => mov.id !== id))

      // Tentar excluir do Firebase
      try {
        const docRef = doc(db, 'movimentacoes', id)
        await updateDoc(docRef, {
          excluido: true,
          excluidoPor: currentUser.displayName || currentUser.email,
          excluidoEm: new Date().toISOString()
        })
      } catch (firebaseError) {
        console.error('⚠️ Erro ao excluir do Firebase:', firebaseError)
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao excluir movimentação:', error)
      return { success: false, error: error.message }
    }
  }

  // Atualizar dados do caixa
  const atualizarCaixa = async (numeroCaixa, dados) => {
    try {
      console.log(`🔄 Atualizando caixa ${numeroCaixa}:`, dados)
      
      const dadosCompletos = {
        ...dados,
        data: dataSelecionada,
        caixa: numeroCaixa
      }

      // Salvar no localStorage
      const key = `caixa_${dataSelecionada}_${numeroCaixa}`
      localStorage.setItem(key, JSON.stringify(dadosCompletos))
      
      // Atualizar estado local
      setCaixasData(prev => ({
        ...prev,
        [numeroCaixa]: { ...prev[numeroCaixa], ...dadosCompletos }
      }))

      // Tentar salvar no Firebase
      try {
        const docRef = doc(db, 'caixas', `${dataSelecionada}_${numeroCaixa}`)
        await setDoc(docRef, dadosCompletos, { merge: true })
      } catch (firebaseError) {
        console.error('⚠️ Erro ao salvar caixa no Firebase:', firebaseError)
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar caixa:', error)
      return { success: false, error: error.message }
    }
  }

  // Atualizar caixa central
  const atualizarCaixaCentral = async (dados) => {
    try {
      console.log('🏢 Atualizando caixa central:', dados)
      
      const dadosCompletos = {
        ...dados,
        data: dataSelecionada
      }

      // Salvar no localStorage
      const key = `caixa_central_${dataSelecionada}`
      localStorage.setItem(key, JSON.stringify(dadosCompletos))
      
      // Atualizar estado
      setCaixaCentralData(prev => ({ ...prev, ...dadosCompletos }))

      // Tentar salvar no Firebase
      try {
        const docRef = doc(db, 'caixa_central', dataSelecionada)
        await setDoc(docRef, dadosCompletos, { merge: true })
      } catch (firebaseError) {
        console.error('⚠️ Erro ao salvar caixa central no Firebase:', firebaseError)
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar caixa central:', error)
      return { success: false, error: error.message }
    }
  }

  // Fechar caixa
  const fecharCaixa = async (numeroCaixa, observacoes) => {
    try {
      const dadosFechamento = {
        fechado: true,
        fechadoPor: currentUser.displayName || currentUser.email,
        fechadoEm: new Date().toISOString(),
        observacoesFechamento: observacoes
      }

      return await atualizarCaixa(numeroCaixa, dadosFechamento)
    } catch (error) {
      console.error('❌ Erro ao fechar caixa:', error)
      return { success: false, error: error.message }
    }
  }

  // Calcular totais por caixa - VERSÃO CORRIGIDA
  const calcularTotaisCaixa = (numeroCaixa) => {
    console.log(`🧮 Calculando totais para caixa ${numeroCaixa}`)
    console.log('📊 Movimentações disponíveis:', movimentacoes)
    
    const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa && !m.excluido)
    console.log(`📋 Movimentações do caixa ${numeroCaixa}:`, movsCaixa)
    
    const dadosCaixa = caixasData[numeroCaixa] || {}
    
    const suprimentos = movsCaixa.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + (m.valor || 0), 0)
    const sangrias = movsCaixa.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + (m.valor || 0), 0)
    
    const trocoInicial = dadosCaixa.trocoInicial || 0
    const valorMaquina = dadosCaixa.valorMaquina || 0
    
    const valorEsperado = trocoInicial + suprimentos - sangrias
    const divergencia = valorMaquina - valorEsperado
    
    const totais = {
      trocoInicial,
      suprimentos,
      sangrias,
      valorEsperado,
      valorMaquina,
      divergencia,
      temDivergencia: Math.abs(divergencia) > 0.01,
      fechado: dadosCaixa.fechado || false
    }

    console.log(`💰 Totais calculados para caixa ${numeroCaixa}:`, totais)
    return totais
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
      atualizarCaixaCentral,
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
function Header({ onLogout, userEmail, dadosUsuario }) {
  const { dataSelecionada, setDataSelecionada } = useData()

  return (
    <header className="bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Loteria Imperatriz</h1>
          <p className="text-sm opacity-90">Sistema de Gestão Financeira</p>
        </div>
        
        {dadosUsuario.tipo === 'admin' && (
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
              {dadosUsuario.tipo === 'admin' ? 'Administrador' : `Operador - Caixa ${dadosUsuario.caixa}`}
            </p>
            <p className="font-semibold">{dadosUsuario.nome}</p>
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

// Componente Gestão de Caixa Individual - VERSÃO CORRIGIDA
function GestaCaixaIndividual({ numeroCaixa, dadosUsuario }) {
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
  const [obsFechamento, setObsFechamento] = useState('')

  const totais = calcularTotaisCaixa(numeroCaixa)
  const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa && !m.excluido)
  const dadosCaixa = caixasData[numeroCaixa] || {}
  const isAdmin = dadosUsuario.tipo === 'admin'

  console.log(`🎯 Renderizando caixa ${numeroCaixa}:`)
  console.log('📊 Totais:', totais)
  console.log('📋 Movimentações:', movsCaixa)

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
    console.log('➕ Tentando adicionar suprimento:', valorSuprimento)
    
    if (!valorSuprimento || parseFloat(valorSuprimento) <= 0) {
      alert('Por favor, insira um valor válido para o suprimento')
      return
    }

    const resultado = await adicionarMovimentacao({
      caixa: numeroCaixa,
      tipo: 'suprimento',
      valor: parseFloat(valorSuprimento),
      observacao: obsSuprimento || 'Suprimento'
    })

    console.log('📝 Resultado do suprimento:', resultado)

    if (resultado.success) {
      setValorSuprimento('')
      setObsSuprimento('')
      alert('Suprimento adicionado com sucesso!')
    } else {
      alert('Erro ao adicionar suprimento: ' + resultado.error)
    }
  }

  const handleAdicionarSangria = async () => {
    console.log('➖ Tentando adicionar sangria:', valorSangria)
    
    if (!valorSangria || parseFloat(valorSangria) <= 0) {
      alert('Por favor, insira um valor válido para a sangria')
      return
    }

    const resultado = await adicionarMovimentacao({
      caixa: numeroCaixa,
      tipo: 'sangria',
      valor: parseFloat(valorSangria),
      observacao: obsSangria || 'Sangria'
    })

    console.log('📝 Resultado da sangria:', resultado)

    if (resultado.success) {
      setValorSangria('')
      setObsSangria('')
      alert('Sangria adicionada com sucesso!')
    } else {
      alert('Erro ao adicionar sangria: ' + resultado.error)
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

        {/* Configurações do Caixa - APENAS PARA ADMINS */}
        {isAdmin && (
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
        )}

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

      {/* Fechamento do Caixa - APENAS PARA ADMINS */}
      {isAdmin && !totais.fechado && dadosCaixa.valorMaquina > 0 && (
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
                    mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mov.tipo === 'suprimento' ? '➕' : '➖'} 
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                  <p className="text-sm text-gray-600">{mov.observacao}</p>
                  <p className="text-xs text-gray-500">
                    {formatarDataHora(mov.criadoEm)} - {mov.criadoPor}
                  </p>
                </div>
                <span className={`font-bold ${
                  mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
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

// Componente Caixa Central (simplificado)
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

  const calcularTotaisGerais = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotaisCaixa(i)
      totalSuprimentos += totais.suprimentos
      totalSangrias += totais.sangrias
    }

    return { totalSuprimentos, totalSangrias }
  }

  const totaisGerais = calcularTotaisGerais()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🏢 Caixa Central - {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Total Suprimentos Enviados</h4>
            <p className="text-xl font-bold text-green-600">{formatarMoeda(totaisGerais.totalSuprimentos)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800">Total Sangrias Recebidas</h4>
            <p className="text-xl font-bold text-red-600">{formatarMoeda(totaisGerais.totalSangrias)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">💰 Valor Inicial do Dia</h3>
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
      </div>
    </div>
  )
}

// Componente Relatório (simplificado)
function Relatorio() {
  const { movimentacoes, calcularTotaisCaixa } = useMovimentacoes()
  const { dataSelecionada } = useData()

  const imprimirRelatorio = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
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

        <div className="space-y-4">
          {[1,2,3,4,5,6].map(numeroCaixa => {
            const totais = calcularTotaisCaixa(numeroCaixa)
            const movsCaixa = movimentacoes.filter(m => m.caixa === numeroCaixa && !m.excluido)
            
            return (
              <div key={numeroCaixa} className="border p-4 rounded">
                <h3 className="text-lg font-bold text-gray-800 mb-2">💰 Caixa {numeroCaixa}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 text-sm">
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

                {movsCaixa.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Movimentações:</h4>
                    <div className="space-y-1">
                      {movsCaixa.map(mov => (
                        <div key={mov.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                          <div>
                            <span className={`font-semibold ${
                              mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                            </span>
                            {mov.observacao && <span className="text-gray-600"> - {mov.observacao}</span>}
                            <span className="text-gray-500 block">{formatarDataHora(mov.criadoEm)} - {mov.criadoPor}</span>
                          </div>
                          <span className={`font-bold ${
                            mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
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
        </div>
      </div>
    </div>
  )
}

// Dashboard para Administradores
function DashboardAdmin({ dadosUsuario }) {
  const { 
    movimentacoes, 
    loading, 
    excluirMovimentacao, 
    calcularTotaisCaixa 
  } = useMovimentacoes()
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
    let caixasFechados = 0

    for (let i = 1; i <= 6; i++) {
      const totais = calcularTotaisCaixa(i)
      totalSuprimentos += totais.suprimentos
      totalSangrias += totais.sangrias
      if (totais.fechado) caixasFechados++
    }

    return {
      totalSuprimentos,
      totalSangrias,
      caixasFechados,
      percentualFechamento: (caixasFechados / 6) * 100
    }
  }

  const resumoGeral = calcularResumoGeral()

  const renderizarConteudo = () => {
    if (telaAtiva === 'resumo') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Resumo Geral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Total Suprimentos</h3>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(resumoGeral.totalSuprimentos)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Total Sangrias</h3>
                <p className="text-2xl font-bold text-red-600">{formatarMoeda(resumoGeral.totalSangrias)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Progresso</h3>
                <p className="text-2xl font-bold text-blue-600">{resumoGeral.caixasFechados}/6</p>
                <p className="text-sm text-blue-600">{resumoGeral.percentualFechamento.toFixed(0)}% concluído</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Caixa</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Suprimentos</th>
                    <th className="text-left p-2">Sangrias</th>
                    <th className="text-left p-2">Valor Esperado</th>
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
                        <td className="p-2 text-green-600">{formatarMoeda(totais.suprimentos)}</td>
                        <td className="p-2 text-red-600">{formatarMoeda(totais.sangrias)}</td>
                        <td className="p-2 text-blue-600">{formatarMoeda(totais.valorEsperado)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Todas as Movimentações do Dia</h3>
            {movimentacoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movimentacoes.filter(m => !m.excluido).map(mov => (
                  <div key={mov.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Caixa {mov.caixa}</span>
                        <span className={`font-semibold ${
                          mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mov.tipo === 'suprimento' ? '➕' : '➖'} 
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
                        mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
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
      return <GestaCaixaIndividual numeroCaixa={numeroCaixa} dadosUsuario={dadosUsuario} />
    }

    if (telaAtiva === 'central') {
      return <CaixaCentral />
    }

    if (telaAtiva === 'relatorio') {
      return <Relatorio />
    }

    return <div>Tela não encontrada</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              </button>
            )
          })}
        </div>
      </nav>

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

// Dashboard para Operadores de Caixa
function DashboardOperador({ dadosUsuario }) {
  const { loading } = useMovimentacoes()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6">
        <GestaCaixaIndividual numeroCaixa={dadosUsuario.caixa} dadosUsuario={dadosUsuario} />
      </main>
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

  const dadosUsuario = obterDadosUsuario(currentUser.email)
  
  if (!dadosUsuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Seu email ({currentUser.email}) não está configurado no sistema.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Entre em contato com o administrador para configurar seu acesso.
          </p>
          <button
            onClick={logout}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            Fazer Logout
          </button>
        </div>
      </div>
    )
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
            dadosUsuario={dadosUsuario}
          />
          
          {dadosUsuario.tipo === 'admin' ? (
            <DashboardAdmin dadosUsuario={dadosUsuario} />
          ) : (
            <DashboardOperador dadosUsuario={dadosUsuario} />
          )}
        </div>
      </MovimentacoesProvider>
    </DataProvider>
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
