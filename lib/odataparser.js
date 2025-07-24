const json2csv = require('json-2-csv')
const { parser } = require('stream-json')
const { pick } = require('stream-json/filters/Pick')
const { streamArray } = require('stream-json/streamers/StreamArray')

const Parser = require('./parser')

class OdataParser extends Parser {
  constructor (argv) {
    super(argv, 'application/json')
  }

  // getData (response) {
  //   return response.json()
  // }

  // Uses stream-json, but did not get this to work correctly with the OData format.
  getData (response) {
    return new Promise((resolve, reject) => {
      const results = []

      const pipeline = response.body
        .pipe(parser())
        .pipe(pick({ filter: 'value' }))
        .pipe(streamArray())

      pipeline.on('data', ({ value }) => results.push(value))

      pipeline.on('end', () => resolve({ value: results }))

      pipeline.on('error', err => reject(new Error(`Parsing error: ${err.message}`)))
    })
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
            '@odata.context': data['@odata.context'].replace('/$entity', '')
          }

          delete data['@odata.context']

          json.value = [data]
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
