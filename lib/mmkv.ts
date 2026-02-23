import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// TanStack Query persister backed by AsyncStorage
export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'billsnapr-query-cache',
});
