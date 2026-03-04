import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Estructura de datos para los productos de la tienda.
 */
interface Product {
    id: string;
    name: string;
    image: string;
    price: number;
}

export function ShopTab() {
    const { toast } = useToast();

    /**
     * Lista de productos disponibles. 
     * Se mantiene como un array vacío para ser alimentado por la API de productos.
     */
    const products: Product[] = [];

    /**
     * Gestiona la adición de productos al carro de compras.
     * @param productName - Nombre del producto seleccionado.
     */
    const handleAddToCart = (productName: string) => {
        toast({
            title: "Agregado al carrito 🛒",
            description: productName
        });
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Tienda</h1>

            {/* Grilla dinámica de productos */}
            <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="aspect-square bg-muted">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                            <h3 className="font-medium text-foreground text-sm line-clamp-2">{product.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-primary">${product.price}</span>
                                <button
                                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                                    onClick={() => handleAddToCart(product.name)}
                                >
                                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Estado visual para inventario vacío */}
            {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <ShoppingBag className="w-12 h-12 mb-4" />
                    <p className="text-sm">No hay productos disponibles por el momento</p>
                </div>
            )}
        </div>
    );
}