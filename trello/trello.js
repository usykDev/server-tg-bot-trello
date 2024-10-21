import axios from "axios";
import "dotenv/config";
import {
  addTrelloIdToDB,
  getChatIdByTelegramId,
  getChatIdByTrelloUserName,
} from "../db/user.js";
import { bot } from "../bot/tg-bot.js";

export const handleTrelloWebhook = async (action, res) => {
  try {
    if (action) {
      console.log("Webhook action received:", action.type);

      if (action.type === "createList") {
        const listName = action.data.list.name;
        const listId = action.data.list.id;
        console.log(`A new list was created: ${listName} (ID: ${listId})`);
      }

      if (
        action.type === "updateCard" &&
        action.data.listBefore &&
        action.data.listAfter
      ) {
        const cardName = action.data.card.name;
        const listBefore = action.data.listBefore.name;
        const listAfter = action.data.listAfter.name;
        const boardId = process.env.TRELLO_BOARD_ID;

        try {
          const chatIds = await getChatIdByTelegramId(boardId);
          console.log(chatIds);

          const allIds = [...chatIds, Number(process.env.TG_GROUP_ID)];
          console.log(allIds);

          if (allIds.length > 0) {
            allIds.forEach((chatId) => {
              bot.sendMessage(
                chatId,
                `Card "${cardName}" was moved from "${listBefore}" to "${listAfter}" List.`
              );
            });
          } else {
            console.log("No chat_id found for this boardId.");
          }
        } catch (err) {
          console.error("Failed to retrieve chat_id:", err);
        }
        console.log(
          `Card "${cardName}" was moved from "${listBefore}" to "${listAfter} List".`
        );
      }

      if (action && action.type === "addMemberToBoard") {
        console.log(action.member);
        const trelloUserId = action.member.id;
        const trelloUserName = `@${action.member.username}`;

        try {
          await addTrelloIdToDB(trelloUserId, trelloUserName);

          const chatIds = await getChatIdByTrelloUserName(trelloUserName);
          console.log(chatIds);

          if (chatIds.length > 0) {
            for (const chatId of chatIds) {
              if (chatId > 0) {
                await bot.sendMessage(
                  chatId,
                  "Congratulations! You have joined Maryna's Trello board!"
                );
                await bot.sendMessage(
                  chatId,
                  "You can press the REPORT button to check tasks.",
                  {
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "REPORT",
                            callback_data: "report",
                          },
                        ],
                      ],
                    },
                  }
                );
              }
            }
          } else {
            console.log("No chat_id found for this boardId.");
          }
        } catch (error) {
          console.log(error);
        }

        console.log(`Linked ${trelloUserName} with Trello ID ${trelloUserId}.`);
      }
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } catch (err) {
    console.error("Error parsing webhook data:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid JSON data");
  }
};

export const setTrelloWebhook = async () => {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;
  const callbackURL = `${process.env.URL}/trello-webhook`;

  //   deleteAllTrelloWebhooks();

  const existingWebhooks = await getTrelloWebhooks();

  // Checking if a webhook for the specific idModel and callbackURL already exists
  const webhookExists = existingWebhooks.some(
    (webhook) =>
      webhook.idModel === boardId && webhook.callbackURL === callbackURL
  );
  if (webhookExists) {
    console.log("A webhook for this board and callback URL already exists.");
    return;
  } else {
    try {
      const response = await axios.post(
        "https://api.trello.com/1/webhooks/",
        null,
        {
          params: {
            key: apiKey,
            token: apiToken,
            callbackURL: callbackURL,
            idModel: boardId,
          },
        }
      );

      console.log("Webhook set up successfully:", response.data);
    } catch (error) {
      console.error(
        "Error setting up Trello webhook:",
        error.response ? error.response.data : error.message
      );
    }
  }
};

export const getTrelloWebhooks = async () => {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_TOKEN;

  try {
    const response = await axios.get(
      "https://api.trello.com/1/tokens/" + apiToken + "/webhooks",
      {
        params: {
          key: apiKey,
          token: apiToken,
        },
      }
    );
    console.log("Webhooks array:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error retrieving Trello webhooks:",
      error.response ? error.response.data : error.message
    );
  }
};

export const deleteAllTrelloWebhooks = async () => {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_TOKEN;

  try {
    const response = await axios.get(
      `https://api.trello.com/1/tokens/${apiToken}/webhooks`,
      {
        params: { key: apiKey },
      }
    );

    const webhooks = response.data; // Getting the webhooks data

    if (webhooks.length === 0) {
      console.log("No webhooks found to delete.");
      return;
    }

    // Looping through and delete each webhook
    for (const webhook of webhooks) {
      const webhookId = webhook.id;
      await axios.delete(`https://api.trello.com/1/webhooks/${webhookId}`, {
        params: {
          key: apiKey,
          token: apiToken,
        },
      });
      console.log(`Deleted webhook: ${webhookId}`);
    }

    console.log("All webhooks deleted successfully.");
  } catch (error) {
    if (error.response) {
      console.error(
        "Error retrieving or deleting Trello webhooks:",
        error.response.data
      );
    } else if (error.request) {
      console.error("No response received from Trello:", error.request);
    } else {
      console.error("Error occurred while making the request:", error.message);
    }
  }
};
