/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

// Redirecionamento real (window.location) para paginas estaticas em public/ —
// o <Navigate> do React Router nao recarrega o arquivo estatico, causando 404 falso.
function StaticRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])
  return null
}

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
        </Route>
        {/* Simulador e Cadastro/Envios: qualquer variacao de URL cai no arquivo estatico correto */}
        <Route
          path="/simulador"
          element={<StaticRedirect to="/panorama-reforma/simulador.html" />}
        />
        <Route
          path="/simulador.html"
          element={<StaticRedirect to="/panorama-reforma/simulador.html" />}
        />
        <Route
          path="/panorama-reforma/simulador"
          element={<StaticRedirect to="/panorama-reforma/simulador.html" />}
        />
        <Route path="/envios" element={<StaticRedirect to="/panorama-reforma/envios.html" />} />
        <Route
          path="/envios.html"
          element={<StaticRedirect to="/panorama-reforma/envios.html" />}
        />
        <Route
          path="/panorama-reforma/envios"
          element={<StaticRedirect to="/panorama-reforma/envios.html" />}
        />
        <Route path="/recebido" element={<StaticRedirect to="/panorama-reforma/recebido.html" />} />
        <Route
          path="/panorama-reforma/recebido"
          element={<StaticRedirect to="/panorama-reforma/recebido.html" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
