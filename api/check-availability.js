import axios from "axios";
import cheerio from "cheerio";

const trains = {
  Takam: ["％EF％BD％BB％EF％BD％BE％EF％BE％84%20000", "％EF％BD％BB％EF％BD％BE％EF％BE％84％EF％BD％BB%20000"],
  Izumo: ["％EF％BD％BB％EF％BD％B2％EF％BD％BD％EF％BE％93%20000", "％EF％BD％BB％EF％BD％B2％EF％BD％BD％EF％BE％93％EF％BD％BB000"],
  Every: [
    "％EF％BD％BB％EF％BD％BE％EF％BE％84%20000",
    "％EF％BD％BB％EF％BD％BE％EF％BE％84％EF％BD％BB%20000",
    "％EF％BD％BB％EF％BD％B2％EF％BD％BD％EF％BE％93%20000",
    "％EF％BD％BB％EF％BD％B2％EF％BD％BD％EF％BE％93％EF％BD％BB000"
  ]
};

const seats = {
  "3010000": "Ordinary",
  "4110042": "Sleeper B Non Smoking",
  "4120042": "Sleeper B Smoking",
  "2110002": "Sleeper A Non Smoking",
  "2120002": "Sleeper A Smoking",
  "4110062": "Sleeper B Twin Non Smoking",
  "4120062": "Sleeper B Twin Smoking"
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { departStName, arriveStName, startDate, endDate } = req.body;
    const start = parseInt(startDate);
    const end = parseInt(endDate);

    const genDates = (start, end) => {
      const dates = [];
      const startY = parseInt(String(start).slice(0, 4));
      const startM = parseInt(String(start).slice(4, 6));
      const startD = parseInt(String(start).slice(6, 8));
      const endY = parseInt(String(end).slice(0, 4));
      const endM = parseInt(String(end).slice(4, 6));
      const endD = parseInt(String(end).slice(6, 8));

      let curr = new Date(startY, startM - 1, startD);
      const stop = new Date(endY, endM - 1, endD);

      while (curr <= stop) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const dd = String(curr.getDate()).padStart(2, "0");
        dates.push(`${yyyy}${mm}${dd}`);
        curr.setDate(curr.getDate() + 1);
      }

      return dates;
    };

    const dates = genDates(start, end);
    const template =
      "https://e5489.jr-odekake.net/e5489/ibpc/CBDayTimeArriveSelRsvMyDiaPC?inputType=0&inputHour=12&inputMinute=00&inputUniqueDepartSt=1&inputUniqueArriveSt=1&inputSearchType=2&inputSpecificTrainType1=2&inputReturnUrl=travel-information/en/tickets-passes/route-search/&SequenceType=1&LANG=en";

    const results = {};
    const trainNames = [];

    for (const date of dates) {
      results[date] = [];
      const candidates =
        trains[departStName.slice(0, 5)] ||
        trains[arriveStName.slice(0, 5)] ||
        trains["Every"];

      for (const kana of candidates) {
        const url =
          `${template}&inputDepartStName=${departStName}&inputArriveStName=${arriveStName}` +
          `&inputTransferDepartStName1=${departStName}&inputTransferArriveStName1=${arriveStName}` +
          `&inputTransferDepartStUnique1=1&inputTransferArriveStUnique1=1&inputTransferTrainType1=0001` +
          `&inputDate=${date}&inputSpecificBriefTrainKana1=${kana}`;

        try {
          const response = await axios.get(url, { timeout: 30000 });
          const $ = cheerio.load(response.data);

          const trainsOnPage = $("div.route-train-list__train-name.express")
            .map((_, el) => $(el).text().trim())
            .get();

          if (
            trainsOnPage.every(name => name.includes("TWIN")) ||
            trainsOnPage.every(name => trainNames.includes(name))
          ) {
            continue;
          }

          trainNames.push(...trainsOnPage);

          const tables = $("table.seat-facility.js-filfac-target");
          tables.each((i, table) => {
            const trainName = trainsOnPage[i] || "Unknown";
            $(table)
              .find("td")
              .each((_, td) => {
                const $td = $(td);
                const dataId = $td.attr("data-search-id");
                const hasLabel = $td.find("label").length > 0;
                if (dataId in seats) {
                  if (hasLabel) {
                    results[date].push({
                      trainName,
                      availableSeatType: seats[dataId],
                      link: url
                    });
                  }
                }
              });
          });
        } catch (err) {
          console.error(`Error fetching ${url}:`, err.message);
        }
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(results);
  } catch (err) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: err.message });
  }
}
