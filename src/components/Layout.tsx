/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet } from 'react-router-dom'
import { GerenciadorBarrasRolagemGlobal } from '@/components/GerenciadorBarrasRolagemGlobal'

export default function Layout() {
  return (
    <main className="flex flex-col min-h-screen">
      <Outlet />
      {/* Barra de rolagem horizontal fixa GLOBAL (modelo aprovado na 0.0.763):
          uma única barra por tela, para qualquer tabela que transborde na
          horizontal. Páginas que já montam a própria barra (ex.: /cadastro-clientes)
          marcam o container com data-barra-rolagem-propria e são ignoradas. */}
      <GerenciadorBarrasRolagemGlobal />
    </main>
  )
}
