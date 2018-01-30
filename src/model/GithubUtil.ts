export interface GithubResponse {
  statusCode: number;
  body: string;
}

export class GithubUtil {

  public static getTeamOrProject(repositoryName: string): string {
    // NOTE assume repository name is of the form: CS310-2016Fall/cpsc310project_team10
    let idx = repositoryName.lastIndexOf('_')+1;
    return repositoryName.slice(idx);
  }

  public static parseDeliverable(fullRepoName: string): string {
    let deliverable = fullRepoName.match(/^[^_]+(?=_)/);
    if (deliverable) {
      return deliverable.pop();
    }
  }
}

export class Commit {
  private commitString: string;

  constructor(commitString: string) {
    if (!Commit.isValid(commitString)) {
      throw 'Invalid commit string.';
    }
    this.commitString = commitString;
  }

  public static isValid(commitString: string): boolean {
    return /^[a-z0-9]{40}$/.test(commitString);
  }

  get short(): string {
    return this.commitString.substring(0,7);
  }

  public toString(): string {
    return this.commitString;
  }
}

export type GithubUsername = string;

export interface GithubAccount {
  username: GithubUsername;
}

export class User {
  private id?: string;
  private account: GithubAccount;
  private name?: string;

  constructor(account: GithubAccount) {
    this.account = account;
  }
}
