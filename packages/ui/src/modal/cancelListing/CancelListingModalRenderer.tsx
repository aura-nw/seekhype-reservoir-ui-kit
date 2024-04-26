import React, { FC, useEffect, useState, useCallback, ReactNode } from 'react'
import { useCoinConversion, useReservoirClient, useListings } from '../../hooks'
import { useConfig, useWalletClient } from 'wagmi'
import { Execute, ReservoirWallet, axios } from '@sh-reservoir0x/reservoir-sdk'
import { getAccount, switchChain } from 'wagmi/actions'
import { customChains } from '@sh-reservoir0x/reservoir-sdk'
import * as allChains from 'viem/chains'
import { WalletClient, createPublicClient, http } from 'viem'
import { ChainConfig, ContractConfig } from '../../constants/common'

export enum CancelStep {
  Cancel,
  Approving,
  Complete,
}

export type CancelListingStepData = {
  totalSteps: number
  stepProgress: number
  currentStep: Execute['steps'][0]
  currentStepItem: NonNullable<Execute['steps'][0]['items']>[0]
}

type ChildrenProps = {
  loading: boolean
  listing?: NonNullable<ReturnType<typeof useListings>['data']>[0]
  tokenId?: string
  contract?: string
  cancelStep: CancelStep
  transactionError?: Error | null
  totalUsd: number
  usdPrice: number
  blockExplorerBaseUrl: string
  blockExplorerName: string
  steps: Execute['steps'] | null
  stepData: CancelListingStepData | null
  setCancelStep: React.Dispatch<React.SetStateAction<CancelStep>>
  cancelOrder: () => void
}

type Props = {
  open: boolean
  listingId?: string
  chainId?: number
  normalizeRoyalties?: boolean
  children: (props: ChildrenProps) => ReactNode
  walletClient?: ReservoirWallet | WalletClient
}

export const CancelListingModalRenderer: FC<Props> = ({
  open,
  listingId,
  chainId,
  normalizeRoyalties,
  children,
  walletClient,
}) => {
  const [cancelStep, setCancelStep] = useState<CancelStep>(CancelStep.Cancel)
  const [transactionError, setTransactionError] = useState<Error | null>()
  const [stepData, setStepData] = useState<CancelListingStepData | null>(null)
  const [steps, setSteps] = useState<Execute['steps'] | null>(null)

  const client = useReservoirClient()
  const currentChain = client?.currentChain()
  const config = useConfig()

  const rendererChain = chainId
    ? client?.chains.find(({ id }) => id === chainId) || currentChain
    : currentChain

  const wagmiChain: allChains.Chain | undefined = Object.values({
    ...allChains,
    ...customChains,
  }).find(({ id }) => rendererChain?.id === id)

  const { data: wagmiWallet } = useWalletClient({ chainId: rendererChain?.id })

  const auraEVMTestnet = ChainConfig[chainId ? chainId : 1235]
  const publicClient = createPublicClient({
    chain: auraEVMTestnet,
    transport: http(),
  })

  const wallet = walletClient || wagmiWallet
  const blockExplorerBaseUrl =
    wagmiChain?.blockExplorers?.default.url || 'https://etherscan.io'

  const blockExplorerName =
    wagmiChain?.blockExplorers?.default?.name || 'Etherscan'

  const { data: listings, isFetchingPage } = useListings(
    {
      ids: listingId,
      normalizeRoyalties,
      includeCriteriaMetadata: true,
      includeRawData: true,
    },
    {
      revalidateFirstPage: true,
    },
    open && listingId ? true : false,
    rendererChain?.id
  )

  const listing = listings && listings[0] ? listings[0] : undefined
  const currency = listing?.price?.currency

  const coinConversion = useCoinConversion(
    open && listing ? 'USD' : undefined,
    currency?.symbol
  )
  const usdPrice = coinConversion.length > 0 ? coinConversion[0].price : 0
  const totalUsd = usdPrice * (listing?.price?.amount?.decimal || 0)

  const tokenId = listing?.tokenSetId?.split(':')[2]
  const contract = listing?.tokenSetId?.split(':')[1]

  const cancelOrder = useCallback(async () => {
    if (!wallet) {
      const error = new Error('Missing a wallet/signer')
      setTransactionError(error)
      throw error
    }

    if (!listingId) {
      const error = new Error('Missing list id to cancel')
      setTransactionError(error)
      throw error
    }

    if (!client) {
      const error = new Error('ReservoirClient was not initialized')
      setTransactionError(error)
      throw error
    }

    let activeWalletChain = getAccount(config).chain
    if (rendererChain?.id !== activeWalletChain?.id) {
      activeWalletChain = await switchChain(config, {
        chainId: rendererChain?.id as number,
      })
    }

    if (rendererChain?.id !== activeWalletChain?.id) {
      const error = new Error(`Mismatching chainIds`)
      setTransactionError(error)
      throw error
    }

    setCancelStep(CancelStep.Approving)

    if (rendererChain?.name === auraEVMTestnet?.name && tokenId) {
      setStepData({
        totalSteps: 1,
        stepProgress: 1,
        currentStep: {
          kind: 'transaction',
          action: '',
          description: '',
          id: '1',
        },
        currentStepItem: {
          status: 'incomplete',
        },
      })
      await wagmiWallet
        ?.writeContract({
          abi: [
            {
              inputs: [
                {
                  internalType: 'address',
                  name: '_tokenContract',
                  type: 'address',
                },
                { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
              ],
              name: 'cancelAsk',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: ContractConfig[chainId ? chainId : 1235]
            ?.ASK1_1_MODULE_ADDRESS as `0x${string}`,
          functionName: 'cancelAsk',
          args: [contract as `0x${string}`, BigInt(Number(tokenId))],
          gas: 500000n,
        })
        .then((hash) => {
          const steps: Execute['steps'] = [
            {
              error: '',
              errorData: [],
              action: '',
              description: '',
              kind: 'transaction',
              id: '',
              items: [
                {
                  status: 'complete',
                  transfersData: [
                    {
                      amount: '1',
                    },
                  ],
                  txHashes: [
                    {
                      txHash: hash,
                      chainId: chainId ? chainId : 1235,
                    },
                  ],
                },
              ],
            },
          ]

          if (
            steps &&
            steps?.length > 0 &&
            steps[0]?.items &&
            steps[0]?.items?.length > 0
          ) {
            setStepData({
              totalSteps: 1,
              stepProgress: 1,
              currentStep: steps[0],
              currentStepItem: steps[0]?.items[0],
            })
          }
          publicClient
            .waitForTransactionReceipt({ hash })
            .then((res) => {
              if (res?.status === 'success') {
                setTimeout(() => {
                  setCancelStep(CancelStep.Complete)
                }, 5000)
              }
            })
            .catch((error) => {
              setCancelStep(CancelStep.Cancel)
              setTransactionError(error)
            })
        })
        .catch((err) => {
          setCancelStep(CancelStep.Cancel)
          setTransactionError(err)
        })
    } else {
      client.actions
        .cancelOrder({
          chainId: rendererChain?.id,
          ids: [listingId],
          wallet,
          onProgress: (steps: Execute['steps']) => {
            if (!steps) {
              return
            }
            setSteps(steps)

            const executableSteps = steps.filter(
              (step) => step.items && step.items.length > 0
            )

            let stepCount = executableSteps.length

            let currentStepItem:
              | NonNullable<Execute['steps'][0]['items']>[0]
              | undefined

            const currentStepIndex = executableSteps.findIndex((step) => {
              currentStepItem = step.items?.find(
                (item) => item.status === 'incomplete'
              )
              return currentStepItem
            })

            const currentStep =
              currentStepIndex > -1
                ? executableSteps[currentStepIndex]
                : executableSteps[stepCount - 1]

            if (currentStepItem) {
              setStepData({
                totalSteps: stepCount,
                stepProgress: currentStepIndex,
                currentStep,
                currentStepItem,
              })
            } else if (
              steps.every(
                (step) =>
                  !step.items ||
                  step.items.length == 0 ||
                  step.items?.every((item) => item.status === 'complete')
              )
            ) {
              setCancelStep(CancelStep.Complete)
            }
          },
        })
        .catch((error: Error) => {
          setTransactionError(error)
          setCancelStep(CancelStep.Cancel)
          setStepData(null)
          setSteps(null)
        })
    }
  }, [listingId, client, rendererChain, wallet, config, tokenId, contract])

  useEffect(() => {
    if (!open) {
      setCancelStep(CancelStep.Cancel)
      setTransactionError(null)
      setStepData(null)
      setSteps(null)
    }
  }, [open])

  open
    ? (axios.defaults.headers.common['x-rkui-context'] =
        'cancelListingRenderer')
    : delete axios.defaults.headers.common?.['x-rkui-context']

  return (
    <>
      {children({
        loading: isFetchingPage !== undefined ? isFetchingPage : true,
        listing,
        tokenId,
        blockExplorerName,
        contract,
        cancelStep,
        transactionError,
        usdPrice,
        totalUsd,
        blockExplorerBaseUrl,
        steps,
        stepData,
        setCancelStep,
        cancelOrder,
      })}
    </>
  )
}
