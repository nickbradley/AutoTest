import restify = require('restify');

import Log from "../Util";
import RouteHandler from "../rest/RouteHandler";
import {IConfig, AppConfig} from '../Config';
import TestJobController from '../controller/TestJobController';
/**
 * This configures the REST endpoints for the server.
 */
export default class Server {
  private rest: restify.Server;
  private port: number;

  constructor() {
    let config: IConfig = new AppConfig();
    this.port = config.getAppPort();
    Log.info("Server::<init>( " + this.port + " )");
  }

  /**
   * Stops the server. Again returns a promise so we know when the connections have
   * actually been fully closed and the port has been released.
   *
   * @returns {Promise<boolean>}
   */
  public async stop(): Promise<boolean> {
    Log.info('Server::close()');
    let that = this;
    await TestJobController.getInstance().close();
    return new Promise<boolean>(function (fulfill) {
      that.rest.close(function () {
          fulfill(true);
      });
    });
  }

  /**
   * Starts the server. Returns a promise with a boolean value. Promises are used
   * here because starting the server takes some time and we want to know when it
   * is done (and if it worked).
   *
   * @returns {Promise<boolean>}
   */
  public start(): Promise<boolean> {
      let that = this;
      return new Promise(function (fulfill, reject) {
          try {
              Log.info('Server::start() - start');

              that.rest = restify.createServer({
                  name: 'AutoTest'
              });

              // support CORS
              that.rest.use(
                function crossOrigin(req,res,next){
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "X-Requested-With");
                  return next();
              });


              // Return the test queue stats
              that.rest.get('/queue', restify.bodyParser(), RouteHandler.queueStats);

              // GitHub Webhook endpoints
              that.rest.post('/submit', restify.bodyParser(), RouteHandler.postGithubHook);


/*
              // Serves static files for the UI.
              that.rest.get("/public/.*", restify.serveStatic({
                  directory: __dirname
              }));

              // Loads the homepage.
              // curl -is  http://localhost:4321/
              that.rest.get('/', RouteHandler.getHomepage);

              // clear; curl -is  http://localhost:4321/echo/foo
              that.rest.get('/echo/:message', RouteHandler.getEcho);

              // Sends a dataset. Is idempotent and can create or update a dataset id.
              // curl localhost:4321/dataset/test --upload-file FNAME.zip
              that.rest.put('/dataset/:id', RouteHandler.putDataset);
*/
              // Receives queries. Although these queries never change the server (and thus could be GETs)
              // they are formed by sending JSON bodies, which is not standard for normal GET requests.
              // curl -is -X POST -d '{ "key": "value" }' http://localhost:4321/query
              //that.rest.post('/submit', restify.bodyParser(), RouteHandler.postSubmit);

              that.rest.listen(that.port, function () {
                  Log.info('Server::start() - restify listening: ' + that.rest.url);
                  fulfill(true);
              });

              that.rest.on('error', function (err: string) {
                  // catches errors in restify start; unusual syntax due to internal node not using normal exceptions here
                  Log.info('Server::start() - restify ERROR: ' + err);
                  reject(err);
              });
          } catch (err) {
              Log.error('Server::start() - ERROR: ' + err);
              reject(err);
          }
      });
  }
}
