import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Alternador de Modo Escuro — SOMENTE apresentação.
 * Usa as variáveis CSS .dark já existentes no main.css (base pronta).
 * Persiste a escolha no navegador (localStorage) — não toca em dados, funções ou cálculos.
 */
export function AlternadorTema() {
  const [escuro, setEscuro] = useState(false)

  useEffect(() => {
    const salvo = window.localStorage.getItem('panorama_tema')
    const prefereEscuro =
      salvo === 'escuro' || (!salvo && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (prefereEscuro) {
      document.documentElement.classList.add('dark')
      setEscuro(true)
    }
  }, [])

  const alternar = () => {
    const novo = !escuro
    setEscuro(novo)
    document.documentElement.classList.toggle('dark', novo)
    window.localStorage.setItem('panorama_tema', novo ? 'escuro' : 'claro')
  }

  return (
    <button
      onClick={alternar}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-panorama-gold-dark hover:border-panorama-gold transition-colors"
      title={escuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label={escuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      {escuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
