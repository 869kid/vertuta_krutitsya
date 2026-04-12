import {
  Accordion,
  Badge,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconCrown, IconHistory, IconTrophy, IconUsers } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

import { historyApi, SessionDto, SessionDetailDto, StatsDto } from '@api/historyApi';
import PageContainer from '@components/PageContainer/PageContainer';

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionDetails, setSessionDetails] = useState<Record<string, SessionDetailDto>>({});
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        setError('Failed to connect to server. Make sure the backend is running (docker-compose up).');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadSessionDetail = useCallback(async (sessionId: string) => {
    if (sessionDetails[sessionId]) return;
    try {
      const detail = await historyApi.getSession(sessionId);
      setSessionDetails((prev) => ({ ...prev, [sessionId]: detail }));
    } catch {
      // ignore
    }
  }, [sessionDetails]);

  if (loading) {
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

  const topLotEntries = stats ? Object.entries(stats.topLots).sort((a, b) => b[1] - a[1]) : [];
  const topWinnerEntries = stats ? Object.entries(stats.topWinners).sort((a, b) => b[1] - a[1]) : [];
  const maxLotCount = topLotEntries.length > 0 ? topLotEntries[0][1] : 1;
  const maxWinnerCount = topWinnerEntries.length > 0 ? topWinnerEntries[0][1] : 1;

  return (
    <PageContainer title={<Title order={1}>History Dashboard</Title>}>
      <Container size='lg' py='md'>
        <Stack gap='lg'>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <StatCard icon={<IconHistory size={28} />} label='Sessions' value={stats?.totalSessions ?? 0} color='blue' />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <StatCard icon={<IconTrophy size={28} />} label='Total Wins' value={stats?.totalWins ?? 0} color='green' />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <StatCard icon={<IconCrown size={28} />} label='Total Rounds' value={stats?.totalRounds ?? 0} color='violet' />
            </Grid.Col>
          </Grid>

          <Grid>
            {topLotEntries.length > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder padding='lg' radius='md'>
                  <Title order={4} mb='md'>Top Lots</Title>
                  <Stack gap='xs'>
                    {topLotEntries.map(([name, count]) => (
                      <div key={name}>
                        <Group justify='space-between' mb={4}>
                          <Text size='sm' fw={500}>{name}</Text>
                          <Badge size='sm' variant='light'>{count}</Badge>
                        </Group>
                        <Progress value={(count / maxLotCount) * 100} size='sm' radius='xl' />
                      </div>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {topWinnerEntries.length > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder padding='lg' radius='md'>
                  <Group mb='md'>
                    <IconUsers size={20} />
                    <Title order={4}>Top Authors</Title>
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
              </Grid.Col>
            )}
          </Grid>

          <Card withBorder padding='lg' radius='md'>
            <Title order={4} mb='md'>Sessions</Title>
            {sessions.length === 0 ? (
              <Text c='dimmed' ta='center' py='lg'>No sessions yet</Text>
            ) : (
              <Accordion variant='separated'>
                {sessions.map((session) => (
                  <Accordion.Item key={session.sessionId} value={session.sessionId}>
                    <Accordion.Control onClick={() => loadSessionDetail(session.sessionId)}>
                      <Group justify='space-between' wrap='nowrap' pr='md'>
                        <div>
                          <Text fw={500}>{session.name}</Text>
                          <Text size='xs' c='dimmed'>{formatDate(session.createdAt)}</Text>
                        </div>
                        <Group gap='xs'>
                          <Badge variant='light'>{session.winCount} wins</Badge>
                          <Badge variant='light' color='violet'>{session.totalRounds} rounds</Badge>
                        </Group>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {sessionDetails[session.sessionId] ? (
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>#</Table.Th>
                              <Table.Th>Lot</Table.Th>
                              <Table.Th>Author</Table.Th>
                              <Table.Th>Path</Table.Th>
                              <Table.Th>Time</Table.Th>
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
