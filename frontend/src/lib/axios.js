import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
    //agar development mode me hain to localhost:5000/api use karenge
    //agar production mode me hain to /api use karenge
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;