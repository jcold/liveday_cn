const path = require('path')
const os = require('os')
const fs = require('fs')

const args = [...process.argv]
args.shift()
args.shift()

function panic(...msg) {
  console.log.apply(null, msg)
  throw new Error(msg)
  //   process.exit(1)
}

const packageName = args.shift()
if (!packageName) {
  panic('required config file name')
}

const packageFileName = 'package.' + packageName + '.js'
const packageFile = path.join(__dirname, '..', 'build.config', packageFileName)
if (!fs.existsSync(packageFile)) {
  panic('not found file: ', packageFile)
}
const f = require(packageFile)
// console.log('env file ', process.argv, f.env)

// const fname = 'tmp-env-' + (Math.random() + 1).toString(36).substr(2, 12) + '.json'
const fname = 'tmp-env-' + new Date().getSeconds() + '.json'
const tmpFile = path.join(os.tmpdir(), fname)

let envSet = f.env.base
if (!envSet) {
  panic('not found base env')
}

// 继承base env
const targetEnv = args.shift()
if (targetEnv) {
  const target = f.env[targetEnv]
  if (!target) {
    panic('not found env: ', targetEnv)
  }

  envSet = {...envSet, ...target}
}

envSet.ENV_File = tmpFile
envSet.PACKAGE_NAME = packageName

const data = JSON.stringify(envSet)
try {
  fs.writeFileSync(tmpFile, data)
} catch (ex) {
  panic('write config file error: ', ex.toString())
}
console.log(tmpFile)
