import { defineChain } from 'viem'

export const auraEVMTestnet = /*#__PURE__*/ defineChain({
  id: 1235,
  name: 'Aura EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'aura',
    symbol: 'aura',
  },
  rpcUrls: {
    default: {
      http: ['https://jsonrpc.dev.aura.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Aura EVM Block Explorer',
      url: 'https://explorer.dev.aura.network/',
    },
  },
})
