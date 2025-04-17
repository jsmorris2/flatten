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
      .then(data => {
        let json

        // if a single entity, turn into an array of one to flatten
        if (data.value) {
          json = data
        } else {
          json = {
            "@odata.context": data["@odata.context"].replace('/$entity', '')
          }

          delete data["@odata.context"]

          json.value = [ data ]
        }

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
