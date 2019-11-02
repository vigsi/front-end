# VIGSI Front-End

This repository contains the front-end application code for VIGSI, the tool for visualizing
graphic solar irradiance data. This application displays solar irradiance information provided
by the backend.

## Running

You need NPM to build the application. Get the code using your preferred Git client. Then, to
get the dependencies, run:

```sh
npm install
```

Run the application with

```sh
npm start
```

Once started, open browser with the URL as listed from the command prompt.

**IMPORTANT** This will not set CORS headers. Any requests that you make will fail due to missing
CORS headers. You should install a browser extension to work around this issue. On Chrome, install
"Allow CORS: Access-Control-Allow-Origin". It is very important to turn this extension off when you
have finished debugging.

## Deploying

The application is built as a series of files into the `dist` folder. That folder contains
everything you need to deploy the application, for example to S3.
