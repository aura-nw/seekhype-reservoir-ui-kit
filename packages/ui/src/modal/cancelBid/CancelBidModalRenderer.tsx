import React, { FC, useEffect, useState, useCallback, ReactNode } from 'react'
import { useCoinConversion, useReservoirClient, useBids } from '../../hooks'
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

export type CancelBidStepData = {
  totalSteps: number
  stepProgress: number
  currentStep: Execute['steps'][0]
  currentStepItem: NonNullable<Execute['steps'][0]['items']>[0]
}

type ChildrenProps = {
  loading: boolean
  bid?: NonNullable<ReturnType<typeof useBids>['data']>[0]
  tokenId?: string
  cancelStep: CancelStep
  transactionError?: Error | null
  totalUsd: number
  usdPrice: number
  blockExplorerBaseUrl: string
  blockExplorerName: string
  steps: Execute['steps'] | null
  stepData: CancelBidStepData | null
  setCancelStep: React.Dispatch<React.SetStateAction<CancelStep>>
  cancelOrder: () => void
}

type Props = {
  open: boolean
  bidId?: string
  chainId?: number
  normalizeRoyalties?: boolean
  children: (props: ChildrenProps) => ReactNode
  walletClient?: ReservoirWallet | WalletClient
}

export const CancelBidModalRenderer: FC<Props> = ({
  open,
  chainId,
  bidId,
  normalizeRoyalties,
  children,
  walletClient,
}) => {
  const [cancelStep, setCancelStep] = useState<CancelStep>(CancelStep.Cancel)
  const [transactionError, setTransactionError] = useState<Error | null>()
  const [stepData, setStepData] = useState<CancelBidStepData | null>(null)
  const [steps, setSteps] = useState<Execute['steps'] | null>(null)
  const [publicClient, setPublicClient] = useState<any>(undefined)

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

  const wallet = walletClient || wagmiWallet

  const blockExplorerBaseUrl =
    wagmiChain?.blockExplorers?.default.url || 'https://etherscan.io'

  const blockExplorerName =
    wagmiChain?.blockExplorers?.default?.name || 'Etherscan'

  const { data: bids, isFetchingPage } = useBids(
    {
      ids: bidId,
      normalizeRoyalties,
      includeCriteriaMetadata: true,
      includeRawData: true,
    },
    {
      revalidateFirstPage: true,
    },
    open && bidId ? true : false,
    rendererChain?.id
  )

  const bid = bids && bids[0] ? bids[0] : undefined
  const currency = bid?.price?.currency

  const coinConversion = useCoinConversion(
    open && bid ? 'USD' : undefined,
    currency?.symbol
  )
  const usdPrice = coinConversion.length > 0 ? coinConversion[0].price : 0
  const totalUsd = usdPrice * (bid?.price?.amount?.decimal || 0)

  const auraEVMTestnet = ChainConfig[chainId ? chainId : 1235]

  useEffect(() => {
    setPublicClient(
      createPublicClient({
        chain: ChainConfig[chainId ? chainId : 1235],
        transport: http(),
      })
    )
  }, [])

  const cancelOrder = useCallback(async () => {
    if (!wallet) {
      const error = new Error('Missing a wallet/signer')
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

    if (!bidId) {
      const error = new Error('Missing bid id to cancel')
      setTransactionError(error)
      throw error
    }

    if (!client) {
      const error = new Error('ReservoirClient was not initialized')
      setTransactionError(error)
      throw error
    }

    setCancelStep(CancelStep.Approving)

    if (rendererChain?.name === auraEVMTestnet?.name) {
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
              type: 'function',
              name: 'cancelOffer',
              inputs: [
                {
                  name: '_tokenContract',
                  type: 'address',
                  internalType: 'address',
                },
                {
                  name: '_tokenId',
                  type: 'uint256',
                  internalType: 'uint256',
                },
                {
                  name: '_offerId',
                  type: 'uint256',
                  internalType: 'uint256',
                },
              ],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ],
          address: ContractConfig[chainId ? chainId : 1235]
            ?.OFFERS_OMNIBUS as `0x${string}`,
          functionName: 'cancelOffer',
          args: [
            bid?.contract as `0x${string}`,
            BigInt(Number(bid?.rawData?.tokenId || 0)),
            BigInt(Number(bid?.rawData?.offerId || 0)),
          ],
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
            .then((res: any) => {
              if (res?.status === 'success') {
                setTimeout(() => {
                  setCancelStep(CancelStep.Complete)
                }, 5000)
              }
            })
            .catch((error: any) => {
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
          ids: [bidId],
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
  }, [bidId, bid, client, rendererChain, wallet, config])

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
        'cancelBidModalRenderer')
    : delete axios.defaults.headers.common?.['x-rkui-context']

  let tokenId

  if (bid?.criteria?.kind === 'token') {
    tokenId = bid?.tokenSetId?.split(':')[2]
  }

  return (
    <>
      {children({
        loading: isFetchingPage !== undefined ? isFetchingPage : true,
        bid,
        tokenId,
        cancelStep,
        transactionError,
        usdPrice,
        totalUsd,
        blockExplorerName,
        blockExplorerBaseUrl,
        steps,
        stepData,
        setCancelStep,
        cancelOrder,
      })}
    </>
  )
}
