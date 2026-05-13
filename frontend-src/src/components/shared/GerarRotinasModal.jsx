import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Input';
import Button from '../ui/Button';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { RefreshCw, Users, Calendar } from 'lucide-react';

export default function GerarRotinasModal({ open, onClose, onGenerated }) {
  const { toast } = useToast();
  const [periodicidade, setPeriodicidade] = useState('todas');
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      apiFetch('/api/usuarios/?status=ativo')
        .then(r => {
          if (r?.ok) setUsuarios(r.data);
        })
        .finally(() => setLoadingUsers(false));
    }
  }, [open]);

  const handleGerar = async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/gerar', {
      method: 'POST',
      body: JSON.stringify({
        periodicidade,
        usuario_ids: selectedUsers.length > 0 ? selectedUsers : null
      })
    });

    if (r?.ok) {
      toast(`${r.data.total} rotinas geradas!`, 'success');
      onGenerated?.();
      onClose();
    } else {
      toast(r?.data?.erro || 'Erro ao gerar rotinas', 'error');
    }
    setLoading(false);
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar Novas Rotinas"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button icon={RefreshCw} onClick={handleGerar} loading={loading}>
            Gerar Agora
          </Button>
        </>
      )}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar size={16} className="text-primary-500" />
            Periodicidade
          </label>
          <Select value={periodicidade} onChange={e => setPeriodicidade(e.target.value)}>
            <option value="todas">Todas as Atividades Ativas</option>
            <option value="semanal">Apenas Semanais</option>
            <option value="quinzenal">Apenas Quinzenais</option>
            <option value="mensal">Apenas Mensais</option>
          </Select>
          <p className="text-xs text-gray-400">
            O sistema criará as rotinas para o período atual com base no catálogo de atividades.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-primary-500" />
            Selecionar Usuários
          </label>
          
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="max-h-48 overflow-y-auto bg-gray-50/50 p-2 space-y-1">
              <button
                onClick={() => setSelectedUsers([])}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedUsers.length === 0 ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-white'}`}
              >
                Todos os Usuários Ativos
              </button>
              {usuarios.map(u => (
                <div 
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedUsers.includes(u.id) ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-white'}`}
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUsers.includes(u.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {selectedUsers.includes(u.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="flex-1 truncate">{u.nome}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{u.perfil}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {selectedUsers.length > 0 ? `${selectedUsers.length} usuários selecionados.` : 'Nenhum usuário selecionado (gera para todos).'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
