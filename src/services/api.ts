import { toPairs } from "lodash";
import "whatwg-fetch";

const SPOTIFY_ROOT = "https://api.spotify.com/v1";
const AUTH_ENDPOINT =
  "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
const parseJSON = (response: any) => {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
};

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */

const checkStatus = (response: any) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error: any = new Error(response.statusText);
  error.response = response;
  throw error;
};

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
export const request = (url: any, options?: any) => {
  // eslint-disable-next-line no-undef
  return fetch(url, options).then(checkStatus).then(parseJSON);
};

const fetchFromSpotify = ({ token, endpoint, params }: any) => {
  let url = [SPOTIFY_ROOT, endpoint].join("/");
  if (params) {
    const paramString = toPairs(params)
      .map((param: any) => param.join("="))
      .join("&");
    url += `?${paramString}`;
  }
  const options = { headers: { Authorization: `Bearer ${token}` } };
  return request(url, options);
};

const authenticateWithSpotify = async () => {
  try {
    const response = await fetch(AUTH_ENDPOINT);
    const data = await response.json();
    const accessToken = data.access_token;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      return accessToken;
    } else {
      throw new Error("Failed to retrieve access token");
    }
  } catch (error) {
    console.error("Error during Spotify authentication:", error);
    return null;
  }
};

const getSpotifyToken = async (): Promise<string | null> => {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = await authenticateWithSpotify();
  }
  return token;
};

export { fetchFromSpotify, getSpotifyToken };
