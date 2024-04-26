import * as allChains from 'viem/chains'
import { customChains } from '@sh-reservoir0x/reservoir-sdk'
import { ChainConfig } from '../constants/common'

const getChainBlockExplorerUrl = (chainId: number) => {
  const wagmiChain: allChains.Chain | undefined = Object.values({
    ...allChains,
    ...customChains,
  }).find(({ id }) => id === chainId)

  return (
    wagmiChain?.blockExplorers?.default?.url ||
    ChainConfig[chainId]?.blockExplorers?.default?.url
  )
}

export default getChainBlockExplorerUrl
