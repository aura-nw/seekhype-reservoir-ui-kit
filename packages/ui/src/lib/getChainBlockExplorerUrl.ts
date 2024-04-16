import * as allChains from 'viem/chains'
import { customChains } from '@reservoir0x/reservoir-sdk'
import { auraEVMTestnet } from '../constants/evmosChain'

const getChainBlockExplorerUrl = (chainId: number) => {
  const wagmiChain: allChains.Chain | undefined = Object.values({
    ...allChains,
    ...customChains,
  }).find(({ id }) => id === chainId)

  return (
    wagmiChain?.blockExplorers?.default?.url ||
    auraEVMTestnet?.blockExplorers?.default?.url
  )
}

export default getChainBlockExplorerUrl
