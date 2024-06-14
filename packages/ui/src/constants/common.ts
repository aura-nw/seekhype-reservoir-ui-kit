export const ASK1_1_MODULE_ADDRESS =
  '0xc3A73d1b9870FEdDb782237aa8AF50167a5016A9'
export const ZORA_MODULE_MANAGER_ADDRESS =
  '0x072e1b72e39aa018de54091CF6625dBDf227b3B4'
export const ERC721TRANSFERHELPER = '0x6944F3183F54757a8deaC2aEb9d4D3d64cb985f1'

// not in use
export const RoyaltyRegistry = '0x727A80Eb575c2d0397a594De24bAb97165D12705'
export const ERC20TransferHelper = '0x71B65250BF5ED67321D318A3a7dB46c7616fa154'
export const RoyaltyEngineV1 = '0x8E4B6D854cB9acaD86435D1E396017e1dAb3220A'
export const ZoraProtocolFeeSettings =
  '0xCFE3456274bE608f2aBf92d0f7d952712D4F3275'
export const WETH = '0x5Db8A2543e7e3Add18389C5ED63757A46A4848C1'

export const ContractConfig = {
  // dev
  [1235 as number]: {
    ASK1_1_MODULE_ADDRESS: '0x3ca4841C584afd6fa1AB248cE0F4876d1CEBd09C',
    ZORA_MODULE_MANAGER_ADDRESS: '0x6B1Cc558DA2f0d909aD16FA29F2D74bF7A8cA6B4',
    ERC721TRANSFERHELPER: '0x9f075Deab9a7433f0A5541d235a57db1cA491E0a',

    RoyaltyRegistry: '0x9A1945e4A316708631332BF7EC4fA8A2f6C6E2f8',
    ERC20TransferHelper: '0xbeA9f83Dc816f0Df3F7fB43a288BE9fF211C3E7A',
    RoyaltyEngineV1: '0xA1b5001fbda9179CBe69DfBEED78be1EC900d523',
    ZoraProtocolFeeSettings: '0x8a914102864dEd8B134E7338e2a54b8f6eb7cb0e',
    WETH: '0x7C258D32e0C5ADda30d18194870b56A38E2EBBbC',
  },
  // serenity
  [1236 as number]: {
    ASK1_1_MODULE_ADDRESS: '0xc3A73d1b9870FEdDb782237aa8AF50167a5016A9',
    ZORA_MODULE_MANAGER_ADDRESS: '0x072e1b72e39aa018de54091CF6625dBDf227b3B4',
    ERC721TRANSFERHELPER: '0x6944F3183F54757a8deaC2aEb9d4D3d64cb985f1',

    RoyaltyRegistry: '0x727A80Eb575c2d0397a594De24bAb97165D12705',
    ERC20TransferHelper: '0x71B65250BF5ED67321D318A3a7dB46c7616fa154',
    RoyaltyEngineV1: '0x8E4B6D854cB9acaD86435D1E396017e1dAb3220A',
    ZoraProtocolFeeSettings: '0xCFE3456274bE608f2aBf92d0f7d952712D4F3275',
    WETH: '0x5Db8A2543e7e3Add18389C5ED63757A46A4848C1',
  },
  // euphoria
  [6321 as number]: {
    ASK1_1_MODULE_ADDRESS: '0xA371d16fFDF669bB8A5A005D9e3476B41db756b2',
    ZORA_MODULE_MANAGER_ADDRESS: '0xcdDe41b8F12182F7D25d1A2f35ADdA971Aa58FcA',
    ERC721TRANSFERHELPER: '0x364Fe4DcB58363fa1a298207B5Ed54F875835aBf',

    // RoyaltyRegistry: '0x727A80Eb575c2d0397a594De24bAb97165D12705',
    ERC20TransferHelper: '0xBB1dEE78eF86cdBe3ea92cA4ab60D3895d875d0f',
    RoyaltyEngineV1: '0x09F8D75D5aF2BB87125063d153Dd7198f6922acf',
    ZoraProtocolFeeSettings: '0xCFE3456274bE608f2aBf92d0f7d952712D4F3275',
    WETH: '0x9A1945e4A316708631332BF7EC4fA8A2f6C6E2f8',
  },
  // main
  [6322 as number]: {
    ASK1_1_MODULE_ADDRESS: '0xFfC170cF1F6cDF421877793d1b8A9a13ead49e0e',
    ZORA_MODULE_MANAGER_ADDRESS: '0x6FD4720cBe77f0c7bbE8263938f38e77D9efEE6A',
    ERC721TRANSFERHELPER: '0xD43f62921bE6d42fe87a0336841431cfFd57F0Eb',

    // RoyaltyRegistry: '0x727A80Eb575c2d0397a594De24bAb97165D12705',
    ERC20TransferHelper: '0xbF3B5f77aBE83eE878cA0205a8b9A59d2AF256F7',
    RoyaltyEngineV1: '0x62435914C478C5f511A1fEBBFAF092CaFB4C2e16',
    ZoraProtocolFeeSettings: '0xDd475d464C0A1De8fD7CdB18756f9F0f4483eAF4',
    WETH: '0x9A1945e4A316708631332BF7EC4fA8A2f6C6E2f8',
  },
}

export const ChainConfig = {
  [1235 as number]: {
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
  },
  [1236 as number]: {
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
  },
  [6321 as number]: {
    id: 6321,
    name: 'Aura EVM',
    nativeCurrency: {
      decimals: 18,
      name: 'aura',
      symbol: 'aura',
    },
    rpcUrls: {
      default: {
        http: ['https://jsonrpc.euphoria.aura.network/'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Aura EVM Block Explorer',
        url: 'https://euphoria.aurascan.io/',
      },
    },
  },
  [6322 as number]: {
    id: 6322,
    name: 'Aura EVM',
    nativeCurrency: {
      decimals: 18,
      name: 'aura',
      symbol: 'aura',
    },
    rpcUrls: {
      default: {
        http: ['https://jsonrpc.aura.network/'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Aura EVM Block Explorer',
        url: 'https://aurascan.io/',
      },
    },
  },
}

export const HALO_TRADE = {
  [1235 as number]: 'https://dev.halotrade.zone/evm/swap',
  [1236 as number]: 'https://serenity.halotrade.zone/evm/swap',
  [6321 as number]: 'https://euphoria.halotrade.zone/evm/swap',
  [6322 as number]: 'https://halotrade.zone/evm/swap',
}

export const IPFS_GATEWAY = {
  [1235 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
  [1236 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
  [6321 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
  [6322 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
}
