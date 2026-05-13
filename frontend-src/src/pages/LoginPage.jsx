import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart2, ClipboardCheck, Users, AlertCircle, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const FEATURES = [
  { icon: BarChart2,     text: 'Dashboard de execução em tempo real' },
  { icon: ClipboardCheck, text: 'Rotinas semanais, quinzenais e mensais' },
  { icon: Users,         text: 'Acompanhamento hierárquico por regional' },
  { icon: AlertCircle,   text: 'Gestão de pendências e planos de ação' },
  { icon: TrendingUp,    text: 'Ranking de aderência por perfil' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, senha);
    setLoading(false);
    if (result !== true) setError(result);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">GC Comercial</div>
            <div className="text-gray-400 text-xs">Gestão de Rotinas Operacionais</div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-tight mb-3">
            Gerencie suas rotinas<br />
            <span className="text-primary-400">com eficiência</span>
          </h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed">
            Plataforma integrada para controle de atividades operacionais,<br />
            acompanhamento de metas e gestão de equipes comerciais.
          </p>
          <div className="space-y-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-primary-400" />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-gray-600 text-xs">
          © 2025 GC Comercial · Construtora Sousa Araújo
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <div className="font-bold text-gray-900">GC Comercial</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="text-gray-500 text-sm mt-1">Faça login para acessar o sistema</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com.br"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
                           transition-all duration-150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 text-sm border border-gray-200 rounded-xl bg-white text-gray-900
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
                             transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Acesso restrito a usuários autorizados.
            Em caso de dúvidas, contate o administrador.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
