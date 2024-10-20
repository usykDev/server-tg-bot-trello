import db from "./db.js";
import "dotenv/config";

export const userExists = async (telegramId) => {
  const query = `SELECT 
                   COUNT(*) AS count
                 FROM users 
                 WHERE telegram_id = ?`;

  try {
    const [results] = await db.query(query, [telegramId]);
    const userCount = results[0].count;
    return userCount > 0; // true if user exists
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }
};

export const saveUserToDb = async (
  user_name,
  chat_id,
  telegram_id,
  board_id
) => {
  const query =
    "INSERT INTO users (user_name, chat_id, telegram_id, board_id) VALUES (?, ?, ?, ?)";

  try {
    await db.query(query, [user_name, chat_id, telegram_id, board_id]);
    console.log("User saved to database successfully.");
  } catch (error) {
    console.error("Error saving user to the database:", error);
    throw error;
  }
};

export const getChatIdByTelegramId = async (boardId) => {
  const query = "SELECT chat_id FROM users WHERE board_id = ?";

  try {
    const [rows] = await db.query(query, [boardId]);

    if (rows.length > 0) {
      return rows.map((row) => row.chat_id); // Returning an array of all chat_ids
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching chat_id from database:", error);
    throw error;
  }
};

export const addTrelloDataToDB = async (trello_name, chat_id, telegram_id) => {
  const query =
    "UPDATE users SET trello_name = ? WHERE chat_id = ? AND telegram_id = ?";

  try {
    await db.query(query, [trello_name, chat_id, telegram_id]);
    console.log("User saved to database successfully.");
  } catch (error) {
    console.error("Error saving user to the database:", error);
    throw error;
  }
};

export const addTrelloIdToDB = async (trello_id, trello_name) => {
  const query = "UPDATE users SET trello_id = ? WHERE trello_name = ?";

  try {
    await db.query(query, [trello_id, trello_name]);
    console.log("User Trello Id saved to database successfully.");
  } catch (error) {
    console.error("Error saving User Trello Id to the database:", error);
    throw error;
  }
};

export const getChatIdByTrelloUserName = async (trello_name) => {
  const query = "SELECT chat_id FROM users WHERE trello_name = ?";

  try {
    const [rows] = await db.query(query, [trello_name]);

    if (rows.length > 0) {
      return rows.map((row) => row.chat_id); // Returning an array of all chat_ids
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching chat_id from database:", error);
    throw error;
  }
};

export const checkTrelloAccount = async (telegram_id) => {
  const query = "SELECT trello_id from users WHERE telegram_id = ?";

  try {
    const [rows] = await db.query(query, [telegram_id]);
    console.log(rows[0].trello_id);
    console.log("Trello user found");
    if (rows[0].trello_id !== null) {
      return;
    } else {
      throw new Error("Trello user not found");
    }
  } catch (error) {
    console.log("Trello user not found");
    throw error;
  }
};
