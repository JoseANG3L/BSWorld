import { Link } from 'react-router-dom';
import { Map, Gamepad2, Wrench, Boxes, Package, ArrowRight, Star, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const FeatureCard = ({ to, icon: Icon, title, desc, colorClass }) => {
    return (
        <Link 
            to={to}
            className="group relative p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
            {/* Fondo decorativo con gradiente suave al hover */}
            <div className={clsx(
            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
            colorClass
            )} />

            <div className="relative z-10 flex flex-col h-fit">
            <div className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md",
                "text-gray-700 dark:text-gray-200 group-hover:text-dark dark:group-hover:text-white",
                // Al hacer hover, el icono toma el color del gradiente
                `bg-gradient-to-br ${colorClass} text-white` 
            )}>
                <Icon size={24} strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {title}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">
                {desc}
            </p>
            </div>
        </Link>
    );
};

export default FeatureCard;