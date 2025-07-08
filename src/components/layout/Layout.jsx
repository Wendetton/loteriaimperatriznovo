import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout({ children, user, onLogout }) {
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [activeCaixa, setActiveCaixa] = useState('central')

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate)
  }

  const handleCaixaChange = (caixaId) => {
    setActiveCaixa(caixaId)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentDate={currentDate}
        onDateChange={handleDateChange}
        user={user}
        onLogout={onLogout}
      />
      
      <div className="flex">
        <Sidebar
          activeCaixa={activeCaixa}
          onCaixaChange={handleCaixaChange}
        />
        
        <main className="flex-1 p-6">
          {children({ activeCaixa, currentDate })}
        </main>
      </div>
    </div>
  )
}

