import { useState, useEffect, useCallback } from 'react';
import { Timer, Check, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageSpinner, EmptyState } from '../components/ui/Spinner';
import { fmtDatetime } from '../utils/constants';

function fmtDuracao(segundos) {
  if (segundos == null) return '—';
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  if (min < 60) return seg > 0 ? `${min}min ${seg}s` : `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function duracaoColor(segundos) {
  if (segundos == null) return 'text-gray-400';
  if (segundos <= 60) return 'text-green-600';
  if (segundos <= 300) return 'text-yellow-600';
  return 'text-red-600';
}

function StatBox({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-card">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AprovadorCard({ info, registros }) {
  const [expanded, setExpanded] = useState(false);
  const detalhes = registros.filter(r => r.aprovador_id === info.aprovador_id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-700">
              {info.aprovador_nome?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">{info.aprovador_nome}</p>
            <p className="text-xs text-gray-400">{info.total} decisão{info.total !== 1 ? 'ões' : ''} registrada{info.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0 ml-3">
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-400">Média</p>
            <p className={`text-sm font-bold ${duracaoColor(info.media_segundos)}`}>
              {fmtDuracao(info.media_segundos)}
            </p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-400">Mais rápido</p>
            <p className="text-sm font-semibold text-green-600">{fmtDuracao(info.min_segundos)}</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-400">Mais lento</p>
            <p className="text-sm font-semibold text-red-600">{fmtDuracao(info.max_segundos)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Check size={11} /> {info.aprovadas}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <X size={11} /> {info.reprovadas}
            </span>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Mobile stats row */}
      {info.com_tempo > 0 && (
        <div className="sm:hidden grid grid-cols-3 gap-2 px-4 pb-3 -mt-1 text-center">
          <div><p className="text-xs text-gray-400">Média</p><p className={`text-sm font-bold ${duracaoColor(info.media_segundos)}`}>{fmtDuracao(info.media_segundos)}</p></div>
          <div><p className="text-xs text-gray-400">Mín</p><p className="text-sm font-semibold text-green-600">{fmtDuracao(info.min_segundos)}</p></div>
          <div><p className="text-xs text-gray-400">Máx</p><p className="text-sm font-semibold text-red-600">{fmtDuracao(info.max_segundos)}</p></div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100">
          {detalhes.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Nenhum registro detalhado disponível.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Atividade', 'Decisão', 'Tempo de revisão', 'Data'].map(h => (
                      <th key={h} className="text-left text-gray-400 font-medium px-4 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalhes.map(d => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-700 font-medium max-w-[200px] truncate">{d.rotina_nome || `#${d.rotina_id}`}</td>
                      <td className="px-4 py-2.5">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.acao === 'aprovada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {d.acao === 'aprovada' ? <Check size={10} /> : <X size={10} />}
                          {d.acao === 'aprovada' ? 'Aprovada' : 'Reprovada'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {d.duracao_revisao_segundos != null ? (
                          <span className={`flex items-center gap-1 font-semibold ${duracaoColor(d.duracao_revisao_segundos)}`}>
                            <Timer size={11} />
                            {fmtDuracao(d.duracao_revisao_segundos)}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">não registrado</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{fmtDatetime(d.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MetricasAprovacaoPage() {
  const { toast } = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/metricas-aprovacao?limit=500');
    if (r?.ok) setDados(r.data);
    else toast(r?.data?.erro || 'Erro ao carregar métricas', 'error');
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner />;
  if (!dados) return null;

  const { registros, por_aprovador } = dados;

  const comTempo = registros.filter(r => r.duracao_revisao_segundos != null);
  const totalAprovadas = registros.filter(r => r.acao === 'aprovada').length;
  const totalReprovadas = registros.filter(r => r.acao === 'reprovada').length;
  const mediaGeral = comTempo.length > 0
    ? Math.round(comTempo.reduce((s, r) => s + r.duracao_revisao_segundos, 0) / comTempo.length)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Timer size={20} className="text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Tempo de Revisão dos Superintendentes</h1>
        </div>
        <p className="text-sm text-gray-500">
          Mede o tempo desde o clique no card da atividade até a decisão de aprovação ou reprovação.
          Visível somente para administradores.
        </p>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label="Total de decisões"
          value={registros.length}
          sub={`${comTempo.length} com tempo registrado`}
          color="text-gray-900"
        />
        <StatBox
          label="Média geral"
          value={fmtDuracao(mediaGeral)}
          sub="tempo de revisão"
          color={duracaoColor(mediaGeral)}
        />
        <StatBox
          label="Aprovadas"
          value={totalAprovadas}
          sub={registros.length > 0 ? `${Math.round(totalAprovadas / registros.length * 100)}% do total` : ''}
          color="text-green-600"
        />
        <StatBox
          label="Reprovadas"
          value={totalReprovadas}
          sub={registros.length > 0 ? `${Math.round(totalReprovadas / registros.length * 100)}% do total` : ''}
          color="text-red-600"
        />
      </div>

      {/* Legenda de cores */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Referência de tempo:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> até 1min — Rápido</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> 1–5min — Moderado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> acima de 5min — Demorado</span>
      </div>

      {/* Por aprovador */}
      {por_aprovador.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="Nenhuma métrica registrada ainda"
          description="Os tempos de revisão serão capturados automaticamente conforme os superintendentes aprovarem ou reprovarem atividades."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Por Superintendente</h2>
          </div>
          {por_aprovador.map(info => (
            <AprovadorCard key={info.aprovador_id} info={info} registros={registros} />
          ))}
        </div>
      )}
    </div>
  );
}
