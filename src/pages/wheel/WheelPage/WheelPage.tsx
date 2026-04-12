import { ActionIcon, Badge, Button, Group, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowRight, IconHistory } from '@tabler/icons-react';
import { FC, Key, useCallback, useMemo, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { historyApi } from '@api/historyApi';
import SlotsPresetInput from '@components/Form/SlotsPresetInput/SlotsPresetInput.tsx';
import PageContainer from '@components/PageContainer/PageContainer';
import AddLotPopover, { NewLotData } from '@domains/winner-selection/matryoshka/AddLotPopover';
import HistoryPanel from '@domains/winner-selection/history/HistoryPanel';
import MatryoshkaBreadcrumb from '@domains/winner-selection/matryoshka/MatryoshkaBreadcrumb';
import MatryoshkaSegmentModal from '@domains/winner-selection/matryoshka/MatryoshkaSegmentModal';
import MatryoshkaWinnerModal from '@domains/winner-selection/matryoshka/MatryoshkaWinnerModal';
import RandomWheel, { RandomWheelController } from '@domains/winner-selection/wheel-of-random/ui/FullWheelUI';
import {
  useSaveWheelSettings,
  useWheelSettings,
} from '@domains/winner-selection/wheel-of-random/lib/hooks/useWheelSettings';
import { Slot } from '@models/slot.model';
import { WheelItem } from '@models/wheel.model';
import { RootState } from '@reducers';
import {
  navigateInto,
  navigateBackTo,
  recordWin,
  nextRound,
} from '@reducers/Matryoshka/Matryoshka';
import { addSlot, createSlot, deleteSlot, initialSlots, setSlots } from '@reducers/Slots/Slots';
import { getLotsAtPath, navStackToParentPath, removeLotByIdInTree, cleanEmptyMultiLayerLots, addLotToTree } from '@utils/matryoshka.utils';
import { SlotListToWheelList } from '@utils/slots.utils';

import styles from './WheelPage.module.css';

const WheelPage: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { slots, isInitialized } = useSelector((root: RootState) => root.slots);
  const { navigationStack, history, currentRound } = useSelector(
    (root: RootState) => root.matryoshka,
  );
  const wheelController = useRef<RandomWheelController | null>(null);
  const wheelForm = useRef<UseFormReturn<Wheel.Settings> | null>(null);

  const [wheelSettings, setWheelSettings] = useState<Wheel.Settings>();
  const [participants, setParticipants] = useState<WheelItem[]>();
  const [historyOpened, historyHandlers] = useDisclosure(false);
  const [clickedSegmentSlot, setClickedSegmentSlot] = useState<Slot | null>(null);
  const [winnerSlot, setWinnerSlot] = useState<Slot | null>(null);

  const { data: initialSettings, isLoading: isLoadingSettings } = useWheelSettings();
  const { mutate: saveSettings } = useSaveWheelSettings();

  const isInsideMatryoshka = navigationStack.length > 0;

  const currentLevelSlots = useMemo(
    () => (isInsideMatryoshka ? getLotsAtPath(slots, navigationStack) : slots),
    [slots, navigationStack, isInsideMatryoshka],
  );

  const previousWheelItems = useRef<Slot[]>(initialSlots);
  const wheelItems = useMemo(() => SlotListToWheelList(currentLevelSlots), [currentLevelSlots]);

  if (previousWheelItems.current === initialSlots) {
    previousWheelItems.current = currentLevelSlots;
    wheelController.current?.setItems(wheelItems);
  }

  const soleMatryoshka = useMemo(() => {
    if (
      currentLevelSlots.length === 1 &&
      currentLevelSlots[0].isMultiLayer &&
      currentLevelSlots[0].children &&
      currentLevelSlots[0].children.length > 0
    ) {
      return currentLevelSlots[0];
    }
    return null;
  }, [currentLevelSlots]);

  const setCustomWheelItems = useCallback(
    (customItems: Slot[], saveSlots: boolean) => {
      wheelController.current?.setItems(SlotListToWheelList(customItems));
      previousWheelItems.current = [];

      if (saveSlots) {
        dispatch(setSlots(customItems));
      }
    },
    [dispatch],
  );

  const deleteItem = useCallback(
    (id: Key) => {
      if (isInsideMatryoshka) {
        const parentPath = navStackToParentPath(navigationStack);
        const updatedSlots = removeLotByIdInTree(slots, id.toString(), parentPath);
        dispatch(setSlots(cleanEmptyMultiLayerLots(updatedSlots)));
      } else {
        dispatch(deleteSlot(id.toString()));
      }
    },
    [isInsideMatryoshka, navigationStack, slots, dispatch],
  );

  const handleWin = useCallback(
    (winnerItem: WheelItem) => {
      const slot = currentLevelSlots.find((s) => s.id === winnerItem.id.toString());
      if (slot) {
        setWinnerSlot(slot);
      }
    },
    [currentLevelSlots],
  );

  const handleNavigateInto = useCallback(
    (slot: Slot) => {
      dispatch(navigateInto({ slotId: slot.id, slotName: slot.name || '(unnamed)' }));
      setClickedSegmentSlot(null);
      setWinnerSlot(null);
    },
    [dispatch],
  );

  const handleBreadcrumbNavigate = useCallback(
    (index: number) => {
      dispatch(navigateBackTo(index));
    },
    [dispatch],
  );

  const handleNextRound = useCallback(
    (slot: Slot) => {
      const pathNames = [
        ...navigationStack.map((n) => n.slotName),
        slot.name || '(unnamed)',
      ];

      dispatch(recordWin({ lot: slot, path: pathNames }));

      historyApi.recordWin({
        lotName: slot.name || '(unnamed)',
        owner: '',
        round: currentRound,
        path: pathNames,
      });

      const parentPath = navStackToParentPath(navigationStack);
      let updatedSlots = removeLotByIdInTree(slots, slot.id, parentPath);
      updatedSlots = cleanEmptyMultiLayerLots(updatedSlots);
      dispatch(setSlots(updatedSlots));

      const remainingAfterRemoval = currentLevelSlots.filter((l) => l.id !== slot.id);
      if (navigationStack.length > 0 && remainingAfterRemoval.length === 0) {
        dispatch(navigateBackTo(0));
      }

      dispatch(nextRound());
      setWinnerSlot(null);
    },
    [navigationStack, slots, currentLevelSlots, currentRound, dispatch],
  );

  const handleSettingsChanged = useCallback(
    (settings: Wheel.Settings) => {
      setWheelSettings(settings);
      saveSettings({ id: initialSettings?.id, data: settings });
    },
    [saveSettings, initialSettings?.id],
  );

  const handleAddLot = useCallback(
    (data: NewLotData) => {
      const newSlot = createSlot({
        name: data.name,
        amount: data.amount,
        isMultiLayer: data.isMultiLayer,
        children: data.isMultiLayer ? [] : undefined,
      });

      if (isInsideMatryoshka) {
        const parentPath = navStackToParentPath(navigationStack);
        const updatedSlots = addLotToTree(slots, parentPath, newSlot);
        dispatch(setSlots(updatedSlots));
      } else {
        dispatch(addSlot({
          name: data.name,
          amount: data.amount,
          isMultiLayer: data.isMultiLayer,
          children: data.isMultiLayer ? [] : undefined,
        }));
      }
    },
    [isInsideMatryoshka, navigationStack, slots, dispatch],
  );

  const addButton = useMemo(
    () => <AddLotPopover onAdd={handleAddLot} />,
    [handleAddLot],
  );

  const title = (
    <Group>
      <Title order={1}>{t('wheel.wheel')}</Title>
      <SlotsPresetInput buttonTitle={t('wheel.importToWheel')} onChange={setCustomWheelItems} />
      <Badge variant='light' size='lg'>
        #{currentRound}
      </Badge>
      <Tooltip label={t('wheel.history', 'History')}>
        <ActionIcon variant='subtle' size='lg' onClick={historyHandlers.open} pos='relative'>
          <IconHistory size={22} />
          {history.length > 0 && (
            <Badge
              size='xs'
              variant='filled'
              circle
              style={{ position: 'absolute', top: -4, right: -4, padding: '0 4px' }}
            >
              {history.length > 99 ? '99+' : history.length}
            </Badge>
          )}
        </ActionIcon>
      </Tooltip>
    </Group>
  );

  return (
    <PageContainer
      className={`${styles.container} wheel-wrapper padding`}
      classes={{ content: styles.content }}
      title={title}
    >
      {isInsideMatryoshka && (
        <MatryoshkaBreadcrumb stack={navigationStack} onNavigate={handleBreadcrumbNavigate} />
      )}

      {soleMatryoshka && (
        <Group justify='center' mt='md'>
          <Button
            size='lg'
            leftSection={<IconArrowRight size={20} />}
            onClick={() => handleNavigateInto(soleMatryoshka)}
            variant='filled'
            color='violet'
          >
            Enter «{soleMatryoshka.name || 'Matryoshka'}»
          </Button>
        </Group>
      )}

      {!isLoadingSettings && isInitialized && !soleMatryoshka && (
        <RandomWheel
          initialSettings={initialSettings?.data}
          items={wheelItems}
          deleteItem={deleteItem}
          wheelRef={wheelController}
          onWheelItemsChanged={setParticipants}
          onSettingsChanged={handleSettingsChanged}
          form={wheelForm}
          onWin={handleWin}
          addButton={addButton}
        />
      )}

      {winnerSlot && (
        <MatryoshkaWinnerModal
          winner={winnerSlot}
          opened={!!winnerSlot}
          onClose={() => setWinnerSlot(null)}
          onEnterSubWheel={
            winnerSlot.isMultiLayer && winnerSlot.children && winnerSlot.children.length > 0
              ? () => handleNavigateInto(winnerSlot)
              : undefined
          }
          onNextRound={() => handleNextRound(winnerSlot)}
        />
      )}

      <MatryoshkaSegmentModal
        slot={clickedSegmentSlot}
        opened={!!clickedSegmentSlot}
        onClose={() => setClickedSegmentSlot(null)}
        onEnter={() => {
          if (clickedSegmentSlot) handleNavigateInto(clickedSegmentSlot);
        }}
      />

      <HistoryPanel opened={historyOpened} onClose={historyHandlers.close} />
    </PageContainer>
  );
};

export default WheelPage;
