import React, { useState } from 'react';
import { Mail, MessageSquare, Send, MapPin, HelpCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

const ContactItem = ({ icon: Icon, title, value, link, colorClass }) => (
  <a 
    href={link}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group"
  >
    <div className={clsx("p-3 rounded-xl text-white transition-transform duration-300 group-hover:scale-110", colorClass)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {value}
      </p>
    </div>
    <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-gray-400">
      <ArrowRight size={18} />
    </div>
  </a>
);

const FAQItem = ({ question, answer }) => (
  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2 flex gap-2">
      <HelpCircle size={16} className="text-primary-500 mt-0.5 shrink-0" />
      {question}
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 ml-6 leading-relaxed">
      {answer}
    </p>
  </div>
);

const Contacto = () => {
  const [formStatus, setFormStatus] = useState('idle'); // 'idle', 'submitting', 'success'

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    // Simular envío
    setTimeout(() => setFormStatus('success'), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="text-primary-600" size={32} />
            Contacto & Soporte
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            ¿Tienes dudas, encontraste un bug o quieres subir tu mapa?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 h-full relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {formStatus === 'success' ? (
              // MENSAJE DE ÉXITO
              <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-fade-in-up">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Mensaje Enviado!</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                  Gracias por contactarnos. Nuestro equipo de cubos revisará tu mensaje y te responderá pronto.
                </p>
                <button 
                  onClick={() => setFormStatus('idle')}
                  className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              // FORMULARIO REAL
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Envíanos un mensaje</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Tu nombre (o nick de MC)" 
                      className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="correo@ejemplo.com" 
                      className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Asunto</label>
                  <select className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white cursor-pointer">
                    <option>Soporte Técnico</option>
                    <option>Reportar un Bug</option>
                    <option>Subir mi Mapa/Mod</option>
                    <option>Colaboración</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mensaje</label>
                  <textarea 
                    rows="5"
                    required
                    placeholder="Describe tu consulta con detalle..." 
                    className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none dark:text-white"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={clsx(
                    "mt-2 py-3.5 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/30",
                    formStatus === 'submitting' 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-primary-600 hover:bg-primary-700 hover:scale-[1.01] active:scale-[0.99]"
                  )}
                >
                  {formStatus === 'submitting' ? (
                    'Enviando...'
                  ) : (
                    <>
                      Enviar Mensaje <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: INFO Y FAQ --- */}
        <div className="flex flex-col gap-6">
          
          {/* Tarjetas de Contacto Directo */}
          <div className="flex flex-col gap-4">
            <ContactItem 
              icon={MessageSquare} 
              title="Discord Comunity" 
              value="Unirse al Servidor" 
              link="#"
              colorClass="bg-[#5865F2]" // Color oficial Discord
            />
            <ContactItem 
              icon={Mail} 
              title="Email Directo" 
              value="hola@bsworld.com" 
              link="mailto:hola@bsworld.com"
              colorClass="bg-gradient-to-br from-pink-500 to-rose-500"
            />
          </div>

          {/* Sección FAQ */}
          <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
              Preguntas Frecuentes
            </h3>
            
            <FAQItem 
              question="¿Cómo subo mi mapa?"
              answer="Envíanos un correo con el link de descarga (Mediafire/Drive) y capturas de pantalla."
            />
            <FAQItem 
              question="¿Los mods tienen virus?"
              answer="No. Revisamos cada archivo manualmente antes de publicarlo en la plataforma."
            />
            <FAQItem 
              question="¿Es gratis?"
              answer="Sí, BSWorld es y siempre será 100% gratuito para la comunidad."
            />
          </div>

          {/* Ubicación (Decorativo) */}
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 flex items-center gap-3">
            <MapPin size={20} className="text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-primary-900 dark:text-primary-200">
              Servidores en Ciudad Cubo, Mundo Overworld.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contacto;