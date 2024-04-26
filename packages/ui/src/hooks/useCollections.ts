import { useInfiniteApi, useReservoirClient } from './'
import { paths, setParams } from '@sh-reservoir0x/reservoir-sdk'
import { SWRInfiniteConfiguration } from 'swr/infinite'

type CollectionResponse =
  paths['/collections/v7']['get']['responses']['200']['schema']

type CollectionsQuery = paths['/collections/v7']['get']['parameters']['query']

export default function (
  options?: CollectionsQuery | false,
  swrOptions: SWRInfiniteConfiguration = {},
  chainId?: number
) {
  const client = useReservoirClient()
  const chain =
    chainId !== undefined
      ? client?.chains.find((chain) => chain.id === chainId)
      : client?.currentChain()

  const response = useInfiniteApi<CollectionResponse>(
    (pageIndex, previousPageData) => {
      if (!options) {
        return null
      }

      const url = new URL(`${chain?.baseApiUrl}/collections/v7`)
      let query: CollectionsQuery = { ...options }

      if (previousPageData && !previousPageData.continuation) {
        return null
      } else if (previousPageData && pageIndex > 0) {
        query.continuation = previousPageData.continuation
      }

      if (
        query.normalizeRoyalties === undefined &&
        client?.normalizeRoyalties !== undefined
      ) {
        query.normalizeRoyalties = client.normalizeRoyalties
      }

      setParams(url, query)
      return [url.href, client?.apiKey, client?.version]
    },
    {
      revalidateOnMount: true,
      revalidateFirstPage: false,
      ...swrOptions,
    }
  )

  const collections =
    response.data?.flatMap((page) => page?.collections || []) ?? []

  return {
    ...response,
    data: collections,
  }
}
