import { useState, useEffect } from 'react'
import { useCaixa } from '../../contexts/CaixaContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react'

export default function CaixaCentral({ data = {}, onUpdate }) {
  const { 
    calcularConsolidacao,
    calcularResumoFinanceiro,
    dataAtual,
    loading 
  } = useCaixa()

  const [consolidacao, setConsolidacao] = useState({
    totalSuprimentos: 0,
    totalSangrias: 0,
    saldoFinalConsolidado: 0,
    divergencias: [],
    caixasAtivos: 0,
    totalMovimentado: 0
  })

  const [dadosCaixas, setDadosCaixas] = useState({})

  useEffect(() => {
    // Calcular consolidação usando o contexto
    const consolidacaoAtual = calcularConsolidacao()
    setConsolidacao(consolidacaoAtual)

    // Obter dados detalhados de cada caixa
    const dadosDetalhados = {}
    for (let i = 1; i <= 6; i++) {
      dadosDetalhados[i] = calcularResumoFinanceiro(i)
    }
    setDadosCaixas(dadosDetalhados)
  }, [calcularConsolidacao, calcularResumoFinanceiro])

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Suprimentos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(consolidacao.totalSuprimentos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sangrias</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarMoeda(consolidacao.totalSangrias)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Consolidado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatarMoeda(consolidacao.saldoFinalConsolidado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {consolidacao.divergencias.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold">
                  {consolidacao.divergencias.length > 0 ? (
                    <span className="text-yellow-600">
                      {consolidacao.divergencias.length} Divergência(s)
                    </span>
                  ) : (
                    <span className="text-green-600">Sem Divergências</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Detalhamento por Caixa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Caixa</th>
                  <th className="text-right p-3 font-medium">Suprimentos</th>
                  <th className="text-right p-3 font-medium">Sangrias</th>
                  <th className="text-right p-3 font-medium">Saldo Calculado</th>
                  <th className="text-right p-3 font-medium">Valor Máquina</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dadosCaixas).map(([caixa, dados]) => {
                  const temDivergencia = dados.valorMaquina !== null && 
                    dados.valorMaquina !== dados.saldoCalculado
                  
                  return (
                    <tr key={caixa} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                            caixa === '1' ? 'from-teal-400 to-teal-600' :
                            caixa === '2' ? 'from-blue-400 to-blue-600' :
                            caixa === '3' ? 'from-purple-400 to-purple-600' :
                            caixa === '4' ? 'from-pink-400 to-pink-600' :
                            caixa === '5' ? 'from-orange-400 to-orange-600' :
                            'from-green-400 to-green-600'
                          }`} />
                          <span className="font-medium">Caixa {caixa}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-green-600 font-medium">
                        {formatarMoeda(dados.totalSuprimentos)}
                      </td>
                      <td className="p-3 text-right text-red-600 font-medium">
                        {formatarMoeda(dados.totalSangrias)}
                      </td>
                      <td className="p-3 text-right text-blue-600 font-medium">
                        {formatarMoeda(dados.saldoCalculado)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {dados.valorMaquina !== null ? 
                          formatarMoeda(dados.valorMaquina) : 
                          <span className="text-gray-400">Não informado</span>
                        }
                      </td>
                      <td className="p-3 text-center">
                        {dados.valorMaquina === null ? (
                          <Badge variant="secondary">Pendente</Badge>
                        ) : temDivergencia ? (
                          <Badge variant="destructive">Divergência</Badge>
                        ) : (
                          <Badge variant="success">Conferido</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <DollarSign className="h-5 w-5" />
            <span>Resumo Final do Dia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Movimentado</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatarMoeda(consolidacao.totalMovimentado)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Saldo Final Consolidado</p>
              <p className="text-3xl font-bold text-green-600">
                {formatarMoeda(consolidacao.saldoFinalConsolidado)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Caixas Ativos</p>
              <p className="text-2xl font-bold text-gray-700">
                {consolidacao.caixasAtivos}/6
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

