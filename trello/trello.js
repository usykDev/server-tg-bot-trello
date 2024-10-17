import axios from "axios";

export const handleTrelloWebhook = (action, res) => {
  try {
    if (action) {
      console.log("Webhook action received:", action.type);

      // Check if the action type is 'createList'
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
        //   const cardId = action.data.card.id;
        const listBefore = action.data.listBefore.name;
        const listAfter = action.data.listAfter.name;

        console.log(
          `Card "${cardName}" was moved from "${listBefore}" to "${listAfter} List".`
        );
      }
    }

    // Respond to Trello with a 200 OK status
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } catch (err) {
    console.error("Error parsing webhook data:", err);

    // Respond with a 400 Bad Request if JSON parsing fails
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

  // Get existing webhooks first
  const existingWebhooks = await getTrelloWebhooks();

  // Check if a webhook for the specific idModel and callbackURL already exists
  const webhookExists = existingWebhooks.some(
    (webhook) =>
      webhook.idModel === boardId && webhook.callbackURL === callbackURL
  );

  if (webhookExists) {
    console.log("A webhook for this board and callback URL already exists.");
    return;
  }

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
};

export const getTrelloWebhooks = async () => {
  const apiKey = process.env.TRELLO_API_KEY; // Your Trello API key
  const apiToken = process.env.TRELLO_TOKEN; // Your Trello API token

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
    // return [];
  }
};

export const deleteAllTrelloWebhooks = async () => {
  const apiKey = process.env.TRELLO_API_KEY; // Your Trello API key
  const apiToken = process.env.TRELLO_TOKEN; // Your Trello API token

  try {
    // Step 1: Retrieve all webhooks
    const response = await axios.get(
      `https://api.trello.com/1/tokens/${apiToken}/webhooks`,
      {
        params: { key: apiKey },
      }
    );

    const webhooks = response.data; // Get the webhooks data

    // Check if there are webhooks to delete
    if (webhooks.length === 0) {
      console.log("No webhooks found to delete.");
      return;
    }

    // Step 2: Loop through and delete each webhook
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
    // Improved error logging
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
