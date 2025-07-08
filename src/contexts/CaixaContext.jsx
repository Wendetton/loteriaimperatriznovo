import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContextDemo'
import { 
  salvarDadosCaixa, 
  buscarDadosCaixa, 
  adicionarMovimentacao,
  buscarMovimentacoesDia,
  calcularSaldoFinal 
} from '../services/firestore'

const CaixaContext = createContext()

export function useCaixa() {
  const context = useContext(CaixaContext)
  if (!context) {
    throw new Error('useCaixa deve ser usado dentro de um CaixaProvider')
  }
  return context
}

export function CaixaProvider({ children }) {
  const { user } = useAuth()
  const [dadosCaixas, setDadosCaixas] = useState({})
  const [movimentacoes, setMovimentacoes] = useState({})
  const [dataAtual, setDataAtual] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carregar dados dos caixas para a data atual
  useEffect(() => {
    if (user && dataAtual) {
      carregarDadosDia()
    }
  }, [user, dataAtual])

  const carregarDadosDia = async () => {
    try {
      setLoading(true)
      setError('')

      const dadosCarregados = {}
      const movimentacoesCarregadas = {}

      // Carregar dados de cada caixa
      for (let i = 1; i <= 6; i++) {
        const dados = await buscarDadosCaixa(i, dataAtual)
        const movs = await buscarMovimentacoesDia(i, dataAtual)
        
        dadosCarregados[i] = dados || {
          saldoInicial: 0,
          valorMaquina: null,
          observacoes: '',
          data: dataAtual
        }
        
        movimentacoesCarregadas[i] = movs || []
      }

      setDadosCaixas(dadosCarregados)
      setMovimentacoes(movimentacoesCarregadas)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados do dia')
    } finally {
      setLoading(false)
    }
  }

  const atualizarDadosCaixa = async (numeroCaixa, dados) => {
    try {
      setError('')
      
      // Atualizar estado local
      setDadosCaixas(prev => ({
        ...prev,
        [numeroCaixa]: { ...prev[numeroCaixa], ...dados }
      }))

      // Salvar no Firebase (em modo demo, apenas simular)
      if (process.env.NODE_ENV !== 'development') {
        await salvarDadosCaixa(numeroCaixa, { ...dados, data: dataAtual })
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do caixa:', error)
      setError('Erro ao salvar dados')
    }
  }

  const adicionarMovimentacaoCaixa = async (numeroCaixa, movimentacao) => {
    try {
      setError('')
      
      const novaMovimentacao = {
        ...movimentacao,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        data: dataAtual
      }

      // Atualizar estado local
      setMovimentacoes(prev => ({
        ...prev,
        [numeroCaixa]: [...(prev[numeroCaixa] || []), novaMovimentacao]
      }))

      // Salvar no Firebase (em modo demo, apenas simular)
      if (process.env.NODE_ENV !== 'development') {
        await adicionarMovimentacao(numeroCaixa, novaMovimentacao)
      }

      return novaMovimentacao
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error)
      setError('Erro ao adicionar movimentação')
      throw error
    }
  }

  const calcularResumoFinanceiro = (numeroCaixa) => {
    const dados = dadosCaixas[numeroCaixa] || {}
    const movs = movimentacoes[numeroCaixa] || []

    const totalSuprimentos = movs
      .filter(m => m.tipo === 'suprimento')
      .reduce((total, m) => total + parseFloat(m.valor || 0), 0)

    const totalSangrias = movs
      .filter(m => m.tipo === 'sangria')
      .reduce((total, m) => total + parseFloat(m.valor || 0), 0)

    const saldoCalculado = (dados.saldoInicial || 0) + totalSuprimentos - totalSangrias

    const temDivergencia = dados.valorMaquina !== null && 
      dados.valorMaquina !== saldoCalculado

    return {
      saldoInicial: dados.saldoInicial || 0,
      totalSuprimentos,
      totalSangrias,
      saldoCalculado,
      valorMaquina: dados.valorMaquina,
      temDivergencia,
      diferenca: dados.valorMaquina !== null ? dados.valorMaquina - saldoCalculado : 0
    }
  }

  const calcularConsolidacao = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let saldoFinalConsolidado = 0
    const divergencias = []
    let caixasAtivos = 0

    for (let i = 1; i <= 6; i++) {
      const resumo = calcularResumoFinanceiro(i)
      
      totalSuprimentos += resumo.totalSuprimentos
      totalSangrias += resumo.totalSangrias
      saldoFinalConsolidado += resumo.saldoCalculado

      if (resumo.totalSuprimentos > 0 || resumo.totalSangrias > 0) {
        caixasAtivos++
      }

      if (resumo.temDivergencia) {
        divergencias.push({
          caixa: i,
          calculado: resumo.saldoCalculado,
          maquina: resumo.valorMaquina,
          diferenca: resumo.diferenca
        })
      }
    }

    return {
      totalSuprimentos,
      totalSangrias,
      saldoFinalConsolidado,
      divergencias,
      caixasAtivos,
      totalMovimentado: totalSuprimentos + totalSangrias
    }
  }

  const obterDadosCaixa = (numeroCaixa) => {
    return dadosCaixas[numeroCaixa] || {
      saldoInicial: 0,
      valorMaquina: null,
      observacoes: '',
      data: dataAtual
    }
  }

  const obterMovimentacoesCaixa = (numeroCaixa) => {
    return movimentacoes[numeroCaixa] || []
  }

  const alterarData = (novaData) => {
    setDataAtual(novaData)
  }

  const value = {
    dadosCaixas,
    movimentacoes,
    dataAtual,
    loading,
    error,
    setError,
    atualizarDadosCaixa,
    adicionarMovimentacaoCaixa,
    calcularResumoFinanceiro,
    calcularConsolidacao,
    obterDadosCaixa,
    obterMovimentacoesCaixa,
    alterarData,
    carregarDadosDia
  }

  return (
    <CaixaContext.Provider value={value}>
      {children}
    </CaixaContext.Provider>
  )
}

