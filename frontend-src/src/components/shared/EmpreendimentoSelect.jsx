import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import SearchableSelect from '../ui/SearchableSelect';

// Cache em nível de módulo: vários campos "Empreendimento" na mesma tela
// compartilham a lista, evitando múltiplas requisições.
let _cache = null;
let _inflight = null;
const _subscribers = new Set();

export function invalidateEmpreendimentosCache() {
  _cache = null;
  _inflight = null;
}

async function fetchEmpreendimentos() {
  if (_cache) return _cache;
  if (!_inflight) {
    _inflight = apiFetch('/api/empreendimentos/?ativo=true').then(r => {
      _cache = r?.ok ? r.data : [];
      _inflight = null;
      _subscribers.forEach(fn => fn(_cache));
      return _cache;
    });
  }
  return _inflight;
}

/** Hook que retorna a lista de empreendimentos ativos (com cache compartilhado). */
export function useEmpreendimentos() {
  const [lista, setLista] = useState(_cache || []);
  useEffect(() => {
    let active = true;
    const update = (data) => { if (active) setLista(data); };
    _subscribers.add(update);
    fetchEmpreendimentos().then(update);
    return () => { active = false; _subscribers.delete(update); };
  }, []);
  return lista;
}

/**
 * <datalist> compartilhado com os empreendimentos ativos. Use em células de
 * tabela (onde um dropdown flutuante seria recortado pelo scroll), aplicando
 * `list={id}` no <input>. Renderize uma única vez por formulário.
 */
export function EmpreendimentosDatalist({ id = 'empreendimentos-ativos' }) {
  const lista = useEmpreendimentos();
  return (
    <datalist id={id}>
      {lista.map(e => <option key={e.id} value={e.nome} />)}
    </datalist>
  );
}

/**
 * Campo padronizado "Empreendimento": lista suspensa com pesquisa, exibindo
 * apenas empreendimentos ativos cadastrados. Use por nome (value = nome) para
 * manter compatibilidade com os dados de formulário já salvos.
 */
export default function EmpreendimentoSelect({
  value,
  onChange,
  label = 'Empreendimento',
  required = false,
  disabled = false,
  byId = false,
}) {
  const [lista, setLista] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    let active = true;
    const update = (data) => { if (active) { setLista(data); setLoading(false); } };
    _subscribers.add(update);
    fetchEmpreendimentos().then(update);
    return () => { active = false; _subscribers.delete(update); };
  }, []);

  const options = lista.map(e => ({ value: byId ? e.id : e.nome, label: e.nome }));

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      required={required}
      disabled={disabled}
      placeholder={loading ? 'Carregando...' : 'Selecione o empreendimento...'}
      emptyMessage="Nenhum empreendimento ativo cadastrado"
    />
  );
}
