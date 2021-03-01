UI
======
The user interface of CellScope (the Biomage single cell analysis platform).

Development
-----------------------

### Prerequisites

We highly recommend using VSCode for development, if you don't have it, make sure you get it installed. You will also need to install:
`homebrew`, `docker`, `npm`.

### Running locally
Make sure that you clone this repo and are in the `ui` folder. then simply do:

    npm install
    npm start

Note that since the UI is not connected to the backend, you should see an empty screen saying `You are not connected to the backend.`
To get it running end-to-end locally with mocked dataset, you will need to set up and run each of these:

- API: https://github.com/biomage-ltd/api
- Inframock: https://github.com/biomage-ltd/inframock
- worker: https://github.com/biomage-ltd/worker

Just follow the README of each of them for instructions on how to get it to run.


### How to run tests in debug mode

As per instructions in: https://jestjs.io/docs/en/troubleshooting

1. Paste the following snippet in your launch.json file:

        {
            "type": "node",
            "request": "attach",
            "name": "Attach",
            "port": 9229
        }

    launch.json file should be located in the .vscode folder.

2. Place a debugger; statement in any of your tests, and then, in a terminal in your project's directory, run:

        node --inspect-brk node_modules/.bin/jest --runInBand

3. Open your browser and go to chrome://inspect and click on "Open Dedicated DevTools for Node".
