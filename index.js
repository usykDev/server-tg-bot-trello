// import { start, setTrelloWebhook } from "./bot/tg-bot.js";
import http from "http"; // Use the built-in HTTP module
import "dotenv/config";
import {
  handleTrelloWebhook,
  setTrelloWebhook,
  getTrelloWebhooks,
  deleteAllTrelloWebhooks,
} from "./trello/trello.js";

import { handleTelegramUpdate } from "./bot/tg-bot.js";

const server = http.createServer((req, res) => {
  // Log incoming requests for debugging
  console.log(`${req.method} ${req.url}`);

  // Handle Telegram webhook
  if (req.url.startsWith(`/bot${process.env.TOKEN}`)) {
    // Parse incoming updates from Telegram
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });
    req.on("end", () => {
      const update = JSON.parse(body);
      handleTelegramUpdate(update);
      res.writeHead(200); // Respond to Telegram with a success status
      res.end();
    });
  } else if (req.url.startsWith("/trello-webhook")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    // Handle Trello webhook updates

    req.on("end", () => {
      console.log("Received request:", req.method, req.url);
      if (req.method === "HEAD") {
        console.log(body);
        res.writeHead(200); // Respond with a success status
        res.end();
        return;
      } else if (req.method === "POST") {
        //console.log("Webhook received, full payload: ", body);
        const webhookData = JSON.parse(body); // Parse the incoming JSON data
        const action = webhookData && webhookData.action; // Extract the action from the webhook payload
        handleTrelloWebhook(action, res);
      } else {
        // Respond with 405 Method Not Allowed if an unexpected method is used
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");
      }
    });
  } else {
    // For any other URL, send a 404 response
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running and listening on port ${process.env.PORT}`);
});

setTrelloWebhook();
