import Log from '../Util';
import * as bull from 'bull';
import {Url} from 'url';
import {Commit} from './GithubUtil';
import {Deliverable} from './settings/DeliverableRecord'

export {Job} from 'bull';

// Newest version supports more option then specified in type file
export interface JobOpts extends bull.AddOptions {
  jobId?: number | string;
  removeOnComplete?: boolean;
}

// export interface JobData {
//   dName: string,
//   team: string,
//   commit: Commit
// }


// interface ProcessJobCallback {
//   (job: bull.Job) => void;
// }

export type ProcessJobCallback = (job: bull.Job) => Promise<any>;

export class JobQueue {
  private queue: bull.Queue;
  private redis: Url;
  private name: string;
  private concurrency: number;
  private processCallback: ProcessJobCallback;
  private initialized: boolean = false;

  constructor(name: string, concurrency: number, redisAddress: Url, process: ProcessJobCallback) {
    this.name = name;
    this.redis = redisAddress;
    this.concurrency = (concurrency <= 0 ? 0 : concurrency);
    this.processCallback = process;
  }

  public async init() {
    Log.trace('JobQueue::init() - Starting.');
    try {
      if (!this.initialized) {
        this.initialized = true;
        this.queue = bull(this.name, +this.redis.port, this.redis.host);
        this.queue.process(this.concurrency, this.processCallback);
        // this.queue.on('active', (job, jobPromise) => {
        //   console.log("Job is active.");
        // });
        // this.queue.on('completed', (job, result) => {
        //   console.log("Job is completed.")
        //   this.queue.count().then(count => {
        //     console.log("Jobs remaining ", count)
        //   })
        // });
        // this.queue.on('failed', (job, err) => {
        //   console.log('Job is failed.');
        // });
        let that = this;
        return new Promise((fulfill, reject) => {
          that.queue.on('ready', () => {
            Log.trace('JobQueue::init() - Ready.')
            fulfill();
          });
        });
      }
    } catch(err) {
      throw 'Failed to start job queue "' + this.name + '". ' + err;
    }
  }


  public async add(job: Object, opts: JobOpts): Promise<bull.Job> {
    if (!this.initialized) {
      await this.init();
    }
    Log.info('JobQueue::add() - Added job ' + opts.jobId + '.')
    return this.queue.add(job, opts);
  }

  public async remove(id: string) {

  }

  public async count() {
    return this.queue.count();
  }

  public async close() {
    Log.info('JobQueue::close() - Closing.')
    this.initialized = false;
    return this.queue.close();
  }
}
