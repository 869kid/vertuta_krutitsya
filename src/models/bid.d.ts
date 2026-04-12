namespace Bid {
  import { ReactNode } from 'react';
  import * as Integration from '@models/integration';

  type Source = Integration.ID | 'API' | 'Mock';
  type Item = Integration.Purchase;
  type Action = 'return' | 'accept';

  interface BaseActionConfig {
    type: Action;
    Title: (props: any) => ReactNode;
    canApply(bid: any): boolean;
  }

  type ActionConfig = BaseActionConfig;
}
