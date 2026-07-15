import { useState, useEffect, useCallback } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, RefreshCw, Download, Trophy, Users } from 'lucide-react';
import { apiFetch, downloadExport } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar } from '../components/ui/StatCard';
import { Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Spinner';
import { PERFIL_LABELS, PERFIL_COLORS, fmtDate } from '../utils/constants';
import GerarRotinasModal from '../components/shared/GerarRotinasModal';

function PorPerfil({ por_perfil }) {
  if (!por_perfil || !Object.keys(por_perfil).length)
    return <p className="text-sm text-gray-400 text-center py-6">Sem dados no período</p>;

  return (
    <div className="space-y-4">
      {Object.entries(por_perfil).map(([perfil, info]) => {
        const pct = info.percentual;
        const barColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
        return (
          <div key={perfil}>
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PERFIL_COLORS[perfil] || 'bg-gray-100 text-gray-600'}`}>
                {PERFIL_LABELS[perfil] || perfil}
              </span>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{pct}%</span>
                <span className="text-xs text-gray-400 ml-2">{info.concluidas}/{info.total}</span>
              </div>
            </div>
            <ProgressBar value={pct} color={barColor} />
          </div>
        );
      })}
    </div>
  );
}

const PERIODO_CARD_LABELS = { quinzenal: 'Quinzenais', mensal: 'Mensais' };

function PeriodoCard({ titulo, subtitulo, stats }) {
  const pct = stats?.percentual_execucao ?? 0;
  const barColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
  const pctColor = pct >= 80 ? 'text-success-dark' : pct >= 50 ? 'text-warning-dark' : 'text-error-dark';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{titulo}</span>
        <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
      </div>
      {subtitulo && <p className="text-[11px] text-gray-400 mb-2">{subtitulo}</p>}
      <ProgressBar value={pct} color={barColor} />
      <p className="text-xs text-gray-400 mt-1.5">{stats?.concluidas ?? 0} de {stats?.total ?? 0} atividades</p>
    </div>
  );
}

function AderenciaTime({ semanas, quinzenal, mensal }) {
  if (!semanas?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aderência da Equipe por Período</CardTitle>
        <BarChart2 size={16} className="text-gray-400" />
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {semanas.map(s => (
            <PeriodoCard key={s.numero} titulo={`Semana ${s.numero}`}
              subtitulo={`${fmtDate(s.periodo_inicio)} - ${fmtDate(s.periodo_fim)}`} stats={s} />
          ))}
          <PeriodoCard titulo={PERIODO_CARD_LABELS.quinzenal} stats={quinzenal} />
          <PeriodoCard titulo={PERIODO_CARD_LABELS.mensal} stats={mensal} />
        </div>
      </CardBody>
    </Card>
  );
}

const MEDAL_STYLES = [
  'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-300',
  'bg-gray-300 text-gray-700 ring-2 ring-gray-200',
  'bg-amber-600 text-white ring-2 ring-amber-500',
];

function Ranking({ ranking }) {
  if (!ranking?.length)
    return <p className="text-sm text-gray-400 text-center py-6">Sem dados no período</p>;

  return (
    <div className="space-y-2">
      {ranking.slice(0, 10).map((r, i) => {
        const pct = r.percentual;
        const barColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
        return (
          <div key={r.id || i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${MEDAL_STYLES[i] || 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{r.nome}</div>
              <div className="text-xs text-gray-400 truncate">{r.regional} · {r.concluidas}/{r.total} concluídas</div>
              <ProgressBar value={pct} color={barColor} className="mt-1" />
            </div>
            <div className={`text-sm font-bold shrink-0 ${pct >= 80 ? 'text-success-dark' : pct >= 50 ? 'text-warning-dark' : 'text-error-dark'}`}>
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('todas');
  const [regionalId, setRegionalId] = useState('');
  const [regionais, setRegionais] = useState([]);
  const [perfil, setPerfil] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [atividadeId, setAtividadeId] = useState('');
  const [atividades, setAtividades] = useState([]);
  const [showGerarModal, setShowGerarModal] = useState(false);

  const podeFiltrarTime = currentUser?.perfil === 'admin' || currentUser?.perfil === 'sr';

  const filtrosQuery = () => {
    let qs = '';
    if (regionalId) qs += `&regional_id=${regionalId}`;
    if (perfil) qs += `&perfil=${perfil}`;
    if (usuarioId) qs += `&usuario_id=${usuarioId}`;
    if (atividadeId) qs += `&atividade_id=${atividadeId}`;
    return qs;
  };

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/rotinas/dashboard?periodo=${periodo}${filtrosQuery()}`;
    const r = await apiFetch(url);
    if (r?.ok) setData(r.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, regionalId, perfil, usuarioId, atividadeId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (currentUser?.perfil !== 'admin') return;
    apiFetch('/api/regionais/?ativo=true').then(r => {
      if (r?.ok) setRegionais(r.data);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!podeFiltrarTime) return;
    apiFetch('/api/usuarios/?status=ativo').then(r => {
      if (r?.ok) setUsuarios(r.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeFiltrarTime]);

  useEffect(() => {
    if (!podeFiltrarTime) return;
    let url = '/api/atividades/?ativo=true';
    if (perfil) url += `&perfil=${perfil}`;
    apiFetch(url).then(r => {
      if (r?.ok) {
        setAtividades(r.data);
        setAtividadeId(prev => (prev && !r.data.some(a => String(a.id) === String(prev))) ? '' : prev);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeFiltrarTime, perfil]);

  const exportar = () => {
    const url = `/api/rotinas/dashboard/export?periodo=${periodo}${filtrosQuery()}`;
    downloadExport(url, `dashboard_${periodo}.csv`).catch(() => toast('Erro ao exportar', 'error'));
  };

  if (loading) return <PageSpinner />;

  const pct = data?.percentual_execucao ?? 0;
  const pctColor = pct >= 80 ? 'text-success-dark' : pct >= 50 ? 'text-warning-dark' : 'text-error-dark';

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periodo} onChange={e => setPeriodo(e.target.value)} className="w-36">
          <option value="todas">Todas</option>
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
        </Select>
        {currentUser?.perfil === 'admin' && regionais.length > 0 && (
          <Select value={regionalId} onChange={e => setRegionalId(e.target.value)} className="w-44">
            <option value="">Todas Regionais</option>
            {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </Select>
        )}
        {podeFiltrarTime && (
          <>
            <Select value={perfil} onChange={e => setPerfil(e.target.value)} className="w-48">
              <option value="">Todos os Perfis</option>
              {Object.entries(PERFIL_LABELS).map(([p, label]) => <option key={p} value={p}>{label}</option>)}
            </Select>
            <Select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className="w-48">
              <option value="">Todos os Usuários</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
            <Select value={atividadeId} onChange={e => setAtividadeId(e.target.value)} className="w-52">
              <option value="">Todas as Atividades</option>
              {atividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </Select>
          </>
        )}
        {data && (
          <span className="text-xs text-gray-400">
            {fmtDate(data.periodo_inicio)} → {fmtDate(data.periodo_fim)}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportar}>Exportar CSV</Button>
          {currentUser?.perfil === 'admin' && (
            <Button icon={RefreshCw} onClick={() => setShowGerarModal(true)}>
              Gerar Rotinas
            </Button>
          )}
        </div>
      </div>

      {/* Período anterior ainda dentro do prazo de tolerância — mostrado separado
          pra não sumir do dashboard assim que o período novo é gerado. */}
      {data?.anterior && (
        <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 shadow-card px-5 py-3.5">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">Período anterior</span>{' '}
            <span className="text-gray-400">
              ({fmtDate(data.anterior.periodo_inicio)} → {fmtDate(data.anterior.periodo_fim)} · prazo até {fmtDate(data.anterior.prazo_final)})
            </span>
          </div>
          <div className={`text-sm font-bold shrink-0 ${
            data.anterior.percentual_execucao >= 80 ? 'text-success-dark' :
            data.anterior.percentual_execucao >= 50 ? 'text-warning-dark' : 'text-error-dark'
          }`}>
            {data.anterior.percentual_execucao}% ({data.anterior.concluidas} de {data.anterior.total})
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Taxa de Execução"
          value={`${pct}%`}
          sub={`${data?.concluidas} de ${data?.total} atividades`}
          icon={BarChart2}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
          valueColor={pctColor}
          trend={pct}
        />
        <StatCard
          label="Concluídas"
          value={data?.concluidas ?? 0}
          sub={`de ${data?.total} previstas`}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-success"
          valueColor="text-success-dark"
        />
        <StatCard
          label="Não Realizadas"
          value={data?.nao_realizadas ?? 0}
          sub="Requerem plano de ação"
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-error"
          valueColor="text-error-dark"
        />
        <StatCard
          label="Em Andamento"
          value={data?.em_andamento ?? 0}
          sub={`+ ${data?.nao_iniciadas ?? 0} não iniciadas`}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-warning"
          valueColor="text-warning-dark"
        />
      </div>

      {/* Segregação por semana/quinzena/mês do mês corrente — independe do
          seletor "Período" acima, sempre reflete os filtros de perfil/usuário/
          atividade/regional aplicados. */}
      <AderenciaTime semanas={data?.semanas} quinzenal={data?.quinzenal} mensal={data?.mensal} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Execução por Perfil</CardTitle>
            <Users size={16} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            <PorPerfil por_perfil={data?.por_perfil} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Aderência</CardTitle>
            <Trophy size={16} className="text-gray-400" />
          </CardHeader>
          <CardBody className="p-2">
            <Ranking ranking={data?.ranking} />
          </CardBody>
        </Card>
      </div>

      <GerarRotinasModal 
        open={showGerarModal} 
        onClose={() => setShowGerarModal(false)}
        onGenerated={load}
      />
    </div>
  );
}
