import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

import { NavEntry } from '@models/slot.model';

interface MatryoshkaNavigationProps {
  stack: NavEntry[];
  onNavigate: (index: number) => void;
}

const MatryoshkaNavigation = ({ stack, onNavigate }: MatryoshkaNavigationProps) => {
  if (stack.length === 0) return null;

  return (
    <Breadcrumbs separator={<IconChevronRight size={14} />} mb='xs'>
      {stack.map((entry, index) => {
        const isLast = index === stack.length - 1;

        if (isLast) {
          return (
            <Text key={entry.slotId} fw={600} size='sm'>
              {entry.slotName}
            </Text>
          );
        }

        return (
          <Anchor
            key={entry.slotId}
            onClick={() => onNavigate(index + 1)}
            size='sm'
            style={{ cursor: 'pointer' }}
          >
            {entry.slotName}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
};

export default MatryoshkaNavigation;
