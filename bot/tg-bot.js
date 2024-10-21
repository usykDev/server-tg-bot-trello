import TelegramBot from "node-telegram-bot-api";
import {
  addTrelloDataToDB,
  checkTrelloAccount,
  saveUserToDb,
  userExists,
} from "../db/user.js";
import "dotenv/config";
import { getTasksForBoardMembers, sendTasksReport } from "../trello/tasks.js";

// Creation of a new Telegram bot instance
const bot = new TelegramBot(process.env.TOKEN, { polling: false });

// Setting the webhook for the Telegram bot
const webhookUrl = `${process.env.URL}/bot${process.env.TOKEN}`;
bot.setWebHook(webhookUrl);

export const handleTelegramUpdate = async (update) => {
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === "report") {
      try {
        await checkTrelloAccount(callbackQuery.from.id);

        const tasks = await getTasksForBoardMembers();
        const message = await sendTasksReport(tasks);

        bot.sendMessage(chatId, message);
      } catch (error) {
        console.log(error);
        bot.sendMessage(
          chatId,
          "Error encountered while retrieving tasks. You are not a member of Maryna's board."
        );
      }
    }

    if (callbackQuery.data === "trello") {
      await bot.sendMessage(
        chatId,
        `Please sign up or sign in and authorize on Trello at https://trello.com`
      );

      await bot.sendMessage(
        chatId,
        `Write down your profile username. You can see it in the link: https://trello.com/your if you have authorized. It should start with @`
      );
    }
    return;
  }

  if (!update.message) {
    console.log("Update does not contain a message.");
    return;
  }

  const msg = update.message;
  const text = msg.text;

  if (!msg || !text) {
    console.log("Message or text is undefined.");
    return;
  }

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (text === "/start") {
    try {
      if (msg.chat.type !== "private") {
        bot.sendMessage(
          chatId,
          "Sorry, this command is only available in a private chat with @maryna1_bot"
        );
      } else {
        const exists = await userExists(telegramId);

        if (!exists) {
          await saveUserToDb(firstName, chatId, telegramId, boardId);
          await bot.sendMessage(
            chatId,
            `Hi, ${firstName}! Your account has been added to the database.`
          );

          await bot.sendMessage(
            chatId,
            `If you want to link your Trello account, press the 'TRELLO' button.`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "TRELLO",
                      callback_data: "trello",
                    },
                  ],
                ],
              },
            }
          );
        } else {
          bot.sendMessage(
            chatId,
            `Hi, ${firstName}! You are already in the database.`
          );
        }
      }
    } catch (err) {
      console.error("An error occurred while checking the database:", err);
      bot.sendMessage(chatId, "An error occurred while checking the database.");
    }
  }

  if (text === "/trello") {
    if (msg.chat.type !== "private") {
      bot.sendMessage(
        chatId,
        "Sorry, this command is only available in a private chat with @maryna1_bot"
      );
    } else {
      await bot.sendMessage(
        chatId,
        `Please sign up or sign in and authorize on Trello at https://trello.com`
      );

      await bot.sendMessage(
        chatId,
        `Write down your profile username. You can see it in the link: https://trello.com/your if you have authorized. It should start with @`
      );
    }
  }

  if (/^@\S+$/.test(text)) {
    try {
      await addTrelloDataToDB(text, chatId, telegramId);
      await bot.sendMessage(
        chatId,
        "Your Trello username has been added to the database. You can change by simply typing a new username that starts with @..."
      );

      await bot.sendMessage(
        chatId,
        "This is the link to join the board https://trello.com/invite/b/670f40101d91060ec4c0c453/ATTI7d476d304364a64965c82c9b1fa5196918C4D228/marynas-board"
      );
    } catch (error) {
      console.log(error);
      bot.sendMessage(chatId, "Error linking your Trello username");
    }
  }

  if (/^@$/.test(text) || /^@.*\s.*$/.test(text)) {
    bot.sendMessage(
      chatId,
      "Invalid Trello username. It must begin with '@' and have no spaces"
    );
  }

  if (text === "/report") {
    try {
      await checkTrelloAccount(telegramId);

      const tasks = await getTasksForBoardMembers();

      const message = await sendTasksReport(tasks);
      console.log(tasks);

      bot.sendMessage(chatId, message);
    } catch (error) {
      console.log(error);
      bot.sendMessage(
        chatId,
        "Error encountered while retrieving tasks. You are not a member of Maryna's board"
      );
    }
  }
};

export { bot };
