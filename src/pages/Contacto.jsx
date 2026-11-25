import React, { useState } from 'react';
import {
  Mail, MessageSquare, Send, HelpCircle, CheckCircle,
  User, ChevronDown, ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import InfoPage, { InfoBack, InfoHero } from '../components/InfoPage';
import LoadingSpinner from '../components/LoadingSpinner';

// --- COMPONENTE: TARJETA DE CONTACTO RÁPIDO ---
const ContactOption = ({ icon: Icon, title, value, link, color, description }) => (
  <a 
    href={link}
    target="_blank"
    rel="noreferrer"
    className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6 hover:border-primary-400 dark:hover:bg-white/10"
  >
    <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white", color)}>
      {React.createElement(Icon, { size: 24, "aria-hidden": true })}
    </div>
    <div className="min-w-0 flex-1 break-words">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        {title}
        <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      </h3>
      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  </a>
);

// --- COMPONENTE: FAQ ACORDEÓN ---
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-300 dark:border-gray-700 last:border-0">
      <button 
        type="button" aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className={clsx("font-semibold text-sm transition-colors", isOpen ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-200 group-hover:text-primary-500")}>
          {question}
        </span>
        <ChevronDown size={18} className={clsx("text-gray-400 transition-transform duration-300", isOpen && "rotate-180 text-primary-500")} />
      </button>
      
      {isOpen && (
        <p className="pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {answer}
        </p>
      )}
    </div>
  );
};

// --- COMPONENTE: INPUT CON ICONO ---
const InputGroup = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="pointer-events-none absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors">
      {React.createElement(Icon, { size: 20, "aria-hidden": true })}
    </div>
    <input 
      {...props}
      className="search-field w-full bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:bg-dark-bg dark:text-white placeholder:text-gray-400"
    />
  </div>
);

const Contacto = () => {
  const [formStatus, setFormStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    setTimeout(() => setFormStatus('success'), 2000);
  };

  return (
    <InfoPage wide>
      <InfoBack />
      <InfoHero icon={Mail} title="Hablemos de Mods"
        desc="¿Tienes una idea brillante, encontraste un bug o simplemente quieres saludar? Estamos aquí para escucharte." />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6">
        
        {/* --- COLUMNA IZQUIERDA: FORMULARIO (7 cols) --- */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6">
            
            {formStatus === 'success' ? (
              <div className="h-96 flex flex-col items-center justify-center text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Mensaje Enviado!</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                  Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderá en menos de 24 horas.
                </p>
                <button 
                  onClick={() => setFormStatus('idle')}
                  className="px-8 py-3 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-6 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Envíanos un mensaje
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Completa el formulario y te responderemos pronto.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                  <InputGroup icon={User} type="text" required placeholder="Tu Nombre" />
                  <InputGroup icon={Mail} type="email" required placeholder="tu@email.com" />
                </div>

                <div className="relative group">
                    <div className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                        <HelpCircle size={20} />
                    </div>
                    <select aria-label="Motivo de contacto" className="search-field w-full cursor-pointer appearance-none bg-gray-50 px-10 py-2.5 text-sm text-gray-900 dark:bg-dark-bg dark:text-white">
                        <option>Soporte Técnico</option>
                        <option>Reportar un Bug</option>
                        <option>Subir mi Mod</option>
                        <option>Colaboración</option>
                        <option>Otro</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>

                <div className="relative group">
                    <div className="pointer-events-none absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <MessageSquare size={20} />
                    </div>
                    <textarea 
                        rows="5" required 
                        placeholder="Cuéntanos los detalles..." 
                        className="search-field w-full bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:bg-dark-bg resize-y dark:text-white placeholder:text-gray-400"
                    ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={clsx(
                    "min-h-10 rounded-xl px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors sm:self-start",
                    formStatus === 'submitting' 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-primary-600 hover:bg-primary-700"
                  )}
                >
                  {formStatus === 'submitting' ? <LoadingSpinner variant="inline" size={20} /> : <Send size={20} />}
                  {formStatus === 'submitting' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: INFO & FAQ (5 cols) --- */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
          
          {/* Tarjetas de Contacto */}
          <div className="flex flex-col gap-4">
            <ContactOption 
              icon={MessageSquare} 
              title="Discord" 
              value="Unirse a la Comunidad" 
              description="Chat en vivo, soporte rápido y eventos comunitarios."
              link="https://discord.com/invite/uvzub83GcP"
              color="bg-[#5865F2]"
            />
            <ContactOption 
              icon={Mail} 
              title="Correo Electrónico" 
              value="bsworld.info1@gmail.com" 
              description="Para temas de negocios, copyright o consultas formales."
              link="mailto:bsworld.info1@gmail.com"
              color="bg-gradient-to-br from-pink-500 to-rose-500"
            />
          </div>

          {/* FAQ Accordion */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="text-primary-500" size={20} />
              Preguntas Frecuentes
            </h3>
            
            <div className="flex flex-col">
                <FAQItem 
                  question="¿Cómo subo mis mods?"
                  answer="Actualmente la subida es por revisión manual. Envíanos un correo o ticket en Discord con el link de descarga (Mediafire/Drive) y capturas."
                />
                <FAQItem 
                  question="¿Los mods tienen virus?"
                  answer="Absolutamente no. Revisamos y escaneamos cada archivo manualmente antes de publicarlo en la plataforma para garantizar tu seguridad."
                />
                <FAQItem 
                  question="¿Es gratis?"
                  answer="Sí, BSWorld es un proyecto comunitario y siempre será 100% gratuito para descargar y compartir contenido."
                />
                {/* <FAQItem 
                  question="¿Puedo ser moderador?"
                  answer="Abrimos convocatorias cada cierto tiempo en nuestro Discord. ¡Mantente atento a los anuncios!"
                /> */}
            </div>
          </div>

        </div>
      </div>
    </InfoPage>
  );
};

export default Contacto;
