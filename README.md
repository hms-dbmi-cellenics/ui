# How to run the code locally

### Running without getting data from the backend

 Simply do:

    yarn run start

### Running with data coming from the backend

First, you will need to port-forward data from the api to the UI by executing the following command:

    kubectl port-forward services/staging-auto-deploy 3000:3000 -n api-18445709-staging

Make sure that you have kubectl installed and you have access to the cluster by following the instructions in here: https://gitlab.com/biomage/iac.

Next, run the UI by doing:

    yarn run start

Make sure that when prompted, you choose port different from 3000, since the backend is already on 3000.


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
