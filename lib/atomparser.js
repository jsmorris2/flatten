const xml2js = require('xml2js')
const json2csv = require('json-2-csv')

const Parser = require('./parser')

class AtomParser extends Parser {
  constructor (argv) {
    super(argv, 'application/xml')
  }

  getData (response) {
    return response.text()
  }

  parse () {
    return super.fetch()
      .then(xml => {
        return new xml2js.Parser({}).parseStringPromise(xml)
          .then(result => {
            return json2csv.json2csv(result.feed.entry, {
              emptyFieldValue: '',
              sortHeader: false,
              excludeKeys: this.argv.exclude,
              unwindArrays: this.argv.unwindArrays
            })
          })
      })
  }
}

module.exports = AtomParser
