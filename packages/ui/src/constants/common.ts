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
    ASK1_1_MODULE_ADDRESS: '0x19d4E98A6b84787879fdc71b5b4a992fF92a5f77',
    ZORA_MODULE_MANAGER_ADDRESS: '0x6B1Cc558DA2f0d909aD16FA29F2D74bF7A8cA6B4',
    ERC721TRANSFERHELPER: '0x9f075Deab9a7433f0A5541d235a57db1cA491E0a',

    RoyaltyRegistry: '0x9A1945e4A316708631332BF7EC4fA8A2f6C6E2f8',
    ERC20TransferHelper: '0xbeA9f83Dc816f0Df3F7fB43a288BE9fF211C3E7A',
    RoyaltyEngineV1: '0xA1b5001fbda9179CBe69DfBEED78be1EC900d523',
    ZoraProtocolFeeSettings: '0x8a914102864dEd8B134E7338e2a54b8f6eb7cb0e',
    
    // for offer/bid
    WETH: '0x7C258D32e0C5ADda30d18194870b56A38E2EBBbC',
    OFFER_MODULE_MANAGER: '0x6B1Cc558DA2f0d909aD16FA29F2D74bF7A8cA6B4',
    OFFERS_OMNIBUS: '0x14511dEfE1fbc147b7364d3A5A3ED1179bd0c707',
  },
  // serenity
  [1236 as number]: {
    ASK1_1_MODULE_ADDRESS: '0x1a7cD784bD81c6761A6bDD88E3508c737f0C800e',
    ZORA_MODULE_MANAGER_ADDRESS: '0xB28D39287eC900E0987f5dD755651dE4256D0F5b',
    ERC721TRANSFERHELPER: '0x56e88b1731D55703C1f80391602297715886Fa6A',

    RoyaltyRegistry: '0x875bf704a28d70909F2Dc04522d58DFE6E9625a9',
    ERC20TransferHelper: '0xd1fC2D4F9984B6214D0a3778cbacbAbfA5e84224',
    RoyaltyEngineV1: '0x297afC4971CD9b6A392c580542399e7B096EEBfd',
    ZoraProtocolFeeSettings: '0x5203152e5E4EaEF7f6a95959817dB260ce97Dca1',

    // for offer/bid
    WETH: '0xE974cC14c93FC6077B0d65F98832B846C5454A0B',
    OFFER_MODULE_MANAGER: '0xB28D39287eC900E0987f5dD755651dE4256D0F5b',
    OFFERS_OMNIBUS: '0x98605ae21Dd3BE686337A6d7a8f156d0d8BAeE92',
  },
  // euphoria
  [6321 as number]: {
    ASK1_1_MODULE_ADDRESS: '0x605532fe1917031251a2A01519B3d976CeaeE209',
    ZORA_MODULE_MANAGER_ADDRESS: '0x6b1efdc214b641D612f538c35818a2cF224D54D4',
    ERC721TRANSFERHELPER: '0xB9D293eda7C4A9dbE2114Da9a9154C4dC97fd91a',

    // RoyaltyRegistry: '0x727A80Eb575c2d0397a594De24bAb97165D12705',
    ERC20TransferHelper: '0xE6e2a48B4a21DD66328D8a19f6396a60d3BfB7ec',
    RoyaltyEngineV1: '0x6A8e8c700c949Bfe02A2Db958098b757799b069D',
    ZoraProtocolFeeSettings: '0x084CFA5aF594A87b56Dfdb5E43e1F0BC37b677Df',
    
    // for offer/bid
    WETH: '0x7f4f375454B34895DAE95e0cCEDc0743B3850893',
    OFFER_MODULE_MANAGER: '0x6b1efdc214b641D612f538c35818a2cF224D54D4',
    OFFERS_OMNIBUS: '0x0B0257bb9d3aA53e7b50b8568B5f79dA8185A8bc',
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

    // for offer/bid
    WETH: '0xDE47A655a5d9904BD3F7e1A536D8323fBD99993A',
    OFFER_MODULE_MANAGER: '0x6FD4720cBe77f0c7bbE8263938f38e77D9efEE6A',
    OFFERS_OMNIBUS: '0xbf64f73074FA5dBF08c57962Fa4aE706F329BA9f',
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
