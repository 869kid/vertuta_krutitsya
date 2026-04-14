import './assets/i18n/index.ts';

import { renderToString } from 'react-dom/server';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MantineProvider as MantineBaseProvider, createTheme } from '@mantine/core';

import i18n, { i18nInitPromise } from '@assets/i18n/index.ts';
import rootReducer from '@reducers/index.ts';
import { initStore, store } from './store.ts';
import App from './App/entrypoint/App.tsx';

initStore(rootReducer);

const ssrTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
});

interface HeadData {
  title: string;
  description: string;
  isIndexed: boolean;
  structuredData: string | null;
  localeLinks: string[];
}

function getHeadData(route: string): HeadData {
  const metadata = i18n.t(`metadata.${route}`, { returnObjects: true, defaultValue: null });
  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';

  const title = isObject(metadata) ? String(metadata.title) : 'Pointauc | Live Auction for Streamers';
  const description = isObject(metadata)
    ? String(metadata.description)
    : 'Host interactive auctions where your viewers can bid on games, videos, and more using Twitch channel points or donations.';
  const isIndexed = isObject(metadata);

  const structuredData =
    route === '/'
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Pointauc',
          alternateName: ['Stream Auction', 'Twitch Auction'],
          url: 'https://pointauc.com/',
        })
      : null;

  return { title, description, isIndexed, structuredData, localeLinks: [] };
}

export async function render(route: string) {
  await i18nInitPromise;

  const queryClient = new QueryClient();

  const router = createMemoryRouter(
    [
      {
        element: <Outlet />,
        children: [{ path: '*', element: <App /> }],
      },
    ],
    { initialEntries: [route] },
  );

  const html = renderToString(
    <Provider store={store}>
      <MantineBaseProvider defaultColorScheme="dark" theme={ssrTheme}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MantineBaseProvider>
    </Provider>,
  );

  const head = getHeadData(route);

  return { html, head };
}
