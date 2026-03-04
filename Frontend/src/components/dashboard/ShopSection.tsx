import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    price: number;
    stock: number;
}

export function ShopSection() {
    const products: Product[] = [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Tienda</h1>
                    <p className="text-muted-foreground">Administra tu inventario de productos</p>
                </div>
                <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Producto</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Categoría</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Precio</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                                            <div>
                                                <p className="font-medium text-foreground">{product.name}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">{product.category}</span>
                                    </td>
                                    <td className="p-4 font-medium text-foreground">${product.price}</td>
                                    <td className="p-4">
                                        <span className={`font-medium ${product.stock < 10 ? 'text-warning' : 'text-foreground'}`}>
                                            {product.stock} unidades
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="ghost">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {products.length === 0 && (
                        <div className="p-12 text-center border-t border-border bg-card/50">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No hay productos en el inventario.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}