import { ActionIcon, Alert, Anchor, Button, Collapse, Group, rem, Stack, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconInfoCircle, IconSettings } from '@tabler/icons-react';
import { CSSProperties, ReactNode } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { FirstTimeHelpNotification } from '@components/FirstTimeHelpNotification';
import { DOCS_PAGES, useDocsUrl } from '@constants/docs.constants';
import { WheelFormat } from '@constants/wheel.ts';
import { useLocalStorageState } from '@shared/lib/localState/useLocalStorageState';
import ClassicDropoutDescription from '@domains/winner-selection/wheel-of-random/settings/ui/Fields/ClassicDropoutDescription';
import RandomnessSourceField from '@domains/winner-selection/wheel-of-random/settings/ui/Fields/RandomnessSourceField/RandomnessSourceField';
import SplitField from '@domains/winner-selection/wheel-of-random/settings/ui/Fields/Split';
import WheelFormatField from '@domains/winner-selection/wheel-of-random/settings/ui/Fields/WheelFormat';

import { DropoutVariant } from '../../../BaseWheel/BaseWheel';
import { DropoutHelp } from '../../../Dropout/ui/DropoutHelp';
import NewDropoutDescription from '../../../Dropout/ui/NewDropoutDescription/NewDropoutDescription';
import { RevealedData } from '../../../lib/hooks/useTicketManagement';
import CoreImageField from '../Fields/CoreImageExpandPanel/CoreImage';
import DropoutFormatField from '../Fields/DropoutFormat';
import WheelSoundtrackField from '../Fields/Soundtrack';
import SpinTimeComposed from '../Fields/Soundtrack/SpinTimeComposed';
import WheelStyleSelect from '../Fields/StyleSelect/StyleSelect';

interface WheelSettingsProps {
  nextWinner?: string;
  isLoadingSeed: boolean;
  controls: Wheel.SettingControls;
  children: ReactNode;
  renderSubmitButton?: (defaultButton: ReactNode) => ReactNode;
  direction?: 'row' | 'column';
  ticketData?: RevealedData | null;
  availableQuota?: number | null;
  isCreatingTicket?: boolean;
  ticketError?: Error | null;
}

const WheelSettings = (props: WheelSettingsProps) => {
  const {
    isLoadingSeed,
    controls,
    children,
    renderSubmitButton,
    ticketData,
    isCreatingTicket,
    availableQuota,
    ticketError,
  } = props;
  const { t } = useTranslation();
  const { control } = useFormContext<Wheel.Settings>();
  const { isSubmitting } = useFormState<Wheel.Settings>({ control });
  const format = useWatch<Wheel.Settings>({ name: 'format' });
  const dropoutVariant = useWatch<Wheel.Settings>({ name: 'dropoutVariant' });
  const [isNewDropoutFairnessInfoDismissed, setIsNewDropoutFairnessInfoDismissed] = useLocalStorageState(
    'wheelNewDropoutFairnessInfoDismissed',
    false,
  );
  const [isSettingsOpen, { toggle: toggleSettings }] = useDisclosure(false);

  const submitButton = (
    <Button loading={isLoadingSeed || isCreatingTicket} disabled={isSubmitting} variant='contained' type='submit'>
      {isSubmitting ? t('wheel.spinning') : t('wheel.spin')}
    </Button>
  );

  const docsUrl = useDocsUrl(DOCS_PAGES.wheel.settings.page);

  return (
    <>
      <FirstTimeHelpNotification
        featureKey='wheelSettingsHelpSeen'
        title={t('wheel.helpNotification.title')}
        message={
          <Trans
            i18nKey='wheel.helpNotification.message'
            components={{ 1: <Anchor href={docsUrl} underline='not-hover' target='_blank' />, 2: <b /> }}
          />
        }
      />
      <Stack gap='sm' mih={0}>
        <Group align='center' gap='xs'>
          {renderSubmitButton ? renderSubmitButton(submitButton) : submitButton}
          <div className='flex-1 flex-shrink-0'>
            <SpinTimeComposed disabled={isSubmitting} />
          </div>
          <WheelSoundtrackField />
          <Tooltip label={t(isSettingsOpen ? 'wheel.hideSettings' : 'wheel.showSettings')}>
            <ActionIcon size='xl' radius='md' variant='outline' onClick={toggleSettings}>
              <IconSettings size={28} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Collapse in={isSettingsOpen} transitionDuration={250}>
          <Stack gap='sm' style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            <WheelStyleSelect />
            <Stack gap='xxs'>
              {controls.mode && <WheelFormatField />}
              {format === WheelFormat.Dropout && (
                <>
                  <DropoutFormatField />
                  {dropoutVariant === DropoutVariant.New && !isNewDropoutFairnessInfoDismissed && (
                    <Alert
                      variant='light'
                      color='blue'
                      icon={<IconInfoCircle size={32} />}
                      withCloseButton
                      onClose={() => setIsNewDropoutFairnessInfoDismissed(true)}
                      styles={{
                        closeButton: {
                          ...({
                            '--cb-size': rem(26),
                            '--cb-icon-size': rem(20),
                          } as CSSProperties),
                        },
                      }}
                    >
                      {t('wheel.dropout.newVariantFairnessInfo')}
                    </Alert>
                  )}
                  <DropoutHelp />
                  {dropoutVariant === DropoutVariant.New && <NewDropoutDescription />}
                  {dropoutVariant === DropoutVariant.Classic && <ClassicDropoutDescription />}
                </>
              )}
            </Stack>
            {children}
            {controls.split && <SplitField />}
            {controls.randomOrg && (
              <RandomnessSourceField
                ticketData={ticketData}
                availableQuota={availableQuota}
                ticketError={ticketError}
              />
            )}
            <CoreImageField />
          </Stack>
        </Collapse>
      </Stack>
    </>
  );
};

export default WheelSettings;
