import React, { FC } from 'react'
import {
  ChainIcon,
  Divider,
  Flex,
  FormatCryptoCurrency,
  Img,
  Text,
} from '../../primitives'
import { useCollections, useTimeSince, useTokens } from '../../hooks'
import { ReservoirChain } from '@sh-reservoir0x/reservoir-sdk'
import { CSS } from '@stitches/react'
import { ExpirationOption } from '../../types/ExpirationOption'
import { Currency } from '../../types/Currency'

type ListCheckoutProps = {
  collection?: NonNullable<ReturnType<typeof useCollections>['data']>[0]
  token?: NonNullable<ReturnType<typeof useTokens>['data']>[0]
  price?: string
  currency?: Currency
  quantity?: number
  chain?: ReservoirChain | null
  expirationOption?: ExpirationOption
  containerCss?: CSS
}

const ListCheckout: FC<ListCheckoutProps> = ({
  collection,
  token,
  price,
  currency,
  quantity,
  chain,
  expirationOption,
  containerCss,
}) => {
  const expirationDisplay =
    expirationOption?.value === 'custom' && expirationOption.relativeTime
      ? useTimeSince(expirationOption.relativeTime)
      : `in ${expirationOption?.text.toLowerCase()}`

  return (
    <Flex align="center" justify="between" css={{ p: '$4', ...containerCss }}>
      <Flex align="center" css={{ gap: '$3', overflow: 'hidden' }}>
        <Img
          src={token?.token?.imageSmall || collection?.image}
          alt={token?.token?.name || collection?.name}
          css={{ width: 56, height: 56, borderRadius: 4, aspectRatio: '1/1', objectFit: 'cover' }}
        />
        <Flex direction="column" css={{ gap: '$1', overflow: 'hidden' }}>
          <Text style="h6" ellipsify>
            {token?.token?.name
              ? token?.token?.name
              : `#${token?.token?.tokenId}`}
          </Text>
          <Flex align="center" css={{ gap: '$1' }}>
            <Text style="subtitle2" color="subtle" ellipsify>
              {collection?.name}
            </Text>
            {chain && !expirationOption ? (
              <>
                <Divider direction="vertical" />
                <ChainIcon
                  chainId={chain.id}
                  height={12}
                  css={{ alignItems: 'center', width: '12px' }}
                />
                <Text style="subtitle2" color="subtle" ellipsify>
                  {chain.name}
                </Text>
              </>
            ) : null}
          </Flex>
          {quantity && quantity > 1 ? (
            <Flex
              css={{
                width: 'max-content',
                backgroundColor: '$neutralBg',
                borderRadius: 4,
                py: '$1',
                px: '$2',
              }}
            >
              <Text style="body3" color="subtle" ellipsify>
                {quantity} items
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      <Flex direction="column" align="end" css={{ gap: '$1', flexShrink: 0 }}>
        {price && currency ? (
          <FormatCryptoCurrency
            amount={Number(price)}
            address={currency?.contract}
            symbol={currency?.symbol}
            textStyle="h6"
          />
        ) : null}
        {/* {expirationOption ? (
          <Text style="body2" color="subtle">
            Expires {expirationDisplay}
          </Text>
        ) : null} */}
      </Flex>
    </Flex>
  )
}

export default ListCheckout
