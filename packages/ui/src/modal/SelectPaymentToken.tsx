import React, { FC } from 'react'
import { Box, CryptoCurrencyIcon, Flex, Text } from '../primitives'
import { EnhancedCurrency } from '../hooks/usePaymentTokens'
import { formatUnits } from 'viem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { formatNumber } from '../lib/numbers'

type Props = {
  paymentTokens: EnhancedCurrency[]
  setCurrency: React.Dispatch<
    React.SetStateAction<EnhancedCurrency | undefined>
  >
  goBack: () => void
  currency?: EnhancedCurrency
}

export const SelectPaymentToken: FC<Props> = ({
  paymentTokens,
  setCurrency,
  goBack,
  currency,
}) => {
  return (
    <Flex direction="column" css={{ width: '100%', gap: '$1', px: '$2' }}>
      {paymentTokens?.map((paymentToken) => {
        const isSelectedCurrency = currency?.address === paymentToken?.address
        const formattedBalance = formatUnits(
          BigInt(paymentToken?.balance || 0),
          paymentToken?.decimals || 18
        )

        return (
          <Flex
            key={paymentToken?.address}
            align="center"
            justify="between"
            css={{
              width: '100%',
              p: '$2',
              borderRadius: 4,
              cursor: 'pointer',
              '&:hover': {
                background: '$neutralBgHover',
              },
            }}
            onClick={() => {
              setCurrency(paymentToken)
              goBack()
            }}
          >
            <Flex
              align="center"
              css={{ gap: '$3', opacity: isSelectedCurrency ? 0.5 : 1 }}
            >
              <CryptoCurrencyIcon
                address={paymentToken?.address as string}
                css={{ width: 24, height: 24 }}
              />
              <Flex direction="column" css={{ gap: '$1' }}>
                <Text style="subtitle2">{paymentToken?.symbol}</Text>
                <Text style="body2" color="subtle">
                  Balance: {formatNumber(Number(formattedBalance), 6)}
                </Text>
              </Flex>
            </Flex>
            <Flex align="center" css={{ gap: '$3' }}>
              <Text style="subtitle2">
                {formatNumber(paymentToken?.currencyTotal, 6)}
              </Text>
              {isSelectedCurrency ? (
                <Box css={{ color: '$accentSolidHover' }}>
                  <FontAwesomeIcon icon={faCheck} width={14} />
                </Box>
              ) : null}
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}
