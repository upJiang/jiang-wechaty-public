import { MessageBot } from "./bot.js";
import qrcode from "qrcode-terminal";
import { sendBlessing } from "./event/sendMsgOntime.js";

import fs from "fs";

import { WechatyBuilder } from "wechaty";

const messageBot = new MessageBot();

const bot = WechatyBuilder.build({
  puppet: "wechaty-puppet-wechat4u",
  puppetOptions: {
    uos: true,
  },
});

async function main() {
  bot
    .on("scan", (c, status) => {
      // status: 2代表等待，3代表扫码完成
      status === 2 && qrcode.generate(c, { small: true }, console.log);
      // 将url抛给sh,在后面 ci 中获取
      const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(c)}`;
      const scriptContent = `export LOGIN_URL=${url}\n`;
      fs.writeFileSync("./setenv.sh", scriptContent);

      console.log(`Scan QR Code to login: ${status}\n${url}`);
    })
    .on("login", (user) => {
      messageBot.setBotName(user.name());
      console.log(`用户 ${user} 登录成功`);
      sendBlessing(bot);
    })
    .on("message", (message) => {
      messageBot.handleMessage(message, bot);
      console.log(`收到消息: ${message}`);
    });
  try {
    await bot.start();
  } catch (e) {
    console.error(
      `⚠️ Bot start failed, can you log in through wechat on the web?: ${e}`
    );
  }
}
main();
