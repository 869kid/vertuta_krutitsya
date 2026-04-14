import { ActionIcon, Badge, Group, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconHistory, IconHome } from '@tabler/icons-react';
import { FC, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { wheelHubApi, type VariantDto, type SpinStartedDto } from '@api/wheelHubApi';
import { historyApi } from '@api/historyApi';
import SlotsPresetInput from '@components/Form/SlotsPresetInput/SlotsPresetInput.tsx';
import PageContainer from '@components/PageContainer/PageContainer';
import HistoryPanel from '@domains/winner-selection/history/HistoryPanel';
import MatryoshkaNavigation from '@domains/winner-selection/matryoshka/MatryoshkaNavigation';
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
  setSpinning,
} from '@reducers/Matryoshka/Matryoshka';
import { setSlots } from '@reducers/Slots/Slots';
import { getLotsAtPath } from '@utils/matryoshka.utils';
import { findVariantIdByClientId, variantsToSlots } from '@utils/roomVariantMapper';
import { SlotListToWheelList } from '@utils/slots.utils';

import VariantsPanel from './VariantsPanel';
import styles from './WheelPage.module.css';

const WheelPage: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { slots, isInitialized } = useSelector((root: RootState) => root.slots);
  const { navigationStack, history, currentRound, isSpinning } = useSelector(
    (root: RootState) => root.matryoshka,
  );
  const wheelController = useRef<RandomWheelController | null>(null);
  const wheelForm = useRef<UseFormReturn<Wheel.Settings> | null>(null);
  const serverVariantsRef = useRef<VariantDto[]>([]);

  const [wheelSettings, setWheelSettings] = useState<Wheel.Settings>();
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

  const currentParentVariantId = useMemo(() => {
    if (navigationStack.length === 0) return null;
    const lastNav = navigationStack[navigationStack.length - 1];
    const variant = serverVariantsRef.current.find((v) => v.clientId === lastNav.slotId);
    return variant?.id ?? null;
  }, [navigationStack]);

  const wheelItems = useMemo(() => SlotListToWheelList(currentLevelSlots), [currentLevelSlots]);

  useEffect(() => {
    wheelController.current?.setItems(wheelItems);
  }, [wheelItems]);

  useEffect(() => {
    const variantsRef = serverVariantsRef;

    const syncVariants = (variants: VariantDto[]) => {
      variantsRef.current = variants;
      dispatch(setSlots(variantsToSlots(variants)));
    };

    const setupConnection = async () => {
      try {
        wheelHubApi.on('onConnected', (data) => syncVariants(data.variants));

        wheelHubApi.on('onReconnected', (data) => syncVariants(data.variants));

        wheelHubApi.on('onVariantAdded', (variant) => {
          variantsRef.current = [...variantsRef.current, variant];
          dispatch(setSlots(variantsToSlots(variantsRef.current)));
        });

        wheelHubApi.on('onVariantUpdated', (updated) => {
          variantsRef.current = variantsRef.current.map((v) =>
            v.id === updated.id ? updated : v,
          );
          dispatch(setSlots(variantsToSlots(variantsRef.current)));
        });

        wheelHubApi.on('onVariantRemoved', (id) => {
          variantsRef.current = variantsRef.current.filter((v) => v.id !== id);
          dispatch(setSlots(variantsToSlots(variantsRef.current)));
        });

        wheelHubApi.on('onSpinStarted', (data: SpinStartedDto) => {
          dispatch(setSpinning(true));
          wheelController.current?.triggerServerSpin(data.winnerClientId, data.duration, data.seed)
            .finally(() => dispatch(setSpinning(false)));
        });

        wheelHubApi.on('onError', (msg) => {
          console.warn('[WheelHub]', msg);
        });

        await wheelHubApi.connect();
      } catch (err) {
        console.error('[WheelHub] Connection failed:', err);
      }
    };

    setupConnection();

    return () => {
      wheelHubApi.removeAllListeners();
      wheelHubApi.disconnect();
    };
  }, [dispatch]);

  const setCustomWheelItems = useCallback(
    (customItems: Slot[], saveSlots: boolean) => {
      wheelController.current?.setItems(SlotListToWheelList(customItems));

      if (saveSlots) {
        dispatch(setSlots(customItems));
      }
    },
    [dispatch],
  );

  const handleDeleteVariant = useCallback(
    (id: string) => {
      const variantId = findVariantIdByClientId(serverVariantsRef.current, id);
      if (variantId != null) {
        wheelHubApi.removeVariant(variantId);
      }
    },
    [],
  );

  const deleteItem = useCallback(
    (id: Key) => handleDeleteVariant(id.toString()),
    [handleDeleteVariant],
  );

  const handleUpdateVariant = useCallback(
    (id: string, changes: Partial<Slot>) => {
      const variantId = findVariantIdByClientId(serverVariantsRef.current, id);
      if (variantId != null) {
        wheelHubApi.updateVariant({
          variantId,
          name: changes.name ?? undefined,
          owner: changes.owner ?? undefined,
          isMultiLayer: changes.isMultiLayer ?? undefined,
        });
      }
    },
    [],
  );

  const handleAddVariant = useCallback(
    (name: string, isMultiLayer: boolean, parentId?: string, owner?: string) => {
      const clientId = Math.random().toString();
      const parentVariantId = parentId
        ? serverVariantsRef.current.find((v) => v.clientId === parentId)?.id ?? null
        : null;
      wheelHubApi.addVariant({
        clientId,
        name,
        owner: owner || undefined,
        isMultiLayer,
        parentVariantId,
      });
    },
    [],
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

  const handleRequestSpin = useCallback(
    (duration: number) => {
      if (isSpinning) return;
      wheelHubApi.requestSpin(duration, currentParentVariantId);
    },
    [currentParentVariantId, isSpinning],
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

      const variantId = findVariantIdByClientId(serverVariantsRef.current, slot.id);
      if (variantId != null) {
        wheelHubApi.confirmRound({
          lotName: slot.name || '(unnamed)',
          owner: slot.owner || '',
          round: currentRound,
          path: pathNames,
          variantId,
          sessionId: historyApi.getSessionId(),
        });
      }

      const remainingAfterRemoval = currentLevelSlots.filter((l) => l.id !== slot.id);
      if (navigationStack.length > 0 && remainingAfterRemoval.length === 0) {
        dispatch(navigateBackTo(0));
      }

      dispatch(nextRound());
      setWinnerSlot(null);
    },
    [navigationStack, currentLevelSlots, currentRound, dispatch],
  );

  const handleSettingsChanged = useCallback(
    (settings: Wheel.Settings) => {
      setWheelSettings(settings);
      saveSettings({ id: initialSettings?.id, data: settings });
    },
    [saveSettings, initialSettings?.id],
  );

  const importButton = useMemo(
    () => <SlotsPresetInput buttonTitle='Импорт' onChange={setCustomWheelItems} />,
    [setCustomWheelItems],
  );

  const handleNavigateBack = useCallback(() => {
    if (navigationStack.length > 0) {
      dispatch(navigateBackTo(navigationStack.length - 1));
    }
  }, [dispatch, navigationStack.length]);

  const handleNavigateHome = useCallback(() => {
    dispatch(navigateBackTo(0));
  }, [dispatch]);

  const handleWheelSegmentClick = useCallback(
    (item: WheelItem) => {
      const slot = currentLevelSlots.find((s) => s.id === item.id.toString());
      if (slot?.isMultiLayer && slot.children && slot.children.length > 0) {
        handleNavigateInto(slot);
      }
    },
    [currentLevelSlots, handleNavigateInto],
  );

  const title = (
    <Group gap='xs'>
      {isInsideMatryoshka && (
        <>
          <Tooltip label={t('wheel.navigation.home', 'Home')}>
            <ActionIcon variant='subtle' size='lg' onClick={handleNavigateHome}>
              <IconHome size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('wheel.navigation.back', 'Back')}>
            <ActionIcon variant='subtle' size='lg' onClick={handleNavigateBack}>
              <IconArrowLeft size={20} />
            </ActionIcon>
          </Tooltip>
        </>
      )}
      <Title order={1}>{t('wheel.wheel')}</Title>
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
        <MatryoshkaNavigation stack={navigationStack} onNavigate={handleBreadcrumbNavigate} />
      )}

      {!isLoadingSettings && isInitialized && (
        <div className={styles.wheelLayout}>
          <VariantsPanel
            slots={slots}
            wheelItems={wheelItems}
            onAdd={handleAddVariant}
            onDelete={handleDeleteVariant}
            onUpdate={handleUpdateVariant}
            importButton={importButton}
          />
          <RandomWheel
            initialSettings={initialSettings?.data}
            items={wheelItems}
            deleteItem={deleteItem}
            wheelRef={wheelController}
            onSettingsChanged={handleSettingsChanged}
            form={wheelForm}
            onWin={handleWin}
            onRequestSpin={handleRequestSpin}
            onSegmentClick={handleWheelSegmentClick}
            elements={{ preview: false }}
            shouldShuffle={false}
          />
        </div>
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
