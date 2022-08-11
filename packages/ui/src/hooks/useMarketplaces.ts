import { paths } from '@reservoir0x/reservoir-kit-client'
import getLocalMarketplaceData from '../lib/getLocalMarketplaceData'
import { useEffect, useState } from 'react'
import useReservoirClient from './useReservoirClient'
import useSWRImmutable from 'swr/immutable'

export type Marketplace = NonNullable<
  paths['/admin/get-marketplaces']['get']['responses']['200']['schema']['marketplaces']
>[0] & {
  isSelected: boolean
  price: number
  truePrice: number
}

export default function (
  listingEnabledOnly?: boolean
): [Marketplace[], React.Dispatch<React.SetStateAction<Marketplace[]>>] {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const client = useReservoirClient()
  const path = new URL(`${client?.apiBase}/admin/get-marketplaces`)

  const { data } = useSWRImmutable<
    paths['/admin/get-marketplaces']['get']['responses']['200']['schema']
  >([path.href, client?.apiKey], null)

  useEffect(() => {
    if (data && data.marketplaces) {
      let updatedMarketplaces: Marketplace[] =
        data.marketplaces as Marketplace[]
      if (listingEnabledOnly) {
        updatedMarketplaces = updatedMarketplaces.filter(
          (marketplace) => marketplace.listingEnabled
        )
      }
      updatedMarketplaces.forEach((marketplace) => {
        if (marketplace.orderbook === 'reservoir') {
          const data = getLocalMarketplaceData()
          marketplace.name = data.title
          marketplace.feeBps = client?.fee ? Number(client.fee) : 0
          if (data.icon) {
            marketplace.imageUrl = data.icon
          }
        }
        marketplace.price = 0
        marketplace.truePrice = 0
        marketplace.isSelected =
          marketplace.orderbook === 'reservoir' ? true : false
      })
      console.log(updatedMarketplaces)
      setMarketplaces(updatedMarketplaces)
    }
  }, [data, listingEnabledOnly])

  return [marketplaces, setMarketplaces]
}
