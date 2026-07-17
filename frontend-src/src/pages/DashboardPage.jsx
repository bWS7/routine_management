import { useState, useEffect, useCallback } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, RefreshCw, Download, Trophy, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

function PeriodoCard({ titulo, subtitulo, stats, selecionada, onClick }) {
  const pct = stats?.percentual_execucao ?? 0;
  const barColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
  const pctColor = pct >= 80 ? 'text-success-dark' : pct >= 50 ? 'text-warning-dark' : 'text-error-dark';
  return (
    <button type="button" onClick={onClick}
      className={`text-left bg-white rounded-xl border p-4 transition-colors ${
        selecionada ? 'border-primary-400 ring-2 ring-primary-100 shadow-card' : 'border-gray-100 shadow-card hover:border-gray-200'
      }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{titulo}</span>
        <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
      </div>
      {subtitulo && <p className="text-[11px] text-gray-400 mb-2">{subtitulo}</p>}
      <ProgressBar value={pct} color={barColor} />
      <p className="text-xs text-gray-400 mt-1.5">{stats?.concluidas ?? 0} de {stats?.total ?? 0} atividades</p>
    </button>
  );
}

function AderenciaTime({ semanas, quinzenal, mensal, selecao, onSelecionar }) {
  if (!semanas?.length) return null;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Aderência da Equipe por Período</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Clique num período pra filtrar os indicadores abaixo</p>
        </div>
        <BarChart2 size={16} className="text-gray-400" />
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {semanas.map(s => (
            <PeriodoCard key={s.numero} titulo={`Semana ${s.numero}`}
              subtitulo={`${fmtDate(s.periodo_inicio)} - ${fmtDate(s.periodo_fim)}`} stats={s}
              selecionada={selecao === `semana${s.numero}`}
              onClick={() => onSelecionar(selecao === `semana${s.numero}` ? '' : `semana${s.numero}`)} />
          ))}
          <PeriodoCard titulo="Quinzenais" stats={quinzenal}
            selecionada={selecao === 'quinzenal'}
            onClick={() => onSelecionar(selecao === 'quinzenal' ? '' : 'quinzenal')} />
          <PeriodoCard titulo="Mensais" stats={mensal}
            selecionada={selecao === 'mensal'}
            onClick={() => onSelecionar(selecao === 'mensal' ? '' : 'mensal')} />
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

const RANKING_PAGE_SIZE = 10;

function Ranking({ ranking }) {
  const [pagina, setPagina] = useState(1);

  useEffect(() => { setPagina(1); }, [ranking]);

  if (!ranking?.length)
    return <p className="text-sm text-gray-400 text-center py-6">Sem dados no período</p>;

  const totalPaginas = Math.max(1, Math.ceil(ranking.length / RANKING_PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * RANKING_PAGE_SIZE;
  const pagina_itens = ranking.slice(inicio, inicio + RANKING_PAGE_SIZE);

  return (
    <div>
      <div className="space-y-2">
        {pagina_itens.map((r, i) => {
          const posicao = inicio + i;
          const pct = r.percentual;
          const barColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
          return (
            <div key={r.usuario_id ?? posicao} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${MEDAL_STYLES[posicao] || 'bg-gray-100 text-gray-500'}`}>
                {posicao + 1}
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
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {inicio + 1}–{Math.min(inicio + RANKING_PAGE_SIZE, ranking.length)} de {ranking.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500 px-1">{paginaAtual} / {totalPaginas}</span>
            <button type="button" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecao, setSelecao] = useState('');
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
    const url = `/api/rotinas/dashboard?selecao=${selecao}${filtrosQuery()}`;
    const r = await apiFetch(url);
    if (r?.ok) setData(r.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecao, regionalId, perfil, usuarioId, atividadeId]);

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
    const url = `/api/rotinas/dashboard/export?selecao=${selecao}${filtrosQuery()}`;
    downloadExport(url, `dashboard_${selecao || 'mes'}.csv`).catch(() => toast('Erro ao exportar', 'error'));
  };

  if (loading) return <PageSpinner />;

  const pct = data?.percentual_execucao ?? 0;
  const pctColor = pct >= 80 ? 'text-success-dark' : pct >= 50 ? 'text-warning-dark' : 'text-error-dark';

  const selecaoLabel = selecao.startsWith('semana') ? `Semana ${selecao.slice(6)}`
    : selecao === 'quinzenal' ? 'Quinzenais'
    : selecao === 'mensal' ? 'Mensais'
    : 'Mês inteiro';

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
          {selecaoLabel}
          {selecao && (
            <button type="button" onClick={() => setSelecao('')} className="text-primary-400 hover:text-primary-600">
              <X size={14} />
            </button>
          )}
        </span>
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={selecao ? 'Taxa de Execução' : 'Aderência Mensal'}
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

      {/* Sempre mostra o mês inteiro (independente da seleção atual) — cada
          card é clicável e filtra os indicadores acima, o ranking e a
          execução por perfil por aquele período específico. */}
      <AderenciaTime semanas={data?.semanas} quinzenal={data?.quinzenal} mensal={data?.mensal}
        selecao={selecao} onSelecionar={setSelecao} />

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
