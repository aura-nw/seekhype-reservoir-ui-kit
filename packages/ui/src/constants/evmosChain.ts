import { defineChain } from "viem";

export const auraEVMTestnet = /*#__PURE__*/ defineChain({
  id: 1236,
  name: 'Aura EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'aura',
    symbol: 'aura',
  },
  rpcUrls: {
    default: {
      http: ['https://jsonrpc.serenity.aura.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Aura EVM Block Explorer',
      url: 'https://serenity.aurascan.io/',
    },
  },
})
