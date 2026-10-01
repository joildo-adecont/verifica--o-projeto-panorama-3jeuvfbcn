/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

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
        {/* Simulador e Cadastro/Envios: paginas estaticas em public/ — qualquer variacao de URL
            (sem .html, com barra final etc.) redireciona para o arquivo estatico correto */}
        <Route
          path="/simulador"
          element={<Navigate to="/panorama-reforma/simulador.html" replace />}
        />
        <Route
          path="/simulador.html"
          element={<Navigate to="/panorama-reforma/simulador.html" replace />}
        />
        <Route
          path="/panorama-reforma/simulador"
          element={<Navigate to="/panorama-reforma/simulador.html" replace />}
        />
        <Route path="/envios" element={<Navigate to="/panorama-reforma/envios.html" replace />} />
        <Route
          path="/envios.html"
          element={<Navigate to="/panorama-reforma/envios.html" replace />}
        />
        <Route
          path="/panorama-reforma/envios"
          element={<Navigate to="/panorama-reforma/envios.html" replace />}
        />
        <Route
          path="/recebido"
          element={<Navigate to="/panorama-reforma/recebido.html" replace />}
        />
        <Route
          path="/panorama-reforma/recebido"
          element={<Navigate to="/panorama-reforma/recebido.html" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
