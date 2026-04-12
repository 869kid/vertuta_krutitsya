import { FC, ReactNode } from 'react';
import { Card, Image, Text, Group } from '@mantine/core';

import { VideoSnippet } from '@models/youtube';

interface VideoPreviewProps extends VideoSnippet {
  blurred?: boolean;
  thumbnailContent?: ReactNode;
  onSelect?: (videoId: string) => void;
}

const VideoPreview: FC<VideoPreviewProps> = ({ id: videoId, snippet, thumbnailContent, onSelect }) => {
  const thumbnailUrl = snippet.thumbnails.high?.url ?? snippet.thumbnails.medium?.url ?? snippet.thumbnails.default?.url;

  return (
    <Card withBorder padding='xs' radius='md' onClick={() => onSelect?.(videoId.videoId)} style={{ cursor: onSelect ? 'pointer' : undefined }}>
      <div style={{ position: 'relative' }}>
        {thumbnailUrl && <Image src={thumbnailUrl} alt={snippet.title} radius='sm' h={120} fit='cover' />}
        {thumbnailContent && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {thumbnailContent}
          </div>
        )}
      </div>
      <Group mt='xs' gap='xs'>
        <Text size='sm' fw={500} lineClamp={1}>{snippet.title}</Text>
        <Text size='xs' c='dimmed'>{snippet.channelTitle}</Text>
      </Group>
    </Card>
  );
};

export default VideoPreview;
