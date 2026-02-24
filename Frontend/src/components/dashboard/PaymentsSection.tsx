import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Check, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function PaymentsSection() {
    const { users, payments, updatePayment } = useApp();
    const { toast } = useToast();

    const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handleApprovePayment = () => {
        if (selectedPayment) {
            updatePayment(selectedPayment.id, 'approved');
            toast({ title: "Pago aprobado ✅", description: "La membresía ha sido activada" });
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
        }
    };

    const handleRejectPayment = () => {
        if (selectedPayment) {
            updatePayment(selectedPayment.id, 'rejected');
            toast({ title: "Pago rechazado", description: "Se ha notificado al usuario", variant: "destructive" });
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Validación de Pagos</h1>
                <p className="text-muted-foreground">Revisa y aprueba los comprobantes de pago</p>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Concepto</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Monto</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => {
                                const user = users.find(u => u.id === payment.userId);
                                return (
                                    <tr key={payment.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-xl object-cover" />
                                                <span className="font-medium text-foreground">{user?.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-foreground">{payment.concept}</td>
                                        <td className="p-4 font-medium text-foreground">${payment.amount.toFixed(2)}</td>
                                        <td className="p-4 text-muted-foreground">{payment.date.toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'approved'
                                                ? 'bg-success/10 text-success'
                                                : payment.status === 'rejected'
                                                    ? 'bg-destructive/10 text-destructive'
                                                    : 'bg-warning/10 text-warning'
                                                }`}>
                                                {payment.status === 'approved' ? 'Aprobado' : payment.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {payment.status === 'pending' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setIsPaymentModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Revisar
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Revisar Comprobante</DialogTitle>
                        <DialogDescription>
                            Verifica el comprobante de pago antes de aprobar
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                                <img
                                    src={selectedPayment.receiptImage}
                                    alt="Comprobante"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                                <span className="text-muted-foreground">Monto</span>
                                <span className="font-bold text-foreground">${selectedPayment.amount.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="destructive" onClick={handleRejectPayment}>
                                    <X className="w-4 h-4 mr-2" />
                                    Rechazar
                                </Button>
                                <Button variant="success" onClick={handleApprovePayment}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Aprobar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
