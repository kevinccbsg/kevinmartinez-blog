---
template: post
title: How to validate your REST API based on your Docs
slug: easy-validation-nodejs-api
draft: false
date: 2021-12-14T23:59:11.706Z
description: This post is a second part of the previous one and we will talk about how to add validation based on your documentation with express-oas-validator
category: API
tags:
  - Node.js
  - API
  - Documentation
---

In this post we are going to answer the question we left in the [previous post](/posts/easy-docs-nodejs-api) **What about validation?**. We are going to continue using our previous example:

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
 * POST /api/v1/song
 * @tags albums
 * @param {SongRequestPayload} request.body.required - song info
 * @return {Song} 200 - song response
 */
app.post('/api/v1/songs', (req, res) => res.send('You save a song!'));

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

## Importance of validation

Although we saw in the previous post how we created good documentation for our APIs, we also need to provide a reliable API. That means we have to validate, in my opinion, two main things.

1. The info we receive from our clients
2. The info we return to them

In the first point, we need to validate what we receive to avoid errors in our APIs. For example, in the API we are using in this post, we have a route:

```js
/**
 * A song request object
 * @typedef {object} SongRequestPayload
 * @property {string} title.required - The title
 * @property {string} artist.required - The artist
 * @property {number} year.required
 */

/**
 * POST /api/v1/songs
 * @tags albums
 * @param {SongRequestPayload} request.body.required - song info
 * @return {Song} 200 - song response
 */
app.post('/api/v1/songs', (req, res) => res.send('You save a song!'));
```

This route based on the documentation expects a body with three arguments “title”, “artist”, and “year”. All of these must be required. In case we don’t validate these, we could cause an error in the API as the code expects to have one of them.

There are many options to validate an express API, but we will be using this option [express-oas-validator](https://www.npmjs.com/package/express-oas-validator).

## express-oas-validator

This package will expose an express middleware that will validate your endpoint **based on your OpenAPI docs**, and a response validator to do the same with your responses payload.

I will remark the **based on your OpenAPI docs** statement because that's the main advantage of this. You will only need to care about your Docs and you will have the validation without adding anything else than a middleware. Let's see this in our code:

```bash
npm i express-oas-validator
```

```js
// filename example.js
const express = require('express');
const bodyParser = require('body-parser');
const expressJSDocSwagger = require('express-jsdoc-swagger');
// Install dependency
const { init, validateRequest, validateResponse } = require('express-oas-validator');


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

// We will use the instance to get the swagger definition
const instance = expressJSDocSwagger(app)(options);

app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

// once our parser finish parsing the files we can init the validator
instance.on('finish', data => {
  init(data);
});

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
app.post('/api/v1/songs',
  // We init the validator
  validateRequest(),
  (req, res) => res.send('You save a song!'));

// We have to include express error middleware
app.use((err, req, res, next) => {
  res.status(err.status).json(err);
});

app.listen(port, () => (
  console.log(`Example app listening at http://localhost:${port}`)
));
```

As you can see in the example, we have to include a few lines to configure the validator.

After adding this, we can call our API, and if we don't do a request as we documented we will get an error.

```bash
# request
curl --location --request POST 'http://localhost:3000/api/v1/songs' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "test"
}
'
```

```js
// Error message
{
    "name": "OpenAPIUtilsError",
    "type": "OpenAPIUtilsError:request",
    "message": "Error in request: Schema SongRequestPayload must have required property 'artist'. You provide \"{\"title\":\"test\"}\"",
    "extra": [
        {
            "instancePath": "",
            "schemaPath": "defs.json#/definitions/components/schemas/SongRequestPayload/required",
            "keyword": "required",
            "params": {
                "missingProperty": "artist"
            },
            "message": "must have required property 'artist'"
        }
    ],
    "status": 400,
    "statusCode": 400
}
```

Therefore, once we have configured the library we only need to take care of the documentation as the dependency will take care of the validation.

## response validation?

Previously in this post we will talk about another important thing to validate, the response payload. But why this is **important**?

The main reason to validate responses is because we want to provide to the users of our api the same response of what we have in our docs.

For example in our API in the `GET /api/v1/album` endpoint we are telling our clients that we are going to return a list of songs with a format similar to this one:

```json
[
  {
    "title": "string",
    "artist": "string",
    "year": 0
  }
]
```

However, you can see that the API is not returning that format:

```js
app.get('/api/v1/album', (req, res) => (
  // Wrong format
  res.json({
    title: 'abum 1',
  })
));
```

This means we will send an invalid format to our clients. What we should do here is adding the response validation so that we can see this problems while we are testing our API.

Our code will look like this:

```js
app.get('/api/v1/album', (req, res, next) => {
  try {
    // Wrong format
    const wrongResponse = {
      title: 'abum 1',
    };
    validateResponse('Error string', req);
    res.json(wrongResponse);
  } catch (error) {
    next(error);
  }
});
```

When we do the request

```bash
curl --location --request GET 'http://localhost:3000/api/v1/album'
```

We will receive this error message, telling us where we did the mistake.

```json
{
    "name": "OpenAPIUtilsError",
    "type": "OpenAPIUtilsError:response",
    "message": "Error in response: must be array. You provide \"Error string\"",
    "extra": [
        {
            "instancePath": "",
            "schemaPath": "#/type",
            "keyword": "type",
            "params": {
                "type": "array"
            },
            "message": "must be array"
        }
    ],
    "status": 500,
    "statusCode": 500
}
```

Here you have to decide if your docs are right so the API has a bug or you have to update the documentation.

---

## Conclusion

Document and validate your API is a very important task, and we could use tools like this to keep both things updated with few lines of code and less effort.

That's what I would like to learn in this blog. It doesn't matter if you use this tools but keep in mind in looking for a solution that helps you write less and save you time in the important things (in this case docs and api validation).
