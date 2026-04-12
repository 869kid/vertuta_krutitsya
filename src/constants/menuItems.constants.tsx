import HistoryIcon from '@mui/icons-material/History';
import { useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import WheelSvg from '@assets/icons/wheel.svg?react';
import { MenuItem } from '@models/common.model';

import ROUTES from './routes.constants';

export type MenuGroups = {
  primary: MenuItem[];
  secondary: MenuItem[];
  tertiary: MenuItem[];
};

const MENU_ITEMS: MenuItem[] = [];

export const useActiveMenu = (items: MenuItem[]): MenuItem | undefined => {
  const { pathname } = useLocation();

  return items.find((item) => matchPath(item.pathMatch ?? item.path, pathname) !== null);
};

export const flattenMenuGroups = (groups: MenuGroups): MenuItem[] => Object.values(groups).flat();

export const useMenuGroups = (): MenuGroups => {
  return useMemo(
    () => ({
      primary: [
        { title: 'menu.items.wheel.title', icon: <WheelSvg />, path: ROUTES.HOME, navbarFixedState: 'closed' },
      ],
      secondary: [
        { title: 'menu.items.history.title', icon: <HistoryIcon />, path: ROUTES.HISTORY },
      ],
      tertiary: [],
    }),
    [],
  );
};

export default MENU_ITEMS;
