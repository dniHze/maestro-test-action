import * as path from 'path'
import * as fs from 'fs'

export function toAbsolutePath(fileOrDirPath: string): string {
  if (fileOrDirPath.length === 0) return ''
  let absolutePath = fileOrDirPath
  if (!path.isAbsolute(fileOrDirPath)) {
    let workfir = process.env['GITHUB_WORKSPACE']
    if (workfir === undefined || workfir === '') {
      workfir = process.cwd()
    }
    absolutePath = path.join(workfir, fileOrDirPath)
  }
  return path.normalize(absolutePath)
}

export function createParentsIfNeeded(
  fileOrDirPath: string,
  file: boolean
): void {
  if (fileOrDirPath.length === 0) return
  let dirToCreate: string
  if (file) {
    dirToCreate = path.parse(fileOrDirPath).dir
  } else {
    dirToCreate = fileOrDirPath
  }
  if (!fs.existsSync(dirToCreate)) {
    fs.mkdirSync(dirToCreate, {recursive: true})
  }
}
