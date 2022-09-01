import fetch from 'node-fetch'
import { ntlm } from 'httpntlm'
import https from 'https'
import json2csv from 'json-2-csv'
import xml2js from 'xml2js'

export default class Parser {
  argv
  #contentType

  constructor (argv, contentType) {
    this.argv = argv
    this.#contentType = contentType
  }

  static get (argv) {
    console.info(`Connecting as ${argv.user}...`)

    switch (argv.format) {
      case 'odata':
        return new OdataParser(argv)
      case 'atom':
        return new AtomParser(argv)
      default:
    }
  }

  #handshake (agent) {
    const options = {
      username: this.argv.user,
      password: this.argv.password,
      domain: process.env.USERDOMAIN,
      workstation: process.env.COMPUTERNAME
    }

    return fetch(this.argv._[0], {
      headers: {
        Connection: 'keep-alive',
        Authorization: ntlm.createType1Message(options)
      },
      agent: agent
    })
      .then(response => response.headers.get('www-authenticate'))
      .then((auth) => {
        if (!auth) {
          throw new Error('Stage 1 NTLM handshake failed.')
        }

        return ntlm.createType3Message(ntlm.parseType2Message(auth), options)
      })
  }

  getData (response) {
    throw new Error('NOT IMPLEMENTED')
  }

  parse () {
    throw new Error('NOT IMPLEMENTED')
  }

  fetch () {
    const agent = new https.Agent({ keepAlive: true })

    console.info(`Fetching ${this.argv._[0]}...`)

    return this.#handshake(agent)
      .then(auth => {
        const options = {
          headers: {
            Authorization: auth,
            'Content-Type': this.#contentType,
            timeout: this.argv.timeout
          },
          agent: agent
        }

        return fetch(this.argv._[0], options)
          .then(r => {
            if (!r.ok) {
              throw new Error(`HTTP response status is ${r.status}`)
            }

            return this.getData(r)
          })
          .then((data) => {
            console.info('...fetching complete!')
            return data
          })
          .catch(e => {
            console.error('...error when fetching data!')
            throw e
          })
      })
  }
}

export class OdataParser extends Parser {
  constructor (argv) {
    super(argv, 'application/json')
  }

  getData (response) {
    return response.json()
  }

  parse () {
    return super.fetch()
      .then(json => {
        return json2csv.json2csvAsync(json.value, {
          emptyFieldValue: '',
          sortHeader: false,
          excludeKeys: this.argv.exclude,
          unwindArrays: this.argv.unwindArrays
        })
      })
  }
}

export class AtomParser extends Parser {
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
            return json2csv.json2csvAsync(result.feed.entry, {
              emptyFieldValue: '',
              sortHeader: false,
              excludeKeys: this.argv.exclude,
              unwindArrays: this.argv.unwindArrays
            })
          })
      })
  }
}
