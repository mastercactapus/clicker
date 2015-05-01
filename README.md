# clicker

Node.js demo/example app using:
  - React for rendering
  - Faye for websockets
  - Redis for communication
  - Webpack for building/bundling
  - Koa.js for the http/fileserver
  - io.js for the runtime


## Setup

*Before starting ensure you have `redis` running locally!*

You can then build with webpack and run with iojs

```bash
npm install
node_modules/.bin/webpack

iojs server.js
```

By default it should start on port 3000: http://127.0.0.1:3000

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mastercactapus/clicker?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
