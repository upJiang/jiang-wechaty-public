import { askChatGPT } from "../utils.js";

import schedule from "node-schedule";

// 定时向群聊发消息
// 定义日期
export const sendBlessing = async (bot) => {
  // 定义日期和事件
  const dates = {
    "2024-02-09T09:00:00": "除夕",
    "2024-02-09T16:00:00": "除夕",
    "2024-02-09T23:59:59": "除夕夜",
    "2024-02-10T09:00:00": "年初一",
    "2024-02-10T18:00:00": "年初一",
    "2024-02-11T09:00:00": "年初二",
    "2024-02-11T18:00:00": "年初二",
    "2024-02-12T09:00:00": "年初三",
    "2024-02-12T18:00:00": "年初三",
    "2024-02-13T09:00:00": "年初四",
    "2024-02-13T18:00:00": "年初四",
    "2024-02-14T09:00:00": "年初五",
    "2024-02-14T18:00:00": "年初五",
    "2024-02-15T09:00:00": "年初六",
    "2024-02-15T18:00:00": "年初六",
    "2024-02-16T09:00:00": "年初七",
    "2024-02-16T18:00:00": "年初七",
    "2024-02-17T09:00:00": "年初八",
    "2024-02-17T18:00:00": "年初八",
    "2024-02-18T09:00:00": "年初九",
    "2024-02-18T18:00:00": "年初九",
  };

  const roomList = ["自家人", "一家人"];
  roomList.forEach(async (item) => {
    const targetRoom = await bot.Room.find({ topic: item });

    if (targetRoom) {
      await targetRoom.ready(); // 确保群聊信息已加载
      Object.entries(dates).forEach(([date, label]) => {
        // 在每个日期的早上9点调度任务
        schedule.scheduleJob(`${date}`, async () => {
          console.log("发送新年祝福...");
          const answer = await generateBlessingMessage(label);
          await targetRoom.say(answer); // 自定义你的祝福语
        });
      });
    } else {
      console.log("未找到群聊");
    }
  });
};

// 假设的 generateBlessingMessage 函数，用于生成祝福语
async function generateBlessingMessage(label) {
  const message = `今天是2024年的${label}，龙年，给大家写一段祝福语，要求喜庆，开头要说今天是${label}啦，然后说一些祝福大家新年快乐，事业顺利，身体健康，心想事成，虎年吉祥之类的话，不需要介绍自己，语气尽量生动活泼，每个段落都要穿插一些表情，段落不得少于三段，字数不得少于两百字`;
  const answer = await askChatGPT(message);
  return answer;
}
