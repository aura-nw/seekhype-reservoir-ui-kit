import { axios } from '@sh-reservoir0x/reservoir-sdk'

const gatewayConfig = {
  [1235 as number]: {
    'ipfs://': 'https://ipfs-gw.dev.aura.network/ipfs/',
    'ar://': 'https://arweave.net/',
  },
  [1236 as number]: {
    'ipfs://': 'https://ipfs-gw.dev.aura.network/ipfs/',
    'ar://': 'https://arweave.net/',
  },
}

const convertToGatewayUrl = (url: string, chainId?: number) => {
  for (const [protocol, gateway] of Object.entries(
    gatewayConfig[chainId || 1235]
  )) {
    if (url.includes(protocol)) {
      return url.replace(protocol, gateway)
    }
  }
  return url
}

const fetchUri = async (uri: string, chainId?: number) => {
  const response = await axios(convertToGatewayUrl(uri, chainId), {
    method: 'GET',
  })

  if (!(response.status >= 200 && response.status < 300)) {
    throw new Error('Failed to fetch URI')
  }

  return response.data
}

export const convertTokenUriToImage = async (
  uri: string,
  chainId?: number
): Promise<string> => {
  try {
    const json = await fetchUri(uri, chainId)

    if (json.image) {
      const image = convertToGatewayUrl(json.image, chainId)
      return image
    }

    return 'https://twilight.s3.ap-southeast-1.amazonaws.com/assets/images/dfimg.png'
  } catch (e) {
    console.error(e)
    return 'https://twilight.s3.ap-southeast-1.amazonaws.com/assets/images/dfimg.png'
  }
}
