import { create } from 'zustand';

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    taxRate: number;
    variantId?: string;
    variantName?: string;
}

// Composite key for cart item identity
const cartItemKey = (item: { productId: string; variantId?: string }) =>
    `${item.productId}::${item.variantId || ''}`;

interface CartState {
    items: CartItem[];
    paymentMethod: 'cash' | 'card' | 'other' | null;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    } | null;

    // Computed
    subtotal: () => number;
    taxTotal: () => number;
    discountAmount: () => number;
    total: () => number;
    getProductTotalQuantity: (productId: string) => number;

    // Actions
    addItem: (product: Omit<CartItem, 'quantity'>) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    setPaymentMethod: (method: 'cash' | 'card' | 'other') => void;
    applyDiscount: (discount: CartState['discount']) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    paymentMethod: null,
    discount: null,

    subtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    taxTotal: () => {
        return get().items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            return sum + (itemTotal * item.taxRate / 100);
        }, 0);
    },

    discountAmount: () => {
        const { discount } = get();
        if (!discount) return 0;

        const subtotal = get().subtotal();
        if (discount.type === 'fixed') return discount.value;
        return subtotal * (discount.value / 100);
    },

    total: () => {
        return get().subtotal() + get().taxTotal() - get().discountAmount();
    },

    getProductTotalQuantity: (productId: string) => {
        return get().items
            .filter(i => i.productId === productId)
            .reduce((sum, i) => sum + i.quantity, 0);
    },

    addItem: (product) => set((state) => {
        const key = cartItemKey(product);
        const existingIndex = state.items.findIndex(i => cartItemKey(i) === key);

        if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 };
            return { items: newItems };
        }

        return { items: [...state.items, { ...product, quantity: 1 }] };
    }),

    removeItem: (productId, variantId) => set((state) => {
        const key = cartItemKey({ productId, variantId });
        return { items: state.items.filter(i => cartItemKey(i) !== key) };
    }),

    updateQuantity: (productId, quantity, variantId) => set((state) => {
        const key = cartItemKey({ productId, variantId });
        if (quantity <= 0) {
            return { items: state.items.filter(i => cartItemKey(i) !== key) };
        }

        return {
            items: state.items.map(i =>
                cartItemKey(i) === key ? { ...i, quantity } : i
            ),
        };
    }),

    setPaymentMethod: (method) => set({ paymentMethod: method }),

    applyDiscount: (discount) => set({ discount }),

    clearCart: () => set({ items: [], paymentMethod: null, discount: null }),
}));
