import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  Calculator,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'

export default function ResumoFinanceiro({
  saldoInicial = 0,
  totalSuprimentos = 0,
  totalSangrias = 0,
  saldoFinalCalculado = 0,
  valorFinalMaquina = 0,
  divergencia = false
}) {
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const diferenca = valorFinalMaquina - saldoFinalCalculado

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarValor(saldoInicial)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suprimentos</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarValor(totalSuprimentos)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sangrias</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarValor(totalSangrias)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Calculado</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatarValor(saldoFinalCalculado)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparação com Valor da Máquina */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Comparação Final</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Saldo Calculado
              </label>
              <div className="text-xl font-bold text-primary">
                {formatarValor(saldoFinalCalculado)}
              </div>
              <p className="text-xs text-muted-foreground">
                Inicial + Suprimentos - Sangrias
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Valor da Máquina
              </label>
              <div className="text-xl font-bold">
                {valorFinalMaquina > 0 ? formatarValor(valorFinalMaquina) : 'Não informado'}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor informado pelo operador
              </p>
            </div>
          </div>

          {/* Indicador de Divergência */}
          {valorFinalMaquina > 0 && (
            <div className="pt-4 border-t">
              {divergencia ? (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Divergência detectada!</span>
                      <Badge variant="destructive" className="ml-2">
                        {diferenca > 0 ? '+' : ''}{formatarValor(Math.abs(diferenca))}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">
                      {diferenca > 0 
                        ? 'A máquina tem mais dinheiro que o calculado'
                        : 'A máquina tem menos dinheiro que o calculado'
                      }
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Valores conferem!</span>
                      <Badge className="bg-green-100 text-green-800 ml-2">
                        ✓ Correto
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">
                      O valor da máquina está igual ao saldo calculado.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

