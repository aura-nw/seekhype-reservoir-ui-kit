import { NextPage } from 'next'
import { MintModal } from '@reservoir0x/reservoir-kit-ui'
import ThemeSwitcher from 'components/ThemeSwitcher'
import { useState } from 'react'
import DeeplinkCheckbox from 'components/DeeplinkCheckbox'
import { useRouter } from 'next/router'
import ChainSwitcher from 'components/ChainSwitcher'
import { PrivyConnectButton } from 'components/PrivyConnectButton'
import { usePrivy } from '@privy-io/react-auth'

const DEFAULT_COLLECTION_ID =
  process.env.NEXT_PUBLIC_DEFAULT_COLLECTION_ID ||
  '0xe14fa5fba1b55946f2fa78ea3bd20b952fa5f34e'

const MintPage: NextPage = () => {
  const router = useRouter()
  const { login } = usePrivy();

  const [contract, setContract] = useState<string | undefined>(undefined)
  const [collectionId, setCollectionId] = useState<string | undefined>(DEFAULT_COLLECTION_ID)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [chainId, setChainId] = useState<string | undefined>(undefined)
  const [feesOnTopBps, setFeesOnTopBps] = useState<string[]>([])
  const [feesOnTopUsd, setFeesOnTopUsd] = useState<string[]>([])
  const deeplinkOpenState = useState(true)
  const hasDeeplink = router.query.deeplink !== undefined

  return (
    <div
      style={{
        display: 'flex',
        height: 50,
        width: '100%',
        gap: 12,
        padding: 24,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 150,
      }}
    >
      <PrivyConnectButton />

      <div>
        <label>Contract: </label>
        <input
          type="text"
          value={contract}
          onChange={(e) => { 
            if(e.target.value === '') {
              setContract(undefined)
            }
            else {
              setContract(e.target.value)
            } 
          }}
        />
      </div>

      <div>
        <label>CollectionId: </label>
        <input
          type="text"
          value={collectionId}
          onChange={(e) => { 
            if(e.target.value === '') {
              setCollectionId(undefined)
            }
            else {
              setCollectionId(e.target.value)
            } 
          }}
        />
      </div>

      <div>
        <label>Token: </label>
        <input
          type="text"
          value={token}
          onChange={(e) => { 
            if(e.target.value === '') {
              setToken(undefined)
            }
            else {
              setToken(e.target.value)
            } 
          }}
        />
      </div>

      <div>
        <label>Chain Override: </label>
        <input
          type="text"
          value={chainId}
          onChange={(e) => setChainId(e.target.value)}
        />
      </div>


      <div>
        <label>Fees on top (BPS): </label>
        <textarea
          onChange={() => {}}
          onBlur={(e) => {
            if (e.target.value && e.target.value.length > 0) {
              try {
                setFeesOnTopBps(JSON.parse(e.target.value))
              } catch (err) {
                e.target.value = ''
                setFeesOnTopBps([])
              }
            } else {
              e.target.value = ''
              setFeesOnTopBps([])
            }
          }}
        />
      </div>
      <div>
        <label>Fees on top (USD): </label>
        <textarea
          onChange={() => {}}
          onBlur={(e) => {
            if (e.target.value && e.target.value.length > 0) {
              try {
                setFeesOnTopUsd(JSON.parse(e.target.value))
              } catch (err) {
                e.target.value = ''
                setFeesOnTopUsd([])
              }
            } else {
              e.target.value = ''
              setFeesOnTopUsd([])
            }
          }}
        />
      </div>
      <DeeplinkCheckbox />

      <MintModal
        chainId={Number(chainId)}
        onConnectWallet={() => {
          login?.()        
        }}
        trigger={
          <button
            style={{
              marginTop: 50,
              padding: 24,
              background: 'blue',
              color: 'white',
              fontSize: 18,
              border: '1px solid #ffffff',
              borderRadius: 8,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Mint
          </button>
        }
        contract={contract}
        collectionId={collectionId}
        token={token}
        feesOnTopBps={feesOnTopBps}
        feesOnTopUsd={feesOnTopUsd}
        openState={hasDeeplink ? deeplinkOpenState : undefined}
        onMintComplete={(data) => {
          console.log('Mint Complete', data)
        }}
        onMintError={(error, data) => {
          console.log('Mint Error', error, data)
        }}
        onClose={(data, currentStep) => {
          console.log('MintModal Closed')
        }}
        onGoToToken={(data) => console.log('Go to Token', data)}
      />
      <ChainSwitcher/>
      <ThemeSwitcher />
    </div>
  )
}

export default MintPage