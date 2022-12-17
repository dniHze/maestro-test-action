import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as os from 'os'

const HOME = os.homedir()

const IDB_HOME = path.join(HOME, '.idb')
const IDB_NAME = 'idb-companion'
const IDB_VERSION = '1.1.8'
const idbDownloadUrl = `https://github.com/facebook/idb/releases/download/v${IDB_VERSION}/idb-companion.universal.tar.gz`

function idbExec(binPath: string): string {
  return path.join(binPath, 'idb_companion')
}

async function findIdbInstallation(): Promise<{
  found: boolean
  path: string
}> {
  const result = {found: false, path: ''}
  const idbPath = tc.find(IDB_NAME, IDB_VERSION)
  if (idbPath.length !== 0) {
    result.found = true
    result.path = path.join(idbPath, 'bin')
  }
  return result
}

export async function install(): Promise<string> {
  core.startGroup('Installing idb_companion')
  const installation = await findIdbInstallation()
  let idbPath = ''
  if (installation.found) {
    idbPath = installation.path
  } else {
    if (fs.existsSync(IDB_HOME)) fse.removeSync(IDB_HOME)
    fs.mkdirSync(IDB_HOME, {recursive: true})
    core.info('Downloading idb_companion')
    const idbToolTar = await tc.downloadTool(idbDownloadUrl)
    core.info('Untaring idb_companion')
    await exec.exec('ls', [idbToolTar])
    const idbExtractedLocation = await tc.extractTar(idbToolTar, IDB_HOME)
    const cachedPath = await tc.cacheDir(
      path.join(idbExtractedLocation, 'idb-companion.universal'),
      'idb-companion',
      IDB_VERSION
    )
    idbPath = path.join(cachedPath, 'bin')
    core.info('idb_companion successfuly installed')
  }
  core.addPath(idbPath)
  core.endGroup()
  return idbExec(idbPath)
}
