import { Paper, Stack } from '@mantine/core';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';

import { MenuItem } from '@models/common.model';
import { RootState } from '@reducers/index';
import ROUTES from '@constants/routes.constants';

import { AppNavbarItem } from './AppNavbarItem';

interface NavbarGroupProps {
  items: MenuItem[];
  activeMenu: MenuItem | undefined;
  nextActiveMenu: MenuItem | undefined;
  onMouseDown: (menuItem: MenuItem) => void;
  onMouseUp: (menuItem: MenuItem) => void;
}

const NavbarGroup = ({ items, activeMenu, nextActiveMenu, onMouseDown, onMouseUp }: NavbarGroupProps) => {
  const path = useLocation().pathname;
  const customBackground = useSelector((state: RootState) => state.aucSettings.settings.background);

  return (
    <Paper
      className={clsx(`bg-paper-600`, { [`bg-paper-transparent-900`]: customBackground && path === ROUTES.HOME })}
      p={4}
      radius='md'
    >
      <Stack gap='xxs'>
        {items.map((menuItem) => {
          const isActive = activeMenu?.path === menuItem.path;
          return (
            <AppNavbarItem
              key={menuItem.path}
              menuItem={menuItem}
              isActive={isActive}
              isNextActive={nextActiveMenu ? nextActiveMenu?.path === menuItem.path : isActive}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

export default NavbarGroup;
