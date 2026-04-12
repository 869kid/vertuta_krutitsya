import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import classes from '@App/entrypoint/App.module.css';
import { AppHeader } from '@App/entrypoint/AppHeader';
import { AppMain } from '@App/entrypoint/AppMain';
import { AppNavbar } from '@App/entrypoint/navbar/AppNavbar.tsx';
import { PortalContextProvider } from '@App/storage/portalContext';
import { COLORS } from '@constants/color.constants';
import AutoloadAutosave from '@domains/auction/archive/ui/AutoloadAutosave';
import { MenuItem } from '@models/common.model';
import { RootState } from '@reducers';
import { useIsMobile } from '@shared/lib/ui';

import { loadUserData, setAucSettings } from '../../reducers/AucSettings/AucSettings';
import { loadHistory, loadRound } from '../../reducers/Matryoshka/Matryoshka';
import { loadMatryoshkaState } from '../../store';
import { getCookie } from '../../utils/common.utils';
import { isBrowser } from '../../utils/ssr.ts';

import type { ThunkDispatch } from 'redux-thunk';

const hasToken = isBrowser && !!getCookie('userSession');

let openDriverTimeout: any;

const App: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [isHovered, setIsDrawerOpen] = useState(false);
  const { username } = useSelector((root: RootState) => root.user);
  const [activeMenu, setActiveMenu] = useState<MenuItem | undefined>();
  const isColorResetDone = useRef(localStorage.getItem('isColorResetDone') === 'true');

  const [isNavbarOpened, mobileNavbar] = useDisclosure();
  const isMobile = useIsMobile();

  if (!isColorResetDone.current && !hasToken) {
    localStorage.setItem('isColorResetDone', 'true');
    isColorResetDone.current = true;
    dispatch(setAucSettings({ primaryColor: COLORS.THEME.PRIMARY }));
  }

  const showDrawer = useCallback(() => {
    openDriverTimeout = setTimeout(() => setIsDrawerOpen(true), 70);
  }, []);
  const hideDrawer = useCallback(() => {
    clearTimeout(openDriverTimeout);
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      await loadUserData(dispatch);
    };

    if (hasToken) {
      loadUser();
    }

    const saved = loadMatryoshkaState();
    if (saved) {
      if (saved.history?.length) dispatch(loadHistory(saved.history));
      if (saved.currentRound > 1) dispatch(loadRound(saved.currentRound));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const isNavbarExpanded = useMemo(() => {
    return (isHovered && activeMenu?.navbarFixedState !== 'closed') || activeMenu?.navbarFixedState === 'opened';
  }, [isHovered, activeMenu]);

  return (
    <PortalContextProvider>
      <AppShell
        padding={0}
        className='bg-paper-800'
        header={{ height: { base: 50, sm: 0 } }}
        navbar={{ width: 70, breakpoint: 'sm', collapsed: { mobile: !isNavbarOpened } }}
        transitionDuration={isMobile ? 200 : 0}
      >
        <AppHeader isNavbarOpened={isNavbarOpened} toggleNavbar={mobileNavbar.toggle} activeMenu={activeMenu} t={t} />
        <AppNavbar
          onActiveMenuChange={setActiveMenu}
          isMobile={isMobile}
          closeNavbar={mobileNavbar.close}
          isNavbarExpanded={isNavbarExpanded}
          t={t}
          showDrawer={showDrawer}
          hideDrawer={hideDrawer}
        />
        <AppMain />
      </AppShell>
      <AutoloadAutosave />
    </PortalContextProvider>
  );
};

export default App;
