const express = require('express');
const app = express()
const port = 3000

app.get('/', (req, res) => {
  const message = {
    message: 'Hello from the backend!',
    timestamp: new Date().toISOString()
  }
  res.send(message)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
