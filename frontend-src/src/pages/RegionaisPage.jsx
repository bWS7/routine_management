import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Map } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { fmtDate } from '../utils/constants';

function RegionalModal({ regional, onClose, onSaved }) {
  const { toast } = useToast();
  const [nome, setNome] = useState(regional?.nome || '');
  const [descricao, setDescricao] = useState(regional?.descricao || '');
  const [ativo, setAtivo] = useState(regional?.ativo !== false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nome) { toast('Informe o nome', 'error'); return; }
    setSaving(true);
    const payload = { nome, descricao };
    if (regional) payload.ativo = ativo;
    const method = regional ? 'PUT' : 'POST';
    const url = regional ? `/api/regionais/${regional.id}` : '/api/regionais/';
    const r = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (r?.ok) { toast(regional ? 'Regional atualizada!' : 'Regional criada!', 'success'); onSaved(); onClose(); }
    else toast(r?.data?.erro || 'Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={regional ? 'Editar Regional' : 'Nova Regional'}
      size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} loading={saving}>Salvar</Button>
      </>}
    >
      <div className="space-y-4">
        <Input label="Nome *" value={nome} onChange={e => setNome(e.target.value)} />
        <Textarea label="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
        {regional && (
          <Select label="Status" value={ativo ? 'true' : 'false'} onChange={e => setAtivo(e.target.value === 'true')}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </Select>
        )}
      </div>
    </Modal>
  );
}

export default function RegionaisPage() {
  const { toast } = useToast();
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/regionais/');
    if (r?.ok) setRegionais(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (r) => {
    const res = await apiFetch(`/api/regionais/${r.id}`, { method: 'PUT', body: JSON.stringify({ ativo: !r.ativo }) });
    if (res?.ok) { toast('Status alterado', 'success'); load(); }
  };

  const remove = async (r) => {
    if (!confirm('Deseja inativar esta regional?')) return;
    const res = await apiFetch(`/api/regionais/${r.id}`, { method: 'DELETE' });
    if (res?.ok) { toast('Regional inativada!', 'success'); load(); }
    else toast(res?.data?.erro || 'Erro', 'error');
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => setModal('new')}>Nova Regional</Button>
      </div>

      {loading ? <PageSpinner /> : (
        <Card>
          {regionais.length === 0 ? (
            <EmptyState icon={Map} title="Nenhuma regional cadastrada" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Descrição</Th>
                  <Th>Status</Th>
                  <Th>Criado em</Th>
                  <Th>Ações</Th>
                </tr>
              </Thead>
              <Tbody>
                {regionais.map(r => (
                  <Tr key={r.id}>
                    <Td className="font-semibold text-gray-800">{r.nome}</Td>
                    <Td className="text-gray-500 text-sm">{r.descricao || '—'}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${r.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </Td>
                    <Td className="text-gray-400 text-xs">{fmtDate(r.criado_em)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit size={15} /></button>
                        <button onClick={() => toggle(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-warning hover:bg-yellow-50 transition-colors"><RefreshCw size={15} /></button>
                        <button onClick={() => remove(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-error hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
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
        <RegionalModal
          regional={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
