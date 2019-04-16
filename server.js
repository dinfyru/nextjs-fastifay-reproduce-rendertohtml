/* global require, process */
const fastify = require('fastify')({ logger: { level: 'error' } });
const Next = require('next');
const { NODE_ENV } = process.env; // prettier-ignore
const dev = NODE_ENV !== 'production';
const app = Next({ dev });
const PORT = 3000;


const appRender = function(req, res, pagePath, queryParams) {
  return new Promise((resolve, reject) => {
    app
      .renderToHTML(req, res, pagePath, queryParams)
      .then(res => {
        console.log(res);
        resolve(res);
      })
      .catch(err => {
        console.log(err);
      });
  });
};

const cachedRender = function(req, res, pagePath, queryParams) {
  return new Promise((resolve, reject) => {
    appRender(req, res, pagePath, queryParams)
      .then(appRes => {
        resolve(appRes);
      })
  })
};

fastify.register(require('fastify-cookie'));
fastify.register((fastify, opts, next) => {
  const app = Next({ dev });

  app
    .prepare()
    .then(() => {
      if (dev) {
        fastify.get('/_next/*', (req, reply) => {
          return app.handleRequest(req.req, reply.res).then(() => {
            reply.sent = true;
          });
        });
      }

      fastify.get('/', (req, reply) => {
        return cachedRender(req, reply, `/home`, {}).then(() => {
          reply.sent = true;
        });
      });

      fastify.get('/*', (req, reply) => {
        return app.handleRequest(req.req, reply.res).then(() => {
          reply.sent = true;
        });
      });

      next();
    })
    .catch(err => next(err));
});

fastify.listen(PORT, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${PORT}`);
});
