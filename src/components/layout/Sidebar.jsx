import { Calculator, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Sidebar({ activeCaixa, onCaixaChange }) {
  const caixas = [
    { id: 'central', name: 'Caixa Central', icon: Building2 },
    ...Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Caixa ${i + 1}`,
      icon: Calculator
    }))
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
          Caixas
        </h2>
        <nav className="space-y-2">
          {caixas.map((caixa) => {
            const Icon = caixa.icon
            const isActive = activeCaixa === caixa.id
            
            return (
              <Button
                key={caixa.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => onCaixaChange(caixa.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {caixa.name}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

