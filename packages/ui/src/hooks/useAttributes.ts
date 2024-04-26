import { paths } from '@sh-reservoir0x/reservoir-sdk'
import useSWR, { SWRConfiguration } from 'swr'
import useReservoirClient from './useReservoirClient'

type AttributesResponse =
  paths['/collections/{collection}/attributes/all/v4']['get']['responses']['200']['schema']

export default function (
  collection?: string | undefined,
  chainId?: number,
  swrOptions: SWRConfiguration = {}
) {
  const client = useReservoirClient()
  const chain =
    chainId !== undefined
      ? client?.chains.find((chain) => chain.id === chainId)
      : client?.currentChain()

  const pathname = `${chain?.baseApiUrl}/collections/${collection}/attributes/all/v4`

  const path = collection ? new URL(pathname) : null

  const { data, mutate, error, isValidating } = useSWR<AttributesResponse>(
    path ? [path.href, client?.apiKey, client?.version] : null,
    null,
    {
      revalidateOnMount: true,
      ...swrOptions,
    }
  )
  const collections: AttributesResponse['attributes'] | null =
    data && data.attributes ? data.attributes : null

  return { response: data, data: collections, mutate, error, isValidating }
}
