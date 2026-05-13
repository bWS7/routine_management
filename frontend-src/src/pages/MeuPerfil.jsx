import { useState, useRef } from 'react';
import { Camera, User, Mail, Shield, Check } from 'lucide-react';
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500">Gerencie suas informações pessoais e foto de perfil.</p>
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
      
      <div className="flex justify-center text-xs text-gray-400">
        As alterações cadastrais devem ser solicitadas ao administrador do sistema.
      </div>
    </div>
  );
}
