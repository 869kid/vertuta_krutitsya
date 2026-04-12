import { Button, Group, ScrollArea, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Slot } from '@models/slot.model';
import { WheelItem } from '@models/wheel.model';

import VariantItem from './VariantItem';
import styles from './VariantsPanel.module.css';

interface VariantsPanelProps {
  slots: Slot[];
  wheelItems: WheelItem[];
  onAdd: (name: string, isMultiLayer: boolean, parentId?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Slot>) => void;
  importButton?: ReactNode;
}

const VariantsPanel: FC<VariantsPanelProps> = ({
  slots,
  wheelItems,
  onAdd,
  onDelete,
  onUpdate,
  importButton,
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
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
    onAdd(trimmed, false);
    setNewName('');
    inputRef.current?.focus();
  }, [newName, onAdd]);

  const handleAddChild = useCallback(
    (parentId: string) => {
      const name = t('wheel.newItem', 'New item');
      onAdd(name, false, parentId);
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

      <Group gap='xs' mb='sm'>
        {importButton}
        <Button
          leftSection={<IconPlus size={16} />}
          variant='filled'
          size='xs'
          onClick={handleAddTopLevel}
          disabled={!newName.trim()}
        >
          {t('wheel.addItem', 'Добавить')}
        </Button>
      </Group>

      <TextInput
        ref={inputRef}
        value={newName}
        onChange={(e) => setNewName(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('wheel.lotNamePlaceholder', 'Variant name...')}
        size='sm'
        mb='sm'
      />

      <ScrollArea className={styles.scrollArea} offsetScrollbars>
        <Stack gap={8}>
          {slots.map((slot) => (
            <VariantItem
              key={slot.id}
              slot={slot}
              color={colorMap.get(slot.id)}
              childColors={buildChildColorMap(slot.children)}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddChild={handleAddChild}
            />
          ))}
        </Stack>
      </ScrollArea>
    </div>
  );
};

export default VariantsPanel;
