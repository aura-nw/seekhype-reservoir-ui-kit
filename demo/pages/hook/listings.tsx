import { NextPage } from 'next'
import { useListings } from '@reservoir0x/reservoir-kit-ui'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { PrivyConnectButton } from 'components/PrivyConnectButton'
import ChainSwitcher from 'components/ChainSwitcher'

const Listings: NextPage = () => {
  const {
    data: listings,
    fetchNextPage,
    hasNextPage,
  } = useListings({
    contracts: [
      '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
      '0x27af21619746a2abb01d3056f971cde936145939',
      '0xfb7e002151343efa2a3a5f2ea98db0d21efb75ce',
    ],
    limit: 10,
  })

  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView) {
      fetchNextPage()
    }
  }, [inView])

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        gap: 12,
        padding: 24,
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <PrivyConnectButton />
      <h3 style={{ fontSize: 20, fontWeight: 600 }}>Listings</h3>
      {listings.map((listing) => (
        <div key={listing?.id}>
          <div>Id: {listing?.id}</div>
          <div>Price: {listing?.price?.amount?.native}</div>
          <div>Source: {listing?.source?.name as string}</div>
        </div>
      ))}
      {hasNextPage ? (
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            padding: 10,
            width: '100%',
            flexShrink: 0,
          }}
          ref={ref}
        >
          Loading
        </div>
      ) : (
        <div>No more data</div>
      )}
      <ChainSwitcher style={{ right: 16 }} />
    </div>
  )
}

export default Listings
