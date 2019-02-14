require('dotenv').config()
var twitterPin = require('twitter-pin')(process.env.TWITTER_CONSUMER_KEY, process.env.TWITTER_CONSUMER_SECRET)

twitterPin.getUrl(function (err, url) {
  if (err) throw err

  console.log('1) Open:', url)
  console.log('2) Enter PIN:')

  process.stdin.once('data', function (pin) {
    twitterPin.authorize(pin.toString().trim(), function (err, result) {
      if (err) throw err

      console.log(result) // => { token: '...',
      //      secret: '...',
      //      user_id: 0,
      //      screen_name: '...' }
    })
  })
})
