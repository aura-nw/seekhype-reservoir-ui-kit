import React, {
  FC,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react'
import {
  useTokens,
  useCoinConversion,
  useReservoirClient,
  useBids,
} from '../../hooks'
import { useAccount, useConfig, useWalletClient } from 'wagmi'
import {
  Execute,
  ExpectedPrice,
  ReservoirClientActions,
  ReservoirWallet,
  SellPath,
  axios,
} from '@sh-reservoir0x/reservoir-sdk'
import { Currency } from '../../types/Currency'
import {
  WalletClient,
  createPublicClient,
  formatUnits,
  http,
  parseUnits,
  zeroAddress,
} from 'viem'
import { getAccount, switchChain } from 'wagmi/actions'
import { customChains } from '@sh-reservoir0x/reservoir-sdk'
import * as allChains from 'viem/chains'
import { ChainConfig, ContractConfig } from '../../constants/common'
import { BidStep } from '../bid/BidModalRenderer'
import wrappedContractNames from '../../constants/wrappedContractNames'
import wrappedContracts from '../../constants/wrappedContracts'

export enum AcceptBidStep {
  Checkout,
  Auth,
  ApproveMarketplace,
  Finalizing,
  Complete,
  Unavailable,
  TokenSwap,
}

export type AcceptBidTokenData = {
  tokenId: string
  collectionId: string
  bidIds?: string[]
  bidsPath?: NonNullable<SellPath>
  royalty?: number
}

export type EnhancedAcceptBidTokenData = Required<AcceptBidTokenData> & {
  tokenData?: ReturnType<typeof useTokens>['data'][0]
}

export type AcceptBidPrice = {
  netAmount: number
  amount: number
  currency: Currency
  royalty: number
  marketplaceFee: number
  feesOnTop: number
}

export type AcceptBidStepData = {
  totalSteps: number
  steps: Execute['steps']
  currentStep: Execute['steps'][0]
  currentStepItem?: NonNullable<Execute['steps'][0]['items']>[0]
}

type ChildrenProps = {
  loading: boolean
  tokensData: EnhancedAcceptBidTokenData[]
  acceptBidStep: AcceptBidStep
  transactionError?: Error | null
  txHash: string | null
  usdPrices: Record<string, ReturnType<typeof useCoinConversion>[0]>
  prices: AcceptBidPrice[]
  address?: string
  blockExplorerBaseUrl: string
  stepData: AcceptBidStepData | null
  acceptBid: () => void
  swapCurrency: Omit<Currency, 'coinGeckoId'> | null
  setAcceptBidStep: React.Dispatch<React.SetStateAction<AcceptBidStep>>
}

type Props = {
  open: boolean
  tokens: AcceptBidTokenData[]
  chainId?: number
  currency?: string
  normalizeRoyalties?: boolean
  children: (props: ChildrenProps) => ReactNode
  walletClient?: ReservoirWallet | WalletClient
  feesOnTopBps?: string[] | null
  feesOnTopCustom?: (data: SellPath) => string[] | null
}

export const AcceptBidModalRenderer: FC<Props> = ({
  open,
  tokens,
  chainId,
  normalizeRoyalties,
  children,
  walletClient,
  feesOnTopBps,
  feesOnTopCustom,
  currency,
}) => {
  const [stepData, setStepData] = useState<AcceptBidStepData | null>(null)
  const [prices, setPrices] = useState<AcceptBidPrice[]>([])
  const [acceptBidStep, setAcceptBidStep] = useState<AcceptBidStep>(
    AcceptBidStep.Checkout
  )
  const [transactionError, setTransactionError] = useState<Error | null>()
  const [txHash, setTxHash] = useState<string | null>(null)

  const client = useReservoirClient()
  const currentChain = client?.currentChain()
  const config = useConfig()

  const [publicClient, setPublicClient] = useState<any>(undefined)

  const auraEVMTestnet = ChainConfig[chainId ? chainId : 1235]

  useEffect(() => {
    setPublicClient(
      createPublicClient({
        chain: ChainConfig[chainId ? chainId : 1235],
        transport: http(),
      })
    )
  }, [])

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
    wagmiChain?.blockExplorers?.default?.url || 'https://etherscan.io'

  const [isFetchingBidPath, setIsFetchingBidPath] = useState(false)
  const [bidsPath, setBidsPath] = useState<SellPath | null>(null)
  const [feesOnTop, setFeesOnTop] = useState<string[] | null>(null)
  const [isApproveModule, setIsApproveModule] = useState(false)
  const [isApproveAll, setIsApproveAll] = useState(false)

  const _tokenIds = tokens.map((token) => {
    const contract = (token?.collectionId || '').split(':')[0]
    return `${contract}:${token.tokenId}`
  })
  const {
    data: tokensData,
    mutate: mutateTokens,
    isValidating: isFetchingTokenData,
  } = useTokens(
    open &&
      _tokenIds &&
      _tokenIds.length > 0 && {
        tokens: _tokenIds,
        normalizeRoyalties,
      },
    {
      revalidateFirstPage: true,
    },
    rendererChain?.id
  )

  const enhancedTokens = useMemo(() => {
    const tokensDataMap = tokensData.reduce((map, data) => {
      map[`${data.token?.contract}:${data.token?.tokenId}`] = data
      return map
    }, {} as Record<string, (typeof tokensData)[0]>)
    const tokensBidPathMap =
      bidsPath?.reduce((map, path) => {
        const key = `${path.contract}:${path.tokenId}`
        const mapPath = map[key]
        if (!mapPath) {
          map[key] = [path]
        } else {
          mapPath.push(path)
        }
        return map
      }, {} as Record<string, NonNullable<AcceptBidTokenData['bidsPath']>>) ||
      {}

    return tokens.reduce((enhancedTokens, token) => {
      const contract = token.collectionId.split(':')[0]
      const dataMapKey = `${contract}:${token.tokenId}`
      const tokenData = tokensDataMap[dataMapKey]
      const bidIds = token.bidIds?.filter((bidId) => bidId.length > 0) || []
      const bidsPath: NonNullable<AcceptBidTokenData['bidsPath']> =
        tokensBidPathMap[dataMapKey] ? tokensBidPathMap[dataMapKey] : []
      if (!bidIds.length) {
        enhancedTokens.push({
          ...token,
          bidIds: tokenData?.market?.topBid?.id
            ? [tokenData.market.topBid.id]
            : [],
          tokenData,
          bidsPath,
        })
      } else {
        enhancedTokens.push({
          ...token,
          bidIds: token.bidIds || [],
          tokenData,
          bidsPath,
        })
      }
      return enhancedTokens
    }, [] as any[])
    // }, [] as EnhancedAcceptBidTokenData[])
  }, [tokensData, tokens, bidsPath])

  const { data: bids } = useBids(
    {
      ids:
        enhancedTokens?.length > 0 && enhancedTokens[0]?.bidIds?.length > 0
          ? enhancedTokens[0]?.bidIds
          : [],
      normalizeRoyalties,
      includeCriteriaMetadata: true,
      includeRawData: true,
    },
    {
      revalidateFirstPage: true,
    },
    open && enhancedTokens?.length > 0 && enhancedTokens[0]?.bidIds?.length > 0
      ? true
      : false,
    rendererChain?.id
  )

  const bid = bids && bids[0] ? bids[0] : undefined

  const checkIsApproveForAll = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            inputs: [
              { internalType: 'address', name: '_user', type: 'address' },
              { internalType: 'address', name: '_module', type: 'address' },
            ],
            name: 'isApprovedForAll',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address:
          enhancedTokens?.length > 0
            ? (enhancedTokens[0].collectionId as `0x${string}`)
            : '',
        functionName: 'isApprovedForAll',
        args: [
          address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.ERC721TRANSFERHELPER as `0x${string}`,
        ],
      })
      .then((res: any) => {
        if (res) {
          setIsApproveAll(true)
        }
      })
      .catch((err: any) => {
        setIsApproveAll(false)
        setAcceptBidStep(AcceptBidStep.Checkout)
      })
  }

  const checkIsApproveForModule = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            type: 'function',
            name: 'isModuleApproved',
            inputs: [
              {
                name: '_user',
                type: 'address',
                internalType: 'address',
              },
              {
                name: '_module',
                type: 'address',
                internalType: 'address',
              },
            ],
            outputs: [
              {
                name: '',
                type: 'bool',
                internalType: 'bool',
              },
            ],
            stateMutability: 'view',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.OFFER_MODULE_MANAGER as `0x${string}`,
        functionName: 'isModuleApproved',
        args: [
          address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.OFFERS_OMNIBUS as `0x${string}`,
        ],
      })
      .then((res: any) => {
        if (res) {
          setIsApproveModule(true)
        }
      })
      .catch((err: any) => {
        setIsApproveModule(false)
        setAcceptBidStep(AcceptBidStep.Checkout)
      })
  }

  useEffect(() => {
    if (publicClient) {
      checkIsApproveForAll()
      checkIsApproveForModule()
    }
  }, [publicClient])

  const triggerSetApproveForModule = () => {
    const steps: Execute['steps'] = [
      {
        error: '',
        errorData: [],
        action: '',
        description: '',
        kind: 'transaction',
        id: 'sale',
        items: [
          {
            status: 'complete',
            transfersData: [
              {
                amount: '1',
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
        currentStep: steps[0],
        currentStepItem: steps[0]?.items[0],
        steps: steps,
      })
    }

    setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
    // setStepData({
    //   totalSteps: 1,
    //   currentStep: {
    //     kind: 'transaction',
    //     action: '',
    //     description:
    //       'Please approve the collection(s) from your wallet. Each collection only needs to be approved once.',
    //     id: '1',
    //   },
    //   steps: [],
    // })
    // set allowance
    wagmiWallet
      ?.writeContract({
        abi: [
          {
            type: 'function',
            name: 'setApprovalForModule',
            inputs: [
              {
                name: '_module',
                type: 'address',
                internalType: 'address',
              },
              {
                name: '_approved',
                type: 'bool',
                internalType: 'bool',
              },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.OFFER_MODULE_MANAGER as `0x${string}`,
        functionName: 'setApprovalForModule',
        args: [
          ContractConfig[chainId ? chainId : 1235]
            ?.OFFERS_OMNIBUS as `0x${string}`,
          true,
        ],
        gas: 500000n,
      })
      .then((hash) => {
        publicClient
          .waitForTransactionReceipt({ hash })
          .then(() => {
            triggerAcceptBidContract()
          })
          .catch((error: any) => {
            triggerAcceptBidContract()
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
      })
  }

  const triggerAcceptBidContract = () => {
    const steps: Execute['steps'] = [
      {
        error: '',
        errorData: [],
        action: '',
        description: '',
        kind: 'transaction',
        id: 'sale',
        items: [
          {
            status: 'complete',
            transfersData: [
              {
                amount: '1',
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
        currentStep: steps[0],
        currentStepItem: steps[0]?.items[0],
        steps: steps,
      })
    }

    setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
    // setStepData({
    //   totalSteps: 1,
    //   currentStep: {
    //     kind: 'signature',
    //     action: '',
    //     description:
    //       'Please review and confirm to create the listing from your wallet.',
    //     id: '1',
    //   },
    //   currentStepItem: {
    //     status: 'incomplete',
    //   },
    //   steps: [],
    // })

    const token =
      enhancedTokens?.length > 0
        ? enhancedTokens[0].tokenData?.token
        : undefined
    // Fill token
    wagmiWallet
      ?.writeContract({
        abi: [
          {
            type: 'function',
            name: 'fillOffer',
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
              {
                name: '_amount',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: '_currency',
                type: 'address',
                internalType: 'address',
              },
              {
                name: '_finder',
                type: 'address',
                internalType: 'address',
              },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.OFFERS_OMNIBUS as `0x{string}`,
        functionName: 'fillOffer',
        args: [
          token ? (token?.contract as `0x${string}`) : ('' as `0x${string}`),
          BigInt(Number(token?.tokenId)),
          BigInt(Number(bid?.rawData?.offerId || 0)),
          BigInt(Number(bid?.rawData?.askPrice) || 0),
          wrappedContracts[chainId ? chainId : 1235] as `0x${string}`,
          zeroAddress,
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
            id: 'sale',
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
            currentStep: steps[0],
            currentStepItem: steps[0]?.items[0],
            steps: steps,
          })
        }
        setAcceptBidStep(AcceptBidStep.Finalizing)
        publicClient
          .waitForTransactionReceipt({ hash })
          .then((res: any) => {
            if (res?.status === 'success') {
              setTimeout(() => {
                const steps: Execute['steps'] = [
                  {
                    error: '',
                    errorData: [],
                    action: '',
                    description: '',
                    kind: 'transaction',
                    id: 'sale',
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
                    currentStep: steps[0],
                    currentStepItem: steps[0]?.items[0],
                    steps: steps,
                  })
                }

                setAcceptBidStep(AcceptBidStep.Complete)
              }, 5000)
            } else {
              setAcceptBidStep(AcceptBidStep.Checkout)
            }
          })
          .catch((error: any) => {
            setAcceptBidStep(AcceptBidStep.Checkout)
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setAcceptBidStep(AcceptBidStep.Checkout)
      })
  }

  const bidTokenMap = useMemo(
    () =>
      enhancedTokens.reduce((map, token) => {
        token.bidIds.forEach((bidId: any) => {
          map[bidId] = token
        })
        return map
      }, {} as Record<string, (typeof enhancedTokens)[0]>),
    [enhancedTokens]
  )

  const fetchBidsPath = useCallback(
    async (tokens: AcceptBidTokenData[]) => {
      if (!wallet || !client) {
        setIsFetchingBidPath(false)
        return
      }
      setIsFetchingBidPath(true)
      type AcceptOfferOptions = Parameters<
        ReservoirClientActions['acceptOffer']
      >['0']['options']
      let options: AcceptOfferOptions = {
        onlyPath: true,
        ...(currency && { currency }),
        partial: true,
      }
      if (normalizeRoyalties !== undefined) {
        options.normalizeRoyalties = normalizeRoyalties
      }

      type AcceptBidItems = Parameters<
        ReservoirClientActions['acceptOffer']
      >[0]['items']
      const items: AcceptBidItems = tokens?.reduce((items, token) => {
        if (tokens) {
          const contract = token.collectionId.split(':')[0]
          const bids = token.bidIds
            ? token.bidIds.filter((bid) => bid.length > 0)
            : []
          if (bids && bids.length > 0) {
            bids.forEach((bidId) => {
              items.push({
                orderId: bidId,
                token: `${contract}:${token.tokenId}`,
              })
            })
          } else {
            items.push({
              token: `${contract}:${token.tokenId}`,
            })
          }
        }
        return items
      }, [] as AcceptBidItems)

      const acceptOfferParams = {
        chainId: rendererChain?.id,
        items: items,
        wallet,
        options,
        precheck: true,
        onProgress: () => {},
      }

      client.actions
        .acceptOffer(acceptOfferParams)
        .then((data) => {
          if (feesOnTopBps || feesOnTopCustom) {
            const bidsPath =
              'path' in (data as any)
                ? ((data as Execute)['path'] as SellPath)
                : null
            if (bidsPath) {
              let feesOnTop: string[] = []
              if (feesOnTopBps) {
                const total = bidsPath.reduce((total, path) => {
                  return (total += BigInt(path.totalRawPrice || 0n))
                }, 0n)
                feesOnTop = feesOnTopBps.map((feeOnTop) => {
                  const [recipient, fee] = feeOnTop.split(':')
                  return `${recipient}:${formatUnits(
                    (BigInt(fee) * total) / 10000n,
                    0
                  )}`
                })
              } else if (feesOnTopCustom) {
                feesOnTop = feesOnTopCustom(bidsPath) || []
              }

              if (feesOnTop) {
                acceptOfferParams.options.feesOnTop = feesOnTop
                setFeesOnTop(feesOnTop)
              }

              return client.actions.acceptOffer(acceptOfferParams)
            }
          } else {
            return data
          }
        })
        .then((data) => {
          setBidsPath(
            'path' in (data as any)
              ? ((data as Execute)['path'] as SellPath)
              : null
          )
        })
        .finally(() => {
          setIsFetchingBidPath(false)
        })
    },
    [
      currency,
      client,
      wallet,
      rendererChain,
      normalizeRoyalties,
      feesOnTopBps,
      feesOnTopCustom,
    ]
  )

  useEffect(() => {
    if (open) {
      fetchBidsPath(tokens)
    }
  }, [client, tokens, open])

  const currencySymbols = useMemo(
    () =>
      Array.from(
        enhancedTokens.reduce((symbols, { bidsPath }) => {
          bidsPath.forEach(({ sellOutCurrencySymbol, currencySymbol }: any) => {
            if (sellOutCurrencySymbol) {
              symbols.add(sellOutCurrencySymbol)
            }

            if (currencySymbol) {
              symbols.add(currencySymbol)
            }
          })
          return symbols
        }, new Set() as Set<string>)
      ).join(','),
    [enhancedTokens]
  )

  const conversions = useCoinConversion(
    open && currencySymbols.length > 0 ? 'USD' : undefined,
    currencySymbols
  )

  const usdPrices = useMemo(
    () =>
      conversions.reduce((map, price) => {
        map[price.symbol] = price
        return map
      }, {} as ChildrenProps['usdPrices']),
    [conversions]
  )

  const acceptBid = useCallback(async () => {
    setTransactionError(null)
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

    if (!bidsPath) {
      const error = new Error('Missing bids to accept')
      setTransactionError(error)
      throw error
    }

    if (!client) {
      const error = new Error('ReservoirClient was not initialized')
      setTransactionError(error)
      setTransactionError(null)
      throw error
    }

    type AcceptOfferOptions = Parameters<
      ReservoirClientActions['acceptOffer']
    >['0']['options']
    let options: AcceptOfferOptions = {
      partial: true,
      ...(currency && { currency }),
    }

    if (normalizeRoyalties !== undefined) {
      options.normalizeRoyalties = normalizeRoyalties
    }

    if (feesOnTop) {
      options.feesOnTop = feesOnTop
    }

    setAcceptBidStep(AcceptBidStep.ApproveMarketplace)

    type AcceptBidItems = Parameters<
      ReservoirClientActions['acceptOffer']
    >[0]['items']
    const items: AcceptBidItems = bidsPath.map(
      ({ orderId, tokenId, contract }) => ({
        orderId: orderId,
        token: `${contract}:${tokenId}`,
      })
    )

    const expectedPrice: Record<string, ExpectedPrice> = {}
    for (let currency in prices) {
      expectedPrice[currency] = {
        amount: prices[currency].netAmount,
        raw: parseUnits(
          `${prices[currency].netAmount}`,
          prices[currency].currency.decimals || 18
        ),
        currencyAddress: prices[currency].currency.contract,
        currencyDecimals: prices[currency].currency.decimals || 18,
      }
    }

    let hasError = false

    if (rendererChain?.name === auraEVMTestnet?.name) {
      if (!isApproveAll) {
        const steps: Execute['steps'] = [
          {
            error: '',
            errorData: [],
            action: '',
            description: '',
            kind: 'transaction',
            id: 'sale',
            items: [
              {
                status: 'complete',
                transfersData: [
                  {
                    amount: '1',
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
            currentStep: steps[0],
            currentStepItem: steps[0]?.items[0],
            steps: steps,
          })
        }

        setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
        // setStepData({
        //   totalSteps: 1,
        //   currentStep: {
        //     kind: 'transaction',
        //     action: 'approval',
        //     description:
        //       'You will be prompted to grant approval for selling on the marketplace. You only need to approve it once for the first time.',
        //     id: '1',
        //   },
        //   steps: [],
        // })
        // approve module
        await wagmiWallet
          ?.writeContract({
            abi: [
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: '_module',
                    type: 'address',
                  },
                  { internalType: 'bool', name: '_approved', type: 'bool' },
                ],
                name: 'setApprovalForAll',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            address:
              enhancedTokens?.length > 0
                ? (enhancedTokens[0].tokenData?.token
                    ?.contract as `0x${string}`)
                : ('' as `0x${string}`),
            functionName: 'setApprovalForAll',
            args: [
              ContractConfig[chainId ? chainId : 1235]
                ?.ERC721TRANSFERHELPER as `0x${string}`,
              true,
            ],
            gas: 500000n,
          })
          .then((hash) => {
            publicClient
              .waitForTransactionReceipt({ hash })
              .then((res: any) => {
                triggerSetApproveForModule()
              })
              .catch((error: any) => {
                triggerSetApproveForModule()
                setTransactionError(error)
              })
          })
          .catch((err) => {
            setTransactionError(err)
            setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
          })

        return
      }

      if (!isApproveModule) {
        triggerSetApproveForModule()
      } else {
        triggerAcceptBidContract()
      }
    } else {
      client.actions
        .acceptOffer({
          chainId: rendererChain?.id,
          expectedPrice,
          wallet,
          items,
          onProgress: (steps: Execute['steps'], path: Execute['path']) => {
            if (!steps || hasError) return
            setBidsPath(path)
            const executableSteps = steps.filter(
              (step) => step.items && step.items.length > 0
            )

            let stepCount = executableSteps.length

            let currentStepItem:
              | NonNullable<Execute['steps'][0]['items']>[0]
              | undefined
            let currentStepIndex: number = 0
            executableSteps.find((step, index) => {
              currentStepIndex = index
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
                currentStep,
                currentStepItem,
                steps,
              })

              if (currentStep.id === 'auth') {
                setAcceptBidStep(AcceptBidStep.Auth)
              } else if (currentStep.id === 'nft-approval') {
                setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
              } else if (currentStep.id === 'sale') {
                if (
                  currentStep.items?.every(
                    (item) => item.txHashes !== undefined
                  )
                ) {
                  setAcceptBidStep(AcceptBidStep.Finalizing)
                } else {
                  setAcceptBidStep(AcceptBidStep.ApproveMarketplace)
                }
              } else if (currentStep.id === 'swap') {
                setAcceptBidStep(AcceptBidStep.TokenSwap)
              }
            } else if (
              executableSteps.every(
                (step) =>
                  !step.items ||
                  step.items.length == 0 ||
                  step.items?.every((item) => item.status === 'complete')
              )
            ) {
              setAcceptBidStep(AcceptBidStep.Complete)

              const lastStepItem = currentStep.items
                ? currentStep.items[currentStep.items?.length - 1]
                : undefined

              if (lastStepItem) {
                setStepData({
                  totalSteps: stepCount,
                  steps,
                  currentStep,
                  currentStepItem: lastStepItem,
                })
              }
            }
          },
          options,
        })
        .catch((e: Error) => {
          hasError = true
          setTransactionError(e)
          setAcceptBidStep(AcceptBidStep.Checkout)
          setStepData(null)
          fetchBidsPath(tokens)
          mutateTokens()
        })
    }
  }, [
    currency,
    config,
    bidsPath,
    bidTokenMap,
    rendererChain,
    client,
    wallet,
    prices,
    feesOnTop,
    mutateTokens,
    bid,
  ])

  useEffect(() => {
    if (bidsPath && bidsPath.length > 0) {
      const prices: Record<string, AcceptBidPrice> = bidsPath.reduce(
        (
          map,
          {
            quote,
            sellOutCurrency,
            sellOutCurrencyDecimals,
            sellOutCurrencySymbol,
            sellOutQuote,
            sellOutRawQuote,
            currency,
            currencyDecimals,
            currencySymbol,
            builtInFees,
            feesOnTop,
            totalPrice,
          }
        ) => {
          const netAmount = sellOutQuote || quote || 0
          const amount = totalPrice || 0
          let royalty = tokens?.length > 0 ? tokens[0]?.royalty || 0 : 0
          let marketplaceFee = 0

          if (sellOutCurrency && sellOutCurrencySymbol) {
            const referralFee =
              feesOnTop?.reduce(
                (total, fee) => total + (fee?.amount || 0),
                0
              ) || 0
            builtInFees?.forEach((fee) => {
              switch (fee.kind) {
                case 'marketplace': {
                  marketplaceFee = fee.amount || 0
                  break
                }
                case 'royalty': {
                  royalty = fee.amount || 0
                  break
                }
              }
            })
            if (!map[sellOutCurrencySymbol]) {
              map[sellOutCurrencySymbol] = {
                netAmount: netAmount - referralFee,
                amount,
                currency: {
                  contract: sellOutCurrency,
                  symbol: sellOutCurrencySymbol,
                  decimals: currencyDecimals,
                },
                royalty,
                marketplaceFee,
                feesOnTop: referralFee,
              }
            } else if (map[sellOutCurrencySymbol]) {
              map[sellOutCurrencySymbol].netAmount += netAmount - referralFee
              map[sellOutCurrencySymbol].amount += amount
              map[sellOutCurrencySymbol].royalty += royalty
              map[sellOutCurrencySymbol].marketplaceFee += marketplaceFee
              map[sellOutCurrencySymbol].feesOnTop += referralFee
            }
          } else if (currency && currencySymbol) {
            const referralFee =
              feesOnTop?.reduce(
                (total, fee) => total + (fee?.amount || 0),
                0
              ) || 0
            builtInFees?.forEach((fee) => {
              switch (fee.kind) {
                case 'marketplace': {
                  marketplaceFee = fee.amount || 0
                  break
                }
                case 'royalty': {
                  royalty = fee.amount || 0
                  break
                }
              }
            })
            if (!map[currencySymbol]) {
              map[currencySymbol] = {
                netAmount: netAmount - referralFee,
                amount,
                currency: {
                  contract: currency,
                  symbol: currencySymbol,
                  decimals: currencyDecimals,
                },
                royalty,
                marketplaceFee,
                feesOnTop: referralFee,
              }
            } else if (map[currencySymbol]) {
              map[currencySymbol].netAmount += netAmount - referralFee
              map[currencySymbol].amount += amount
              map[currencySymbol].royalty += royalty
              map[currencySymbol].marketplaceFee += marketplaceFee
              map[currencySymbol].feesOnTop += referralFee
            }
          } else {
            map['WAURA'] = {
              netAmount:
                netAmount - marketplaceFee - netAmount * (royalty / 100),
              amount: amount,
              royalty: netAmount * (royalty / 100),
              marketplaceFee: marketplaceFee,
              feesOnTop: 0,
              currency: {
                contract: ContractConfig[chainId ? chainId : 1235]
                  ?.WETH as `0x${string}`,
                symbol: 'WAURA',
                decimals: 18,
              },
            }
          }
          return map
        },
        {} as Record<string, AcceptBidPrice>
      )

      setPrices(Object.values(prices))

      if (acceptBidStep === AcceptBidStep.Unavailable) {
        setAcceptBidStep(AcceptBidStep.Checkout)
      }
    } else if (!isFetchingBidPath) {
      setPrices([])
      setAcceptBidStep(AcceptBidStep.Unavailable)
    }
  }, [client, bidsPath, isFetchingBidPath])

  const swapCurrency = useMemo(() => {
    const bidPath = bidsPath?.[0]
    if (bidPath && bidPath.sellOutCurrency) {
      return {
        contract: bidPath.sellOutCurrency as string,
        decimals: bidPath.sellOutCurrencyDecimals as number,
        symbol: bidPath.sellOutCurrencySymbol as string,
      }
    } else return null
  }, [bidsPath, currency])

  const { address } = useAccount()

  useEffect(() => {
    if (!open) {
      setAcceptBidStep(AcceptBidStep.Checkout)
      setTxHash(null)
      setStepData(null)
      setTransactionError(null)
    }
  }, [open])

  open
    ? (axios.defaults.headers.common['x-rkui-context'] =
        'acceptBidModalRenderer')
    : delete axios.defaults.headers.common?.['x-rkui-context']

  return (
    <>
      {children({
        swapCurrency,
        loading: isFetchingBidPath || isFetchingTokenData,
        tokensData: enhancedTokens,
        acceptBidStep,
        transactionError,
        txHash,
        usdPrices,
        prices,
        address,
        blockExplorerBaseUrl,
        acceptBid,
        setAcceptBidStep,
        stepData,
      })}
    </>
  )
}
