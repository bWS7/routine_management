import { useState } from 'react';
import { Lock, User, KeyRound } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PERFIL_LABELS } from '../utils/constants';
import { PerfilBadge } from '../components/ui/Badge';

export default function PerfilPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [saving, setSaving] = useState(false);

  const trocarSenha = async (e) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha) { toast('Preencha todos os campos', 'error'); return; }
    setSaving(true);
    const r = await apiFetch('/api/auth/trocar-senha', {
      method: 'POST',
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
    });
    if (r?.ok) {
      toast('Senha alterada com sucesso!', 'success');
      setSenhaAtual('');
      setNovaSenha('');
    } else {
      toast(r?.data?.erro || 'Erro ao alterar senha', 'error');
    }
    setSaving(false);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-xl space-y-6">
      {/* Profile card */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {currentUser.nome.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900">{currentUser.nome}</div>
              <div className="text-sm text-gray-500">{currentUser.email}</div>
              <div className="mt-1.5">
                <PerfilBadge perfil={currentUser.perfil} label={PERFIL_LABELS[currentUser.perfil] || currentUser.perfil} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <KeyRound size={16} className="text-gray-400" />
        </CardHeader>
        <CardBody>
          <form onSubmit={trocarSenha} className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Nova Senha"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" icon={Lock} loading={saving}>Salvar Nova Senha</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
