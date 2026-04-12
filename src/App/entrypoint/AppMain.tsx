import { AppShell } from '@mantine/core';
import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Metadata from '@components/Metadata';
import ROUTES from '@constants/routes.constants';
import WheelPage from '@pages/wheel/WheelPage/WheelPage';

import classes from './App.module.css';

const HistoryDashboard = lazy(() => import('@pages/history/HistoryDashboard'));

export const AppMain = () => {
  return (
    <AppShell.Main className={classes.main}>
      <Metadata />
      <Routes>
        <Route path={ROUTES.HOME} element={<WheelPage />} />
        <Route path={ROUTES.WHEEL} element={<WheelPage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryDashboard />} />
      </Routes>
    </AppShell.Main>
  );
};
