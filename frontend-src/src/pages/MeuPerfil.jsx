import { useState, useRef } from 'react';
import { Camera, User, Mail, Shield, Check, Lock, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PERFIL_LABELS } from '../utils/constants';

export default function MeuPerfil() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Password state
  const [passwordData, setPasswordData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });
  const [loadingSenha, setLoadingSenha] = useState(false);

  if (!currentUser) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast('Imagem muito grande (máx 2MB)', 'error');
        return;
      }
      setPreview(URL.createObjectURL(file));
      uploadFoto(file);
    }
  };

  const uploadFoto = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('foto', file);

    const r = await apiFetch('/api/usuarios/perfil/foto', {
      method: 'POST',
      body: formData
    });

    if (r?.ok) {
      toast('Foto atualizada com sucesso!', 'success');
      updateCurrentUser({ ...currentUser, foto_url: r.data.foto_url });
    } else {
      toast(r?.data?.erro || 'Erro ao carregar foto', 'error');
      setPreview(null);
    }
    setUploading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.nova_senha !== passwordData.confirmar_senha) {
      toast('As novas senhas não coincidem', 'error');
      return;
    }
    if (passwordData.nova_senha.length < 6) {
      toast('A nova senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setLoadingSenha(true);
    const r = await apiFetch('/api/usuarios/perfil/senha', {
      method: 'POST',
      body: JSON.stringify({
        senha_atual: passwordData.senha_atual,
        nova_senha: passwordData.nova_senha
      })
    });

    if (r?.ok) {
      toast('Senha alterada com sucesso!', 'success');
      setPasswordData({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
    } else {
      toast(r?.data?.erro || 'Erro ao alterar senha', 'error');
    }
    setLoadingSenha(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500">Gerencie suas informações pessoais e segurança.</p>
      </header>

      <Card className="p-8">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Upload Area */}
          <div className="relative group">
            <Avatar 
              src={preview || currentUser.foto_url} 
              name={currentUser.nome} 
              size="xl" 
              className="ring-4 ring-white shadow-xl"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-xl shadow-lg 
                         hover:bg-primary-700 transition-all transform hover:scale-110 active:scale-95"
              disabled={uploading}
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{currentUser.nome}</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield size={12} />
              {PERFIL_LABELS[currentUser.perfil] || currentUser.perfil}
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-4 mt-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                <Mail size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">E-mail Corporativo</div>
                <div className="text-sm text-gray-700 font-medium truncate">{currentUser.email}</div>
              </div>
              <div className="text-success">
                <Check size={18} />
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nome de Exibição</div>
                <div className="text-sm text-gray-700 font-medium truncate">{currentUser.nome}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Alterar Senha Section */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Segurança da Conta</h3>
            <p className="text-sm text-gray-500">Mantenha sua senha atualizada para proteger seu acesso.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Senha Atual</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Key size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Sua senha atual"
                  value={passwordData.senha_atual}
                  onChange={(e) => setPasswordData({ ...passwordData, senha_atual: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={passwordData.nova_senha}
                  onChange={(e) => setPasswordData({ ...passwordData, nova_senha: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={passwordData.confirmar_senha}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmar_senha: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              loading={loadingSenha}
              icon={Save}
              className="w-full sm:w-auto"
            >
              Salvar Nova Senha
            </Button>
          </div>
        </form>
      </Card>
      
      <div className="flex justify-center text-xs text-gray-400">
        As alterações cadastrais devem ser solicitadas ao administrador do sistema.
      </div>
    </div>
  );
}
