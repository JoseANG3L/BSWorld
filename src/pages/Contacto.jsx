import React, { useState } from 'react';
import { 
  Mail, MessageSquare, Send, MapPin, HelpCircle, CheckCircle, 
  ArrowRight, User, FileText, ChevronDown, Server, ExternalLink 
} from 'lucide-react';
import { clsx } from 'clsx';

// --- COMPONENTE: TARJETA DE CONTACTO RÁPIDO ---
const ContactOption = ({ icon: Icon, title, value, link, color, description }) => (
  <a 
    href={link}
    target="_blank"
    rel="noreferrer"
    className="group flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
  >
    <div className={clsx("p-3 rounded-xl text-white shadow-md transition-transform group-hover:scale-110 shrink-0", color)}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className={clsx("font-semibold text-sm transition-colors", isOpen ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-200 group-hover:text-primary-500")}>
          {question}
        </span>
        <ChevronDown size={18} className={clsx("text-gray-400 transition-transform duration-300", isOpen && "rotate-180 text-primary-500")} />
      </button>
      
      <div className={clsx("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-40 opacity-100 pb-4" : "max-h-0 opacity-0")}>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

// --- COMPONENTE: INPUT CON ICONO ---
const InputGroup = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors">
      <Icon size={20} />
    </div>
    <input 
      {...props}
      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white placeholder:text-gray-400"
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
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500 rounded-3xl overflow-hidden mb-4 md:mb-8 text-center p-4 md:p-6">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-2 md:mb-4 backdrop-blur-sm border border-white/10 shadow-inner">
             <Mail className="text-white" size={32} />
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight">
            Hablemos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Mods</span>
          </h1>
          <p className="text-md md:text-lg text-primary-100 leading-relaxed">
            ¿Tienes una idea brillante, encontraste un bug o simplemente quieres saludar? Estamos aquí para escucharte.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-10">
        
        {/* --- COLUMNA IZQUIERDA: FORMULARIO (7 cols) --- */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#1e1e1e] p-4 md:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 shadow-md relative overflow-hidden">
            
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
                    <div className="absolute left-4 top-3.5 text-gray-400">
                        <HelpCircle size={20} />
                    </div>
                    <select className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white cursor-pointer appearance-none">
                        <option>Soporte Técnico</option>
                        <option>Reportar un Bug</option>
                        <option>Subir mi Mod</option>
                        <option>Colaboración</option>
                        <option>Otro</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <MessageSquare size={20} />
                    </div>
                    <textarea 
                        rows="5" required 
                        placeholder="Cuéntanos los detalles..." 
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none dark:text-white placeholder:text-gray-400"
                    ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={clsx(
                    "py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/30",
                    formStatus === 'submitting' 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-primary-600 hover:bg-primary-700 hover:scale-[1.01] active:scale-[0.99]"
                  )}
                >
                  {formStatus === 'submitting' ? <Loader2 className="animate-spin" /> : <Send size={20} />}
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
          <div className="bg-white dark:bg-[#1e1e1e] p-4 md:p-6 rounded-3xl border border-gray-300 dark:border-gray-700 shadow-sm">
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
    </div>
  );
};

export default Contacto;