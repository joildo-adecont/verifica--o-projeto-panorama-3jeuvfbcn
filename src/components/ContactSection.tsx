import { useState } from 'react'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitInquiry } from '@/services/panorama'

export function ContactSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Basic Validation
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.')
      return
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMessage('Por favor, informe um número de telefone com DDD.')
      return
    }

    try {
      setLoading(true)
      await submitInquiry({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        message: message.trim() || 'Interesse geral no empreendimento Projeto Panorama',
      })
      setSuccess(true)
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setErrorMessage(
        'Não foi possível enviar sua mensagem no momento. Por favor, tente novamente ou contate-nos via WhatsApp.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="contato"
      className="relative py-24 sm:py-32 bg-[#060D1A] text-[#F9F8F5] overflow-hidden"
    >
      {/* Decorative Golden Aura */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Context, Value Proposition & Contact Details */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
                <Send className="w-4 h-4" />
                Atendimento Exclusivo
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] leading-tight mb-4">
                Agende uma Visita Privativa ao Decorado
              </h2>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                Nossos consultores patrimoniais estão à disposição para apresentar todos os detalhes
                do projeto com total discrição e atendimento personalizado.
              </p>
            </div>

            {/* Contact cards */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0B1528] border border-[#162238]">
                <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[#C5A059] font-medium">
                    Central de Vendas
                  </h4>
                  <p className="text-base font-bold text-white mt-0.5">(11) 4003-8822</p>
                  <p className="text-xs text-stone-300">Atendimento diário das 09h às 20h</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0B1528] border border-[#162238]">
                <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[#C5A059] font-medium">
                    E-mail Corporativo
                  </h4>
                  <p className="text-base font-bold text-white mt-0.5">
                    contato@projetopanorama.com.br
                  </p>
                  <p className="text-xs text-stone-300">Retorno garantido em até 2 horas úteis</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0B1528] border border-[#162238]">
                <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[#C5A059] font-medium">
                    Espaço Panorama & Plantão
                  </h4>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    Alameda dos Ipês Nobres, 1200 — Jardins, SP
                  </p>
                  <p className="text-xs text-stone-300">
                    Estacionamento privativo com manobrista no local
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <ShieldCheck className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>Garantia de confidencialidade e proteção de dados (LGPD).</span>
            </div>
          </div>

          {/* Right Column: High Standard Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#0B1528] border border-[#C5A059]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
              {/* Golden corner accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]/60 pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#C5A059]/60 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#C5A059]/60 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#C5A059]/60 pointer-events-none" />

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                Solicite uma Consulta Exclusiva
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm mb-6">
                Preencha os campos abaixo para receber a tabela de valores, caderno de plantas e
                agendar sua experiência.
              </p>

              {success ? (
                <div className="p-8 rounded-2xl bg-[#162238]/80 border border-[#C5A059] text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#C5A059]/20 text-[#C5A059] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-white">
                    Recebemos sua mensagem!
                  </h4>
                  <p className="text-stone-300 text-sm max-w-md mx-auto leading-relaxed">
                    Agradecemos o seu interesse no{' '}
                    <strong className="text-white">Projeto Panorama</strong>. Nosso especialista
                    entrará em contato em breve através do telefone e e-mail informados.
                  </p>
                  <Button
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0B1528] text-xs uppercase tracking-widest mt-4"
                  >
                    Enviar Outra Mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs sm:text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                      Nome Completo *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#162238]/60 border-[#162238] focus:border-[#C5A059] text-white placeholder:text-stone-400 rounded-xl py-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                        E-mail *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="carlos@exemplo.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#162238]/60 border-[#162238] focus:border-[#C5A059] text-white placeholder:text-stone-400 rounded-xl py-3"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                        Telefone com DDD *
                      </label>
                      <Input
                        type="tel"
                        required
                        placeholder="(11) 99876-5432"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-[#162238]/60 border-[#162238] focus:border-[#C5A059] text-white placeholder:text-stone-400 rounded-xl py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                      Mensagem ou Preferência de Horário (Opcional)
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Gostaria de saber mais sobre a planta Duplex e agendar uma visita para este sábado..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-[#162238]/60 border-[#162238] focus:border-[#C5A059] text-white placeholder:text-stone-400 rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C5A059] hover:bg-[#DFBE7C] text-[#0B1528] font-bold text-xs uppercase tracking-widest py-6 rounded-full shadow-xl transition-all duration-300 hover:scale-[1.01] mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando Informações...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Solicitar Atendimento Exclusivo</span>
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-stone-300 text-center mt-3">
                    Ao enviar, você concorda em receber contato por telefone, WhatsApp e e-mail
                    sobre este empreendimento.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
