import { NextPage } from 'next'
import { useTokens } from '@reservoir0x/reservoir-kit-ui'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { PrivyConnectButton } from 'components/PrivyConnectButton'
import ChainSwitcher from 'components/ChainSwitcher'

const Tokens: NextPage = () => {
  const {
    data: tokens,
    fetchNextPage,
    hasNextPage,
    isFetchingInitialData,
    isFetchingPage,
    resetCache,
  } = useTokens({
    collection: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
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
      <h3 style={{ fontSize: 20, fontWeight: 600 }}>Tokens</h3>
      Fetching Initial: {isFetchingInitialData ? 'Fetching' : '...'}
      <br />
      Fetching: {isFetchingPage ? 'Fetching' : '...'}
      <button
        onClick={() => {
          resetCache()
        }}
      >
        Restart page
      </button>
      {tokens.map((token) => (
        <div key={token?.token?.tokenId}>
          <div>Id: {token?.token?.tokenId}</div>
          <div>Name: {token?.token?.name}</div>
          <div>Price: {token?.market?.floorAsk?.price?.amount?.native}</div>
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

export default Tokens
