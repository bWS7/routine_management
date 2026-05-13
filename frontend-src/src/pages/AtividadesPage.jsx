import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Download, BookOpen, Check, X } from 'lucide-react';
import { apiFetch, downloadCsvFromRows } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { PeriodoBadge, PerfilBadge } from '../components/ui/Badge';
import { PERFIL_LABELS, PERIODO_LABELS } from '../utils/constants';

function AtividadeModal({ atividade, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: atividade?.nome || '',
    descricao: atividade?.descricao || '',
    perfil: atividade?.perfil || 'gv',
    periodicidade: atividade?.periodicidade || 'semanal',
    obrigatoria: atividade?.obrigatoria !== false,
    ordem: atividade?.ordem || 0,
    tipo_evidencia: atividade?.tipo_evidencia || '',
    indicador: atividade?.indicador || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.nome) { toast('Informe o nome', 'error'); return; }
    setSaving(true);
    const method = atividade ? 'PUT' : 'POST';
    const url = atividade ? `/api/atividades/${atividade.id}` : '/api/atividades/';
    const r = await apiFetch(url, { method, body: JSON.stringify({ ...form, ordem: Number(form.ordem) }) });
    if (r?.ok) { toast(atividade ? 'Atividade atualizada!' : 'Atividade criada!', 'success'); onSaved(); onClose(); }
    else toast(r?.data?.erro || 'Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={atividade ? 'Editar Atividade' : 'Nova Atividade'}
      size="md"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} loading={saving}>Salvar</Button>
      </>}
    >
      <div className="space-y-4">
        <Input label="Nome *" value={form.nome} onChange={e => set('nome', e.target.value)} />
        <Textarea label="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Perfil *" value={form.perfil} onChange={e => set('perfil', e.target.value)}>
            {['sr', 'gv', 'cd', 'sp'].map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
          </Select>
          <Select label="Periodicidade *" value={form.periodicidade} onChange={e => set('periodicidade', e.target.value)}>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
          </Select>
          <Select label="Obrigatória" value={form.obrigatoria ? 'true' : 'false'} onChange={e => set('obrigatoria', e.target.value === 'true')}>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </Select>
          <Input label="Ordem" type="number" value={form.ordem} onChange={e => set('ordem', e.target.value)} />
        </div>
        <Input label="Tipo de Evidência" value={form.tipo_evidencia} onChange={e => set('tipo_evidencia', e.target.value)}
          placeholder="Ex: Print do painel, Ata de reunião..." />
        <Input label="Indicador Relacionado" value={form.indicador} onChange={e => set('indicador', e.target.value)} />
      </div>
    </Modal>
  );
}

export default function AtividadesPage() {
  const { toast } = useToast();
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilFilter, setPerfilFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let url = '/api/atividades/?ativo=true';
    if (perfilFilter) url += `&perfil=${perfilFilter}`;
    if (periodoFilter) url += `&periodicidade=${periodoFilter}`;
    const r = await apiFetch(url);
    if (r?.ok) setAtividades(r.data);
    setLoading(false);
  }, [perfilFilter, periodoFilter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (a) => {
    if (!confirm('Deseja inativar esta atividade?')) return;
    const r = await apiFetch(`/api/atividades/${a.id}`, { method: 'DELETE' });
    if (r?.ok) { toast('Atividade inativada!', 'success'); load(); }
    else toast(r?.data?.erro || 'Erro', 'error');
  };

  const exportar = async () => {
    let url = '/api/atividades/?ativo=true';
    if (perfilFilter) url += `&perfil=${perfilFilter}`;
    if (periodoFilter) url += `&periodicidade=${periodoFilter}`;
    const r = await apiFetch(url);
    if (!r?.ok) { toast('Erro ao exportar', 'error'); return; }
    const rows = r.data.map(a => [a.ordem, a.nome, PERFIL_LABELS[a.perfil] || a.perfil,
      PERIODO_LABELS[a.periodicidade] || a.periodicidade, a.obrigatoria ? 'Sim' : 'Não', a.tipo_evidencia || '', a.indicador || '']);
    downloadCsvFromRows('catalogo_atividades.csv', ['Ordem', 'Nome', 'Perfil', 'Periodicidade', 'Obrigatória', 'Tipo Evidência', 'Indicador'], rows);
  };

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        O catálogo central define todas as atividades pré-determinadas por cargo. As rotinas são geradas automaticamente a partir deste catálogo.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={perfilFilter} onChange={e => setPerfilFilter(e.target.value)} className="w-44">
          <option value="">Todos os Perfis</option>
          {['sr', 'gv', 'cd', 'sp'].map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
        </Select>
        <Select value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)} className="w-36">
          <option value="">Todas</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportar}>Exportar CSV</Button>
          <Button icon={Plus} onClick={() => setModal('new')}>Nova Atividade</Button>
        </div>
      </div>

      {loading ? <PageSpinner /> : (
        <Card>
          {atividades.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nenhuma atividade encontrada" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>#</Th>
                  <Th>Nome</Th>
                  <Th>Perfil</Th>
                  <Th>Periodicidade</Th>
                  <Th>Obrigatória</Th>
                  <Th>Evidência</Th>
                  <Th>Ações</Th>
                </tr>
              </Thead>
              <Tbody>
                {atividades.map(a => (
                  <Tr key={a.id}>
                    <Td className="text-gray-400 text-xs font-mono">{a.ordem}</Td>
                    <Td>
                      <div className="font-medium text-gray-800">{a.nome}</div>
                      {a.descricao && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.descricao}</div>}
                    </Td>
                    <Td><PerfilBadge perfil={a.perfil} label={PERFIL_LABELS[a.perfil] || a.perfil} /></Td>
                    <Td><PeriodoBadge periodo={a.periodicidade} label={PERIODO_LABELS[a.periodicidade]} /></Td>
                    <Td>
                      {a.obrigatoria
                        ? <Check size={15} className="text-success" />
                        : <X size={15} className="text-gray-300" />}
                    </Td>
                    <Td className="text-xs text-gray-500">{a.tipo_evidencia || '—'}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit size={15} /></button>
                        <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-error hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
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
        <AtividadeModal
          atividade={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
