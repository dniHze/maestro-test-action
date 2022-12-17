import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import * as idb from './idb'
import * as maestro from './maestro'

function checkOS(): void {
  const platform = process.platform
  if (platform !== 'darwin' && platform !== 'linux') {
    throw Error(`Platform ${platform} is not supported`)
  }
}

function toAbsoluteReportPath(report: string): string {
  let absoluteReport = report
  if (!path.isAbsolute(report)) {
    const workfir = process.env['GITHUB_WORKSPACE']
    if (workfir === undefined) {
      throw Error('Failed to access workdir')
    }
    // join and normalize with workdir
    absoluteReport = path.normalize(path.join(workfir, report))
  }
  core.debug(`Report path: ${absoluteReport}`)
  // verify
  const parsedPath = path.parse(absoluteReport)
  if (parsedPath.ext !== '.xml') {
    throw Error(
      `Maestro generates JUnit reports using XML files. File extension ${parsedPath.ext} does not comply`
    )
  }
  return absoluteReport
}

async function run(): Promise<void> {
  try {
    checkOS()
    const flow = core.getInput('flow')
    let env = core.getMultilineInput('env')
    env = env.filter(value => value.length !== 0)
    let report = core.getInput('report')
    if (report.length === 0) {
      report = `reports${path.sep}maestro-test.xml`
    }
    report = toAbsoluteReportPath(report)

    if (process.platform === 'darwin') {
      const idbExec = await idb.install()
      core.debug(`idb_companion exec: ${idbExec}`)
    }

    const maestroExec = await maestro.install()
    core.debug(`maestro exec: ${maestroExec}`)
    if (flow.length !== 0) {
      const result = await maestro.run(maestroExec, env, flow, report)

      if (fs.existsSync(report)) {
        core.setOutput('report', report)
      }

      if (result !== 0) {
        core.setFailed(`Maestro tests failed`)
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
