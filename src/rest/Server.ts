import restify = require('restify');
import Log from "../Util";
import * as fs from 'fs';
import RouteHandler from "../rest/RouteHandler";
import {IConfig, AppConfig} from '../Config';
import TestJobController from '../controller/TestJobController';
import {RedisUtil} from '../model/RedisUtil';
import RequestHelper from '../../src/rest/helpers/RequestHelper'


/**
 * This configures the REST endpoints for the server.
 */
export default class Server {
  private rest: restify.Server;
  private port: number;
  private config: IConfig;

  constructor() {
    this.config = new AppConfig();
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
    await TestJobController.getInstance(7310).close();
    await TestJobController.getInstance(7210).close();    
    return new Promise<boolean>(function (fulfill) {
      that.rest.close(function () {
          fulfill(true);
      });
    });
  }

  /**
   * Sets the port on this instance of a server
   * @returns {void}
   */
  public setPort(portNum: number) {
      Log.info('Server::setPort()');
      this.port = portNum;
  }

  /**
   * Gets the port that was set on this instance of a server
   * @returns {number}
   */
  public getPort() {
      return this.port;
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
                  name: 'AutoTest',
                  key: fs.readFileSync(that.config.getSSLKeyPath()).toString(),
                  certificate: fs.readFileSync(that.config.getSSLCertPath()).toString(),
                  ca: fs.readFileSync(that.config.getSSLIntCertPath()).toString(),
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

              // Docker container ResultRecord submission
              that.rest.post('/result', restify.bodyParser(), RouteHandler.resultSubmission);

              // Host Static HTML content send in ZipFile on Express ClassPortal application
              that.rest.post('/staticHtml', restify.bodyParser(), RouteHandler.staticHtml);

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
