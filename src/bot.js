import { DataPool } from "./dataPool.js";
import { filterMessage, askChatGPT, handleDataPool } from "./utils.js";

// 数据池
const dataPool = new DataPool();

export class MessageBot {
  // 当前用户
  botName = "";

  // 设置当前用户
  setBotName = (name) => {
    this.botName = name;
  };

  // 处理消息
  handleMessage = async (msg) => {
    const talker = msg.talker();
    // 内容
    const text = msg.text();
    // 群聊
    const room = msg.room();
    // 消息类型
    const messageType = msg.type();

    console.log("消息类型", messageType);
    console.log("talker", talker);
    console.log("text", text);
    console.log("msg", msg);
    // 根据类型添加数据池
    messageType !== 13 &&
      (await handleDataPool(room, msg, talker, messageType, text, dataPool));
    console.log("数据整理", dataPool.getAllRoomData());

    // 过滤数据不处理
    if (filterMessage(talker, messageType, text)) return;

    // 处理群聊
    if (room) {
      // 处理 at 自己的文本消息
      if (text.includes(`@${this.botName}`) && messageType === 7) {
        const answer = await askChatGPT(text);
        const gptMessage = `@${talker.name()} \n------\n ${answer}`;
        msg.say(gptMessage);
        return;
      }

      // 处理群聊撤回消息
      if (messageType === 13) {
        try {
          const msgId = text.split("<msgid>")[1].split("</msgid>")[0];
          // 找到撤回的消息
          const recalledMessage = dataPool
            .getRoomData(room.id)
            .message.filter((item) => item.msgId === msgId)[0];

          // 返回撤回的文本
          if (recalledMessage.messageType === 7) {
            msg.say(
              `这是${talker.name()}撤回的消息 \n------\n ${
                recalledMessage.content
              }`
            );
          }

          // 返回撤回的图片以及视频
          if (
            recalledMessage.messageType === 6 ||
            recalledMessage.messageType === 15
          ) {
            msg.say(
              `这是${talker.name()}撤回的${
                recalledMessage.messageType === 6 ? "图片" : "视频"
              }`
            );
            msg.say(recalledMessage.content);
          }
        } catch (err) {
          console.log("失败");
        }
      }
    }

    // 处理私聊
    if (!room) {
      // 文本直接走chatGPT
      if (messageType === 7) {
        const answer = await askChatGPT(text);
        msg.say(answer);
        return;
      }

      // 处理撤回
      if (messageType === 13) {
        try {
          const msgId = text.split("<msgid>")[1].split("</msgid>")[0];
          // 找到撤回的消息
          const recalledMessage = dataPool
            .getPrivateData(talker.id)
            .message.filter((item) => item.msgId === msgId)[0];
          console.log("recalledMessage", recalledMessage);
          // 返回撤回的文本
          if (recalledMessage.messageType === 7) {
            msg.say(`这是您撤回的消息 \n------\n ${recalledMessage.content}`);
          }
          // 返回撤回的图片
          if (
            recalledMessage.messageType === 6 ||
            recalledMessage.messageType === 15 ||
            recalledMessage.messageType === 2
          ) {
            msg.say(
              `这是您撤回的${
                recalledMessage.messageType === 6 ? "图片" : "视频"
              }`
            );
            msg.say(recalledMessage.content);
          }
        } catch (err) {
          console.log("失败");
        }
        return;
      }
    }
  };
}
