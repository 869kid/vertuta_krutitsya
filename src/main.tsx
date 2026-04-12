import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import '@styles/index.scss';
import './index.css';
import '@assets/i18n/index.ts';

import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';
import 'dayjs/locale/ru';
import 'dayjs/locale/be';
import 'dayjs/locale/uk';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';

import { AppErrorBoundary } from '@App/error-tracking/AppErrorBoundary';
import { RouteErrorBoundary } from '@App/error-tracking/RouteErrorBoundary';
import i18n from '@assets/i18n/index.ts';
import rootReducer from '@reducers/index.ts';
import { initErrorTracking } from '@shared/lib/error-tracking/service';
import { createConfiguredErrorTrackingProvider } from '@shared/lib/error-tracking/providers';
import MantineProvider from '@shared/mantine/MantineProvider.tsx';
import archiveApi from '@domains/auction/archive/api/IndexedDBAdapter';
import { slotsToArchivedLots } from '@domains/auction/archive/lib/converters';
import { queryClient } from '@shared/lib/react-query/client.ts';

import App from './App/entrypoint/App.tsx';
import { initStore, store } from './store.ts';

initErrorTracking(createConfiguredErrorTrackingProvider());
initStore(rootReducer);

export { store };

dayjs.extend(relativeTime);
dayjs.extend(duration);

const initialLanguage = i18n.language === 'ua' ? 'uk' : i18n.language;
dayjs.locale(initialLanguage);

i18n.on('languageChanged', (language) => {
  const dayjsLocale = language === 'ua' ? 'uk' : language;
  dayjs.locale(dayjsLocale);
});

window.onbeforeunload = (): undefined => {
  const { slots } = store.getState().slots;

  if (slots.length > 1) {
    const lots = slotsToArchivedLots(slots);
    archiveApi.upsertAutosave({ lots }).catch((err: unknown) => console.error('Final autosave failed:', err));
  }

  return undefined;
};

const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: (
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <Notifications limit={4} autoClose={3000} />
          <Outlet />
        </QueryClientProvider>
      </MantineProvider>
    ),
    children: [{ path: '*', element: <App /> }],
  },
]);

const container = document.getElementById('root');
const root = createRoot(container!);

const portalRoot = document.createElement('div');
portalRoot.id = 'portal-root';
document.body.appendChild(portalRoot);

root.render(
  <StrictMode>
    <Provider store={store}>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </Provider>
  </StrictMode>,
);
