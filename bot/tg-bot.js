import TelegramBot from "node-telegram-bot-api";
import { saveUserToDb, userExists, getGroupChatId } from "../db/user.js"; // Ensure this path is correct
import "dotenv/config";

// Create a new Telegram bot instance
const bot = new TelegramBot(process.env.TOKEN, { polling: false });

// Set the webhook for the Telegram bot
const webhookUrl = `${process.env.URL}/bot${process.env.TOKEN}`;
bot.setWebHook(webhookUrl);

export const handleTelegramUpdate = (update) => {
  const msg = update.message;
  if (!msg) return; // Ignore non-message updates

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;

  userExists(telegramId, (err, exists) => {
    if (err) {
      bot.sendMessage(chatId, "An error occurred while checking the database.");
      return;
    }

    if (!exists) {
      saveUserToDb(firstName, chatId);
      bot.sendMessage(chatId, "Your name has been added to the database.");
    } else {
      bot.sendMessage(chatId, "You are already in the database.");
    }
  });
};
