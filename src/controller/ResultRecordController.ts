import cp = require('child_process');
import tmp = require('tmp');
import Log from '../Util';
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import ResultRecordRepo from '../repos/ResultRecordRepo';
import ResultRecord, {ResultPayload, Result} from '../model/results/ResultRecord';


export default class ResultRecordController {
  private config: IConfig;
  private resultsDB: Database;
  private courseNum: number;
  private _resultRecord: ResultRecord;

  constructor(courseNum: number, resultRecordContainer: ResultPayload) { // resultRecord: ResultRecord
    this._resultRecord = new ResultRecord(resultRecordContainer.response);
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  public async exec() {
    //
  }

  get resultRecord() {
    return JSON.stringify(this._resultRecord);
  }

  public async store() {
    let resultRecordRepo: ResultRecordRepo = new ResultRecordRepo();
    let resultRecordJSON = this._resultRecord.convertToJSON();
    
    return resultRecordRepo.insertResultRecord(resultRecordJSON)
      .catch((err) => {
        Log.error('ResultRecordController:: store() ERROR ' + err);
      });
  }

}
