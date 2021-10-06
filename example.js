const converter = require('json-2-csv')

const data = [{
  "m": {
    "no": "500704803",
    "mfg": "foobar",
    "model": "ESO-9999",
    "description": "sample",
    "oa": {
      "number": "2100000158",
      "line": "4570"
    }
  }
}, {
  "m": {
    "number": "500704802",
    "mfg": "foobar",
    "model": "ESO-9998",
    "description": "example",
    "oa": null
  }
},{
  "m": {
    "no": "500704801",
    "mfg": "foobar",
    "model": "ESO-9997",
    "description": "sample",
    "oa": {
      "number": "2100000158",
      "line": "4570"
    }
  }
}]

converter.json2csvAsync(data)
  .then(r => {
    console.log(r)
  })
