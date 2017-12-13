import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';
import UserRepo from '../../repos/UserRepo';
import {User} from '../../model/business/UserModel';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import DeliverableRepo from '../../repos/DeliverableRepo';


const BOT_USERNAME = 'autobot';

export interface DockerInputJSON {
  userInfo: DockerUserInfo;  
  pushInfo: DockerPushInfo;
  deliverableInfo: DockerDeliverableInfo;
  githubOrg: string;
  whitelistedServers: string;
  allowDNS: number;
  courseNum: number;
  teamId: string;
  custom: object;
  githubKey: string; // to be removed instead of being logged in the DB.
}

export interface DockerUserInfo {
  username: string;
  fname: string;
  lname: string;
  csid: string;
  snum: string;
  profileUrl: string;
}

export interface DockerPushInfo {
  commit: string;
  branch: string;
  commitUrl: string;
  projectUrl: string;
  repo: string;
}

export interface DockerDeliverableInfo {
  deliverableUrl: string; // Repo import to mark assignment (important if Github key not on image)
  deliverableCommit: string; // Commit of Deliverable soluton that will be marked in Docker container
  deliverableToMark: string;
  solutionsUrl: string;
}

export default class DockerInput {
  private config: IConfig;
  private deliverable: Deliverable;
  private pushRecord: PushRecord;
  private courseNum: number;
  private _DockerInputJSON: DockerInputJSON = null;
  
  constructor(deliverable: Deliverable, pushRecord: PushRecord, courseNum: number) {
    this.deliverable = deliverable;
    this.pushRecord = pushRecord;
    this.courseNum = courseNum;
    this.config = new AppConfig();
  }

  private parseDockerInput() {

  }

  private getUserInfo(): Promise<User> {
    let userRepo = new UserRepo();
    return userRepo.getUser(this.pushRecord.user)
      .then((user: User) => {
        if (user) {
          return user;
        }
        Log.warn(`DockerInput::getUserInfo() The user ${this.pushRecord.user} cannot be found in the DB. ` + 
          'DockerInput will have null user entries.')
      });
  }

  public async createDockerInputJSON() {
    let that = this;
    try {

      let userInfo: DockerUserInfo = {username: null, csid: null, snum: null, profileUrl: null, fname: null, lname: null};
      let pushInfo: DockerPushInfo = {branch: null, repo: null, commit: null, commitUrl: null, projectUrl: null};
      let deliverableInfo: DockerDeliverableInfo = {solutionsUrl: null, deliverableCommit: null, deliverableUrl: null, deliverableToMark: null};
      let dockerInput: DockerInputJSON = {
        userInfo, 
        pushInfo, 
        deliverableInfo,
        allowDNS: null,
        whitelistedServers: null,
        githubKey: null,
        githubOrg: null, 
        custom: null, 
        teamId: null,
        courseNum: null,
      };

      return this.getUserInfo()
        .then((user: User) => {
          if (user) {
            dockerInput.userInfo.csid = user.csid;
            dockerInput.userInfo.snum = user.snum;
            dockerInput.userInfo.fname = user.fname;
            dockerInput.userInfo.lname = user.lname;
            dockerInput.userInfo.username = user.username;
            dockerInput.userInfo.profileUrl = user.profileUrl;
          }
        })
        .then(() => {
          dockerInput.deliverableInfo.deliverableCommit = this.deliverable.commit;
          dockerInput.deliverableInfo.deliverableUrl = this.deliverable.url;
          dockerInput.deliverableInfo.deliverableToMark = this.pushRecord.deliverable;  
          dockerInput.deliverableInfo.solutionsUrl = this.deliverable.solutionsUrl;
          dockerInput.pushInfo.branch = this.pushRecord.ref;
          dockerInput.pushInfo.commit = this.pushRecord.commit.toString();
          dockerInput.pushInfo.commitUrl = this.pushRecord.commitUrl;
          dockerInput.pushInfo.projectUrl = this.pushRecord.projectUrl;
          dockerInput.pushInfo.repo = this.pushRecord.repo;
          dockerInput.githubKey = this.config.getGithubToken();
          dockerInput.teamId = this.pushRecord.team;
          dockerInput.whitelistedServers = this.deliverable.whitelistedServers;
          dockerInput.allowDNS = this.deliverable.allowDNS;
          dockerInput.custom = this.deliverable.custom;
          dockerInput.courseNum = this.courseNum;          
          dockerInput.githubOrg = this.pushRecord.githubOrg;
          that._DockerInputJSON = dockerInput;
          return this._DockerInputJSON;          
        });
    } catch (err) {
      Log.error(`DockerInput::DockerInputJSON() ERROR ${err}`);
    }
  }
}