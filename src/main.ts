import * as core from '@actions/core'
import * as fs from 'fs'
import * as idb from './idb'
import {ActionInputs, ActionOutputs} from './constants'
import * as fsutils from './fsutils'
import * as maestro from './maestro'

function checkOS(): void {
  const platform = process.platform
  if (platform !== 'darwin' && platform !== 'linux') {
    throw Error(`Platform ${platform} is not supported`)
  }
}

async function setup(): Promise<void> {
  if (process.platform === 'darwin') {
    const idbExec = await idb.install()
    core.debug(`idb_companion exec: ${idbExec}`)
  }

  const maestroExec = await maestro.install()
  core.debug(`maestro exec: ${maestroExec}`)
}

async function runTest(): Promise<void> {
  let flow = core.getInput(ActionInputs.Flow)
  if (flow.length === 0) return
  flow = fsutils.toAbsolutePath(flow)
  if (!fs.existsSync(flow)) {
    throw Error(`Flow or directory with path "${flow}" doesn't exist`)
  }

  const env = core.getMultilineInput(ActionInputs.Env)

  let report = core.getInput(ActionInputs.Report)
  if (report === '') {
    throw Error("Report path can't be empty")
  }
  report = fsutils.toAbsolutePath(report)
  fsutils.createParentsIfNeeded(report, true)

  let screenshotDir = core.getInput(ActionInputs.ScreenshotsDir)
  if (screenshotDir === '') {
    screenshotDir = process.cwd()
  }
  screenshotDir = fsutils.toAbsolutePath(screenshotDir)
  fsutils.createParentsIfNeeded(screenshotDir, false)

  const result = await maestro.run('maestro', env, flow, report, screenshotDir)

  if (fs.existsSync(report)) core.setOutput(ActionOutputs.Report, report)
  core.setOutput(ActionOutputs.ScreenshotsDir, screenshotDir)

  if (result !== 0) {
    core.setFailed(`Maestro tests failed. Exit code: ${result}`)
  }
}

async function run(): Promise<void> {
  try {
    checkOS()
    await setup()
    await runTest()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
