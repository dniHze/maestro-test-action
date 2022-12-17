import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as os from 'os'

const MAESTRO_VERSION_REGEX = /[0-9]+\.[0-9]+.[0-9]+/g

const HOME = os.homedir()
const MAESTRO_HOME = path.join(HOME, '.maestro')
const MAESTRO_BIN = path.join(MAESTRO_HOME, 'bin')

function validateMaestroVersion(version: string): boolean {
  if (version === 'latest') return true
  const matchResult = version.trim().match(MAESTRO_VERSION_REGEX)
  return matchResult !== null && matchResult.length !== 0
}

function maestroExec(binPath: string): string {
  return path.join(binPath, 'maestro')
}

function maestroDownloadUrl(version: string): string {
  if (version === 'latest') {
    return 'https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip'
  } else {
    return `https://github.com/mobile-dev-inc/maestro/releases/download/cli-${version}/maestro.zip`
  }
}

async function resolveMaestroVersion(execPath: string): Promise<string> {
  const output = await exec.getExecOutput(execPath, ['--version'])
  if (output.exitCode === 0) {
    const matches = output.stdout.match(MAESTRO_VERSION_REGEX)
    // When maestro finds updates, it spills new version first, and then installed version
    if (matches != null) {
      return matches[matches.length - 1]
    }
  }
  return ''
}

async function findMaestroInstallation(): Promise<{
  found: boolean
  path: string
  version: string
}> {
  const result = {found: false, path: '', version: ''}
  if (fs.existsSync(maestroExec(MAESTRO_BIN))) {
    core.info('Local maestro installation found')
    result.found = true
    result.path = MAESTRO_BIN
    result.version = await resolveMaestroVersion(maestroExec(MAESTRO_BIN))
    core.info('Adding maestro to path')
    core.addPath(MAESTRO_BIN)
  } else {
    const whichResult = await exec.getExecOutput('which', ['maestro'])
    if (whichResult.exitCode === 0) {
      core.info('Found maestro system level installation')
      result.found = true
      result.path = path.parse(whichResult.stdout).dir
      result.version = await resolveMaestroVersion(whichResult.stdout)
    }
  }
  return result
}

export async function install(): Promise<string> {
  let version: string = core.getInput('version')
  if (version.length === 0) {
    version = 'latest'
  }
  if (!validateMaestroVersion(version)) {
    throw Error('Invalid version requested')
  }

  core.startGroup('Installing maestro')
  const existingInstall = await findMaestroInstallation()
  let maestroPath = MAESTRO_BIN
  if (
    existingInstall.found &&
    (version === 'latest' || existingInstall.version === version)
  ) {
    maestroPath = existingInstall.path
  } else {
    if (fs.existsSync(MAESTRO_HOME)) fse.removeSync(MAESTRO_HOME)
    fs.mkdirSync(MAESTRO_HOME, {recursive: true})
    core.info(`Downloading maestro ${version}`)
    const maestroToolZip = await tc.downloadTool(maestroDownloadUrl(version))
    core.info('Unzipping maestro')
    const maestroExtractionLocation = await tc.extractZip(maestroToolZip)
    const maestroDir = path.join(maestroExtractionLocation, 'maestro')
    core.info('Moving maestro to home dir')
    fse.moveSync(maestroDir, MAESTRO_HOME)
    fse.removeSync(maestroDir)
    core.info('Adding maestro to path')
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
  params.push(flow)
  return await exec.exec(execPath, params)
}
