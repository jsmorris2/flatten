const json2csv = require('json-2-csv')

const Parser = require('./parser')

class OdataParser extends Parser {
  constructor (argv) {
    super(argv, 'application/json')
  }

  getData (response) {
    return response.json()
  }

  parse () {
    return super.fetch()
      .then(json => {
        return json2csv.json2csv(json.value, {
          emptyFieldValue: '',
          sortHeader: false,
          excludeKeys: this.argv.exclude,
          expandArrayObjects: this.argv.expandArrayObjects,
          unwindArrays: this.argv.unwindArrays
        })
      })
  }
}

module.exports = OdataParser
