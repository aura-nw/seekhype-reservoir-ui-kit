import React, {
  FC,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  useTokens,
  useCoinConversion,
  useReservoirClient,
  useMarketplaces,
  useCollections,
  useUserTokens,
  useChainCurrency,
} from '../../hooks'
import { createConfig, useAccount, useConfig, useWalletClient } from 'wagmi'
import {
  Execute,
  ReservoirClientActions,
  ReservoirWallet,
  axios,
} from '@sh-reservoir0x/reservoir-sdk'
import dayjs from 'dayjs'
import { Marketplace } from '../../hooks/useMarketplaces'
import { ExpirationOption } from '../../types/ExpirationOption'
import defaultExpirationOptions from '../../lib/defaultExpirationOptions'
import { Currency } from '../../types/Currency'
import {
  WalletClient,
  parseUnits,
  zeroAddress,
  createPublicClient,
  http,
} from 'viem'
import { getAccount, getPublicClient, switchChain } from 'wagmi/actions'
import { ContractConfig, ChainConfig } from '../../constants/common'

export enum ListStep {
  Unavailable,
  SetPrice,
  Listing,
  Complete,
}

export type Listing = Parameters<
  ReservoirClientActions['listToken']
>['0']['listings'][0]

type Exchange = NonNullable<Marketplace['exchanges']>['string']

export type ListingData = {
  listing: Listing
  marketplace: Marketplace
}

export type ListModalStepData = {
  totalSteps: number
  stepProgress: number
  currentStep: Execute['steps'][0]
  listingData: ListingData[]
}

type ChildrenProps = {
  loading: boolean
  token?: NonNullable<NonNullable<ReturnType<typeof useTokens>>['data']>[0]
  quantityAvailable: number
  collection?: NonNullable<ReturnType<typeof useCollections>['data']>[0]
  listStep: ListStep
  usdPrice: number
  expirationOptions: ExpirationOption[]
  expirationOption: ExpirationOption
  marketplace?: Marketplace
  exchange?: Exchange
  listingData: ListingData[]
  transactionError?: Error | null
  stepData: ListModalStepData | null
  price: string
  currencies: Currency[]
  currency: Currency
  quantity: number
  royaltyBps?: number
  setListStep: React.Dispatch<React.SetStateAction<ListStep>>
  setExpirationOption: React.Dispatch<React.SetStateAction<ExpirationOption>>
  setPrice: React.Dispatch<React.SetStateAction<string>>
  setCurrency: (currency: Currency) => void
  setQuantity: React.Dispatch<React.SetStateAction<number>>
  listToken: (options?: { royaltyBps?: number }) => void
}

type Props = {
  open: boolean
  tokenId?: string
  collectionId?: string
  chainId?: number
  orderKind?: ListingData['listing']['orderKind']
  currencies?: Currency[]
  normalizeRoyalties?: boolean
  oracleEnabled: boolean
  feesBps?: string[]
  children: (props: ChildrenProps) => ReactNode
  walletClient?: ReservoirWallet | WalletClient
}

const expirationOptions = [
  ...defaultExpirationOptions,
  {
    text: 'Custom',
    value: 'custom',
    relativeTime: null,
    relativeTimeUnit: null,
  },
]

export const ListModalRenderer: FC<Props> = ({
  open,
  tokenId,
  collectionId,
  orderKind,
  currencies: preferredCurrencies,
  chainId,
  normalizeRoyalties,
  oracleEnabled = false,
  feesBps,
  children,
  walletClient,
}) => {
  const account = useAccount()

  const client = useReservoirClient()
  const currentChain = client?.currentChain()
  const config = useConfig()

  const rendererChain = chainId
    ? client?.chains.find(({ id }) => id === chainId) || currentChain
    : currentChain

  const { data: wagmiWallet } = useWalletClient({ chainId: rendererChain?.id })

  const wallet = walletClient || wagmiWallet

  const [listStep, setListStep] = useState<ListStep>(ListStep.SetPrice)
  const [listingData, setListingData] = useState<ListingData[]>([])
  const [publicClient, setPublicClient] = useState<any>(undefined)
  const [allMarketplaces] = useMarketplaces(
    collectionId,
    tokenId,
    true,
    feesBps,
    rendererChain?.id,
    open
  )

  const marketplace = useMemo(
    () =>
      allMarketplaces.find(
        (marketplace) => marketplace.orderbook === 'reservoir'
      ),
    [allMarketplaces]
  )

  const auraEVMTestnet = ChainConfig[chainId ? chainId : 1235]

  useEffect(() => {
    setPublicClient(
      createPublicClient({
        chain: ChainConfig[chainId ? chainId : 1235],
        transport: http(),
      })
    )
  }, [])

  const [transactionError, setTransactionError] = useState<Error | null>()
  const [stepData, setStepData] = useState<ListModalStepData | null>(null)
  const [price, setPrice] = useState('')
  const chainCurrency = useChainCurrency(rendererChain?.id)
  const defaultCurrency = {
    contract: chainCurrency.address,
    symbol: chainCurrency.symbol,
  }
  const [currencies, setCurrencies] = useState<Currency[] | undefined>(
    preferredCurrencies
  )
  const [currency, setCurrency] = useState<Currency>(
    preferredCurrencies && preferredCurrencies[0]
      ? preferredCurrencies[0]
      : defaultCurrency
  )
  const [quantity, setQuantity] = useState(1)
  const [isApproveModule, setIsApproveModule] = useState(false)
  const [isApproveNft, setIsApproveNft] = useState(false)
  const contract = collectionId ? collectionId?.split(':')[0] : undefined
  const { data: collections } = useCollections(
    open && {
      id: collectionId,
      normalizeRoyalties,
    },
    {},
    rendererChain?.id
  )
  const collection = collections && collections[0] ? collections[0] : undefined

  const [expirationOption, setExpirationOption] = useState<ExpirationOption>(
    expirationOptions[5]
  )

  const royaltyBps = collection?.royalties?.bps
    ? collection?.royalties?.bps
    : marketplace?.royalties?.maxBps
    ? marketplace?.royalties?.maxBps
    : 0

  const { data: tokens } = useTokens(
    open && {
      tokens: [`${contract}:${tokenId}`],
      includeAttributes: true,
      includeLastSale: true,
      normalizeRoyalties,
    },
    {
      revalidateFirstPage: true,
    },
    rendererChain?.id
  )

  const token = tokens && tokens.length > 0 ? tokens[0] : undefined
  const is1155 = token?.token?.kind === 'erc1155'

  const { data: userTokens } = useUserTokens(
    open && is1155 ? account.address : undefined,
    {
      tokens: [`${contract}:${tokenId}`],
    },
    {},
    rendererChain?.id
  )

  const quantityAvailable =
    is1155 && userTokens[0]
      ? Number(userTokens[0].ownership?.tokenCount || 1)
      : 1

  const coinConversion = useCoinConversion(
    open ? 'USD' : undefined,
    currency.symbol,
    currency.coinGeckoId
  )
  const usdPrice = coinConversion.length > 0 ? coinConversion[0].price : 0

  useEffect(() => {
    if (!open) {
      setListStep(ListStep.SetPrice)
      setTransactionError(null)
      setPrice('')
      setStepData(null)
      setExpirationOption(expirationOptions[5])
      setQuantity(1)
      setCurrency(defaultCurrency)
    }
  }, [open])

  open
    ? (axios.defaults.headers.common['x-rkui-context'] = 'listModalRenderer')
    : delete axios.defaults.headers.common?.['x-rkui-context']

  const exchange = useMemo(() => {
    const exchanges: Record<string, Exchange> = marketplace?.exchanges || {}
    const exchange = orderKind
      ? exchanges[orderKind]
      : Object.values(exchanges).find((exchange) => exchange?.enabled)
    return exchange?.enabled ? exchange : undefined
  }, [marketplace, orderKind])

  useEffect(() => {
    if (exchange?.paymentTokens && exchange?.paymentTokens.length > 0) {
      const restrictedCurrencies = exchange.paymentTokens
        .filter((token) => token.address && token.symbol)
        .map((token) => ({
          contract: token.address as string,
          decimals: token.decimals,
          name: token.name,
          symbol: token.symbol as string,
        }))
      setCurrencies(restrictedCurrencies)

      if (
        !restrictedCurrencies.find(
          (c) => currency.contract.toLowerCase() == c.contract.toLowerCase()
        )
      ) {
        setCurrency(restrictedCurrencies[0])
      }
    } else {
      setCurrency(
        preferredCurrencies && preferredCurrencies[0]
          ? preferredCurrencies[0]
          : defaultCurrency
      )
      setCurrencies(preferredCurrencies)
    }
  }, [exchange, open])

  useEffect(() => {
    if (marketplace && !exchange) {
      setListStep(ListStep.Unavailable)
    }
  }, [marketplace, exchange])

  useEffect(() => {
    if (currencies && currencies.length > 5) {
      console.warn(
        'The ListModal UI was designed to have a maximum of 5 currencies, going above 5 may degrade the user experience.'
      )
    }
  }, [currencies])

  const checkIsApproveModuleAsk = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            inputs: [
              { internalType: 'address', name: '_user', type: 'address' },
              { internalType: 'address', name: '_module', type: 'address' },
            ],
            name: 'isModuleApproved',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.ZORA_MODULE_MANAGER_ADDRESS as `0x${string}`,
        functionName: 'isModuleApproved',
        args: [
          account?.address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.ASK1_1_MODULE_ADDRESS as `0x${string}`,
        ],
      })
      .then((res) => {
        if (res) {
          setIsApproveModule(true)
        }
      })
      .catch((err) => {
        setIsApproveModule(false)
        console.log(err)
        console.log('message: ' + err?.message)
      })
  }

  const checkIsApproveNft = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            constant: true,
            inputs: [
              { internalType: 'address', name: 'owner', type: 'address' },
              { internalType: 'address', name: 'operator', type: 'address' },
            ],
            name: 'isApprovedForAll',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: contract as `0x${string}`,
        functionName: 'isApprovedForAll',
        args: [
          account?.address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.ERC721TRANSFERHELPER as `0x${string}`,
        ],
      })
      .then((res) => {
        if (res) {
          setIsApproveNft(true)
        }
      })
      .catch((err) => {
        setIsApproveNft(false)
        console.log(err)
        console.log('message: ' + err?.message)
      })
  }

  useEffect(() => {
    if (publicClient) {
      checkIsApproveModuleAsk()
      checkIsApproveNft()
    }
  }, [publicClient])

  const triggerListTokenContract = (maker: any) => {
    setListStep(ListStep.Listing)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'signature',
        action: '',
        description:
          'Please review and confirm to create the listing from your wallet.',
        id: '1',
      },
      listingData: [],
    })
    // list token
    wagmiWallet
      ?.writeContract({
        abi: [
          {
            inputs: [
              {
                internalType: 'address',
                name: '_tokenContract',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: '_askPrice',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: '_askCurrency',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '_sellerFundsRecipient',
                type: 'address',
              },
              {
                internalType: 'uint16',
                name: '_findersFeeBps',
                type: 'uint16',
              },
            ],
            name: 'createAsk',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.ASK1_1_MODULE_ADDRESS as `0x${string}`,
        functionName: 'createAsk',
        args: [
          contract as `0x${string}`,
          BigInt(Number(tokenId)),
          BigInt(Number(price) * Math.pow(10, 18)),
          zeroAddress,
          maker as `0x${string}`,
          0,
        ],
        gas: 500000n,
      })
      .then((hash) => {
        publicClient
          .waitForTransactionReceipt({ hash })
          .then((res) => {
            if (res?.status === 'success') {
              setTimeout(() => {
                setListStep(ListStep.Complete)
              }, 5000)
            }
          })
          .catch((error) => {
            setListStep(ListStep.SetPrice)
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setListStep(ListStep.SetPrice)
      })
  }

  const triggerApproveCollection = (maker: any) => {
    setListStep(ListStep.Listing)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'transaction',
        action: '',
        description:
          'Please approve the collection(s) from your wallet. Each collection only needs to be approved once.',
        id: '1',
      },
      listingData: [],
    })
    // approve nft
    wagmiWallet
      ?.writeContract({
        abi: [
          {
            constant: false,
            inputs: [
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'bool', name: 'approved', type: 'bool' },
            ],
            name: 'setApprovalForAll',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: contract as `0x${string}`,
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
          .then(() => {
            triggerListTokenContract(maker)
          })
          .catch((error) => {
            triggerListTokenContract(maker)
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setListStep(ListStep.SetPrice)
      })
  }

  const listToken = useCallback(
    async (options: { royaltyBps?: number } | undefined) => {
      const { royaltyBps } = options ?? {}
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

      if (!client) {
        const error = new Error('ReservoirClient was not initialized')
        setTransactionError(error)
        throw error
      }

      if (!marketplace) {
        throw new Error('No marketplace found')
      }

      if (!exchange) {
        throw new Error('No exchange found')
      }

      setTransactionError(null)

      let expirationTime: string | null = null

      if (expirationOption.relativeTime) {
        if (expirationOption.relativeTimeUnit) {
          expirationTime = dayjs()
            .add(
              expirationOption.relativeTime,
              expirationOption.relativeTimeUnit
            )
            .unix()
            .toString()
        } else {
          expirationTime = `${expirationOption.relativeTime}`
        }
      }

      const listing: Listing = {
        token: `${contract}:${tokenId}`,
        weiPrice: (
          parseUnits(`${+price}`, currency.decimals || 18) * BigInt(quantity)
        ).toString(),
        // @ts-ignore
        orderbook: marketplace.orderbook,
        // @ts-ignore
        orderKind: exchange.orderKind,
      }

      const fees = feesBps || client.marketplaceFees
      if (fees) {
        listing.marketplaceFees = fees
      }

      if (quantity > 1) {
        listing.quantity = quantity
      }

      if (expirationTime) {
        listing.expirationTime = expirationTime
      }

      if (currency && currency.contract != zeroAddress) {
        listing.currency = currency.contract
      }

      if (oracleEnabled) {
        listing.options = {
          [`${listing.orderKind}`]: {
            useOffChainCancellation: true,
          },
        }
      }

      if (royaltyBps !== undefined) {
        listing.royaltyBps = royaltyBps
      }

      setListingData([{ listing, marketplace }])
      setListStep(ListStep.Listing)

      const maker = account?.address
      if (rendererChain?.name === auraEVMTestnet?.name) {
        if (!isApproveModule) {
          setListStep(ListStep.Listing)
          setStepData({
            totalSteps: 1,
            stepProgress: 1,
            currentStep: {
              kind: 'transaction',
              action: 'approval',
              description:
                'You will be prompted to grant approval for selling on the marketplace. You only need to approve it once for the first time.',
              id: '1',
            },
            listingData: [],
          })
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
                  name: 'setApprovalForModule',
                  outputs: [],
                  stateMutability: 'nonpayable',
                  type: 'function',
                },
              ],
              address: ContractConfig[chainId ? chainId : 1235]
                ?.ZORA_MODULE_MANAGER_ADDRESS as `0x${string}`,
              functionName: 'setApprovalForModule',
              args: [
                ContractConfig[chainId ? chainId : 1235]
                  ?.ASK1_1_MODULE_ADDRESS as `0x${string}`,
                true,
              ],
              gas: 500000n,
            })
            .then((hash) => {
              publicClient
                .waitForTransactionReceipt({ hash })
                .then((res) => {
                  triggerApproveCollection(maker)
                })
                .catch((error) => {
                  triggerApproveCollection(maker)
                  setTransactionError(error)
                })
            })
            .catch((err) => {
              setTransactionError(err)
              setListStep(ListStep.SetPrice)
            })

          return
        }

        if (!isApproveNft) {
          triggerApproveCollection(maker)
        } else {
          triggerListTokenContract(maker)
        }
      } else {
        client.actions
          .listToken({
            chainId: rendererChain?.id,
            listings: [listing],
            wallet,
            onProgress: (steps: Execute['steps']) => {
              const executableSteps = steps.filter(
                (step) => step.items && step.items.length > 0
              )

              let stepCount = executableSteps.length
              let incompleteStepItemIndex: number | null = null
              let incompleteStepIndex: number | null = null

              executableSteps.find((step, i) => {
                if (!step.items) {
                  return false
                }

                incompleteStepItemIndex = step.items.findIndex(
                  (item) => item.status == 'incomplete'
                )
                if (incompleteStepItemIndex !== -1) {
                  incompleteStepIndex = i
                  return true
                }
              })

              if (
                incompleteStepIndex === null ||
                incompleteStepItemIndex === null
              ) {
                const currentStep = executableSteps[executableSteps.length - 1]
                const currentStepItem = currentStep.items
                  ? currentStep.items[currentStep.items.length]
                  : null
                setListStep(ListStep.Complete)
                const listings =
                  currentStepItem && currentStepItem.orderIndexes !== undefined
                    ? listingData.filter((_, i) =>
                        currentStepItem.orderIndexes?.includes(i)
                      )
                    : [listingData[listingData.length - 1]]
                setStepData({
                  totalSteps: stepCount,
                  stepProgress: stepCount,
                  currentStep,
                  listingData: listings,
                })
              } else {
                const currentStep = executableSteps[incompleteStepIndex]
                const listingIndexes: Set<number> = new Set()
                currentStep.items?.forEach(({ orderIndexes, status }) => {
                  if (status === 'incomplete') {
                    orderIndexes?.forEach((orderIndex) => {
                      listingIndexes.add(orderIndex)
                    })
                  }
                })
                const listings = Array.from(listingIndexes).map(
                  (index) => listingData[index]
                )

                setStepData({
                  totalSteps: stepCount,
                  stepProgress: incompleteStepIndex,
                  currentStep: executableSteps[incompleteStepIndex],
                  listingData: listings,
                })
              }
            },
          })
          .catch((error: Error) => {
            setListStep(ListStep.SetPrice)
            setTransactionError(error)
          })
      }
    },
    [
      client,
      wallet,
      config,
      collectionId,
      chainId,
      tokenId,
      expirationOption,
      currency,
      quantity,
      feesBps,
      price,
      marketplace,
      exchange,
      isApproveModule,
      isApproveNft,
    ]
  )

  return (
    <>
      {children({
        loading: !token || !collection || !marketplace,
        token,
        quantityAvailable,
        collection,
        listStep,
        usdPrice,
        marketplace,
        exchange,
        expirationOption,
        expirationOptions,
        listingData,
        transactionError,
        stepData,
        price,
        currencies: currencies || [defaultCurrency],
        currency,
        quantity,
        royaltyBps,
        setListStep,
        setPrice,
        setCurrency,
        setExpirationOption,
        setQuantity,
        listToken,
      })}
    </>
  )
}

ListModalRenderer.displayName = 'ListModalRenderer'
