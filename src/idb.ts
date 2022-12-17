import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as os from 'os'

const HOME = os.homedir()

const IDB_HOME = path.join(HOME, '.idb')
const IDB_BIN = path.join(IDB_HOME, 'bin')

const idbDownloadUrl =
  'https://github.com/facebook/idb/releases/latest/download/idb-companion.universal.tar.gz'

function idbExec(binPath: string): string {
  return path.join(binPath, 'idb_companion')
}

async function findIdbInstallation(): Promise<{
  found: boolean
  path: string
}> {
  const result = {found: false, path: ''}
  core.info('Checking if idb already installed')
  const whichResult = await exec.getExecOutput('which', ['idb_companion'], {
    ignoreReturnCode: true
  })
  if (whichResult.exitCode === 0) {
    core.info('idb_companion is already installed on a system level')
    result.found = true
    result.path = path.parse(whichResult.stdout).dir
  } else if (fs.existsSync(idbExec(IDB_BIN))) {
    const idbCode = await exec.exec(idbExec(IDB_BIN), ['--version'])
    if (idbCode === 0) {
      core.info('Local idb_companion is already installed')
      result.found = true
      result.path = IDB_BIN
      core.info('Adding idb_companion to path')
      core.addPath(IDB_BIN)
    }
  }
  return result
}

export async function install(): Promise<string> {
  core.startGroup('Installing idb_companion')
  const installation = await findIdbInstallation()
  let idbPath = IDB_BIN
  if (installation.found) {
    idbPath = installation.path
  } else {
    if (fs.existsSync(IDB_HOME)) fse.removeSync(IDB_HOME)
    fs.mkdirSync(IDB_HOME, {recursive: true})
    core.info('Downloading idb_companion')
    const idbToolTar = await tc.downloadTool(idbDownloadUrl)
    core.info('Untaring idb_companion')
    const idbExtractedLocation = await tc.extractTar(idbToolTar)
    const idbDir = path.join(idbExtractedLocation, 'idb-companion.universal')
    fse.moveSync(idbDir, IDB_HOME)
    fse.removeSync(idbDir)
    core.info('Adding idb_companion to path')
    core.addPath(idbPath)
    core.info('idb_companion successfuly installed')
  }
  core.endGroup()
  return idbExec(idbPath)
}
