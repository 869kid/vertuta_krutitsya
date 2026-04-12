import { Badge, Button, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconPlayerSkipForward } from '@tabler/icons-react';

import { Slot } from '@models/slot.model';

interface MatryoshkaWinnerModalProps {
  winner: Slot;
  opened: boolean;
  onClose: () => void;
  onEnterSubWheel?: () => void;
  onNextRound: () => void;
}

const MatryoshkaWinnerModal = ({
  winner,
  opened,
  onClose,
  onEnterSubWheel,
  onNextRound,
}: MatryoshkaWinnerModalProps) => {
  const hasChildren = winner.isMultiLayer && winner.children && winner.children.length > 0;

  return (
    <Modal opened={opened} onClose={onClose} centered size='md' withCloseButton={false}>
      <Stack align='center' gap='md' py='md'>
        <Title order={2} ta='center'>
          {winner.name || '(unnamed)'}
        </Title>

        {hasChildren && (
          <Badge size='lg' variant='light' color='violet'>
            Matryoshka — {winner.children!.length} inside
          </Badge>
        )}

        <Group gap='sm' mt='md'>
          {hasChildren ? (
            <>
              <Button
                size='lg'
                leftSection={<IconArrowRight size={20} />}
                onClick={onEnterSubWheel}
                variant='filled'
              >
                Enter sub-wheel
              </Button>
              <Button size='lg' variant='subtle' onClick={onClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                size='lg'
                leftSection={<IconPlayerSkipForward size={20} />}
                onClick={onNextRound}
                variant='filled'
              >
                Next round
              </Button>
              <Button size='lg' variant='subtle' onClick={onClose}>
                Close
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};

export default MatryoshkaWinnerModal;
