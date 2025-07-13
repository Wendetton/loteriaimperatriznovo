import { useState, useEffect } from 'react'
import TrocoControl from './TrocoControl'
import formatarMoeda from '../../utils/formatarMoeda'

export default function CaixaIndividual({ numero, dataSelecionada }) {
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

    const movs = JSON.parse(localStorage.getItem(chaveMovimentacoes) || '[]')
    const dados = JSON.parse(
      localStorage.getItem(chaveDados) ||
      '{"trocoInicial":0,"valorMaquina":0,"fechado":false}'
    )

    setMovimentacoes(movs)
    setDadosCaixa(dados)
  }, [numero, dataSelecionada])

  // Cálculos de totais
  const totalSuprimentos = movimentacoes
    .filter((m) => m.tipo === 'suprimento')
    .reduce((total, m) => total + m.valor, 0)

  const totalSangrias = movimentacoes
    .filter((m) => m.tipo === 'sangria')
    .reduce((total, m) => total + m.valor, 0)

  const valorEsperado =
    dadosCaixa.trocoInicial + totalSuprimentos - totalSangrias

  const divergencia = dadosCaixa.valorMaquina - valorEsperado

  // Funções de definição e movimentações (legado)
  const definirTrocoInicial = () => {
    const valor = parseFloat(novoTroco)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para o troco inicial')
      return
    }
    const novosDados = { ...dadosCaixa, trocoInicial: valor }
    setDadosCaixa(novosDados)
    localStorage.setItem(
      `dados_caixa_${numero}_${dataSelecionada}`,
      JSON.stringify(novosDados)
    )
    setNovoTroco('')
    alert('Troco inicial definido com sucesso!')
  }

  const definirValorMaquina = () => {
    const valor = parseFloat(novoValorMaquina)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para o valor da máquina')
      return
    }
    const novosDados = { ...dadosCaixa, valorMaquina: valor }
    setDadosCaixa(novosDados)
    localStorage.setItem(
      `dados_caixa_${numero}_${dataSelecionada}`,
      JSON.stringify(novosDados)
    )
    setNovoValorMaquina('')
    alert('Valor da máquina definido com sucesso!')
  }

  const adicionarSuprimento = () => {
    const valor = parseFloat(novoSuprimento.valor)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para a sangria')
      return
    }
    const novaMovimentacao = {
      id: Date.now(),
      tipo: 'suprimento',
      valor,
      observacao: novoSuprimento.observacao,
      data: new Date().toISOString()
    }
    const novasMovimentacoes = [...movimentacoes, novaMovimentacao]
    setMovimentacoes(novasMovimentacoes)
    localStorage.setItem(
      `movimentacoes_caixa_${numero}_${dataSelecionada}`,
      JSON.stringify(novasMovimentacoes)
    )
    setNovoSuprimento({ valor: '', observacao: '' })
    alert('Suprimento adicionado com sucesso!')
  }

  const adicionarSangria = () => {
    const valor = parseFloat(novaSangria.valor)
    if (!valor || valor <= 0) {
      alert('Digite um valor válido para a sangria')
      return
    }
    const novaMov = {
      id: Date.now(),
      tipo: 'sangria',
      valor,
      observacao: novaSangria.observacao,
      data: new Date().toISOString()
    }
    const movs = [...movimentacoes, novaMov]
    setMovimentacoes(movs)
    localStorage.setItem(
      `movimentacoes_caixa_${numero}_${dataSelecionada}`,
      JSON.stringify(movs)
    )
    setNovaSangria({ valor: '', observacao: '' })
    alert('Sangria adicionada com sucesso!')
  }

  // Renderização
  return (
    <div>
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-blue-800 mb-3">🪙 Troco Inicial</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatarMoeda(dadosCaixa.trocoInicial)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800 mb-3">💧 Suprimentos</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatarMoeda(totalSuprimentos)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-red-800 mb-3">✂️ Sangrias</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatarMoeda(totalSangrias)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">🎯 Valor Esperado</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatarMoeda(valorEsperado)}
          </p>
        </div>
      </div>

      {/* Novo controle de troco digital */}
      <TrocoControl caixaId={numero} />

      {/* Formulários de Movimentação */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800 mb-3">
            ➕ Adicionar Suprimento
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              value={novoSuprimento.valor}
              onChange={(e) =>
                setNovoSuprimento({
                  ...novoSuprimento,
                  valor: e.target.value
                })
              }
              placeholder="Valor (R$)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={novoSuprimento.observacao}
              onChange={(e) =>
                setNovoSuprimento({
                  ...novoSuprimento,
                  observacao: e.target.value
                })
              }
              placeholder="Observação (opcional)"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={adicionarSuprimento}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Registrar Suprimento
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-red-800 mb-3">➖ Adicionar Sangria</h3>
          <div className="space-y-3">
            <input
              type="number"
              value={novaSangria.valor}
              onChange={(e) =>
                setNovaSangria({ ...novaSangria, valor: e.target.value })
              }
              placeholder="Valor (R$)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={novaSangria.observacao}
              onChange={(e) =>
                setNovaSangria({ ...novaSangria, observacao: e.target.value })
              }
              placeholder="Observação (opcional)"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={adicionarSangria}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Registrar Sangria
            </button>
          </div>
        </div>
      </div>

      {/* ... restante do componente (lista de movimentações, status, etc.) ... */}
    </div>
  )
}
