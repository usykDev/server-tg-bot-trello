import TelegramBot from "node-telegram-bot-api";
import { saveUserToDb, userExists } from "../db/user.js"; 
import "dotenv/config";

// Creation of a new Telegram bot instance
const bot = new TelegramBot(process.env.TOKEN, { polling: false });

// Setting the webhook for the Telegram bot
const webhookUrl = `${process.env.URL}/bot${process.env.TOKEN}`;
bot.setWebHook(webhookUrl);

export const handleTelegramUpdate = async (update) => {
  const msg = update.message;
  console.log(msg);
  if (!msg) return; 

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (msg.text === "/start") {
    try {
      // Check if the user exists in the database
      const exists = await userExists(telegramId);

      if (!exists) {
        // Save the new user to the database
        await saveUserToDb(firstName, chatId, telegramId, boardId);
        bot.sendMessage(
          chatId,
          `Hi, ${firstName}! Your account has been added to the database.`
        );
      } else {
        bot.sendMessage(
          chatId,
          `Hi, ${firstName}! You are already in the database.`
        );
      }
    } catch (err) {
      console.error("An error occurred while checking the database:", err);
      bot.sendMessage(chatId, "An error occurred while checking the database.");
    }
  }

  if (msg.text === "/id") {
    bot.sendMessage(chatId, `This chat's ID is: ${chatId}`);
  }
};

export { bot };
