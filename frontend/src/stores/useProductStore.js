import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
    //products ka array hoga jisme sab products honge
    //loading boolean hoga ki abhi loading ho rahi hai ya nahi
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
            //jab /products pe post request bhejenge to productData bhejenge backend ko
            //ye productData kya hai? ye ek object hoga jisme product ki details hongi
            //jaise name, price, description, category, imageUrl etc.
            //aur ye kaha se aya hamare paas? ye frontend se aya hai jab admin naya product create karta hai
            //aur fir backend me vo product create ho jayega aur jo naya product create hoga
            //jo response me aayega vo res me store kar lenge
            toast.success("Product created successfully");
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
		} catch (error) {
			toast.error(error.response.data.error);
			set({ loading: false });
		}
	},
	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},
	fetchProductsByCategory: async (category) => {
        //ye category parameter lega jo category ka naam hoga
        //jaise jeans, t-shirts, shoes etc.

        //category in paramas asal me kya hai? ye url ka hissa hai jo frontend se aayega
        //jaise /category/jeans to yaha pe category hoga jeans
        //ab tumhe jake category page dekhna chahoiye for better understanding
		set({ loading: true });
		try {
			const response = await axios.get(`/products/category/${category}`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to delete product");
		}
	},
	toggleFeaturedProduct: async (productId) => {
        //productId hume pata hai ki kaunsa product feature karna hai ya feature hatana hai
        //ye function toggle karega ki agar product featured hai to hatayega aur agar nahi hai to add karega
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
            //jab /products/:productId pe patch request bhejenge to ye product ka featured status toggle kar dega
            //patch kya karta hai? patch se hum resource ke kuch fields ko update kar sakte hain
            //jaise ki hum yaha pe isFeatured field ko toggle kar rahe hain
            //ye productId kaha se aya? ye frontend se aya hai jab admin kisi product ko feature karna chahta hai
			// this will update the isFeatured prop of the product
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to update product");
		}
	},
	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},
}));