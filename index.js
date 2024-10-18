import http from "http"; // built-in HTTP module
import "dotenv/config";
import {
  handleTrelloWebhook,
  setTrelloWebhook,
} from "./trello/trello.js";

import { handleTelegramUpdate } from "./bot/tg-bot.js";

const server = http.createServer((req, res) => {

  // Handling Telegram webhook
  if (req.url.startsWith(`/bot${process.env.TOKEN}`)) {
    // Parsing incoming updates from Telegram
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Converting Buffer to string
    });
    req.on("end", () => {
      const update = JSON.parse(body);
      handleTelegramUpdate(update);
      res.writeHead(200); // Responding to Telegram with a success status
      res.end();
    });
  } else if (req.url.startsWith("/trello-webhook")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Converting Buffer to string
    });
    req.on("end", () => {
    //   console.log("Received request:", req.method, req.url);
      if (req.method === "HEAD") {
        console.log(body);
        res.writeHead(200); 
        res.end();
        return;
      } else if (req.method === "POST") {
        const webhookData = JSON.parse(body); 
        const action = webhookData && webhookData.action; // Extracting the action from the webhook payload

        handleTrelloWebhook(action, res);
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running and listening on port ${process.env.PORT}`);
});

setTrelloWebhook();
