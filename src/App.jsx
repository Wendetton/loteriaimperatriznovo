// App.jsx - VERSÃO LIMPA E 100% FUNCIONAL
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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

// Função para obter dados do usuário
const obterDadosUsuario = (email) => {
  return USUARIOS_CONFIGURADOS[email] || null
}

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
function Header({ onLogout, dadosUsuario, dataSelecionada, setDataSelecionada }) {
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

// Componente Gestão de Caixa Individual
function GestaCaixaIndividual({ numeroCaixa, dadosUsuario, dataSelecionada }) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [dadosCaixa, setDadosCaixa] = useState({
    trocoInicial: 0,
    valorMaquina: 0,
    fechado: false
  })
  
  const [trocoInicial, setTrocoInicial] = useState('')
  const [valorMaquina, setValorMaquina] = useState('')
  const [valorSuprimento, setValorSuprimento] = useState('')
  const [obsSuprimento, setObsSuprimento] = useState('')
  const [valorSangria, setValorSangria] = useState('')
  const [obsSangria, setObsSangria] = useState('')

  const isAdmin = dadosUsuario.tipo === 'admin'

  // Carregar dados do localStorage
  useEffect(() => {
    const carregarDados = () => {
      try {
        // Carregar movimentações
        const keyMovs = `movimentacoes_${dataSelecionada}_${numeroCaixa}`
        const movsData = localStorage.getItem(keyMovs)
        if (movsData) {
          setMovimentacoes(JSON.parse(movsData))
        } else {
          setMovimentacoes([])
        }

        // Carregar dados do caixa
        const keyCaixa = `caixa_${dataSelecionada}_${numeroCaixa}`
        const caixaData = localStorage.getItem(keyCaixa)
        if (caixaData) {
          const dados = JSON.parse(caixaData)
          setDadosCaixa(dados)
          setTrocoInicial(dados.trocoInicial || '')
          setValorMaquina(dados.valorMaquina || '')
        } else {
          setDadosCaixa({
            trocoInicial: 0,
            valorMaquina: 0,
            fechado: false
          })
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    carregarDados()
  }, [dataSelecionada, numeroCaixa])

  // Salvar dados no localStorage
  const salvarDadosCaixa = (novosDados) => {
    try {
      const key = `caixa_${dataSelecionada}_${numeroCaixa}`
      const dadosCompletos = { ...dadosCaixa, ...novosDados }
      localStorage.setItem(key, JSON.stringify(dadosCompletos))
      setDadosCaixa(dadosCompletos)
    } catch (error) {
      console.error('Erro ao salvar dados do caixa:', error)
    }
  }

  const salvarMovimentacoes = (novasMovs) => {
    try {
      const key = `movimentacoes_${dataSelecionada}_${numeroCaixa}`
      localStorage.setItem(key, JSON.stringify(novasMovs))
      setMovimentacoes(novasMovs)
    } catch (error) {
      console.error('Erro ao salvar movimentações:', error)
    }
  }

  // Calcular totais
  const calcularTotais = () => {
    const suprimentos = movimentacoes
      .filter(m => m.tipo === 'suprimento')
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    
    const sangrias = movimentacoes
      .filter(m => m.tipo === 'sangria')
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    
    const valorEsperado = dadosCaixa.trocoInicial + suprimentos - sangrias
    const divergencia = dadosCaixa.valorMaquina - valorEsperado
    
    return {
      trocoInicial: dadosCaixa.trocoInicial,
      suprimentos,
      sangrias,
      valorEsperado,
      valorMaquina: dadosCaixa.valorMaquina,
      divergencia,
      temDivergencia: Math.abs(divergencia) > 0.01,
      fechado: dadosCaixa.fechado
    }
  }

  const totais = calcularTotais()

  // Handlers
  const handleAtualizarTrocoInicial = () => {
    if (!trocoInicial || parseFloat(trocoInicial) < 0) {
      alert('Por favor, insira um valor válido para o troco inicial')
      return
    }

    salvarDadosCaixa({ trocoInicial: parseFloat(trocoInicial) })
    alert('Troco inicial atualizado com sucesso!')
  }

  const handleAtualizarValorMaquina = () => {
    if (!valorMaquina || parseFloat(valorMaquina) < 0) {
      alert('Por favor, insira um valor válido para o valor da máquina')
      return
    }

    salvarDadosCaixa({ valorMaquina: parseFloat(valorMaquina) })
    alert('Valor da máquina atualizado com sucesso!')
  }

  const handleAdicionarSuprimento = () => {
    if (!valorSuprimento || parseFloat(valorSuprimento) <= 0) {
      alert('Por favor, insira um valor válido para o suprimento')
      return
    }

    const novaMovimentacao = {
      id: Date.now().toString(),
      tipo: 'suprimento',
      valor: parseFloat(valorSuprimento),
      observacao: obsSuprimento || 'Suprimento',
      criadoEm: new Date().toISOString(),
      criadoPor: dadosUsuario.nome
    }

    const novasMovs = [...movimentacoes, novaMovimentacao]
    salvarMovimentacoes(novasMovs)
    
    setValorSuprimento('')
    setObsSuprimento('')
    alert('Suprimento adicionado com sucesso!')
  }

  const handleAdicionarSangria = () => {
    if (!valorSangria || parseFloat(valorSangria) <= 0) {
      alert('Por favor, insira um valor válido para a sangria')
      return
    }

    const novaMovimentacao = {
      id: Date.now().toString(),
      tipo: 'sangria',
      valor: parseFloat(valorSangria),
      observacao: obsSangria || 'Sangria',
      criadoEm: new Date().toISOString(),
      criadoPor: dadosUsuario.nome
    }

    const novasMovs = [...movimentacoes, novaMovimentacao]
    salvarMovimentacoes(novasMovs)
    
    setValorSangria('')
    setObsSangria('')
    alert('Sangria adicionada com sucesso!')
  }

  const handleFecharCaixa = () => {
    if (!dadosCaixa.valorMaquina || dadosCaixa.valorMaquina === 0) {
      alert('Por favor, defina o valor da máquina antes de fechar o caixa')
      return
    }

    if (window.confirm('Tem certeza que deseja fechar este caixa? Esta ação não pode ser desfeita.')) {
      salvarDadosCaixa({ 
        fechado: true,
        fechadoPor: dadosUsuario.nome,
        fechadoEm: new Date().toISOString()
      })
      alert('Caixa fechado com sucesso!')
    }
  }

  const handleExcluirMovimentacao = (id) => {
    const senha = prompt('Digite a senha de confirmação para excluir:')
    if (senha === 'matilde') {
      const novasMovs = movimentacoes.filter(m => m.id !== id)
      salvarMovimentacoes(novasMovs)
      alert('Movimentação excluída com sucesso!')
    } else {
      alert('Senha incorreta!')
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
          <button 
            onClick={handleFecharCaixa}
            className="bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
          >
            Fechar Caixa
          </button>
        </div>
      )}

      {/* Histórico de Movimentações */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Histórico de Movimentações</h3>
        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {movimentacoes.map(mov => (
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
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${
                    mov.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(mov.valor)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleExcluirMovimentacao(mov.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Excluir movimentação"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente Caixa Central
function CaixaCentral({ dataSelecionada }) {
  const [dadosCentral, setDadosCentral] = useState({
    valorInicial: 0,
    valorCarroForte: 0,
    valorFinal: 0
  })
  
  const [valorInicial, setValorInicial] = useState('')

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const key = `caixa_central_${dataSelecionada}`
      const data = localStorage.getItem(key)
      if (data) {
        const dados = JSON.parse(data)
        setDadosCentral(dados)
        setValorInicial(dados.valorInicial || '')
      }
    } catch (error) {
      console.error('Erro ao carregar dados do caixa central:', error)
    }
  }, [dataSelecionada])

  const salvarDados = (novosDados) => {
    try {
      const key = `caixa_central_${dataSelecionada}`
      const dadosCompletos = { ...dadosCentral, ...novosDados }
      localStorage.setItem(key, JSON.stringify(dadosCompletos))
      setDadosCentral(dadosCompletos)
    } catch (error) {
      console.error('Erro ao salvar dados do caixa central:', error)
    }
  }

  const handleAtualizarValorInicial = () => {
    if (!valorInicial || parseFloat(valorInicial) < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    salvarDados({ valorInicial: parseFloat(valorInicial) })
    alert('Valor inicial atualizado com sucesso!')
  }

  // Calcular totais gerais
  const calcularTotaisGerais = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0

    for (let i = 1; i <= 6; i++) {
      try {
        const key = `movimentacoes_${dataSelecionada}_${i}`
        const data = localStorage.getItem(key)
        if (data) {
          const movs = JSON.parse(data)
          totalSuprimentos += movs.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + (m.valor || 0), 0)
          totalSangrias += movs.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + (m.valor || 0), 0)
        }
      } catch (error) {
        console.error(`Erro ao calcular totais do caixa ${i}:`, error)
      }
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

// Componente Relatório
function Relatorio({ dataSelecionada }) {
  const imprimirRelatorio = () => {
    window.print()
  }

  // Calcular dados para o relatório
  const calcularDadosRelatorio = () => {
    const dadosCaixas = []

    for (let i = 1; i <= 6; i++) {
      try {
        // Carregar movimentações
        const keyMovs = `movimentacoes_${dataSelecionada}_${i}`
        const movsData = localStorage.getItem(keyMovs)
        const movimentacoes = movsData ? JSON.parse(movsData) : []

        // Carregar dados do caixa
        const keyCaixa = `caixa_${dataSelecionada}_${i}`
        const caixaData = localStorage.getItem(keyCaixa)
        const dadosCaixa = caixaData ? JSON.parse(caixaData) : { trocoInicial: 0, valorMaquina: 0, fechado: false }

        // Calcular totais
        const suprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + (m.valor || 0), 0)
        const sangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + (m.valor || 0), 0)
        const valorEsperado = dadosCaixa.trocoInicial + suprimentos - sangrias
        const divergencia = dadosCaixa.valorMaquina - valorEsperado

        dadosCaixas.push({
          numero: i,
          trocoInicial: dadosCaixa.trocoInicial,
          suprimentos,
          sangrias,
          valorEsperado,
          valorMaquina: dadosCaixa.valorMaquina,
          divergencia,
          temDivergencia: Math.abs(divergencia) > 0.01,
          fechado: dadosCaixa.fechado,
          movimentacoes
        })
      } catch (error) {
        console.error(`Erro ao calcular dados do caixa ${i}:`, error)
      }
    }

    return dadosCaixas
  }

  const dadosRelatorio = calcularDadosRelatorio()

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
          {dadosRelatorio.map(caixa => (
            <div key={caixa.numero} className="border p-4 rounded">
              <h3 className="text-lg font-bold text-gray-800 mb-2">💰 Caixa {caixa.numero}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 text-sm">
                <div>
                  <span className="font-semibold">Troco Inicial:</span>
                  <p className="text-blue-600 font-bold">{formatarMoeda(caixa.trocoInicial)}</p>
                </div>
                <div>
                  <span className="font-semibold">Suprimentos:</span>
                  <p className="text-green-600 font-bold">{formatarMoeda(caixa.suprimentos)}</p>
                </div>
                <div>
                  <span className="font-semibold">Sangrias:</span>
                  <p className="text-red-600 font-bold">{formatarMoeda(caixa.sangrias)}</p>
                </div>
                <div>
                  <span className="font-semibold">Valor Esperado:</span>
                  <p className="text-purple-600 font-bold">{formatarMoeda(caixa.valorEsperado)}</p>
                </div>
                <div>
                  <span className="font-semibold">Valor Máquina:</span>
                  <p className={`font-bold ${caixa.temDivergencia ? 'text-red-600' : 'text-green-600'}`}>
                    {formatarMoeda(caixa.valorMaquina)}
                    {caixa.temDivergencia && <span className="text-xs block">⚠️ Divergência: {formatarMoeda(caixa.divergencia)}</span>}
                  </p>
                </div>
              </div>

              {caixa.movimentacoes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Movimentações:</h4>
                  <div className="space-y-1">
                    {caixa.movimentacoes.map(mov => (
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
          ))}
        </div>
      </div>
    </div>
  )
}

// Dashboard para Administradores
function DashboardAdmin({ dadosUsuario }) {
  const [telaAtiva, setTelaAtiva] = useState('resumo')
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const calcularResumoGeral = () => {
    let totalSuprimentos = 0
    let totalSangrias = 0
    let caixasFechados = 0

    for (let i = 1; i <= 6; i++) {
      try {
        // Carregar movimentações
        const keyMovs = `movimentacoes_${dataSelecionada}_${i}`
        const movsData = localStorage.getItem(keyMovs)
        const movimentacoes = movsData ? JSON.parse(movsData) : []

        // Carregar dados do caixa
        const keyCaixa = `caixa_${dataSelecionada}_${i}`
        const caixaData = localStorage.getItem(keyCaixa)
        const dadosCaixa = caixaData ? JSON.parse(caixaData) : { fechado: false }

        totalSuprimentos += movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + (m.valor || 0), 0)
        totalSangrias += movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + (m.valor || 0), 0)
        if (dadosCaixa.fechado) caixasFechados++
      } catch (error) {
        console.error(`Erro ao calcular resumo do caixa ${i}:`, error)
      }
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
          </div>
        </div>
      )
    }

    if (telaAtiva.startsWith('caixa-')) {
      const numeroCaixa = parseInt(telaAtiva.split('-')[1])
      return <GestaCaixaIndividual numeroCaixa={numeroCaixa} dadosUsuario={dadosUsuario} dataSelecionada={dataSelecionada} />
    }

    if (telaAtiva === 'central') {
      return <CaixaCentral dataSelecionada={dataSelecionada} />
    }

    if (telaAtiva === 'relatorio') {
      return <Relatorio dataSelecionada={dataSelecionada} />
    }

    return <div>Tela não encontrada</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        dadosUsuario={dadosUsuario}
        dataSelecionada={dataSelecionada}
        setDataSelecionada={setDataSelecionada}
        onLogout={() => window.location.reload()}
      />
      
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
          ].map(opcao => (
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
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {renderizarConteudo()}
      </main>
    </div>
  )
}

// Dashboard para Operadores de Caixa
function DashboardOperador({ dadosUsuario }) {
  const [dataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        dadosUsuario={dadosUsuario}
        dataSelecionada={dataSelecionada}
        setDataSelecionada={() => {}} // Operadores não podem mudar data
        onLogout={() => window.location.reload()}
      />
      
      <main className="p-6">
        <GestaCaixaIndividual 
          numeroCaixa={dadosUsuario.caixa} 
          dadosUsuario={dadosUsuario} 
          dataSelecionada={dataSelecionada} 
        />
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

  return (
    <>
      {dadosUsuario.tipo === 'admin' ? (
        <DashboardAdmin dadosUsuario={dadosUsuario} />
      ) : (
        <DashboardOperador dadosUsuario={dadosUsuario} />
      )}
    </>
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

