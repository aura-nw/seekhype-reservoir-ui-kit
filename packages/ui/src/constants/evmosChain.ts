import { defineChain } from "viem";

export const evmosTestnet = /*#__PURE__*/ defineChain({
  id: 9_000,
  name: 'Evmos Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Evmos',
    symbol: 'EVMOS',
  },
  rpcUrls: {
    default: {
      http: ['https://evmos-testnet.drpc.org/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Evmos Testnet Block Explorer',
      url: 'https://testnet.escan.live/',
    },
  },
})
