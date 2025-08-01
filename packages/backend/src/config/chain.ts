import { Chain } from 'viem'

export const somniaChain: Chain = {
    id: 50312,
    name: 'Somnia',
    nativeCurrency: {
        decimals: 18,
        name: 'STT',
        symbol: 'STT',
    },
    rpcUrls: {
        default: {
            http: ['https://dream-rpc.somnia.network'],
        },
        public: {
            http: ['https://dream-rpc.somnia.network'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Somnia Explorer',
            url: 'https://explorer.somnia.network',
        },
    },
} as const;
