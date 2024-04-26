import { paths, setParams } from '@sh-reservoir0x/reservoir-sdk'
import useSWR from 'swr/immutable'
import { useReservoirClient } from './'

type MarketplaceConfigurationsResponse =
  paths['/collections/{collection}/marketplace-configurations/v2']['get']['responses']['200']['schema']

export type MarketPlaceConfigurationsQuery =
  paths['/collections/{collection}/marketplace-configurations/v2']['get']['parameters']['query']

export default function (
  collectionId?: string,
  chainId?: number,
  options?: MarketPlaceConfigurationsQuery,
  enabled: boolean = true
) {
  const client = useReservoirClient()
  const chain =
    chainId !== undefined
      ? client?.chains.find((chain) => chain.id === chainId)
      : client?.currentChain()

  const { data, error } = useSWR<MarketplaceConfigurationsResponse>(() => {
    if (!enabled || !collectionId) {
      return null
    }

    const url = new URL(
      `${chain?.baseApiUrl}/collections/${collectionId}/marketplace-configurations/v2`
    )
    let query: MarketPlaceConfigurationsQuery = { ...options }

    setParams(url, query)
    return [url.href, client?.apiKey, client?.version]
  })

  return {
    data: data,
    isError: !!error,
    isLoading: !data && !error,
  }
}
