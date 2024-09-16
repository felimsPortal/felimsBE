import axios from "axios";
import { parseStringPromise } from "xml2js";

export const searchMovieByExactTitle = async (movieTitle) => {
  try {
    // Step 1: Make the request to nzbGeek's API with the movie title
    const nzbGeekUrl = `https://api.nzbgeek.info/api?t=search&q=${encodeURIComponent(
      movieTitle
    )}&apikey=${process.env.NZBGEEK_API_KEY}`;
    console.log(`Searching for movie title: ${movieTitle}`);

    const response = await axios.get(nzbGeekUrl);
    const parsedResponse = await parseStringPromise(response.data);

    // Step 2: Check if there are any <item> elements in the parsed response
    const items = parsedResponse?.rss?.channel?.[0]?.item;
    if (!items || items.length === 0) {
      console.log("No results found.");
      return [];
    }

    // Step 3: Filter results for an exact title match (case-insensitive)
    const exactMatches = items.filter((item) => {
      const nzbTitle = item.title[0].toLowerCase().trim();
      return nzbTitle === movieTitle.toLowerCase();
    });

    if (exactMatches.length === 0) {
      console.log("No exact match found.");
      return [];
    }

    console.log(
      `Found ${exactMatches.length} exact match(es) for "${movieTitle}".`
    );

    return exactMatches.map((item) => ({
      title: item.title[0],
      link: item.link[0],
      pubDate: item.pubDate[0],
      category: item.category[0],
      size: item["newznab:attr"]?.find((attr) => attr.$.name === "size")?.$
        .value,
    }));
  } catch (error) {
    console.error("Error searching for movie by exact title:", error);
    return [];
  }
};
