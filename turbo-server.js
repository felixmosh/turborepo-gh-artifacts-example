const express = require('express')
const app = express()
const port = 3000

app.all('*', (req, res) => {
  console.log(`Got a ${req.method} request`, req.path, res.getHeaders(), req.query);
  res.send('Hello World!')
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
