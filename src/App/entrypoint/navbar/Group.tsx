import { Paper, Stack } from '@mantine/core';

import { MenuItem } from '@models/common.model';

import { AppNavbarItem } from './AppNavbarItem';

interface NavbarGroupProps {
  items: MenuItem[];
  activeMenu: MenuItem | undefined;
  nextActiveMenu: MenuItem | undefined;
  onMouseDown: (menuItem: MenuItem) => void;
  onMouseUp: (menuItem: MenuItem) => void;
}

const NavbarGroup = ({ items, activeMenu, nextActiveMenu, onMouseDown, onMouseUp }: NavbarGroupProps) => {
  return (
    <Paper className='bg-paper-600' p={4} radius='md'>
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
