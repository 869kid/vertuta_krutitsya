import { ActionIcon, Checkbox, Group, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Slot } from '@models/slot.model';
import { WheelItem } from '@models/wheel.model';
import AuthorSelect from '@shared/ui/AuthorSelect/AuthorSelect';

import VariantItem from './VariantItem';
import styles from './VariantsPanel.module.css';

interface VariantsPanelProps {
  slots: Slot[];
  wheelItems: WheelItem[];
  onAdd: (name: string, isMultiLayer: boolean, parentId?: string, owner?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Slot>) => void;
  importButton?: ReactNode;
  isReadOnly?: boolean;
}

const VariantsPanel: FC<VariantsPanelProps> = ({
  slots,
  wheelItems,
  onAdd,
  onDelete,
  onUpdate,
  importButton,
  isReadOnly = false,
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newIsMultiLayer, setNewIsMultiLayer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    wheelItems.forEach((item) => map.set(item.id.toString(), item.color));
    return map;
  }, [wheelItems]);

  const buildChildColorMap = useCallback(
    (children: Slot[] | undefined): Map<string, string> => {
      const map = new Map<string, string>();
      if (!children) return map;
      children.forEach((child) => {
        const c = colorMap.get(child.id);
        if (c) map.set(child.id, c);
      });
      return map;
    },
    [colorMap],
  );

  const handleAddTopLevel = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed, newIsMultiLayer, undefined, newOwner || undefined);
    setNewName('');
    setNewOwner('');
    setNewIsMultiLayer(false);
    inputRef.current?.focus();
  }, [newName, newOwner, newIsMultiLayer, onAdd]);

  const handleAddChild = useCallback(
    (parentId: string, defaultOwner?: string) => {
      const name = t('wheel.newItem', 'New item');
      onAdd(name, false, parentId, defaultOwner);
    },
    [onAdd, t],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTopLevel();
      }
    },
    [handleAddTopLevel],
  );

  return (
    <div className={styles.panel}>
      <Text fw={700} size='lg' mb='xs'>
        {t('wheel.variants', 'Варианты')}
      </Text>

      <ScrollArea className={styles.scrollArea} offsetScrollbars>
        <Stack gap={8}>
          <div className={styles.addCard}>
            <Group gap={8} wrap='nowrap' align='center'>
              <TextInput
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('wheel.lotNamePlaceholder', 'Variant name...')}
                size='xs'
                variant='unstyled'
                className={styles.addCardInput}
              />
              <ActionIcon
                variant='outline'
                size='sm'
                color={newName.trim() ? 'primary' : 'dimmed'}
                disabled={!newName.trim()}
                onClick={handleAddTopLevel}
                className={styles.addCardButton}
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Group>
            <Group gap={8} mt={4} wrap='nowrap' align='center'>
              <AuthorSelect
                value={newOwner}
                onChange={setNewOwner}
                size='xs'
                className={styles.ownerInput}
              />
              <Checkbox
                checked={newIsMultiLayer}
                onChange={(e) => setNewIsMultiLayer(e.currentTarget.checked)}
                label={t('wheel.matryoshkaShort', 'Матрёшка')}
                size='xs'
              />
            </Group>
          </div>
          {slots.map((slot) => (
            <VariantItem
              key={slot.id}
              slot={slot}
              color={colorMap.get(slot.id)}
              childColors={buildChildColorMap(slot.children)}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddChild={handleAddChild}
              isReadOnly={isReadOnly}
            />
          ))}
        </Stack>
      </ScrollArea>

      {importButton}
    </div>
  );
};

export default VariantsPanel;
