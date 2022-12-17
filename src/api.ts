import * as rm from 'typed-rest-client/RestClient'
import {randomUUID} from 'crypto'

const LATEST_KNOWN_MAESTRO_VERSION = '1.17.4'

interface MaestroVersion {
  major: number
  minor: number
  patch: number
}

export async function getLatestMaestroVersion(): Promise<string> {
  let version = ''
  const client = new rm.RestClient('mobile-dev', 'https://api.mobile.dev')
  const options: rm.IRequestOptions = {
    additionalHeaders: {
      'X-UUID': randomUUID(),
      'X-OS': process.platform,
      'X-VERSION': LATEST_KNOWN_MAESTRO_VERSION
    }
  }
  const response = await client.get<MaestroVersion>('/maestro/version', options)
  if (response.statusCode === 200 && response.result !== null) {
    version = `${response.result.major}.${response.result.minor}.${response.result.patch}`
  } else {
    throw Error(
      `Failed to get latest maestro version: {status: "${response.statusCode}"}`
    )
  }
  return version
}
