import useSWR, { SWRConfiguration } from 'swr'
import useReservoirClient from './useReservoirClient'

export type OpenSeaTokenResponse = {
  supports_wyvern?: boolean
  collection?: {
    payment_tokens: {
      address: string
      decimals: number
      name: string
      symbol: string
    }[]
  }
}

export default function (
  contract?: string,
  tokenId?: number | string,
  chainId?: number,
  swrOptions: SWRConfiguration = {}
) {
  const client = useReservoirClient()

  const baseUrl =
    (chainId || client?.currentChain()?.id) === 5
      ? 'https://testnets-api.opensea.io/api/v1/assets'
      : 'https://api.opensea.io/api/v1/assets'

  const path = new URL(`${baseUrl}/${contract}/${tokenId}`)

  const { data, mutate, error, isValidating } = useSWR<OpenSeaTokenResponse>(
    contract && tokenId ? [path.href] : null,
    (resource: string) => {
      return fetch(resource)
        .then((res) => res.json())
        .catch((e) => {
          throw e
        })
    },
    {
      revalidateOnMount: true,
      ...swrOptions,
    }
  )

  return { response: data, mutate, error, isValidating }
}
