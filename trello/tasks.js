import https from "https"; 
import querystring from "querystring";
import "dotenv/config";

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        // Collect the data chunk by chunk
        res.on("data", (chunk) => {
          data += chunk;
        });

        // Once the response is fully received, process the data
        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error("Failed to parse JSON: " + error.message));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

export const getTasksForBoardMembers = async () => {
  try {
    const membersUrl = `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/members?${querystring.stringify(
      {
        key: TRELLO_API_KEY,
        token: TRELLO_API_TOKEN,
      }
    )}`;

    const members = await makeRequest(membersUrl);

    const tasks = {};

    // For each member, getting their assigned cards (tasks)
    for (const member of members) {
      const memberId = member.id;
      const memberName = member.username;

      const cardsUrl = `https://api.trello.com/1/members/${memberId}/cards?${querystring.stringify(
        {
          key: TRELLO_API_KEY,
          token: TRELLO_API_TOKEN,
        }
      )}`;

      const cards = await makeRequest(cardsUrl);

      // Adding the member's tasks to the object
      tasks[memberName] =
        cards.length === 0
          ? []
          : cards.map((card) => ({
              card: card.name,
            }));
    }

    return tasks;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const sendTasksReport = async (tasks) => {
  let message =
    "This is the report listing all the members of Maryna's board:\n";

  let memberCount = 1;

  //   Looping through each member in the tasks object
  for (const [member, taskList] of Object.entries(tasks)) {
    // Start message for each member
    message += `${memberCount}. ${member} tasks:\n`;

    if (taskList.length === 0) {
      // If no tasks assigned to the member
      message += `    (no tasks assigned)\n`;
    } else {
      // List all tasks for the member
      taskList.forEach((task) => {
        message += `  - ${task.card} \n`;
      });
    }

    // Increment the member counter
    memberCount++;
  }

  return message;
};
