const fetch = require('node-fetch')
const ntlm = require('httpntlm').ntlm
const https = require('https')
const createError = require('http-errors')

class Parser {
  argv
  #contentType

  constructor (argv, contentType) {
    this.argv = argv
    this.#contentType = contentType
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

  getError (response) {
    return response.text()
      .then((body) => {
        if (body) {
          console.error(body)
        }
        throw createError(response.status)
      })
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
          agent
        }

        return fetch(this.argv._[0], options)
          .then(r => {
            if (!r.ok) {
              return this.getError(r)
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

module.exports = Parser
