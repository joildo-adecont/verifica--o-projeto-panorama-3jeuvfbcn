/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

/**
 * SERVICE WORKER — instalação e atualização (pedido do CEO, 02/11/2026)
 *
 * Registrado aqui, e não dentro de um componente, por dois motivos:
 *  1. O registro precisa acontecer UMA vez por sessão, cedo, antes de qualquer
 *     render — não a cada montagem de aba.
 *  2. Só roda em produção. Em desenvolvimento o service worker serviria o
 *     bundle do cache e esconderia as mudanças (o clássico "alterei e não
 *     apareceu").
 *
 * A atualização é SILENCIOSA e automática: quando há versão nova o navegador
 * baixa em segundo plano; quando o usuário fecha todas as abas do app, o novo
 * service worker assume e a próxima abertura já é a versão nova. Se a aba
 * ficar aberta por dias, o `controllerchange` recarrega uma vez para pegar a
 * versão publicada.
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const producao = import.meta.env.PROD

  if (producao) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registro) => {
          // procura atualização a cada 30 min (o Panorama publica toda semana,
          // mas quem deixa o app aberto no celular merece ver antes)
          setInterval(() => registro.update().catch(() => null), 30 * 60 * 1000)
        })
        .catch(() => null)

      // Quando um service worker novo assume, recarrega UMA vez. A trava em
      // `recarregando` evita laço infinito se algo der errado.
      let recarregando = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (recarregando) return
        recarregando = true
        window.location.reload()
      })
    })
  }
}
