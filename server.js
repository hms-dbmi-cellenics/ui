const express = require('express');
const cp = require('child_process');
const next = require('next');
const os = require('os');

function getIPAdress() {
  const interfaces = os.networkInterfaces();
  const keys = Object.keys(interfaces);
  // eslint-disable-next-line no-restricted-syntax
  for (const devName of keys) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i += 1) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const port = isDev ? 5000 : (process.env.PORT || 5000);

const app = next({ dev: isDev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = express();

    server.get('*', (req, res) => handle(req, res));

    server.listen(port, (err) => {
      if (err) throw err;
      const serverUrl = `http://localhost:${port}`;
      console.log(`
        App is running at:
        - Local: ${serverUrl}
        - Network: http://${getIPAdress()}:${port}
      `);
      // development auto open browser
      if (isDev) {
        switch (process.platform) {
          // macos
          case 'darwin':
            cp.exec(`open ${serverUrl}`);
            break;
          // windows
          case 'win32':
            cp.exec(`start ${serverUrl}`);
            break;
          default:
            cp.exec(`open ${serverUrl}`);
        }
      }
    });
  });
