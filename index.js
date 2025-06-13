const format = require('date-fns').format
const hideBin = require('yargs/helpers').hideBin
const fs = require('fs')
const rc = require('rc')
const yargs = require('yargs')

const OdataParser = require('./lib/odataparser')
const AtomParser = require('./lib/atomparser')
const { HttpError } = require('http-errors')

process.env.NODE_NO_WARNINGS = '1'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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
    description: 'Convert arrays into one line per value'
  })
  .option('eao', {
    alias: 'expandArrayObjects',
    type: 'boolean',
    default: false,
    description: 'Convert arrays into one line per value'
  })
  .option('t', {
    alias: 'timeout',
    type: 'number',
    default: 1200000,
    nargs: 1,
    description: 'How long to wait for data to return in milliseconds'
  })
  .option('f', {
    alias: 'format',
    type: 'string',
    default: 'odata',
    nargs: 1,
    description: 'What format is the data in?, i.e. odata, atom, etc'
  })
  .help('h')
  .alias('h', 'help')
  .example('$0 https://ems.intel.com/api/v2/processes -p "password"', 'Returns a CSV file with the JSON data flattened')
  .example('$0 https://ems.intel.com/api/v2/processes -p "password" -o output.csv', 'Returns a CSV file with name output.csv with the JSON data flattened')
  .example('$0 https://ems.intel.com/api/v2/processes -e pr -e oa -e oa.name', 'Returns a CSV file with name output.csv with the JSON data flattened')
  .example('$0 https://ems-test.intel.com/api/v4/procurements?process=1274 -t 1200000', 'Will wait for 20 minutes before timing out')
  .argv

console.info(`Connecting as ${argv.user}...`)

function get (argv) {
  switch (argv.format) {
    case 'odata':
      return new OdataParser(argv)
    case 'atom':
      return new AtomParser(argv)
    default:
  }
}

get(argv)
  .parse()
  .then(r => {
    console.info(`Creating file ${argv.output}`)
    return fs.createWriteStream(argv.output, { flags: 'a' }).write(r)
  })
  .then(f => {
    console.info('...saved!')
    return f
  })
  .catch(e => {
    if (e instanceof HttpError) {
      console.error(`HTTP error: ${e.status} - ${e.message}`)
    } else {
      console.error(`ERROR: ${e.message}`)
    }
  })
