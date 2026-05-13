import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Users } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { StatusBadge, PerfilBadge } from '../components/ui/Badge';
import { PERFIL_LABELS } from '../utils/constants';

const STATUS_USUARIO_COLORS = {
  ativo:     'bg-green-50 text-green-700',
  inativo:   'bg-gray-100 text-gray-600',
  bloqueado: 'bg-red-50 text-red-700',
};

function UsuarioModal({ usuario, regionais, usuarios, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    perfil: usuario?.perfil || 'gv',
    regional_id: usuario?.regional_id || '',
    supervisor_id: usuario?.supervisor_id || '',
    status: usuario?.status || 'ativo',
    senha: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.nome || !form.email) { toast('Preencha nome e email', 'error'); return; }
    setSaving(true);
    const payload = { ...form };
    if (!payload.senha) delete payload.senha;
    if (!payload.regional_id) payload.regional_id = null;
    if (!payload.supervisor_id) payload.supervisor_id = null;

    const method = usuario ? 'PUT' : 'POST';
    const url = usuario ? `/api/usuarios/${usuario.id}` : '/api/usuarios/';
    const r = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (r?.ok) { toast(usuario ? 'Usuário atualizado!' : 'Usuário criado!', 'success'); onSaved(); onClose(); }
    else toast(r?.data?.erro || 'Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={usuario ? 'Editar Usuário' : 'Novo Usuário'}
      size="md"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} loading={saving}>Salvar</Button>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome Completo *" value={form.nome} onChange={e => set('nome', e.target.value)} />
          <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Select label="Perfil *" value={form.perfil} onChange={e => set('perfil', e.target.value)}>
            {Object.entries(PERFIL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select label="Regional" value={form.regional_id} onChange={e => set('regional_id', e.target.value)}>
            <option value="">Nenhuma</option>
            {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </Select>
          <Select label="Supervisor" value={form.supervisor_id} onChange={e => set('supervisor_id', e.target.value)}>
            <option value="">Nenhum</option>
            {usuarios.filter(u => u.id !== usuario?.id).map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </Select>
        </div>
        {!usuario && (
          <Input label="Senha Inicial" type="password" placeholder="Padrão: 123456"
            value={form.senha} onChange={e => set('senha', e.target.value)} />
        )}
      </div>
    </Modal>
  );
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilFilter, setPerfilFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | usuario object
  const [regMap, setRegMap] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    let url = '/api/usuarios/?';
    if (perfilFilter) url += `perfil=${perfilFilter}&`;
    if (statusFilter) url += `status=${statusFilter}`;
    const [ur, rr] = await Promise.all([apiFetch(url), apiFetch('/api/regionais/')]);
    if (ur?.ok) setUsuarios(ur.data);
    if (rr?.ok) {
      setRegionais(rr.data);
      setRegMap(Object.fromEntries(rr.data.map(r => [r.id, r.nome])));
    }
    setLoading(false);
  }, [perfilFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (u) => {
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    const r = await apiFetch(`/api/usuarios/${u.id}`, { method: 'PUT', body: JSON.stringify({ status: novoStatus }) });
    if (r?.ok) { toast(`Status alterado para ${novoStatus}`, 'success'); load(); }
    else toast('Erro ao alterar status', 'error');
  };

  const deleteUser = async (u) => {
    if (!confirm('Deseja inativar este usuário?')) return;
    const r = await apiFetch(`/api/usuarios/${u.id}`, { method: 'DELETE' });
    if (r?.ok) { toast('Usuário inativado!', 'success'); load(); }
    else toast(r?.data?.erro || 'Erro', 'error');
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={perfilFilter} onChange={e => setPerfilFilter(e.target.value)} className="w-44">
          <option value="">Todos os Perfis</option>
          {Object.entries(PERFIL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="bloqueado">Bloqueado</option>
        </Select>
        <Button icon={Plus} onClick={() => setModal('new')} className="ml-auto">Novo Usuário</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <Card>
          {usuarios.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum usuário encontrado" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Perfil</Th>
                  <Th>Regional</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </Thead>
              <Tbody>
                {usuarios.map(u => (
                  <Tr key={u.id}>
                    <Td className="font-semibold text-gray-800">{u.nome}</Td>
                    <Td className="text-gray-500 text-xs">{u.email}</Td>
                    <Td><PerfilBadge perfil={u.perfil} label={PERFIL_LABELS[u.perfil] || u.perfil} /></Td>
                    <Td className="text-gray-500 text-sm">{regMap[u.regional_id] || '—'}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_USUARIO_COLORS[u.status] || 'bg-gray-100 text-gray-600'}`}>
                        {u.status}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => toggleStatus(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-warning hover:bg-yellow-50 transition-colors" title="Alterar status">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => deleteUser(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-error hover:bg-red-50 transition-colors" title="Inativar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {modal && (
        <UsuarioModal
          usuario={modal === 'new' ? null : modal}
          regionais={regionais}
          usuarios={usuarios}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
