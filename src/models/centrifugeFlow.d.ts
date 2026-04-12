namespace CentrifugeFlow {
  import * as Integration from '@models/integration';

  type Version = '2' | 'websocketV2';

  interface AdapterParams {
    url: string;
    events: any;
    parseMessage: (data: any) => any;
    userId: string;
    subscribeEndpoint: string;
    channel: string;
    subscribeParams?: any;
    subscribeHeaders?: any;
  }

  declare class Adapter {
    constructor(params: AdapterParams);
    connect: (token: string) => Promise<void>;
    disconnect: () => Promise<void>;
  }
}
