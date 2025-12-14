"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/hooks/use-data";
import { useUserKey } from "@/lib/session";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface PaymentHistoryDialogProps {
  debt: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentHistoryDialog({ debt, isOpen, onClose }: PaymentHistoryDialogProps) {
  const userKey = useUserKey();
  const { data: payments, isLoading } = useData<any[]>(
    "debts:getPayments" as any, 
    debt && isOpen ? { userKey, debtId: debt._id } : "skip" as any
  );

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment History: {debt.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-100">
             <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Total Loan Amount</span>
                <span className="font-semibold">₱{debt.total_amount.toLocaleString()}</span>
             </div>
             <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Remaining Balance</span>
                <span className="font-bold text-indigo-600">₱{debt.remaining_amount.toLocaleString()}</span>
             </div>
             <div className="h-2 w-full bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100}%` }}
                />
             </div>
             <div className="text-xs text-gray-500 text-right mt-1">
               {((debt.total_amount - debt.remaining_amount) / debt.total_amount * 100).toFixed(1)}% Paid
             </div>
          </div>

          <h4 className="text-sm font-medium mb-3">Recent Payments</h4>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : payments && payments.length > 0 ? (
              payments.map((payment: any) => (
                <div key={payment._id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-sm">₱{payment.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{format(payment.date, "MMM d, yyyy")}</div>
                  </div>
                  {payment.notes && (
                    <div className="text-xs text-gray-400 max-w-[150px] truncate text-right">
                      {payment.notes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No payments recorded yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
