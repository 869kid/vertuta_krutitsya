import { Badge, Button, Modal, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';

import { Slot } from '@models/slot.model';

interface MatryoshkaSegmentModalProps {
  slot: Slot | null;
  opened: boolean;
  onClose: () => void;
  onEnter: () => void;
}

const MatryoshkaSegmentModal = ({ slot, opened, onClose, onEnter }: MatryoshkaSegmentModalProps) => {
  if (!slot) return null;

  return (
    <Modal opened={opened} onClose={onClose} centered size='sm' withCloseButton={false}>
      <Stack align='center' gap='md' py='md'>
        <Title order={3} ta='center'>
          {slot.name || '(unnamed)'}
        </Title>
        <Badge size='lg' variant='light' color='violet'>
          Matryoshka — {slot.children?.length ?? 0} inside
        </Badge>
        <Button fullWidth leftSection={<IconArrowRight size={18} />} onClick={onEnter} variant='filled'>
          Enter
        </Button>
        <Button fullWidth variant='subtle' onClick={onClose}>
          Close
        </Button>
      </Stack>
    </Modal>
  );
};

export default MatryoshkaSegmentModal;
