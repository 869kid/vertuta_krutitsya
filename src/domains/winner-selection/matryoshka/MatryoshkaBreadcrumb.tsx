import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';

import { NavEntry } from '@models/slot.model';

interface MatryoshkaBreadcrumbProps {
  stack: NavEntry[];
  onNavigate: (index: number) => void;
}

const MatryoshkaBreadcrumb = ({ stack, onNavigate }: MatryoshkaBreadcrumbProps) => {
  if (stack.length === 0) return null;

  return (
    <Breadcrumbs separator='→'>
      <Anchor onClick={() => onNavigate(0)} style={{ cursor: 'pointer' }}>
        <IconHome size={16} />
      </Anchor>
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
          <Anchor key={entry.slotId} onClick={() => onNavigate(index + 1)} size='sm' style={{ cursor: 'pointer' }}>
            {entry.slotName}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
};

export default MatryoshkaBreadcrumb;
