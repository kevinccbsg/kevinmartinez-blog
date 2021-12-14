---
template: post
title: How to create easy Docs in a Node.js REST API
slug: easy-docs-nodejs-api
draft: false
date: 2021-12-14T18:59:11.706Z
description: In this post we will talk about how to document your Node.js REST API with express-jsdoc-swagger.
category: API
tags:
  - Node.js
  - API
  - Documentation
---

In this post we are going to explain how to easily create docs and validation in a Node.js API using [express-jsdoc-swagger](https://www.npmjs.com/package/express-jsdoc-swagger).

If you ever worked with REST APIs you might notice the importance of having a good documentation as well as a consistency between validation and what we offer to our clients. You might be aware or probably you might use one of these tools OpenAPI, Swagger, Swagger-jsdoc among others.

In this case we are going to talk about [express-jsdoc-swagger](https://www.npmjs.com/package/express-jsdoc-swagger). This library allows to create fast documentation with a few comments in you code. It is perfect for small and big projects, and for teams that does not know very well how to create API documentation.

## How it works?

We will use this express API code as a reference:

```js
// filename example.js
const express = require('express');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const port = 3000;

app.get('/api/v1/album', (req, res) => (
  res.json({
    title: 'abum 1',
  })
));

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

First of all we have to install the dependency:

```bash
npm i express-jsdoc-swagger
```

The next step is adding the configuration. We have multiple options to access the OpenAPI info and we could also change the URL we want to display the Docs.

```js
const options = {
  info: {
    version: '1.0.0',
    title: 'Albums store',
    license: {
      name: 'MIT',
    },
  },
  security: {
    BasicAuth: {
      type: 'http',
      scheme: 'basic',
    },
  },
  baseDir: __dirname,
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  filesPattern: './**/*.js',
  // URL where SwaggerUI will be rendered. Default. /api-docs
  swaggerUIPath: '/api-docs',
  // Expose OpenAPI UI
  exposeSwaggerUI: true,
  // Expose Open API JSON Docs documentation in `apiDocsPath` path.
  exposeApiDocs: false,
  // Open API JSON Docs endpoint.
  apiDocsPath: '/v3/api-docs',
  // Set non-required fields as nullable by default
  notRequiredAsNullable: false,
  // You can customize your UI options.
  // you can extend swagger-ui-express config. You can checkout an example of this
  // in the `example/configuration/swaggerOptions.js`
  swaggerUiOptions: {},
  // multiple option in case you want more that one instance
  multiple: true,
};
```

*recommendation:* to use a specific pattern like \*-routes.js, \*-specs.js or something similar.

In our express API example we will use a basic configuration.

```js
// filename example.js
const express = require('express');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const port = 3000;

const options = {
  info: {
    version: '1.0.0',
    title: 'Albums store',
    license: {
      name: 'MIT',
    },
  },
  filesPattern: './example.js',
  baseDir: __dirname,
  security: {
    BasicAuth: {
      type: 'http',
      scheme: 'basic',
    },
  },
};

expressJSDocSwagger(app)(options);

app.get('/api/v1/album', (req, res) => (
  res.json({
    title: 'abum 1',
  })
));

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

Once we have this we can start documenting our endpoints with simple comments like this.

```js
/**
 * GET /api/v1/album
 * @summary This is the summary of the endpoint
 * @tags albums
 * @return {object} 200 - success response - application/json
 * @return {object} 400 - Bad request response
 */
```

In our example will look like this:

```js
// filename example.js
const express = require('express');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const port = 3000;

const options = {
  info: {
    version: '1.0.0',
    title: 'Albums store',
    license: {
      name: 'MIT',
    },
  },
  filesPattern: './example.js',
  baseDir: __dirname,
  security: {
    BasicAuth: {
      type: 'http',
      scheme: 'basic',
    },
  },
};

expressJSDocSwagger(app)(options);

/**
 * GET /api/v1/album
 * @summary This is the summary of the endpoint
 * @tags albums
 * @return {object} 200 - success response - application/json
 * @return {object} 400 - Bad request response
 */
app.get('/api/v1/album', (req, res) => (
  res.json({
    title: 'abum 1',
  })
));

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

There's also options to include models to the response and the request. We will include a post method with a response model like this:

```js
/**
 * A song item
 * @typedef {object} Song
 * @property {string} title.required - The title required in the response
 * @property {string} artist - The artist
 * @property {number} year
 */

/**
 * A song request object
 * @typedef {object} SongRequestPayload
 * @property {string} title.required - The title
 * @property {string} artist.required - The artist
 * @property {number} year.required
 */
```

and this is the final result

```js
// filename example.js
const express = require('express');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const port = 3000;

const options = {
  info: {
    version: '1.0.0',
    title: 'Albums store',
    license: {
      name: 'MIT',
    },
  },
  filesPattern: './example.js',
  baseDir: __dirname,
  security: {
    BasicAuth: {
      type: 'http',
      scheme: 'basic',
    },
  },
};

expressJSDocSwagger(app)(options);

/**
 * A song item
 * @typedef {object} Song
 * @property {string} title.required - The title required in the response
 * @property {string} artist - The artist
 * @property {number} year
 */

/**
 * A song request object
 * @typedef {object} SongRequestPayload
 * @property {string} title.required - The title
 * @property {string} artist.required - The artist
 * @property {number} year.required
 */

/**
 * GET /api/v1/album
 * @summary This is the summary of the endpoint
 * @tags albums
 * @return {array<Song>} 200 - success response - application/json
 */
app.get('/api/v1/album', (req, res) => (
  res.json({
    title: 'abum 1',
  })
));

/**
 * POST /api/v1/songs
 * @tags albums
 * @param {SongRequestPayload} request.body.required - song info
 * @return {Song} 200 - song response
 */
app.post('/api/v1/songs', (req, res) => res.send('You save a song!'));

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

And also this is the result in the route defined in the config "/api-docs" after running the command

```bash
node example.js
```


![open api example](/example.png "Logo Title Text 1")

There’s also more options in our [docs website](https://brikev.github.io/express-jsdoc-swagger-docs/#/).

---

As you can see it is way easier to maintain the OpenAPI documentation, as we include it only a few comments in our code. Therefore, it also does not affect the current development and it is displayed close to the developer endpoints or methods so it is hard to forget that we have to complete our documentation.

If you are starting using Node.js or you want to start a project as soon as possible or a POC of an API, and you don’t want to spend too much time in your docs this might be a good tool to include in your projects.

## What about validation?

Having documentation is a good feature for every API you develop. However, we could improve this a little bit more. We are going to talk about validation using [express-oas-validator](https://www.npmjs.com/package/express-oas-validator) in the next article which will allow us to include validation based on our documentation.
