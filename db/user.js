import db from "./db.js";

export const saveUserToDb = (user_name, chat_id) => {
  const query = `INSERT INTO users (user_name, chat_id)
                   VALUES (?, ?)`;
  db.query(query, [user_name, chat_id], (err, result) => {
    if (err) {
      console.error("Error saving user to the database:", err);
    } else {
      console.log("User saved to the database:", {
        user_name,
        chat_id,
      });
    }
  });
};

export const userExists = (telegramId, callback) => {
  const query = `SELECT 
                   COUNT(*) AS count
                   FROM users 
                   WHERE chat_id = ?`;

  db.query(query, [telegramId], (err, results) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return callback(err, null);
    }
    const userCount = results[0].count;
    callback(null, userCount > 0); // true if user exists, false otherwise
  });
};

export const getGroupChatId = (callback) => {
  db.query("SELECT chat_id FROM users LIMIT 1", (err, results) => {
    if (err) {
      return callback(err, null);
    }
    if (results.length > 0) {
      return callback(null, results[0].group_chat_id); // Adjust the key based on your database schema
    } else {
      return callback(new Error("No group chat ID found"), null);
    }
  });
};
