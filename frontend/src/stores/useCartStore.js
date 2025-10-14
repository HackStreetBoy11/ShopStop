import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
    // Initial state - sab khali hai kuki user ne abhi tak kuch nahi kiya
    //cart me products ka array hoga
    //coupon me coupon ka object hoga
    //total me total price hoga
    //subtotal me subtotal price hoga
    //isCouponApplied me boolean hoga ki coupon apply hua hai ya nahi
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
            //ye function coupon fetch karega backend se
			const response = await axios.get("/coupons");
            //jab /coupons pe get request bhejenge to coupon ka data aayega
			set({ coupon: response.data });
            //fir us coupon ko state me set kar denge
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
            //jab /coupons/validate pe post request bhejenge to coupon validate hoga backend pe 
            //aur fir valid coupon ka data aayega
            //jo response me aayega
			set({ coupon: response.data, isCouponApplied: true });
            //fir us coupon ko state me set kar denge aur isCouponApplied true kar denge
            //fir total aur subtotal calculate karenge
            //taki frontend pe sahi price dikhaye
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	addToCart: async (product) => {
		try {
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
        //productId hamare paas hoga jo hume remove karna hai cart se
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
        //cart me se us product ko filter kar denge jo remove karna hai 
        //aur fir updated cart ko set kar denge
        //fir total aur subtotal calculate karenge
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
		}));
		get().calculateTotals();
	},
	calculateTotals: () => {
		const { cart, coupon } = get();
        //subtotal aur total calculate karenge
        //subtotal me sab products ka price * quantity ka sum hoga
        //total me subtotal me se coupon ka discount minus kar denge agar coupon apply hua hai to
        //discount percentage coupon object me hoga
        
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
}));