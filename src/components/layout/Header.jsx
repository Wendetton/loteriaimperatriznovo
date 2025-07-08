import { Calendar, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header({ currentDate, onDateChange, user, onLogout }) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary">
            Loteria Imperatriz
          </h1>
          <span className="text-sm text-muted-foreground">
            Sistema de Gestão Financeira
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1 border border-border rounded-md text-sm"
            />
          </div>
          
          {user && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

