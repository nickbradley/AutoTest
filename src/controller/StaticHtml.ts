import cp = require('child_process');
import tmp = require('tmp');
import fs = require('fs');
import {IConfig, AppConfig} from '../Config';
import {Database} from '../model/Database';
import TestRecord from '../model/results/TestRecord';
import {TestJob} from './TestJobController';
import TestRecordRepo from '../repos/TestRecordRepo';
import ResultRecord, {ResultPayload, Result} from '../model/results/ResultRecord';


export default class StaticHtml {
  private config: IConfig;
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
    let testRecordRepo: TestRecordRepo = new TestRecordRepo();
    let testRecordJSON = this._resultRecord.convertToJSON();
    
    return testRecordRepo.insertTestRecord(testRecordJSON);
  }

}