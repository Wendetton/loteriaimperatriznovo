import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Clock } from 'lucide-react'

export default function ListaMovimentacoes({ 
  suprimentos = [], 
  sangrias = [],
  titulo = "Movimentações do Dia" 
}) {
  // Combinar e ordenar todas as movimentações por horário
  const todasMovimentacoes = [
    ...suprimentos.map(item => ({ ...item, tipo: 'suprimento' })),
    ...sangrias.map(item => ({ ...item, tipo: 'sangria' }))
  ].sort((a, b) => new Date(b.horario) - new Date(a.horario))

  const formatarHorario = (horario) => {
    if (!horario) return '--:--'
    const data = new Date(horario)
    return data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  if (todasMovimentacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma movimentação registrada hoje</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {todasMovimentacoes.map((movimentacao, index) => {
            const isSuprimento = movimentacao.tipo === 'suprimento'
            const Icon = isSuprimento ? ArrowUp : ArrowDown
            const cor = isSuprimento ? 'text-green-600' : 'text-red-600'
            const corBg = isSuprimento ? 'bg-green-100' : 'bg-red-100'
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${corBg}`}>
                    <Icon className={`h-4 w-4 ${cor}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={isSuprimento ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isSuprimento ? 'Suprimento' : 'Sangria'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatarHorario(movimentacao.horario)}
                      </span>
                    </div>
                    {movimentacao.observacao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {movimentacao.observacao}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className={`text-lg font-semibold ${cor}`}>
                  {isSuprimento ? '+' : '-'}{formatarValor(movimentacao.valor)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

