import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pb, logErrorToPocketBase } from '../services/pocketbase';
import { useAuth } from './AuthContext';

const FirmDataContext = createContext();

export const FirmDataProvider = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firmId] = useState(currentUser?.firm_id);
  const [firmName, setFirmName] = useState('');
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const fetchData = useCallback(async () => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    try {
      const firmPromise = pb.collection('firms').getOne(firmId, { $autoCancel: false });
      const itemsPromise = pb.collection('items').getFullList({ filter: `firm_id="${firmId}"`, sort: 'name', fields: '*', $autoCancel: false });
      const salesPromise = pb.collection('sales').getFullList({ filter: `firm_id="${firmId}"`, sort: '-created', fields: '*', $autoCancel: false });
      const customersPromise = pb.collection('customers').getFullList({ filter: `firm_id="${firmId}"`, sort: 'name', fields: '*', $autoCancel: false });
      const expensesPromise = pb.collection('expenses').getFullList({ filter: `firm_id="${firmId}"`, fields: '*', $autoCancel: false });
      const depositsPromise = pb.collection('deposits').getFullList({ filter: `firm_id="${firmId}"`, fields: '*', $autoCancel: false });
      const [firmData, itemsData, salesData, customersData, expensesData, depositsData] = await Promise.all([
        firmPromise, 
        itemsPromise, 
        salesPromise, 
        customersPromise, 
        expensesPromise, 
        depositsPromise 
      ]);
      setFirmName(firmData.name);
      setItems(itemsData);
      setSales(salesData);
      setCustomers(customersData);
      setExpenses(expensesData);
      setDeposits(depositsData);
    } catch (error) {
        if (!error.isAbort) {
            logErrorToPocketBase({ message: `Failed to fetch firm data for firm ${firmId}`, stack: error.stack });
            if (error.status === 404 || error.status === 403) {
                alert("Error: Could not access firm data. Logging out.");
                logout();
            }
        }
    } finally {
      setLoading(false);
    }
  }, [firmId, logout]); 

  useEffect(() => {
    fetchData();

    if (firmId) {
      const collections = ['items', 'sales', 'customers', 'expenses'];
      const options = { filter: `firm_id = "${firmId}"` };
      collections.forEach(collectionName => {
        pb.collection(collectionName).subscribe('*', fetchData, options);
      });
    }

    const cleanup = () => {
      pb.collection('items').unsubscribe();
      pb.collection('sales').unsubscribe();
      pb.collection('customers').unsubscribe();
      pb.collection('expenses').unsubscribe();
      pb.collection('deposits').unsubscribe();
    };
    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            pb.realtime.unsubscribe(); 
        });
    }
    return cleanup;
  }, [firmId, fetchData]);
  
  const value = {
    loading,
    firmId,
    firmName,
    items,
    sales,
    customers,
    expenses,
    deposits,
    refetchData: fetchData,
  };

  return <FirmDataContext.Provider value={value}>{children}</FirmDataContext.Provider>;
};

export const useFirmData = () => {
  const context = useContext(FirmDataContext);
  if (context === undefined) {
    throw new Error('useFirmData must be used within a FirmDataProvider');
  }
  return context;
};