import React, { FC, ReactElement } from 'react'
import {
  Flex,
  Text,
  FormatCryptoCurrency,
  FormatWrappedCurrency,
} from '../primitives'

type StatProps = {
  label: string | ReactElement
  chainId?: number
  value: string | number | null
  symbol?: string
  asNative?: boolean
  asWrapped?: boolean
  address?: string
}

const Stat: FC<StatProps> = ({
  label,
  value,
  chainId,
  symbol,
  asNative = false,
  asWrapped = false,
  address,
  ...props
}) => (
  <Flex
    align="center"
    justify="between"
    className="rk-stat-well"
    css={{
      backgroundColor: '$wellBackground',
      p: '$2',
      borderRadius: '$borderRadius',
      overflow: 'hidden',
    }}
    {...props}
  >
    <Flex
      css={{
        flex: 1,
        minWidth: '0',
        alignItems: 'center',
        gap: '$2',
        mr: '$1',
      }}
    >
      {label}
    </Flex>
    {asNative && !asWrapped && (
      <FormatCryptoCurrency
        chainId={chainId}
        amount={value}
        textStyle="subtitle3"
        address={address}
        symbol={symbol}
      />
    )}
    {asWrapped && !asNative && (
      <FormatWrappedCurrency
        chainId={chainId}
        amount={value}
        address={address}
        symbol={symbol}
        textStyle="subtitle3"
      />
    )}
    {!asNative && !asWrapped && (
      <Text
        style="subtitle3"
        as="p"
        css={{
          marginLeft: '$2',
        }}
        ellipsify
      >
        {value ? value : '-'}
      </Text>
    )}
  </Flex>
)

Stat.toString = () => '.rk-stat-well'

export default Stat
