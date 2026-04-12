import { Group, Text } from '@mantine/core';
import HighlightIcon from '@mui/icons-material/Highlight';
import StarIcon from '@mui/icons-material/Star';
import classNames from 'classnames';
import { useContext } from 'react';

import { WheelContext } from '@domains/winner-selection/wheel-of-random/settings/ui/Context/WheelContext';
import { WheelItemWithMetadata } from '@models/wheel.model.ts';

import classes from './Item.module.css';

interface Props {
  item: WheelItemWithMetadata;
  disabled: boolean;
  actionable?: boolean;
}

const Item = ({ item, disabled, actionable }: Props) => {
  const { name, color } = item;
  const { controller } = useContext(WheelContext);

  const onHover = () => {
    if (disabled || !actionable) return;
    controller.current?.highlight(item.id);
  };

  const onLeave = () => {
    if (disabled || !actionable) return;
    controller.current?.resetStyles();
  };

  return (
    <Group
      className={classNames(classes.item, { [classes.disabled]: disabled })}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      { item.isFavorite && <StarIcon /> }
      <Text className={classes.name}>{name}</Text>
      <div className={classes.color}>
        {!disabled && (
          <>
            {actionable && <HighlightIcon className={classes.findIcon} />}
            <div style={{ color }} />
          </>
        )}
      </div>
    </Group>
  );
};

export default Item;
