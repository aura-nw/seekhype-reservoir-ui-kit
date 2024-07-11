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
  useCollections,
  useAttributes,
  useChainCurrency,
  useMarketplaces,
} from '../../hooks'
import {
  useAccount,
  useBalance,
  useConfig,
  useReadContracts,
  useWalletClient,
} from 'wagmi'
import { mainnet, goerli } from 'wagmi/chains'

import {
  Execute,
  ReservoirClientActions,
  ReservoirWallet,
  axios,
} from '@sh-reservoir0x/reservoir-sdk'
import { ExpirationOption } from '../../types/ExpirationOption'
import defaultExpirationOptions from '../../lib/defaultExpirationOptions'
import { formatBN } from '../../lib/numbers'

import dayjs from 'dayjs'
import wrappedContractNames from '../../constants/wrappedContractNames'
import wrappedContracts from '../../constants/wrappedContracts'
import { Currency } from '../../types/Currency'
import {
  Address,
  WalletClient,
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  parseEther,
  parseGwei,
  parseUnits,
  zeroAddress,
} from 'viem'
import { getAccount, getWalletClient, switchChain } from 'wagmi/actions'
import { Marketplace } from '../../hooks/useMarketplaces'
import { ChainConfig, ContractConfig, HALO_TRADE } from '../../constants/common'

const expirationOptions = [
  ...defaultExpirationOptions,
  {
    text: 'Custom',
    value: 'custom',
    relativeTime: null,
    relativeTimeUnit: null,
  },
]

export type FetchBalanceResult = {
  decimals: number
  formatted: string
  symbol: string
  value: bigint
}

export enum BidStep {
  SetPrice,
  Offering,
  Complete,
  Unavailable,
}

export type Traits =
  | NonNullable<ReturnType<typeof useAttributes>['data']>
  | undefined

export type Trait =
  | {
      key: string
      value: string
      floorAskPrice?: number
    }
  | undefined

type Exchange = NonNullable<Marketplace['exchanges']>['string']

type ChildrenProps = {
  token?: NonNullable<NonNullable<ReturnType<typeof useTokens>>['data']>[0]
  collection?: NonNullable<ReturnType<typeof useCollections>['data']>[0]
  attributes?: Traits
  bidAmountPerUnit: string
  totalBidAmount: bigint
  totalBidAmountUsd: number
  quantity: number
  setQuantity: React.Dispatch<React.SetStateAction<number>>
  bidData: BidData | null
  bidStep: BidStep
  hasEnoughNativeCurrency: boolean
  hasEnoughWrappedCurrency: boolean
  loading: boolean
  traitBidSupported: boolean
  collectionBidSupported: boolean
  partialBidSupported: boolean
  biddingSupported: boolean
  amountToWrap: string
  usdPrice: number | null
  balance?: FetchBalanceResult
  wrappedBalance?: [bigint, number, string]
  wrappedContractName: string
  wrappedContractAddress: string
  canAutomaticallyConvert: boolean
  convertLink: string
  transactionError?: Error | null
  expirationOptions: ExpirationOption[]
  expirationOption: ExpirationOption
  stepData: BidModalStepData | null
  currencies: Currency[]
  currency?: Currency
  exchange?: Exchange
  feeBps?: number
  setCurrency: (currency: Currency) => void
  setBidStep: React.Dispatch<React.SetStateAction<BidStep>>
  setBidAmountPerUnit: React.Dispatch<React.SetStateAction<string>>
  setExpirationOption: React.Dispatch<React.SetStateAction<ExpirationOption>>
  setTrait: React.Dispatch<React.SetStateAction<Trait>>
  trait: Trait
  placeBid: (options?: { royaltyBps?: number }) => void
}

type Props = {
  open: boolean
  tokenId?: string
  chainId?: number
  collectionId?: string
  attribute?: Trait
  normalizeRoyalties?: boolean
  currencies?: Currency[]
  oracleEnabled: boolean
  feesBps?: string[] | null
  orderKind?: BidData['orderKind']
  children: (props: ChildrenProps) => ReactNode
  walletClient?: ReservoirWallet | WalletClient
  usePermit?: boolean
}

export const BID_AMOUNT_MINIMUM = 0.000001

export type BidData = Parameters<
  ReservoirClientActions['placeBid']
>['0']['bids'][0]

export type BidModalStepData = {
  totalSteps: number
  stepProgress: number
  currentStep: Execute['steps'][0]
}

export const BidModalRenderer: FC<Props> = ({
  open,
  tokenId,
  chainId,
  collectionId,
  orderKind,
  attribute,
  normalizeRoyalties,
  currencies: preferredCurrencies,
  oracleEnabled = false,
  feesBps,
  children,
  walletClient,
  usePermit,
}) => {
  const client = useReservoirClient()
  const currentChain = client?.currentChain()

  const rendererChain = chainId
    ? client?.chains.find(({ id }) => id === chainId) || currentChain
    : currentChain

  const { data: wagmiWallet } = useWalletClient({ chainId: rendererChain?.id })
  const config = useConfig()

  const wallet = walletClient || wagmiWallet

  const [bidStep, setBidStep] = useState<BidStep>(BidStep.SetPrice)
  const [transactionError, setTransactionError] = useState<Error | null>()
  const [bidAmountPerUnit, setBidAmountPerUnit] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [expirationOption, setExpirationOption] = useState<ExpirationOption>(
    expirationOptions[3]
  )
  const [hasEnoughNativeCurrency, setHasEnoughNativeCurrency] = useState(false)
  const [hasEnoughWrappedCurrency, setHasEnoughWrappedCurrency] =
    useState(false)
  const [amountToWrap, setAmountToWrap] = useState('')
  const [stepData, setStepData] = useState<BidModalStepData | null>(null)
  const [bidData, setBidData] = useState<BidData | null>(null)
  const contract = collectionId ? collectionId?.split(':')[0] : undefined
  const [trait, setTrait] = useState<Trait>(attribute)
  const [attributes, setAttributes] = useState<Traits>()
  const chainCurrency = useChainCurrency(rendererChain?.id)
  const [publicClient, setPublicClient] = useState<any>(undefined)
  const [isApproveModule, setIsApproveModule] = useState(false)
  const [wAuraBalance, setWAuraBalance] = useState(0n)

  const account = useAccount()
  const auraEVMTestnet = ChainConfig[chainId ? chainId : 1235]

  useEffect(() => {
    setPublicClient(
      createPublicClient({
        chain: ChainConfig[chainId ? chainId : 1235],
        transport: http(),
      })
    )
  }, [])

  const nativeWrappedContractAddress =
    chainCurrency.chainId in wrappedContracts
      ? wrappedContracts[chainCurrency.chainId]
      : wrappedContracts[1]
  const nativeWrappedContractName =
    chainCurrency.chainId in wrappedContractNames
      ? wrappedContractNames[chainCurrency.chainId]
      : wrappedContractNames[1]

  const defaultCurrency = {
    contract: nativeWrappedContractAddress,
    symbol: nativeWrappedContractName,
  }
  const [currency, setCurrency] = useState<Currency>(
    preferredCurrencies && preferredCurrencies[0]
      ? preferredCurrencies[0]
      : defaultCurrency
  )
  const [currencies, setCurrencies] = useState<Currency[] | undefined>(
    preferredCurrencies
  )

  const wrappedContractAddress = currency
    ? currency.contract
    : nativeWrappedContractAddress
  const wrappedContractName = currency
    ? currency.symbol
    : nativeWrappedContractName

  const { data: tokens } = useTokens(
    open &&
      tokenId !== undefined && {
        tokens: [`${contract}:${tokenId}`],
        includeTopBid: true,
        normalizeRoyalties,
      },
    {
      revalidateFirstPage: true,
    },
    rendererChain?.id
  )

  const { data: traits } = useAttributes(
    open && !tokenId ? collectionId : undefined,
    rendererChain?.id
  )

  const { data: collections } = useCollections(
    open && {
      id: collectionId,
      normalizeRoyalties,
    },
    {},
    rendererChain?.id
  )

  const collection = collections && collections[0] ? collections[0] : undefined

  const token = tokens && tokens.length > 0 ? tokens[0] : undefined
  const usdConversion = useCoinConversion(
    open ? 'USD' : undefined,
    wrappedContractName
  )
  const usdPrice = usdConversion.length > 0 ? usdConversion[0].price : null
  const totalBidAmount =
    parseUnits(bidAmountPerUnit, currency?.decimals ?? 18) *
    BigInt(quantity ?? 1)
  const totalBidAmountUsd =
    Number(formatUnits(totalBidAmount, currency?.decimals ?? 18)) *
    (usdPrice || 0)

  const [allMarketplaces] = useMarketplaces(
    collectionId,
    tokenId,
    undefined,
    undefined,
    rendererChain?.id,
    open
  )

  const reservoirMarketplace = useMemo(
    () =>
      allMarketplaces.find(
        (marketplace) => marketplace.orderbook === 'reservoir'
      ),
    [allMarketplaces]
  )

  const exchange = useMemo(() => {
    const exchanges: Record<string, Exchange> =
      reservoirMarketplace?.exchanges || {}
    const exchange = orderKind
      ? exchanges[orderKind]
      : Object.values(exchanges).find((exchange) => exchange?.enabled)
    return exchange?.enabled ? exchange : undefined
  }, [reservoirMarketplace, orderKind])

  const traitBidSupported = Boolean(exchange?.traitBidSupported)
  const collectionBidSupported = Boolean(exchange?.collectionBidSupported)
  const partialBidSupported = Boolean(exchange?.partialOrderSupported)
  const biddingSupported = exchange?.supportedBidCurrencies
    ? exchange?.supportedBidCurrencies?.length > 0
    : false

  // Set bid step to unavailable if collection bid is not supported or if bidding is not supported
  useEffect(() => {
    if (
      open &&
      reservoirMarketplace &&
      ((!tokenId && !collectionBidSupported) || !biddingSupported)
    ) {
      setBidStep(BidStep.Unavailable)
    } else {
      setBidStep(BidStep.SetPrice)
    }
  }, [
    open,
    tokenId,
    reservoirMarketplace,
    collectionBidSupported,
    biddingSupported,
  ])

  const { address } = useAccount()
  const { data: balance } = useBalance({
    address: address,
    chainId: rendererChain?.id,
    query: {
      enabled: open,
    },
  })

  const { data: wrappedBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: wrappedContractAddress as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        chainId: rendererChain?.id,
        args: [address as Address],
      },
      {
        address: wrappedContractAddress as Address,
        abi: erc20Abi,
        chainId: rendererChain?.id,
        functionName: 'decimals',
      },
      {
        address: wrappedContractAddress as Address,
        abi: erc20Abi,
        chainId: rendererChain?.id,
        functionName: 'symbol',
      },
    ],
    query: {
      enabled: Boolean(open && address !== undefined),
    },
  })

  const canAutomaticallyConvert =
    !currency ||
    currency.contract.toLowerCase() ===
      nativeWrappedContractAddress.toLowerCase()
  let convertLink: string = ''

  if (canAutomaticallyConvert) {
    // convertLink =
    //   rendererChain?.id === mainnet.id || rendererChain?.id === goerli.id
    //     ? `https://app.uniswap.org/#/swap?theme=dark&exactAmount=${amountToWrap}&chain=mainnet&inputCurrency=eth&outputCurrency=${wrappedContractAddress}`
    //     : `https://app.uniswap.org/#/swap?theme=dark&exactAmount=${amountToWrap}`

    convertLink = HALO_TRADE[rendererChain?.id || 1235]
  } else {
    // convertLink = `https://jumper.exchange/?toChain=${rendererChain?.id}&toToken=${wrappedContractAddress}`
    convertLink = HALO_TRADE[rendererChain?.id || 1235]
  }

  const feeBps: number | undefined = useMemo(() => {
    let bpsFees = feesBps || client?.marketplaceFees
    if (bpsFees) {
      return bpsFees.reduce((total, fee) => {
        const bps = Number(fee.split(':')[1])
        total += bps
        return total
      }, 0)
    }
  }, [feesBps, client?.marketplaceFees, currency])

  useEffect(() => {
    if (totalBidAmount !== 0n) {
      const bid = totalBidAmount

      if (!wrappedBalance?.[0] || wrappedBalance?.[0] < bid) {
        setHasEnoughWrappedCurrency(false)
        const wrappedAmount = wrappedBalance?.[0]
          ? BigInt(wrappedBalance?.[0])
          : BigInt(0)
        const amountToWrap = bid - wrappedAmount
        setAmountToWrap(formatBN(amountToWrap, 5))

        if (!balance?.value || balance.value < amountToWrap) {
          setHasEnoughNativeCurrency(false)
        } else {
          setHasEnoughNativeCurrency(true)
        }
      } else {
        setHasEnoughWrappedCurrency(true)
        setHasEnoughNativeCurrency(true)
        setAmountToWrap('')
      }
    } else {
      setHasEnoughNativeCurrency(true)
      setHasEnoughWrappedCurrency(true)
      setAmountToWrap('')
    }
  }, [totalBidAmount, balance, wrappedBalance])

  useEffect(() => {
    const validAttributes = traits
      ? traits.filter(
          (attribute) => attribute.values && attribute.values.length > 0
        )
      : undefined
    setAttributes(validAttributes)
  }, [traits])

  useEffect(() => {
    const validAttributes = traits
      ? traits.filter(
          (attribute) => attribute.values && attribute.values.length > 0
        )
      : undefined
    setAttributes(validAttributes)
  }, [traits])

  useEffect(() => {
    if (!open) {
      setBidStep(BidStep.SetPrice)
      setExpirationOption(expirationOptions[3])
      setHasEnoughNativeCurrency(false)
      setHasEnoughWrappedCurrency(false)
      setAmountToWrap('')
      setBidAmountPerUnit('')
      setQuantity(1)
      setStepData(null)
      setBidData(null)
      setTransactionError(null)
      setTrait(undefined)
    } else {
      setTrait(attribute)
    }
    setCurrency(currencies && currencies[0] ? currencies[0] : defaultCurrency)
  }, [open])

  open
    ? (axios.defaults.headers.common['x-rkui-context'] = 'bidModalRenderer')
    : delete axios.defaults.headers.common?.['x-rkui-context']

  useEffect(() => {
    const setDefaultCurrency = async () => {
      const supportedCurrencies =
        exchange?.supportedBidCurrencies?.map((currency) => {
          return {
            address: currency?.address?.toLowerCase() as string,
            contract: currency?.address?.toLowerCase() as string,
            decimals: currency?.decimals ?? 18,
            name: currency?.name ?? '',
            symbol: currency?.symbol ?? '',
          }
        }) || []
      const supportedCurrencyAddresses = supportedCurrencies.map(
        (currency) => currency.address
      )
      if (exchange?.paymentTokens) {
        let restrictedCurrencies = exchange.paymentTokens
          .filter(
            (token) =>
              token.address &&
              token.symbol &&
              supportedCurrencyAddresses.includes(token.address.toLowerCase())
          )
          .map((token) => ({
            contract: token.address as string,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol as string,
          }))
        if (!restrictedCurrencies.length) {
          restrictedCurrencies = supportedCurrencies ?? []
        }
        setCurrencies(restrictedCurrencies)

        if (
          !restrictedCurrencies.find(
            (c) => currency.contract.toLowerCase() == c.contract.toLowerCase()
          )
        ) {
          setCurrency(restrictedCurrencies[0])
        }
      } else {
        const currencies = preferredCurrencies?.filter((currency) =>
          currency.contract.toLowerCase()
        )
        setCurrency(
          currencies && currencies[0] ? currencies[0] : defaultCurrency
        )
        setCurrencies(preferredCurrencies)
      }
    }
    setDefaultCurrency()
  }, [exchange, open])

  useEffect(() => {
    if (currencies && currencies.length > 5) {
      console.warn(
        'The BidModal UI was designed to have a maximum of 5 currencies, going above 5 may degrade the user experience.'
      )
    }
  }, [currencies])

  const checkBalanceWAura = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            inputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
            name: 'balanceOf',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.WETH as `0x${string}`,
        functionName: 'balanceOf',
        args: [account?.address as `0x${string}`],
      })
      .then((res: any) => {
        if (res) {
          setWAuraBalance(res)
        }
      })
  }

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
          ?.OFFER_MODULE_MANAGER as `0x${string}`,
        functionName: 'isModuleApproved',
        args: [
          account?.address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.OFFERS_OMNIBUS as `0x${string}`,
        ],
      })
      .then((res: any) => {
        if (!res) {
          triggerApproveModuleAsk()
        } else {
          triggerBidTokenContract()
        }
      })
  }

  const checkIsSetAllowance = () => {
    publicClient
      ?.readContract({
        abi: [
          {
            type: 'function',
            name: 'allowance',
            inputs: [
              {
                name: '',
                type: 'address',
                internalType: 'address',
              },
              {
                name: '',
                type: 'address',
                internalType: 'address',
              },
            ],
            outputs: [
              {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
            stateMutability: 'view',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.WETH as `0x${string}`,
        functionName: 'allowance',
        args: [
          account?.address as `0x${string}`,
          ContractConfig[chainId ? chainId : 1235]
            ?.ERC20TransferHelper as `0x${string}`,
        ],
      })
      .then((res: any) => {
        if (res < totalBidAmount) {
          let allowanceValue = totalBidAmount

          triggerSetAllowance(allowanceValue)
        } else {
          checkIsApproveModuleAsk()
        }
      })
  }

  useEffect(() => {
    if (publicClient) {
      // checkIsApproveModuleAsk()
      checkBalanceWAura()
    }
  }, [publicClient])

  const triggerApproveModuleAsk = () => {
    setBidStep(BidStep.Offering)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'transaction',
        action: 'Module Approval',
        description:
          'You will be prompted to grant approval for offering on the marketplace. You only need to approve it once.',
        id: '1',
      },
    })
    // approve module
    wagmiWallet
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
          .then((res: any) => {
            triggerBidTokenContract()
          })
          .catch((error: any) => {
            triggerBidTokenContract()
            setTransactionError(error)
            setBidStep(BidStep.Offering)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setBidStep(BidStep.Offering)
      })
  }

  const triggerDepositWAura = () => {
    setBidStep(BidStep.Offering)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'transaction',
        action: 'Wrapping currency',
        description: `We'll ask your approval to wrap the currency for bidding. Gas fee required.`,
        id: '1',
      },
    })

    wagmiWallet
      ?.writeContract({
        abi: [
          {
            type: 'function',
            name: 'deposit',
            inputs: [],
            outputs: [],
            stateMutability: 'payable',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.WETH as `0x${string}`,
        functionName: 'deposit',
        args: [],
        gas: 500000n,
        value: totalBidAmount - (wrappedBalance?.[0] || 0n),
      })
      .then((hash) => {
        publicClient
          .waitForTransactionReceipt({ hash })
          .then(() => {
            // triggerBidTokenContract()
            checkIsSetAllowance()
          })
          .catch((error: any) => {
            // triggerBidTokenContract()
            checkIsSetAllowance()
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setBidStep(BidStep.Offering)
      })
  }

  const triggerBidTokenContract = async () => {
    setBidStep(BidStep.Offering)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'signature',
        action: '',
        description:
          'Please review and confirm to create the offer from your wallet',
        id: '1',
      },
    })
    // Bid token
    let expirationTime = 0
    if (expirationOption.relativeTime) {
      if (expirationOption.relativeTimeUnit) {
        expirationTime = dayjs()
          .add(expirationOption.relativeTime, expirationOption.relativeTimeUnit)
          .unix()
      } else {
        expirationTime = expirationOption.relativeTime
      }
    }

    const wagmiWalletClient = await getWalletClient(config, {
      chainId: rendererChain?.id,
    })

    wagmiWalletClient
      ?.writeContract({
        abi: [
          {
            type: 'function',
            name: 'createOffer',
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
                name: '_offerCurrency',
                type: 'address',
                internalType: 'address',
              },
              {
                name: '_offerAmount',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: '_expiry',
                type: 'uint96',
                internalType: 'uint96',
              },
              {
                name: '_findersFeeBps',
                type: 'uint16',
                internalType: 'uint16',
              },
              {
                name: '_listingFeeBps',
                type: 'uint16',
                internalType: 'uint16',
              },
              {
                name: '_listingFeeRecipient',
                type: 'address',
                internalType: 'address',
              },
            ],
            outputs: [
              {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
            stateMutability: 'payable',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.OFFERS_OMNIBUS as `0x${string}`,
        functionName: 'createOffer',
        args: [
          contract as `0x${string}`,
          BigInt(Number(tokenId)),
          wrappedContractAddress as `0x${string}`,
          totalBidAmount,
          BigInt(expirationTime),
          0,
          0,
          zeroAddress,
        ],
        gas: 500000n,
      })
      .then((hash) => {
        publicClient
          .waitForTransactionReceipt({ hash })
          .then((res: any) => {
            if (res?.status === 'success') {
              setTimeout(() => {
                setBidStep(BidStep.Complete)
              }, 5000)
            } else {
              setTransactionError({
                name: 'reverted',
                message: `Failed: Offer ${res?.status}`,
              })
            }
          })
          .catch((error: any) => {
            setBidStep(BidStep.Offering)
            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setBidStep(BidStep.Offering)
      })
  }

  const triggerSetAllowance = (allowanceValue: bigint) => {
    setBidStep(BidStep.Offering)
    setStepData({
      totalSteps: 1,
      stepProgress: 1,
      currentStep: {
        kind: 'transaction',
        action: 'Approve currency',
        description: `We'll ask your approval for the exchange to access your token. This is a one-time only operation per exchange`,
        id: '1',
      },
    })
    // set allowance
    wagmiWallet
      ?.writeContract({
        abi: [
          {
            type: 'function',
            name: 'approve',
            inputs: [
              {
                name: 'guy',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'wad',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
            outputs: [
              {
                name: '',
                type: 'bool',
                internalType: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        address: ContractConfig[chainId ? chainId : 1235]
          ?.WETH as `0x${string}`,
        functionName: 'approve',
        args: [
          ContractConfig[chainId ? chainId : 1235]
            ?.ERC20TransferHelper as `0x${string}`,
          allowanceValue,
        ],
        gas: 500000n,
      })
      .then((hash) => {
        publicClient
          .waitForTransactionReceipt({ hash })
          .then(() => {
            checkIsApproveModuleAsk()
          })
          .catch((error: any) => {
            checkIsApproveModuleAsk()

            setTransactionError(error)
          })
      })
      .catch((err) => {
        setTransactionError(err)
        setBidStep(BidStep.Offering)
      })
  }

  const placeBid = useCallback(
    async (options?: { royaltyBps?: number }) => {
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

      if (!tokenId && !collectionId) {
        const error = new Error('Missing tokenId and collectionId')
        setTransactionError(error)
        throw error
      }

      if (!client) {
        const error = new Error('ReservoirClient was not initialized')
        setTransactionError(error)
        throw error
      }

      if (!tokenId && !collectionBidSupported) {
        const error = new Error(
          'Collection bids are not supported for this collection'
        )
        setTransactionError(error)
        throw error
      }

      if (!exchange) {
        const error = new Error('Missing Exchange')
        setTransactionError(error)
        throw error
      }

      setBidStep(BidStep.Offering)
      setTransactionError(null)
      setBidData(null)

      const bid: BidData = {
        weiPrice: totalBidAmount.toString(),
        orderbook: 'reservoir',
        orderKind:
          orderKind ||
          (exchange?.orderKind as BidData['orderKind']) ||
          'seaport',
        attributeKey: traitBidSupported ? trait?.key : undefined,
        attributeValue: traitBidSupported ? trait?.value : undefined,
      }

      if (feesBps && feesBps?.length > 0) {
        bid.marketplaceFees = feesBps
      } else if (!feesBps) {
        delete bid.fees
        delete bid.marketplaceFees
      }

      if (currency) {
        bid.currency = currency.contract
      }

      if (tokenId && collectionId) {
        const contract = collectionId ? collectionId?.split(':')[0] : undefined
        bid.token = `${contract}:${tokenId}`
      } else if (collectionId) {
        bid.collection = collectionId
      }

      if (expirationOption.relativeTime) {
        if (expirationOption.relativeTimeUnit) {
          bid.expirationTime = dayjs()
            .add(
              expirationOption.relativeTime,
              expirationOption.relativeTimeUnit
            )
            .unix()
            .toString()
        } else {
          bid.expirationTime = `${expirationOption.relativeTime}`
        }
      }

      if (oracleEnabled) {
        bid.options = {
          [exchange.orderKind as string]: {
            useOffChainCancellation: true,
          },
        }
      }

      if (usePermit) {
        bid.usePermit = true
      }

      if (quantity > 1) {
        bid.quantity = quantity
      }

      if (options?.royaltyBps !== undefined) {
        bid.royaltyBps = options.royaltyBps
      }

      setBidData(bid)
      if (rendererChain?.name === auraEVMTestnet?.name) {
        if ((wrappedBalance?.[0] || 0n) < totalBidAmount) {
          triggerDepositWAura()
        } else {
          checkIsSetAllowance()
        }

        // check allowance or deposit aura
        // if ((wrappedBalance?.[0] || 0n) < totalBidAmount) {
        //   triggerDepositWAura()
        // } else {
        //   checkIsSetAllowance()
        // }
      } else {
        client.actions
          .placeBid({
            chainId: rendererChain?.id,
            wallet,
            bids: [bid],
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

              if (incompleteStepIndex !== null) {
                setStepData({
                  totalSteps: stepCount,
                  stepProgress: incompleteStepIndex,
                  currentStep: executableSteps[incompleteStepIndex],
                })
              } else {
                setBidStep(BidStep.Complete)
              }
            },
          })
          .catch((e: Error) => {
            setTransactionError(e)
          })
      }
    },
    [
      config,
      tokenId,
      rendererChain,
      collectionId,
      currency,
      client,
      wallet,
      totalBidAmount,
      expirationOption,
      trait,
      quantity,
      feesBps,
      exchange,
      usePermit,
    ]
  )

  return (
    <>
      {children({
        token,
        collection,
        attributes,
        usdPrice,
        balance,
        wrappedBalance,
        wrappedContractName,
        wrappedContractAddress,
        convertLink,
        canAutomaticallyConvert,
        bidAmountPerUnit,
        totalBidAmount,
        quantity,
        setQuantity,
        bidData,
        totalBidAmountUsd,
        bidStep,
        loading: !collection || !reservoirMarketplace,
        hasEnoughNativeCurrency,
        hasEnoughWrappedCurrency,
        traitBidSupported,
        collectionBidSupported,
        partialBidSupported,
        biddingSupported,
        amountToWrap,
        transactionError,
        expirationOption,
        expirationOptions,
        stepData,
        currencies: currencies || [defaultCurrency],
        currency,
        exchange,
        feeBps,
        setCurrency,
        setBidStep,
        setBidAmountPerUnit,
        setExpirationOption,
        setTrait,
        trait,
        placeBid,
      })}
    </>
  )
}
