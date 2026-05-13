import { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { apiFetch } from '../api/client';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { fmtDatetime, formatAuditDetails } from '../utils/constants';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/audit-log?limit=200');
    if (r?.ok) setLogs(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ACTION_COLORS = {
    CREATE: 'blue',
    UPDATE: 'purple',
    DELETE: 'red',
    LOGIN:  'green',
  };

  return (
    <div className="space-y-5">
      {loading ? <PageSpinner /> : (
        <Card>
          {logs.length === 0 ? (
            <EmptyState icon={Shield} title="Nenhum log encontrado" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Usuário</Th>
                  <Th>Entidade</Th>
                  <Th>Ação</Th>
                  <Th>Detalhes</Th>
                </tr>
              </Thead>
              <Tbody>
                {logs.map(log => (
                  <Tr key={log.id}>
                    <Td className="text-xs text-gray-500 whitespace-nowrap">{fmtDatetime(log.criado_em)}</Td>
                    <Td className="font-medium text-gray-800">{log.usuario_nome || 'Sistema'}</Td>
                    <Td className="text-sm text-gray-600">
                      {log.entidade} {log.entidade_id ? <span className="text-gray-400 font-mono text-xs">#{log.entidade_id}</span> : ''}
                    </Td>
                    <Td>
                      <Badge color={ACTION_COLORS[log.acao?.toUpperCase()] || 'gray'}>
                        {log.acao}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-gray-500 max-w-[300px] truncate">{formatAuditDetails(log.detalhes)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
