const fetch = require('node-fetch')
const format = require('date-fns').format
const hideBin = require('yargs/helpers').hideBin
const fs = require('fs')
const json2csv = require('json-2-csv')
const rc = require('rc')
const yargs = require('yargs')

process.env.NODE_NO_WARNINGS = '1'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

function get (argv) {
  const options = {
    timeout: 600000,
    headers: {
      'Accept': '*/*',
      'Authorization': `Basic ${Buffer.from(`${argv.user}:${argv.password}`).toString('base64')}`
    }
  }

  console.log(`Connecting as ${argv.user}...`)

  return fetch(argv._[0], options)
    .then(r => {
      if (!r.ok) {
        throw new Error(`HTTP response status is ${r.status}`)
      }

      return r.json()
    })
}

function load(argv) {
  console.log(`fetching ${argv._[0]}...`)

  return get(argv)
    .then((data) => {
      console.log(`...fetching complete!`)
      return data
    })
}

function flatten(argv) {
  return load(argv)
    .then(r => {
      return json2csv.json2csvAsync(r.value, { emptyFieldValue: '', sortHeader: false, excludeKeys: argv.exclude, unwindArrays: argv.unwindArrays })
        .then(r => {
          fs.createWriteStream(argv.output, { flags: 'a' }).write(r)
        })
    })
}

const argv = yargs(hideBin(process.argv))
  .config(rc('flatten'))
  .usage('Usage: $0 <url> -p [password]')
  .option('u', {
    alias: 'user',
    default: process.env.USERNAME,
    nargs: 1
  })
  .option('p', {
    alias: 'password',
    demandOption: 'A password is required',
    nargs: 1
  })
  .option('o', {
    alias: 'output',
    default: `output-${format(new Date(), 'yyyy-MM-dd HH-mm-ss')}.csv`,
    nargs: 1
  })
  .option('e', {
    alias: 'exclude',
    type: 'array',
    description: 'List of keys/columns to exclude from output'
  })
  .option('ua', {
    alias: 'unwindArrays',
    type: 'boolean',
    default: false,
    description: 'convert arrays into one live per value'
  })
  .help('h')
  .alias('h', 'help')
  .example('$0 https://ems.intel.com/api/v2/processes -p "password"', 'Returns a CSV file with the JSON data flattened')
  .example('$0 https://ems.intel.com/api/v2/processes -p "password" -o output.csv', 'Returns a CSV file with name output.csv with the JSON data flattened')
  .example('$0 https://ems.intel.com/api/v2/processes -e pr -e oa -e oa.name', 'Returns a CSV file with name output.csv with the JSON data flattened')
  .argv

flatten(argv)
  .catch(e => {
    console.log(`ERROR: ${e.message}`)
  })
