import { BLOCK_WORDS } from "./config.js";
import axios from "axios";
import { hostname, apiKey, model } from "./config.js";

import dayjs from "dayjs";

// 消息类型对应
export const MessageType = {
  Unknown: 0,
  Attachment: 1, // Attach(6),
  Audio: 2, // Audio(1), Voice(34)
  Contact: 3, // ShareCard(42)
  ChatHistory: 4, // ChatHistory(19)
  Emoticon: 5, // Sticker: Emoticon(15), Emoticon(47)
  Image: 6, // Img(2), Image(3)
  Text: 7, // Text(1)
  Location: 8, // Location(48)
  MiniProgram: 9, // MiniProgram(33)
  GroupNote: 10, // GroupNote(53)
  Transfer: 11, // Transfers(2000)
  RedEnvelope: 12, // RedEnvelopes(2001)
  Recalled: 13, // 撤回(10002)
  Url: 14, // Url(5)
  Video: 15, // Video(4), Video(43)
  Post: 16, // Moment, Channel, Tweet, etc
};

// 过滤消息
export const filterMessage = (talker, messageType, text) => {
  return (
    talker.self() ||
    // TODO: add doc support
    !(messageType === 1 || messageType === 7 || messageType === 13) ||
    talker.name() === "微信团队" ||
    // 语音(视频)消息
    text.includes("收到一条视频/语音聊天消息，请在手机上查看") ||
    // 红包消息
    text.includes("收到红包，请在手机上查看") ||
    // Transfer message
    text.includes("收到转账，请在手机上查看") ||
    // 位置消息
    text.includes("/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg") ||
    // 聊天屏蔽词
    BLOCK_WORDS.find((word) => text.includes(word))
  );
};

// 询问ChatGPT
export const askChatGPT = (msg) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 这里不做上下文关联
      const res = await axios({
        url: `https://${hostname}/v1/chat/completions`,
        method: "POST",
        data: {
          model: model,
          messages: [
            {
              role: "user",
              content: msg,
            },
          ],
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (res?.data.choices && res?.data?.choices.length) {
        resolve(res?.data?.choices[0].message.content);
      } else {
        reject("");
      }
    } catch (error) {
      console.log("询问失败");
      reject("");
    }
  });
};

// 处理数据池的数据
export const handleDataPool = async (
  room,
  msg,
  talker,
  messageType,
  text,
  dataPool
) => {
  // 群聊
  if (room) {
    const roomName = await room.topic();
    if (!dataPool.getRoomData(room.id)) {
      dataPool.addroomData(room.id, {
        id: "",
        message: [],
      });
    }
    // 处理图片
    let roomContentObj = text;
    if (messageType === 6 || messageType === 15) {
      roomContentObj = await msg.toFileBox(); // 获取图片的 FileBox
    }
    // 处理群聊数据
    dataPool.addroomData(room.id, {
      id: room.id,
      name: roomName,
      message: [
        ...dataPool.getRoomData(room.id).message,
        {
          talkerId: talker.id,
          talkerName: talker.name(),
          content: roomContentObj,
          time: dayjs(msg.timestamp).format("YYYY-MM-DD HH:mm:ss"),
          messageType,
          room: room.id,
          msgId: msg.id,
        },
      ],
    });

    // 删除超过三分钟的消息
    Object.keys(dataPool.getAllRoomData()).forEach((key) => {
      const currentItem = dataPool.getRoomData(key);
      if (!currentItem || !currentItem?.message || currentItem?.length) {
        // 删除空数据
        dataPool.deleteRoomData(key);
        return;
      }
      currentItem.message.forEach((item, index) => {
        if (dayjs().diff(dayjs(item.time), "minute") > 3) {
          // 根据下标删除对应项
          dataPool.getRoomData(key).message.splice(index, 1);
        }
      });
    });
  }

  // 私聊
  if (!room) {
    if (!dataPool.getPrivateData(talker.id)) {
      dataPool.addPrivateData(talker.id, {
        id: "",
        message: [],
      });
    }
    // 处理图片
    let privateContentObj = text;
    if (messageType === 6 || messageType === 15 || messageType === 2) {
      privateContentObj = await msg.toFileBox();
    }
    dataPool.addPrivateData(talker.id, {
      id: talker.id,
      name: talker.name(),
      message: [
        ...dataPool.getPrivateData(talker.id).message,
        {
          talkerId: talker.id,
          talkerName: talker.name(),
          content: privateContentObj,
          time: dayjs(msg.timestamp).format("YYYY-MM-DD HH:mm:ss"),
          messageType,
          msgId: msg.id,
        },
      ],
    });

    // 删除超过三分钟的消息
    Object.keys(dataPool.getAllPrivateData()).forEach((key) => {
      const currentItem = dataPool.getPrivateData(key);
      if (
        !currentItem ||
        !currentItem?.message ||
        !currentItem?.message.length
      ) {
        // 删除空数据
        dataPool.deletePrivateData(key);
        return;
      }
      currentItem.message.forEach((item, index) => {
        if (dayjs().diff(dayjs(item.time), "minute") > 3) {
          // 根据下标删除对应项
          dataPool.getPrivateData(key).message.splice(index, 1);
        }
      });
    });
  }
};
