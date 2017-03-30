import express from 'express'
import path from 'path'
import compression from 'compression'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { match, RouterContext } from 'react-router'
import routes from './modules/routes'
import rp from 'request-promise';

var app = express()

app.use(compression())

// serve our static stuff like index.css
app.use(express.static(path.join(__dirname, 'public'), {index: false}))

app.get('/one.json', (req, res) => {
  res.json({well: 'hello'})
})

// send all requests to index.html so browserHistory works
app.get('*', (req, res) => {

  // Make async request
  var options = {
      uri: 'http://localhost:8080/one.json',
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
  };
  rp(options)
      .then(function (response) {
        match({ routes, location: req.url }, (err, redirect, props) => {
          if (err) {
            res.status(500).send(err.message)
          } else if (redirect) {
            res.redirect(redirect.pathname + redirect.search)
          } else if (props) {
            // hey we made it!
            const appHtml = renderToString(<RouterContext
              {...props}
              createElement={(Component, props) => <Component response={response} {...props} /> }
              />)
            res.send(renderPage(appHtml))
          } else {
            res.status(404).send('Not Found')
          }
        })
      })
      .catch(function (err) {
          // Crawling failed...
      });

})


function renderPage(appHtml) {
  return `
    <!doctype html public="storage">
    <html>
    <meta charset=utf-8/>
    <title>My First React Router App</title>
    <link rel=stylesheet href=/index.css>
    <div id=app>${appHtml}</div>
    <script src="/bundle.js"></script>
   `
}

var PORT = process.env.PORT || 8080
app.listen(PORT, function() {
  console.log('Production Express server running at localhost:' + PORT)
})
