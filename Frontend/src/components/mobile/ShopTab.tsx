import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockProducts } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export function ShopTab() {
    const { toast } = useToast();

    const handleAddToCart = (productName: string) => {
        toast({
            title: "Agregado al carrito 🛒",
            description: productName
        });
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Tienda</h1>
            <div className="grid grid-cols-2 gap-4">
                {mockProducts.map((product) => (
                    <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="aspect-square bg-muted">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                            <h3 className="font-medium text-foreground text-sm line-clamp-2">{product.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-primary">${product.price}</span>
                                <Button size="sm" variant="ghost" onClick={() => handleAddToCart(product.name)}>
                                    <ShoppingBag className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
