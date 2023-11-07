import { NextPage } from 'next'
import { useCollectionActivity } from '@reservoir0x/reservoir-kit-ui'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { PrivyConnectButton } from 'components/PrivyConnectButton'
import ChainSwitcher from 'components/ChainSwitcher'

const Activity: NextPage = () => {
  const {
    data: activity,
    fetchNextPage,
    hasNextPage,
  } = useCollectionActivity({
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
      <h3 style={{ fontSize: 20, fontWeight: 600 }}>Activity</h3>
      {activity.map((token, i) => (
        <pre>{JSON.stringify(token, null, 2)}</pre>
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

export default Activity
