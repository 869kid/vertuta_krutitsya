import { ActionIcon, Checkbox, Group, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Slot } from '@models/slot.model';
import AuthorSelect from '@shared/ui/AuthorSelect/AuthorSelect';

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

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(slot.name);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(slot.name);
  }, [slot.name]);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== slot.name) {
      onUpdate(slot.id, { name: trimmed });
    } else {
      setEditValue(slot.name);
    }
    setIsEditing(false);
  }, [editValue, slot.name, slot.id, onUpdate]);

  const cancelRename = useCallback(() => {
    setEditValue(slot.name);
    setIsEditing(false);
  }, [slot.name]);

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
        {isEditing ? (
          <TextInput
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            size='xs'
            className={styles.variantNameInput}
          />
        ) : (
          <UnstyledButton onClick={() => setIsEditing(true)} className={styles.variantName}>
            <Text fw={600} size='sm' lineClamp={1}>
              {slot.name || '—'}
            </Text>
          </UnstyledButton>
        )}
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
        <AuthorSelect
          value={slot.owner ?? ''}
          onChange={handleOwnerChange}
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
