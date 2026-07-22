import { useState, useCallback, useRef, useEffect } from 'react';
import api from '@/lib/api';
import type { ApiResponse, Product, Sale, PaymentMethod } from '@magazin/shared';
import { sanitizeScanInput } from '@magazin/shared';

export interface CartItem {
  productId: string;
  nameKy: string;
  nameRu: string;
  barcode?: string | null;
  unit: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export function usePos() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const addProduct = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, stock: product.stock }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          nameKy: product.nameKy,
          nameRu: product.nameRu,
          barcode: product.barcode,
          unit: product.unit,
          unitPrice: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  }, []);

  const scanBarcode = async (code: string) => {
    const trimmed = sanitizeScanInput(code);
    if (!trimmed) return;

    const { data: res } = await api.get<ApiResponse<Product>>(
      `/products/code/${encodeURIComponent(trimmed)}`
    );
    if (!res.success || !res.data) throw new Error('notFound');

    const product = res.data;
    if (product.stock <= 0) throw new Error('outOfStock');

    const existing = cartRef.current.find((i) => i.productId === product.id);
    if (existing && existing.quantity >= product.stock) {
      throw new Error('insufficientStock');
    }

    addProduct(product);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const qty = Math.min(quantity, i.stock);
        return { ...i, quantity: qty };
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const completeSale = async (paymentMethod: PaymentMethod) => {
    if (cart.length === 0) throw new Error('emptyCart');

    setIsProcessing(true);
    try {
      const { data: res } = await api.post<ApiResponse<Sale>>('/sales', {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discount,
        paymentMethod,
      });
      if (!res.success || !res.data) throw new Error(res.message ?? 'saleFailed');
      setLastSale(res.data);
      clearCart();
      return res.data;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    cart,
    discount,
    setDiscount,
    subtotal,
    total,
    isProcessing,
    lastSale,
    setLastSale,
    addProduct,
    scanBarcode,
    updateQuantity,
    removeItem,
    clearCart,
    completeSale,
  };
}
