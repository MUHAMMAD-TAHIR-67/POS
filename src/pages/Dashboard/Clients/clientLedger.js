import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';  // Assume firestore is correctly initialized

// Function to add a payment entry to the client ledger
export const addPaymentToLedger = async (clientId, paymentAmount, previousBalance, paymentNote) => {
    const newBalance = previousBalance - paymentAmount;

    try {
        // Add ledger entry for the payment
        await addDoc(collection(firestore, 'clientLedger'), {
            client_id: clientId,
            transaction_type: 'payment',
            previous_balance: previousBalance,
            amount: paymentAmount,
            new_balance: newBalance,
            date: new Date().toISOString(),
            note: paymentNote || 'Payment recorded',
        });

        return newBalance;  // Return the updated balance after the payment
    } catch (error) {
        console.error("Error adding payment to ledger:", error);
        throw new Error("Error adding payment to ledger");
    }
};

// Function to add a bill edit entry to the client ledger
export const addBillEditToLedger = async (clientId, amount, previousBalance, isPayment, description) => {
    const newBalance = isPayment ? previousBalance - amount : previousBalance + amount;

    try {
        // Add ledger entry for the bill edit
        await addDoc(collection(firestore, 'clientLedger'), {
            client_id: clientId,
            transaction_type: 'bill_edit',
            previous_balance: previousBalance,
            amount,
            new_balance: newBalance,
            date: new Date().toISOString(),
            note: `Bill updated: ${description || 'No description'}`,
        });

        return newBalance;
    } catch (error) {
        console.error("Error adding bill edit to ledger:", error);
        throw new Error("Error adding bill edit to ledger");
    }
};

// Function to update the client's previous balance in the 'clients' collection
export const updateClientBalance = async (clientId, newBalance) => {
    try {
        // Update the client's previous balance in the clients collection
        await updateDoc(doc(firestore, 'clients', clientId), {
            previousBalance: newBalance,
        });
    } catch (error) {
        console.error("Error updating client balance:", error);
        throw new Error("Error updating client balance");
    }
};
