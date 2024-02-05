export class DataPool {
  constructor() {
    this.data = {
      privateData: {},
      roomData: {},
    };
  }

  // 添加私聊数据
  addPrivateData(key, value) {
    this.data.privateData[key] = value;
  }
  // 添加群聊数据
  addroomData(key, value) {
    this.data.roomData[key] = value;
  }
  // 删除群聊数据
  deleteRoomData(key) {
    delete this.data.roomData[key];
  }
  //   获取私聊数据
  getPrivateData(key) {
    return this.data.privateData[key];
  }
  // 删除私聊数据
  deletePrivateData(key) {
    delete this.data.privateData[key];
  }
  // 获取群聊数据
  getRoomData(key) {
    return this.data.roomData[key];
  }
  // 获取所有私聊数据
  getAllPrivateData() {
    return this.data.privateData;
  }
  // 获取所有群聊数据
  getAllRoomData() {
    return this.data.roomData;
  }
}
