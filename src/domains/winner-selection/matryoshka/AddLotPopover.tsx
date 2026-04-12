import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Popover,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface NewLotData {
  name: string;
  amount: number;
  owner: string;
  isMultiLayer: boolean;
}

interface AddLotPopoverProps {
  onAdd: (data: NewLotData) => void;
  compact?: boolean;
}

const AddLotPopover = ({ onAdd, compact = false }: AddLotPopoverProps) => {
  const [opened, handlers] = useDisclosure(false);
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(1);
  const [owner, setOwner] = useState('');
  const [isMultiLayer, setIsMultiLayer] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setAmount(1);
    setOwner('');
    setIsMultiLayer(false);
  }, []);

  const handleSubmit = useCallback(() => {
    onAdd({
      name: name.trim() || 'New item',
      amount: amount || 1,
      owner: owner.trim(),
      isMultiLayer,
    });
    resetForm();
    handlers.close();
  }, [name, amount, owner, isMultiLayer, onAdd, resetForm, handlers]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <Popover opened={opened} onChange={handlers.toggle} position='bottom-start' shadow='lg' width={320}>
      <Popover.Target>
        {compact ? (
          <Tooltip label={t('wheel.addItem', 'Add variant')}>
            <ActionIcon variant='light' size='lg' onClick={handlers.toggle}>
              <IconPlus size={18} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            leftSection={<IconPlus size={16} />}
            variant='light'
            size='sm'
            onClick={handlers.toggle}
          >
            {t('wheel.addItem', 'Add variant')}
          </Button>
        )}
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap='sm'>
          <Text fw={600} size='sm'>
            {t('wheel.addItem', 'Add variant')}
          </Text>

          <TextInput
            label={t('wheel.lotName', 'Name')}
            placeholder={t('wheel.lotNamePlaceholder', 'Variant name...')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            data-autofocus
          />

          <NumberInput
            label={t('wheel.lotAmount', 'Weight')}
            placeholder='1'
            value={amount}
            onChange={(val) => setAmount(typeof val === 'number' ? val : 1)}
            min={1}
            onKeyDown={handleKeyDown}
          />

          <TextInput
            label={t('wheel.lotOwner', 'Author')}
            placeholder={t('wheel.lotOwnerPlaceholder', 'Author name...')}
            value={owner}
            onChange={(e) => setOwner(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />

          <Switch
            label={t('wheel.isMatryoshka', 'Matryoshka (nested wheel)')}
            checked={isMultiLayer}
            onChange={(e) => setIsMultiLayer(e.currentTarget.checked)}
            description={t('wheel.matryoshkaHint', 'Contains sub-items that form their own wheel')}
          />

          <Group justify='flex-end' mt='xs'>
            <Button variant='subtle' size='xs' onClick={handlers.close}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size='xs' onClick={handleSubmit}>
              {t('wheel.addItem', 'Add')}
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default AddLotPopover;
