import { useState, useEffect } from 'react'
import { useCaixa } from '../../contexts/CaixaContext'
import FormularioMovimentacao from './FormularioMovimentacao'
import ListaMovimentacoes from './ListaMovimentacoes'
import ResumoFinanceiro from './ResumoFinanceiro'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Calculator, Save, AlertTriangle, CheckCircle } from 'lucide-react'

export default function CaixaIndividual({ numeroCaixa }) {
  const { 
    obterDadosCaixa, 
    obterMovimentacoesCaixa,
    atualizarDadosCaixa,
    adicionarMovimentacaoCaixa,
    calcularResumoFinanceiro,
    dataAtual,
    loading,
    error,
    setError
  } = useCaixa()

  const [dados, setDados] = useState({})
  const [movimentacoes, setMovimentacoes] = useState([])
  const [resumo, setResumo] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Carregar dados do caixa
    const dadosCaixa = obterDadosCaixa(numeroCaixa)
    const movsCaixa = obterMovimentacoesCaixa(numeroCaixa)
    const resumoCaixa = calcularResumoFinanceiro(numeroCaixa)

    setDados(dadosCaixa)
    setMovimentacoes(movsCaixa)
    setResumo(resumoCaixa)
  }, [numeroCaixa, obterDadosCaixa, obterMovimentacoesCaixa, calcularResumoFinanceiro])

  const handleSalvarDados = async () => {
    try {
      setSalvando(true)
      setError('')
      await atualizarDadosCaixa(numeroCaixa, dados)
      
      // Mostrar feedback de sucesso
      setTimeout(() => setSalvando(false), 1000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setSalvando(false)
    }
  }

  const handleAdicionarMovimentacao = async (movimentacao) => {
    try {
      await adicionarMovimentacaoCaixa(numeroCaixa, movimentacao)
      
      // Atualizar dados locais
      const novasMovs = obterMovimentacoesCaixa(numeroCaixa)
      const novoResumo = calcularResumoFinanceiro(numeroCaixa)
      
      setMovimentacoes(novasMovs)
      setResumo(novoResumo)
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error)
    }
  }

  const handleAtualizarCampo = (campo, valor) => {
    const novosDados = { ...dados, [campo]: valor }
    setDados(novosDados)
    
    // Recalcular resumo se necessário
    if (campo === 'saldoInicial' || campo === 'valorMaquina') {
      const novoResumo = calcularResumoFinanceiro(numeroCaixa)
      setResumo(novoResumo)
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do caixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Caixa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Caixa {numeroCaixa}</h2>
          <span className="text-muted-foreground">- {dataAtual}</span>
        </div>
        <button
          onClick={handleSalvarDados}
          disabled={salvando}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            salvando 
              ? 'bg-green-100 text-green-700 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          <Save className="h-4 w-4" />
          <span>{salvando ? 'Salvo!' : 'Salvar'}</span>
          {salvando && <span className="text-xs">✓</span>}
        </button>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resumo Financeiro */}
      <ResumoFinanceiro resumo={resumo} />

      {/* Comparação Final */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Comparação Final</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Saldo Calculado</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatarMoeda(resumo.saldoCalculado)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Inicial + Suprimentos - Sangrias</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-sm font-medium text-purple-600">Valor da Máquina</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {dados.valorMaquina !== null ? 
                  formatarMoeda(dados.valorMaquina) : 
                  'Não informado'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Valor informado pelo operador</p>
            </div>
          </div>

          {/* Indicador de Divergência */}
          {dados.valorMaquina !== null && (
            <div className={`mt-4 p-3 rounded-lg border ${
              resumo.temDivergencia 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                {resumo.temDivergencia ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-700">
                      Divergência de {formatarMoeda(Math.abs(resumo.diferenca))}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">
                      Valores conferem
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Iniciais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Iniciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={dados.saldoInicial || ''}
              onChange={(e) => handleAtualizarCampo('saldoInicial', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500 mt-1">Saldo do fechamento do dia anterior</p>
          </div>
        </CardContent>
      </Card>

      {/* Valor Final da Máquina */}
      <Card>
        <CardHeader>
          <CardTitle>Valor Final da Máquina</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Informado (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={dados.valorMaquina || ''}
              onChange={(e) => handleAtualizarCampo('valorMaquina', parseFloat(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500 mt-1">Valor mostrado na máquina ao final do expediente</p>
          </div>
        </CardContent>
      </Card>

      {/* Formulários de Movimentação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormularioMovimentacao 
          tipo="suprimento" 
          onAdicionar={handleAdicionarMovimentacao}
        />
        <FormularioMovimentacao 
          tipo="sangria" 
          onAdicionar={handleAdicionarMovimentacao}
        />
      </div>

      {/* Lista de Movimentações */}
      <ListaMovimentacoes movimentacoes={movimentacoes} />

      {/* Observações do Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Observações do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={dados.observacoes || ''}
            onChange={(e) => handleAtualizarCampo('observacoes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
            placeholder="Adicione observações sobre as operações do dia..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

