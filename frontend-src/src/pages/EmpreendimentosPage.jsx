import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Building2 } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { fmtDate } from '../utils/constants';
import { invalidateEmpreendimentosCache } from '../components/shared/EmpreendimentoSelect';

function EmpreendimentoModal({ empreendimento, regionais, onClose, onSaved }) {
  const { toast } = useToast();
  const [nome, setNome] = useState(empreendimento?.nome || '');
  const [descricao, setDescricao] = useState(empreendimento?.descricao || '');
  const [regionalId, setRegionalId] = useState(empreendimento?.regional_id || '');
  const [ativo, setAtivo] = useState(empreendimento?.ativo !== false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nome) { toast('Informe o nome', 'error'); return; }
    setSaving(true);
    const payload = { nome, descricao, regional_id: regionalId ? Number(regionalId) : null };
    if (empreendimento) payload.ativo = ativo;
    const method = empreendimento ? 'PUT' : 'POST';
    const url = empreendimento ? `/api/empreendimentos/${empreendimento.id}` : '/api/empreendimentos/';
    const r = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (r?.ok) {
      invalidateEmpreendimentosCache();
      toast(empreendimento ? 'Empreendimento atualizado!' : 'Empreendimento criado!', 'success');
      onSaved(); onClose();
    } else toast(r?.data?.erro || 'Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={empreendimento ? 'Editar Empreendimento' : 'Novo Empreendimento'}
      size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} loading={saving}>Salvar</Button>
      </>}
    >
      <div className="space-y-4">
        <Input label="Nome *" value={nome} onChange={e => setNome(e.target.value)} />
        <Textarea label="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
        <Select label="Regional" value={regionalId} onChange={e => setRegionalId(e.target.value)}>
          <option value="">— Sem regional —</option>
          {regionais.map(rg => <option key={rg.id} value={rg.id}>{rg.nome}</option>)}
        </Select>
        {empreendimento && (
          <Select label="Status" value={ativo ? 'true' : 'false'} onChange={e => setAtivo(e.target.value === 'true')}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        )}
      </div>
    </Modal>
  );
}

export default function EmpreendimentosPage() {
  const { toast } = useToast();
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [e, rg] = await Promise.all([
      apiFetch('/api/empreendimentos/'),
      apiFetch('/api/regionais/?ativo=true'),
    ]);
    if (e?.ok) setEmpreendimentos(e.data);
    if (rg?.ok) setRegionais(rg.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (e) => {
    const res = await apiFetch(`/api/empreendimentos/${e.id}`, { method: 'PUT', body: JSON.stringify({ ativo: !e.ativo }) });
    if (res?.ok) { invalidateEmpreendimentosCache(); toast('Status alterado', 'success'); load(); }
  };

  const remove = async (e) => {
    if (!confirm('Deseja inativar este empreendimento?')) return;
    const res = await apiFetch(`/api/empreendimentos/${e.id}`, { method: 'DELETE' });
    if (res?.ok) { invalidateEmpreendimentosCache(); toast('Empreendimento inativado!', 'success'); load(); }
    else toast(res?.data?.erro || 'Erro', 'error');
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => setModal('new')}>Novo Empreendimento</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <Card>
          {empreendimentos.length === 0 ? (
            <EmptyState icon={Building2} title="Nenhum empreendimento cadastrado" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Regional</Th>
                  <Th>Descrição</Th>
                  <Th>Status</Th>
                  <Th>Criado em</Th>
                  <Th>Ações</Th>
                </tr>
              </Thead>
              <Tbody>
                {empreendimentos.map(e => (
                  <Tr key={e.id}>
                    <Td className="font-semibold text-gray-800">{e.nome}</Td>
                    <Td className="text-gray-500 text-sm">{e.regional_nome || '—'}</Td>
                    <Td className="text-gray-500 text-sm">{e.descricao || '—'}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${e.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {e.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </Td>
                    <Td className="text-gray-400 text-xs">{fmtDate(e.criado_em)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit size={15} /></button>
                        <button onClick={() => toggle(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-warning hover:bg-yellow-50 transition-colors"><RefreshCw size={15} /></button>
                        <button onClick={() => remove(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-error hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
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
        <EmpreendimentoModal
          empreendimento={modal === 'new' ? null : modal}
          regionais={regionais}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
