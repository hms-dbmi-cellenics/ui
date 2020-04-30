# How to run tests in debug mode

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

# Test coverage

Test coverage is not enabled yet, because it breaks tests, see this bug report: https://github.com/facebook/jest/issues/9723
