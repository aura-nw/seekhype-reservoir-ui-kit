import Box from '../primitives/Box'
import React, { FC, ComponentProps } from 'react'
import FormatCrypto from './FormatCrypto'

type FormatWEthProps = {
  logoWidth?: number
}

type Props = ComponentProps<typeof FormatCrypto> & FormatWEthProps

const FormatWEth: FC<Props> = ({
  amount,
  maximumFractionDigits,
  logoWidth = 14,
  textStyle,
  css,
  textColor,
}) => {
  return (
    <FormatCrypto
      css={css}
      textColor={textColor}
      textStyle={textStyle}
      amount={amount}
      maximumFractionDigits={maximumFractionDigits}
    >
      <Box
        css={{
          width: 'auto',
          height: logoWidth,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 15 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7.49721 0L0 12.4432L7.49721 9.03511V0Z" fill="#AE1955" />
          <path
            d="M7.49721 9.03506L0 12.4432L7.49721 16.8767V9.03506Z"
            fill="#801D45"
          />
          <path
            d="M14.9959 12.4433L7.49731 0V9.03511L14.9959 12.4433Z"
            fill="#801D45"
          />
          <path
            d="M7.49731 16.8767L14.9959 12.4432L11.2466 10.7391L7.49731 9.03506V16.8767Z"
            fill="#641D3B"
          />
          <path
            d="M0 13.8661L7.49721 24.4337V18.2968L0 13.8661Z"
            fill="#AE1955"
          />
          <path
            d="M7.49731 18.2968V24.4337L15.0001 13.8661L7.49731 18.2968Z"
            fill="#801D45"
          />
        </svg>
      </Box>
    </FormatCrypto>
  )
}

export default FormatWEth
