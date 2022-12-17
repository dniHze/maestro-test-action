import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as os from 'os'
import * as rm from 'typed-rest-client/RestClient'

const MAESTRO_VERSION_REGEX = /[0-9]+\.[0-9]+.[0-9]+/g

const HOME = os.homedir()
const MAESTRO_HOME = path.join(HOME, '.maestro')
const MAESTRO_NAME = 'maestro'

interface Tag {
  name: string
}

interface SearchResult {
  found: boolean
  path: string
}

function validateMaestroVersion(version: string): boolean {
  if (version === 'latest') return true
  const matchResult = version.trim().match(MAESTRO_VERSION_REGEX)
  return matchResult !== null && matchResult.length !== 0
}

function maestroExec(binPath: string): string {
  return path.join(binPath, 'maestro')
}

function maestroDownloadUrl(version: string): string {
  return `https://github.com/mobile-dev-inc/maestro/releases/download/cli-${version}/maestro.zip`
}

async function findMaestroInstallation(version: string): Promise<SearchResult> {
  const result = {found: false, path: '', version: ''}
  const cachedMaestro = tc.find(MAESTRO_NAME, version)
  if (cachedMaestro.length !== 0) {
    result.found = true
    result.path = path.join(cachedMaestro, 'bin')
    core.info('Adding maestro to path')
    core.addPath(result.path)
  }
  return result
}

async function getLatestMaestroVersion(): Promise<string> {
  let version = ''
  const client = new rm.RestClient('github', 'https://api.github.com')
  const response = await client.get<Tag[]>('/repos/mobile-dev-inc/maestro/tags')
  if (response.statusCode === 200 && response.result !== null) {
    const latestTag = response.result[0].name
    const matchResult = latestTag.match(MAESTRO_VERSION_REGEX)
    if (matchResult !== null) {
      version = matchResult[0]
    } else {
      throw Error(
        `Failed to get latest maestro version: {status: "${response.statusCode}"}`
      )
    }
  }
  return version
}

export async function install(): Promise<string> {
  let version: string = core.getInput('version')
  if (version.length === 0) {
    version = 'latest'
  }
  if (!validateMaestroVersion(version)) {
    throw Error('Invalid version requested')
  }
  if (version === 'latest') {
    version = await getLatestMaestroVersion()
  }
  core.startGroup('Installing maestro')
  const existingInstall = await findMaestroInstallation(version)
  let maestroPath = ''
  if (existingInstall.found) {
    maestroPath = existingInstall.path
  } else {
    if (fs.existsSync(MAESTRO_HOME)) fse.removeSync(MAESTRO_HOME)
    fs.mkdirSync(MAESTRO_HOME, {recursive: true})
    core.info(`Downloading maestro ${version}`)
    const maestroToolZip = await tc.downloadTool(maestroDownloadUrl(version))
    core.info('Unzipping maestro')
    const maestroExtractionLocation = await tc.extractZip(
      maestroToolZip,
      MAESTRO_HOME
    )
    const cacheLocation = await tc.cacheDir(
      maestroExtractionLocation,
      MAESTRO_NAME,
      version
    )
    core.info('Adding maestro to path')
    maestroPath = path.join(cacheLocation, 'bin')
    core.addPath(maestroPath)
    core.info('maestro succesffuly installed')
  }
  core.endGroup()
  return maestroExec(maestroPath)
}

export async function run(
  execPath: string,
  envVariables: string[],
  flow: string,
  report: string
): Promise<number> {
  const params: string[] = []
  params.push('test')
  for (const envVariable of envVariables) {
    params.push('-e', envVariable)
  }
  params.push('--format=junit')
  params.push(`--output=${report}`)
  params.push(`--no-ansi`)
  params.push(flow)
  return await exec.exec(execPath, params)
}
