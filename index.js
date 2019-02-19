require('dotenv').config()
var Twitter = require('twitter')
var _ = require('lodash')

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

console.log('Connecting to the Twitter stream')

var phrases = [
  { claim: 'EU needs reform', reply: 'What reform?' },
  { claim: 'EU must be reformed', reply: 'Reformed how exactly?' }
]

// build track query from claims
var claims = []
phrases.forEach(phrase => {
  claims.push(phrase.claim)
})
var trackQuery = claims.join(',')

// debugger

// connect to the stream
connectToStream('statuses/filter', { track: trackQuery })

function connectToStream (endpoint, parameters) {
  client.stream(endpoint, parameters, function (stream) {
    stream.on('data', function (event) {
      var isTweet = _.conformsTo(event, {
        id_str: _.isString,
        text: _.isString
      })

      if (isTweet) {
        reaction(event)
      } else {
        console.log('Some other event than a tweet occured:')
        console.log(event)
      }
    })

    stream.on('error', function (error) {
      if (error.message === 'Status Code: 420') {
        console.log('Rate limit reached, waiting 10s to retry')
        setTimeout(() => {
          console.log('Reconnecting to the stream')
          connectToStream('statuses/filter', { track: trackQuery })
        }, 10000)
      } else if (error.message === 'Unexpected token E in JSON at position 0' && error.source === 'Exceeded connection limit for user') {
        console.log(error.source)
      } else {
        // debugger
        throw error
      }
    })
  })
}

function reaction (event) {
  if (!event.retweeted_status) {
  // if (event.retweeted_status.id_str !== '1095726057993453568') {
    var response = ''

    // match phrase
    claims.forEach(claim => {
      if (_.includes(_.lowerCase(event.text), _.lowerCase(claim))) {
        var index = _.findIndex(phrases, ['claim', claim])
        response = phrases[index].reply
      }
    })

    if (response) {
      setTimeout(() => { // just a little timeout
        client.post('statuses/update', { status: response, in_reply_to_status_id: event.id_str, auto_populate_reply_metadata: true }, function (error, tweet, response) {
          if (error) console.log(error)
          console.log('https://twitter.com/' + event.user.screen_name + '/status/' + event.id_str + ' ' + event.text)
        })
      }, 10000)
    }
  }
}
