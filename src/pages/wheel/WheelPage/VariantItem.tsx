import { ActionIcon, Checkbox, Group, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Slot } from '@models/slot.model';

import styles from './VariantsPanel.module.css';

interface VariantItemProps {
  slot: Slot;
  color?: string;
  depth?: number;
  childColors?: Map<string, string>;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Slot>) => void;
  onAddChild: (parentId: string) => void;
}

const VariantItem: FC<VariantItemProps> = ({
  slot,
  color,
  depth = 0,
  childColors,
  onDelete,
  onUpdate,
  onAddChild,
}) => {
  const { t } = useTranslation();

  const handleNameChange = useCallback(
    (val: string) => onUpdate(slot.id, { name: val }),
    [slot.id, onUpdate],
  );

  const handleOwnerChange = useCallback(
    (val: string) => onUpdate(slot.id, { owner: val }),
    [slot.id, onUpdate],
  );

  const handleMatryoshkaToggle = useCallback(
    (checked: boolean) => {
      onUpdate(slot.id, {
        isMultiLayer: checked,
        children: checked ? (slot.children ?? []) : [],
      });
    },
    [slot.id, slot.children, onUpdate],
  );

  const childCount = slot.children?.length ?? 0;

  return (
    <div className={styles.variantItem} style={{ marginLeft: depth * 20 }}>
      <Group gap={8} wrap='nowrap' align='center'>
        <div className={styles.colorDot} style={{ backgroundColor: color ?? '#888' }} />
        <Text className={styles.variantName} fw={600} size='sm' lineClamp={1}>
          {slot.name || '—'}
        </Text>
        <ActionIcon
          variant='subtle'
          size='xs'
          color='dimmed'
          onClick={() => onDelete(slot.id)}
          className={styles.deleteButton}
        >
          <IconX size={14} />
        </ActionIcon>
      </Group>

      <Group gap={8} mt={4} wrap='nowrap' align='center'>
        <TextInput
          value={slot.owner ?? ''}
          onChange={(e) => handleOwnerChange(e.currentTarget.value)}
          placeholder={t('wheel.lotOwnerPlaceholder', 'Author...')}
          size='xs'
          className={styles.ownerInput}
        />
        <Checkbox
          checked={!!slot.isMultiLayer}
          onChange={(e) => handleMatryoshkaToggle(e.currentTarget.checked)}
          label={t('wheel.matryoshkaShort', 'Матрёшка')}
          size='xs'
        />
        {slot.isMultiLayer && childCount > 0 && (
          <Text size='xs' c='dimmed'>
            ({childCount})
          </Text>
        )}
      </Group>

      {slot.isMultiLayer && (
        <Stack gap={4} mt={4}>
          {slot.children?.map((child) => (
            <VariantItem
              key={child.id}
              slot={child}
              color={childColors?.get(child.id)}
              depth={depth + 1}
              childColors={childColors}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
            />
          ))}
          <UnstyledButton
            className={styles.addChildButton}
            onClick={() => onAddChild(slot.id)}
            style={{ marginLeft: (depth + 1) * 20 }}
          >
            <Text size='xs' c='violet'>+ {t('wheel.addItem', 'Добавить')}</Text>
          </UnstyledButton>
        </Stack>
      )}
    </div>
  );
};

export default VariantItem;
