import { Badge, Button, Card, Drawer, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconClock, IconCloud, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { historyApi, WinRecordDto } from '@api/historyApi';
import { wheelHubApi, type WinRecordDto as HubWinRecordDto } from '@api/wheelHubApi';
import { RootState } from '@reducers';
import { clearHistory } from '@reducers/Matryoshka/Matryoshka';

function formatDate(ts: number | string): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

interface HistoryPanelProps {
  opened: boolean;
  onClose: () => void;
}

const HistoryPanel = ({ opened, onClose }: HistoryPanelProps) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const localHistory = useSelector((state: RootState) => state.matryoshka.history);
  const [serverRecords, setServerRecords] = useState<WinRecordDto[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [showServer, setShowServer] = useState(false);

  useEffect(() => {
    const unsub = wheelHubApi.on('onWinRecorded', (record: HubWinRecordDto) => {
      setServerRecords((prev) => [
        {
          id: record.id,
          lotName: record.lotName,
          owner: record.owner,
          round: record.round,
          path: record.path,
          timestamp: record.timestamp,
          sessionId: record.sessionId,
        },
        ...prev,
      ]);
    });
    return unsub;
  }, []);

  const loadServerHistory = useCallback(async () => {
    setLoadingServer(true);
    try {
      const records = await historyApi.getHistory('', 'DEFAULT');
      setServerRecords(records);
      setShowServer(true);
    } catch {
      setShowServer(false);
    } finally {
      setLoadingServer(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      loadServerHistory();
    }
  }, [opened, loadServerHistory]);

  const handleClearHistory = async () => {
    dispatch(clearHistory());
    try {
      const sessionId = historyApi.getSessionId();
      await historyApi.clearHistory(sessionId);
      setServerRecords([]);
    } catch {
      // server might be offline
    }
  };

  const displayRecords = showServer
    ? serverRecords.map((r) => ({
        id: r.id.toString(),
        lotName: r.lotName,
        owner: r.owner,
        round: r.round,
        path: r.path,
        timestamp: r.timestamp,
      }))
    : localHistory.map((r) => ({
        id: r.id,
        lotName: r.lotName,
        owner: r.owner,
        round: r.round,
        path: r.path,
        timestamp: new Date(r.timestamp).toISOString(),
      }));

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='sm'>
          <IconClock size={20} />
          <Title order={4}>{t('wheel.history', 'History')}</Title>
          {displayRecords.length > 0 && (
            <Badge size='sm' variant='filled'>
              {displayRecords.length}
            </Badge>
          )}
        </Group>
      }
      position='right'
      size='md'
      padding='md'
    >
      <Stack gap='sm'>
        <Group justify='space-between'>
          <Button
            variant={showServer ? 'filled' : 'light'}
            size='xs'
            leftSection={loadingServer ? <Loader size={14} /> : <IconCloud size={14} />}
            onClick={loadServerHistory}
            disabled={loadingServer}
          >
            {showServer ? t('wheel.serverHistory', 'Server') : t('wheel.loadFromServer', 'Load from server')}
          </Button>
          {displayRecords.length > 0 && (
            <Button
              variant='subtle'
              color='red'
              size='xs'
              leftSection={<IconTrash size={14} />}
              onClick={handleClearHistory}
            >
              {t('wheel.clearHistory', 'Clear')}
            </Button>
          )}
        </Group>

        {displayRecords.length === 0 && (
          <Text c='dimmed' ta='center' py='xl'>
            {t('wheel.noHistory', 'No spin history yet')}
          </Text>
        )}

        {displayRecords.map((record) => (
          <Card key={record.id} withBorder padding='sm' radius='md'>
            <Group justify='space-between' mb={4}>
              <Text size='xs' c='dimmed'>
                {formatDate(record.timestamp)}
              </Text>
              <Badge size='xs' variant='light'>
                #{record.round}
              </Badge>
            </Group>
            <Text fw={600} size='md'>
              {record.lotName}
            </Text>
            {record.owner && (
              <Text size='xs' c='dimmed' mt={2}>
                {record.owner}
              </Text>
            )}
            {record.path.length > 1 && (
              <Text size='xs' c='dimmed' mt={2}>
                {record.path.join(' → ')}
              </Text>
            )}
          </Card>
        ))}
      </Stack>
    </Drawer>
  );
};

export default HistoryPanel;
