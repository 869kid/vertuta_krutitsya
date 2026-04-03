import { AppShell, Stack } from '@mantine/core';
import { TFunction } from 'i18next';
import { useLayoutEffect, useMemo, useState } from 'react';

import { flattenMenuGroups, useActiveMenu, useMenuGroups } from '@constants/menuItems.constants';
import { MenuItem } from '@models/common.model';

import NavbarGroup from './Group';

interface AppNavbarProps {
  onActiveMenuChange: (activeMenu: MenuItem | undefined) => void;
  isMobile: boolean;
  closeNavbar: () => void;
  isNavbarExpanded: boolean;
  t: TFunction;
  showDrawer: () => void;
  hideDrawer: () => void;
}

export const AppNavbar = ({ onActiveMenuChange }: AppNavbarProps) => {
  const menuGroups = useMenuGroups();
  const menuItems = useMemo(() => flattenMenuGroups(menuGroups), [menuGroups]);
  const activeMenu = useActiveMenu(menuItems);
  const [nextActiveMenu, setNextActiveMenu] = useState<MenuItem | undefined>(undefined);

  useLayoutEffect(() => {
    onActiveMenuChange(activeMenu);
  }, [activeMenu, onActiveMenuChange]);

  return (
    <AppShell.Navbar withBorder={false} bg='transparent'>
      <Stack justify='space-between' h='100%' pl='md' pr={0} py='lg'>
        <Stack gap='sm'>
          <NavbarGroup
            items={menuGroups.primary}
            activeMenu={activeMenu}
            nextActiveMenu={nextActiveMenu}
            onMouseDown={setNextActiveMenu}
            onMouseUp={() => setNextActiveMenu(undefined)}
          />
          <NavbarGroup
            items={menuGroups.secondary}
            activeMenu={activeMenu}
            nextActiveMenu={nextActiveMenu}
            onMouseDown={setNextActiveMenu}
            onMouseUp={() => setNextActiveMenu(undefined)}
          />
        </Stack>
        <NavbarGroup
          items={menuGroups.tertiary}
          activeMenu={activeMenu}
          nextActiveMenu={nextActiveMenu}
          onMouseDown={setNextActiveMenu}
          onMouseUp={() => setNextActiveMenu(undefined)}
        />
      </Stack>
    </AppShell.Navbar>
  );
};
