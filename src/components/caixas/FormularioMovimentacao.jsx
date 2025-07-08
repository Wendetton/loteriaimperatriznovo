import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'

export default function FormularioMovimentacao({ 
  tipo, // 'suprimento' ou 'sangria'
  onAdicionar,
  loading = false 
}) {
  const [valor, setValor] = useState('')
  const [observacao, setObservacao] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const valorNumerico = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    onAdicionar({
      valor: valorNumerico,
      observacao: observacao.trim(),
      horario: new Date()
    })

    // Limpar formulário
    setValor('')
    setObservacao('')
  }

  const formatarValor = (value) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleaned = value.replace(/[^\d.,]/g, '')
    return cleaned
  }

  const isSuprimento = tipo === 'suprimento'
  const Icon = isSuprimento ? ArrowUp : ArrowDown
  const titulo = isSuprimento ? 'Adicionar Suprimento' : 'Adicionar Sangria'
  const cor = isSuprimento ? 'text-green-600' : 'text-red-600'
  const corBg = isSuprimento ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  return (
    <Card className={`${corBg} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 text-lg ${cor}`}>
          <Icon className="h-5 w-5" />
          <span>{titulo}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`valor-${tipo}`}>Valor (R$)</Label>
            <Input
              id={`valor-${tipo}`}
              type="text"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(formatarValor(e.target.value))}
              required
              className="text-lg font-semibold"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`observacao-${tipo}`}>Observação (opcional)</Label>
            <Textarea
              id={`observacao-${tipo}`}
              placeholder="Adicione uma observação..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !valor}
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Adicionando...' : `Adicionar ${isSuprimento ? 'Suprimento' : 'Sangria'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

