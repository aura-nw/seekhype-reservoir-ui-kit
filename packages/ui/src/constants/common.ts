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
    ASK1_1_MODULE_ADDRESS: '0xc7fEE6F73A28dA384c2f027fe6471193537AE5E5',
    ZORA_MODULE_MANAGER_ADDRESS: '0x36643A5F6Ce387dAf6d4522678c50aa356DEC870',
    ERC721TRANSFERHELPER: '0xC1a12B265ab64cc1b00FB2051DdA5Af983B68598',

    RoyaltyRegistry: '0x887752d42c252bDe0B5acB32b071b69963425E6D',
    ERC20TransferHelper: '0x09d099937104B8eB319eCCee930A0f547c476Be4',
    RoyaltyEngineV1: '0xb7D4737Dfa69eB2129Bc5365F3e087f52D152D3C',
    ZoraProtocolFeeSettings: '0x84b7BA21713A1DBA7E6E8268b68c4a94AbAC8A09',
    WETH: '0x1664A8d748621D4b3ceCfA5f8D52446D9F236f6b',
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
}

export const HALO_TRADE = {
  [1235 as number]: 'https://dev.halotrade.zone/evm/swap',
  [1236 as number]: 'https://serenity.halotrade.zone/evm/swap',
  [6321 as number]: 'https://euphoria.halotrade.zone/evm/swap',
}

export const IPFS_GATEWAY = {
  [1235 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
  [1236 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
  [6321 as number]: 'https://ipfs-gw.dev.aura.network/ipfs/',
}
