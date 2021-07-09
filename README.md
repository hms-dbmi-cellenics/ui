ui
==

The user interface of Cellscope (the Biomage single cell analysis platform).

Development
-----------

### Prerequisites

We highly recommend using VSCode for development, if you don't have it, make sure you get it installed. You will also need to install:
`homebrew`, `docker`, `npm`. You should also install the package `dbaeumer.vscode-eslint` for syntax linting & format errors in VS Code.

### Running locally

Make sure that you clone this repo and are in the `ui` folder. then simply do:

    make install
    make run

See more available commands like syntax checking with `make help`.

Note that since the UI is not connected to the backend, you should see an empty screen saying `You are not connected to the backend.`
To get it running end-to-end locally with mocked dataset, you will need to set up and run each of these:

- API: https://github.com/biomage-ltd/api
- Inframock: https://github.com/biomage-ltd/inframock
- worker: https://github.com/biomage-ltd/worker

Just follow the README of each of them for instructions on how to get it to run.

Once you have everything running on the backend, go to <http://localhost:5000> in your browser.
You will get redirected to an authentication page. You will have to create a staging account by clicking
through "Sign up" link (even if you have an existing production account).

### Remote debugging with VS Code

Remote debugging is enabled for all staging and production environments. For
remote debugging, the best approach is to use VS Code's native debugger capatibilites.

First, you need to ensure you have the correct website to debug. You can go to
`.vscode/launch.json` and find an object with the `name` set to `Debug develop in Chrome`.

You can edit the `url` to match your staged or production environment. Then you can use the VS
Code debugger, select `Debug develop in Chrome` and start the debug session.
A Chrome window should spin up and you can control it using the debugger in VS Code.

**Note:** For debugging to work reliably, the code used on the environment must be the
same version as the code open in VS Code. This is needed so line numbers from VS Code
can be mapped to remote code on the server.

### Remote debugging with Chrome DevTools

Alternatively, you can use Google Chrome's built-in DevTools. When it is open
(e.g. by clicking Inspect on an element), you can click on `Sources > Filesystem`.
Click on `Add Folder to Workspace` and add this folder. You will be able to use
Google Chrome's debugger to set breakpoints, inspect variables, similarly to VS Code.

In the DevTools, if you have the React and Redux Developer Tools installed,
you can also run the React profiler and check the Redux history just as you would
on a local development environment.

**Note:** For debugging to work reliably, the code added the the workspace must be
the same version as the code on the environment.

### How to run tests in debug mode

The workspace comes with a preset for debugging tests. You can enter the Debugger
in Visual Studio Code, find `Run and Debug` and find the preset `Test and debug`.
Running the debugger using this configuration will automatically launch the test suite
and attach the VS Code debugger to it.

### How to check bundle size

You can check for the size of the bundles served to the user and loaded onto the server by typing:

    npm run analyze

Alternatively, you can use `npm run analyze:server` or `npm run analyze:client` to get information about
bundle sizes for just server-side rendered and client-side scripts.

The script will produce HTML artifacts that will open in your default browser as a Voronoi treemap.
