import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASEURL,
  withCredentials: false, // Clerk uses Bearer token, not cookies
});

export default api;
