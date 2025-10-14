import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
    //idhar kya hua? signup (matlab ak function hai) -
    //  async (matlab async function hai) - 
    // ({name,email,password,confirmPassword} matlab ye chaar parameters lenge) iska matlab ye hai ki
    //signup karenge tab ye 4 fields frontend se bhejenge backend ko aur fir vo store karega ye sab
		set({ loading: true });

        //kam chalu hai isley loading true kar diya

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
            //jab https /auth/signup pe post request bhejenge to ye chaar fields bhejenge
            //aur fir response me jo data aayega vo res me store kar lenge

            toast.success("Signup successful!");
            
			set({ user: res.data, loading: false });
            //ab user ko set kar denge res.data se jo backend se aaya hai
            //aur loading false kar denge kyuki kam ho gaya
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });

			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
        //jab bhi checkAuth call hoga to checkingAuth true kar denge

		try {
			const response = await axios.get("/auth/profile");
            //jab /auth/profile pe get request bhejenge to user ka data aayega
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;
        //agar checkingAuth true hai to return kar denge

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
            //jab /auth/refresh-token pe post request bhejenge to naya access token aayega
            //jo automatically axios ke headers me set ho jayega
            //aur fir hum profile fetch kar payenge bina dobara login kiye
            //iska matlab hai ki agar access token expire ho gaya to hum refresh token se naya access token le sakte hain

            // Update user state with new token
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);