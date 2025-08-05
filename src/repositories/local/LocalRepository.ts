import { TrellisObject } from "../../models";
import { Repository } from "../Repository";

export default class LocalRepository implements Repository {
  async getObjectById(_id: string) {
    return Promise.resolve(null);
  }

  async getObjects(_includeClosed?: boolean) {
    return Promise.resolve([]);
  }

  async saveObject(_trellisObject: TrellisObject) {}

  async deleteObject(_id: string) {}
}
