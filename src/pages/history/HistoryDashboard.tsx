import {
  Accordion,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconTrophy, IconUsers } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { historyApi, SessionDto, SessionDetailDto, StatsDto } from '@api/historyApi';
import PageContainer from '@components/PageContainer/PageContainer';

const formatDate = (ts: string): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) => (
  <Card withBorder padding='lg' radius='md'>
    <Group>
      <div style={{ color: `var(--mantine-color-${color}-6)` }}>{icon}</div>
      <div>
        <Text size='xs' c='dimmed' tt='uppercase' fw={700}>
          {label}
        </Text>
        <Text fw={700} size='xl'>
          {value}
        </Text>
      </div>
    </Group>
  </Card>
);

const HistoryDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionDetails, setSessionDetails] = useState<Record<string, SessionDetailDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, sessionsData] = await Promise.all([
          historyApi.getStats(),
          historyApi.getSessions(),
        ]);
        setStats(statsData);
        setSessions(sessionsData);

        const details = await Promise.all(
          sessionsData.map((s) => historyApi.getSession(s.sessionId)),
        );
        const detailsMap: Record<string, SessionDetailDto> = {};
        for (const d of details) {
          detailsMap[d.sessionId] = d;
        }
        setSessionDetails(detailsMap);
      } catch {
        setError(t('historyDashboard.connectionError'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [t]);

  const defaultOpenSessionIds = useMemo(() => sessions.map((s) => s.sessionId), [sessions]);

  if (isLoading) {
    return (
      <Container py='xl'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container py='xl'>
        <Paper withBorder p='xl' radius='md'>
          <Text c='red' ta='center'>{error}</Text>
        </Paper>
      </Container>
    );
  }

  const topWinnerEntries = stats ? Object.entries(stats.topWinners).sort((a, b) => b[1] - a[1]) : [];
  const maxWinnerCount = topWinnerEntries.length > 0 ? topWinnerEntries[0][1] : 1;

  return (
    <PageContainer title={<Title order={1}>{t('historyDashboard.title')}</Title>}>
      <Container size='lg' py='md'>
        <Stack gap='lg'>
          <StatCard icon={<IconTrophy size={28} />} label={t('historyDashboard.winningVariants')} value={stats?.totalWins ?? 0} color='green' />

          {topWinnerEntries.length > 0 && (
            <Card withBorder padding='lg' radius='md'>
              <Group mb='md'>
                <IconUsers size={20} />
                <Title order={4}>{t('historyDashboard.topAuthors')}</Title>
              </Group>
              <Stack gap='xs'>
                {topWinnerEntries.map(([name, count]) => (
                  <div key={name}>
                    <Group justify='space-between' mb={4}>
                      <Text size='sm' fw={500}>{name}</Text>
                      <Badge size='sm' variant='light'>{count}</Badge>
                    </Group>
                    <Progress value={(count / maxWinnerCount) * 100} size='sm' radius='xl' color='teal' />
                  </div>
                ))}
              </Stack>
            </Card>
          )}

          <Card withBorder padding='lg' radius='md'>
            <Title order={4} mb='md'>{t('historyDashboard.sessions')}</Title>
            {sessions.length === 0 ? (
              <Text c='dimmed' ta='center' py='lg'>{t('historyDashboard.noSessions')}</Text>
            ) : (
              <Accordion variant='separated' multiple defaultValue={defaultOpenSessionIds}>
                {sessions.map((session) => (
                  <Accordion.Item key={session.sessionId} value={session.sessionId}>
                    <Accordion.Control>
                      <Group justify='space-between' wrap='nowrap' pr='md'>
                        <div>
                          <Text fw={500}>{session.name}</Text>
                          <Text size='xs' c='dimmed'>{formatDate(session.createdAt)}</Text>
                        </div>
                        <Group gap='xs'>
                          <Badge variant='light'>{t('historyDashboard.winsCount', { count: session.winCount })}</Badge>
                          <Badge variant='light' color='violet'>{t('historyDashboard.roundsCount', { count: session.totalRounds })}</Badge>
                        </Group>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {sessionDetails[session.sessionId] ? (
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>#</Table.Th>
                              <Table.Th>{t('historyDashboard.lot')}</Table.Th>
                              <Table.Th>{t('historyDashboard.author')}</Table.Th>
                              <Table.Th>{t('historyDashboard.path')}</Table.Th>
                              <Table.Th>{t('historyDashboard.time')}</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {sessionDetails[session.sessionId].winRecords.map((record) => (
                              <Table.Tr key={record.id}>
                                <Table.Td>
                                  <Badge size='xs' variant='light'>#{record.round}</Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text fw={500} size='sm'>{record.lotName}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size='sm' c='dimmed'>{record.owner || '—'}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size='xs' c='dimmed'>{record.path.length > 1 ? record.path.join(' → ') : '—'}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size='xs' c='dimmed'>{formatDate(record.timestamp)}</Text>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      ) : (
                        <Group justify='center' py='md'>
                          <Loader size='sm' />
                        </Group>
                      )}
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Card>
        </Stack>
      </Container>
    </PageContainer>
  );
};

export default HistoryDashboard;
