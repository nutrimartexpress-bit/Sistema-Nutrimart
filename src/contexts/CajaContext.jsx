import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// --- INITIAL STATE & TYPES ---
const initialState = {
    currentSession: null,
    transactions: [],
    history: [], // [NEW] Added historical sessions
    isLoading: true
};

const ACTION_TYPES = {
    LOAD_STATE: 'LOAD_STATE',
    OPEN_REGISTER: 'OPEN_REGISTER',
    ADD_TRANSACTION: 'ADD_TRANSACTION',
    CLOSE_REGISTER: 'CLOSE_REGISTER',
    HARD_RESET: 'HARD_RESET'
};

const CajaContext = createContext(initialState);

function cajaReducer(state, action) {
    switch (action.type) {
        case ACTION_TYPES.LOAD_STATE:
            return {
                ...state,
                currentSession: action.payload.currentSession,
                transactions: action.payload.transactions,
                history: action.payload.history,
                isLoading: false
            };
        case ACTION_TYPES.OPEN_REGISTER:
            return {
                ...state,
                currentSession: action.payload.session,
                transactions: [action.payload.initialTransaction]
            };
        case ACTION_TYPES.ADD_TRANSACTION:
            return {
                ...state,
                transactions: [...state.transactions, action.payload]
            };
        case ACTION_TYPES.CLOSE_REGISTER:
            return {
                ...state,
                currentSession: null,
                transactions: [],
                history: [action.payload, ...state.history]
            };
        case ACTION_TYPES.HARD_RESET:
            return initialState;
        default:
            return state;
    }
}

export function CajaProvider({ children }) {
    const [state, dispatch] = useReducer(cajaReducer, initialState);
    const { toast } = useToast();

    useEffect(() => {
        const load = () => {
            try {
                const session = JSON.parse(localStorage.getItem('cashOpening'));
                const history = JSON.parse(localStorage.getItem('cashClosingHistory') || '[]');

                let transactions = [];
                if (session) {
                    transactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
                }

                dispatch({
                    type: ACTION_TYPES.LOAD_STATE,
                    payload: { currentSession: session, transactions, history }
                });
            } catch (error) {
                console.error("Error loading Caja state:", error);
                dispatch({
                    type: ACTION_TYPES.LOAD_STATE,
                    payload: { currentSession: null, transactions: [], history: [] }
                });
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!state.isLoading) {
            if (state.currentSession) {
                localStorage.setItem('cashOpening', JSON.stringify(state.currentSession));
                localStorage.setItem('cashTransactions', JSON.stringify(state.transactions));
            } else {
                localStorage.removeItem('cashOpening');
                localStorage.removeItem('cashTransactions');
            }
            // Always persist history
            localStorage.setItem('cashClosingHistory', JSON.stringify(state.history));
        }
    }, [state.currentSession, state.transactions, state.history, state.isLoading]);

    const openRegister = (amount, responsible, notes = '') => {
        if (state.currentSession) throw new Error("La caja ya está abierta.");

        const now = new Date();
        const newSession = {
            id: now.getTime(),
            openingDate: now.toISOString().split('T')[0],
            openingTime: now.toTimeString().slice(0, 5),
            openingAmount: amount,
            responsible,
            notes,
            status: 'OPEN'
        };

        const initialTransaction = {
            id: now.getTime(),
            date: newSession.openingDate,
            time: newSession.openingTime,
            description: `APERTURA DE CAJA - ${responsible}`,
            concept: 'APERTURA',
            amount: parseFloat(amount),
            type: 'income',
            paymentMethod: 'Efectivo',
            destination: 'Caja',
            isSystem: true
        };

        dispatch({
            type: ACTION_TYPES.OPEN_REGISTER,
            payload: { session: newSession, initialTransaction }
        });

        const openings = JSON.parse(localStorage.getItem('cashOpeningHistory') || '[]');
        localStorage.setItem('cashOpeningHistory', JSON.stringify([newSession, ...openings]));
    };

    const addTransaction = (transactionData) => {
        if (!state.currentSession) throw new Error("Caja cerrada.");

        const now = new Date();
        const newTransaction = {
            id: Date.now(),
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5),
            ...transactionData
        };

        dispatch({ type: ACTION_TYPES.ADD_TRANSACTION, payload: newTransaction });
        return newTransaction;
    };

    const closeRegister = (actualCashCount, notes = '') => {
        if (!state.currentSession) throw new Error("Caja cerrada.");

        const now = new Date();
        const closingDate = now.toISOString().split('T')[0];
        const closingTime = now.toTimeString().slice(0, 5);

        // 1. Create a "CIERRE CAJA" transaction record
        const closingTransaction = {
            id: Date.now(),
            date: closingDate,
            time: closingTime,
            description: "Cierre Caja",
            concept: "Cierre Caja",
            clientName: state.currentSession.responsible, // Using responsible as Social Reason
            amount: 0,
            type: 'info', // Special type or just 0 amount income/expense
            paymentMethod: 'Efectivo',
            destination: '--',
            isSystem: true,
            invoiceNumber: 'no aplica'
        };

        const finalTransactions = [...state.transactions, closingTransaction];

        const totalIn = finalTransactions.filter(t => t.type === 'income' && t.paymentMethod === 'Efectivo').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
        const totalOut = finalTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
        const expectedCash = totalIn - totalOut;
        const discrepancy = parseFloat(actualCashCount) - expectedCash;

        const summary = {
            ...state.currentSession,
            closingDate,
            closingTime,
            expectedCash,
            actualCash: parseFloat(actualCashCount),
            discrepancy,
            notes,
            status: 'CLOSED',
            transactionsSnapshot: finalTransactions
        };

        dispatch({ type: ACTION_TYPES.CLOSE_REGISTER, payload: summary });
        return summary;
    };

    return (
        <CajaContext.Provider value={{
            ...state,
            transactions: state.transactions,
            currentSession: state.currentSession,
            openRegister,
            addTransaction,
            closeRegister,
            hardResetSystem: () => {
                localStorage.clear();
                dispatch({ type: ACTION_TYPES.HARD_RESET });
                window.location.reload();
            }
        }}>
            {children}
        </CajaContext.Provider>
    );
}

export const useCaja = () => {
    const context = useContext(CajaContext);
    if (!context) {
        throw new Error("useCaja debe usarse dentro de un CajaProvider");
    }
    return context;
};
