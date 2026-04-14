import {
  Badge,
  Button,
  CopyButton,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCopy, IconDoorEnter, IconDoorExit, IconPlus, IconCheck } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { wheelHubApi, roomRestApi, type VariantDto } from '@api/wheelHubApi';
import { RootState } from '@reducers';
import { joinedRoom, leftRoom, setConnectionError } from '@reducers/Room/Room';
import { setSlots } from '@reducers/Slots/Slots';
import { variantsToSlots } from '@utils/roomVariantMapper';

interface RoomPanelProps {
  serverVariants: VariantDto[];
  onServerVariantsChange: (variants: VariantDto[]) => void;
}

const RoomPanel: FC<RoomPanelProps> = ({ serverVariants, onServerVariantsChange }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { roomCode, hostName, isHost, isConnected, connectionError } = useSelector(
    (state: RootState) => state.room,
  );

  const [createOpened, createHandlers] = useDisclosure(false);
  const [joinOpened, joinHandlers] = useDisclosure(false);

  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setupListeners = useCallback(
    (variants: VariantDto[]) => {
      const currentVariants = [...variants];

      wheelHubApi.on('onVariantAdded', (variant) => {
        currentVariants.push(variant);
        onServerVariantsChange([...currentVariants]);
        dispatch(setSlots(variantsToSlots(currentVariants)));
      });

      wheelHubApi.on('onVariantRemoved', (id) => {
        const idx = currentVariants.findIndex((v) => v.id === id);
        if (idx >= 0) currentVariants.splice(idx, 1);
        onServerVariantsChange([...currentVariants]);
        dispatch(setSlots(variantsToSlots(currentVariants)));
      });

      wheelHubApi.on('onError', (msg) => {
        dispatch(setConnectionError(msg));
      });
    },
    [dispatch, onServerVariantsChange],
  );

  const handleCreate = useCallback(async () => {
    setIsLoading(true);
    try {
      const room = await roomRestApi.createRoom(createName, createPassword || undefined);

      wheelHubApi.on('onJoinedRoom', (data) => {
        dispatch(joinedRoom({ roomCode: data.roomCode, hostName: data.hostName, isHost: data.isHost }));
        onServerVariantsChange(data.variants);
        dispatch(setSlots(variantsToSlots(data.variants)));
        setupListeners(data.variants);
      });

      await wheelHubApi.connect();
      await wheelHubApi.joinRoom(room.roomCode, createPassword || undefined);

      createHandlers.close();
      setCreateName('');
      setCreatePassword('');
    } catch (err) {
      dispatch(setConnectionError(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [createName, createPassword, dispatch, createHandlers, onServerVariantsChange, setupListeners]);

  const handleJoin = useCallback(async () => {
    setIsLoading(true);
    try {
      wheelHubApi.on('onJoinedRoom', (data) => {
        dispatch(joinedRoom({ roomCode: data.roomCode, hostName: data.hostName, isHost: data.isHost }));
        onServerVariantsChange(data.variants);
        dispatch(setSlots(variantsToSlots(data.variants)));
        setupListeners(data.variants);
      });

      await wheelHubApi.connect();
      await wheelHubApi.joinRoom(joinCode.trim().toUpperCase(), joinPassword || undefined);

      joinHandlers.close();
      setJoinCode('');
      setJoinPassword('');
    } catch (err) {
      dispatch(setConnectionError(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [joinCode, joinPassword, dispatch, joinHandlers, onServerVariantsChange, setupListeners]);

  const handleLeave = useCallback(async () => {
    if (roomCode) {
      await wheelHubApi.leaveRoom(roomCode);
    }
    await wheelHubApi.disconnect();
    wheelHubApi.removeAllListeners();
    dispatch(leftRoom());
  }, [roomCode, dispatch]);

  if (isConnected && roomCode) {
    return (
      <Group gap='xs' mb='xs'>
        <Badge variant='light' color='green' size='lg'>
          {t('wheel.room.connected', 'Room')}: {roomCode}
        </Badge>
        <Badge variant='light' size='sm'>
          {hostName}
        </Badge>
        {isHost ? (
          <Badge variant='filled' color='violet' size='xs'>
            {t('wheel.room.host', 'Host')}
          </Badge>
        ) : (
          <Badge variant='filled' color='gray' size='xs'>
            {t('wheel.room.viewer', 'Viewer')}
          </Badge>
        )}
        <CopyButton value={roomCode} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}>
              <Button variant='subtle' size='compact-xs' onClick={copy} leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}>
                {t('wheel.room.copyCode', 'Code')}
              </Button>
            </Tooltip>
          )}
        </CopyButton>
        <Button variant='subtle' color='red' size='compact-xs' onClick={handleLeave} leftSection={<IconDoorExit size={14} />}>
          {t('wheel.room.leave', 'Leave')}
        </Button>
        {connectionError && (
          <Text size='xs' c='red'>
            {connectionError}
          </Text>
        )}
      </Group>
    );
  }

  return (
    <>
      <Group gap='xs' mb='xs'>
        <Button variant='light' size='compact-sm' onClick={createHandlers.open} leftSection={<IconPlus size={14} />}>
          {t('wheel.room.create', 'Create room')}
        </Button>
        <Button variant='light' size='compact-sm' onClick={joinHandlers.open} leftSection={<IconDoorEnter size={14} />}>
          {t('wheel.room.join', 'Join room')}
        </Button>
        {connectionError && (
          <Text size='xs' c='red'>
            {connectionError}
          </Text>
        )}
      </Group>

      <Modal opened={createOpened} onClose={createHandlers.close} title={t('wheel.room.createTitle', 'Create a room')} centered>
        <Stack gap='sm'>
          <TextInput
            label={t('wheel.room.hostNameLabel', 'Your name')}
            placeholder={t('wheel.room.hostNamePlaceholder', 'Name...')}
            value={createName}
            onChange={(e) => setCreateName(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label={t('wheel.room.passwordLabel', 'Password (optional)')}
            placeholder={t('wheel.room.passwordPlaceholder', 'Leave empty for open room')}
            value={createPassword}
            onChange={(e) => setCreatePassword(e.currentTarget.value)}
          />
          <Button onClick={handleCreate} loading={isLoading} disabled={!createName.trim()}>
            {t('wheel.room.createButton', 'Create')}
          </Button>
        </Stack>
      </Modal>

      <Modal opened={joinOpened} onClose={joinHandlers.close} title={t('wheel.room.joinTitle', 'Join a room')} centered>
        <Stack gap='sm'>
          <TextInput
            label={t('wheel.room.roomCodeLabel', 'Room code')}
            placeholder='ABC12345'
            value={joinCode}
            onChange={(e) => setJoinCode(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label={t('wheel.room.passwordLabel', 'Password (optional)')}
            placeholder={t('wheel.room.passwordPlaceholder', 'Leave empty for open room')}
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.currentTarget.value)}
          />
          <Button onClick={handleJoin} loading={isLoading} disabled={!joinCode.trim()}>
            {t('wheel.room.joinButton', 'Join')}
          </Button>
        </Stack>
      </Modal>
    </>
  );
};

export default RoomPanel;
