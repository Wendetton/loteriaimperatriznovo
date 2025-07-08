// Layout.jsx - Versão Corrigida
import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout({ children, telaAtiva, setTelaAtiva }) {
  const [sidebarAberta, setSidebarAberta] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onToggleSidebar={() => setSidebarAberta(!sidebarAberta)}
        sidebarAberta={sidebarAberta}
      />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          telaAtiva={telaAtiva}
          setTelaAtiva={setTelaAtiva}
          aberta={sidebarAberta}
          onClose={() => setSidebarAberta(false)}
        />
        
        {/* Conteúdo Principal */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarAberta ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Overlay para mobile */}
      {sidebarAberta && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}
    </div>
  )
}

