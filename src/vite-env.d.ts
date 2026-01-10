/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  electron: {
    products: {
      getAll: () => Promise<any>;
      getById: (id: number) => Promise<any>;
      create: (data: any) => Promise<any>;
      update: (id: number, data: any) => Promise<any>;
      delete: (id: number) => Promise<any>;
      search: (query: string) => Promise<any>;
      findByBarcode: (barcode: string) => Promise<any>;
    };
    bills: {
      create: (data: any) => Promise<any>;
      getAll: (filters?: any) => Promise<any>;
      getById: (id: number) => Promise<any>;
      getToday: () => Promise<any>;
      update: (id: number, data: any) => Promise<any>;
      search: (query: string) => Promise<any>;
    };
    returns: {
      create: (data: any) => Promise<any>;
      getAll: (filters?: any) => Promise<any>;
      getById: (id: number) => Promise<any>;
      updateStatus: (id: number, status: string) => Promise<any>;
      printReceipt: (id: number) => Promise<any>;
    };
    reports: {
      dailySales: (date?: string) => Promise<any>;
      salesByDateRange: (startDate: string, endDate: string) => Promise<any>;
      inventoryReport: () => Promise<any>;
      financialReport: (startDate: string, endDate: string) => Promise<any>;
      stockReport: () => Promise<any>;
    };
    settings: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: string) => Promise<any>;
    };
    customers: {
      getAll: () => Promise<any>;
      create: (data: any) => Promise<any>;
      search: (query: string) => Promise<any>;
    };
    barcode: {
      generateUnique: (category?: string) => Promise<any>;
      generateImage: (value: string, type?: string) => Promise<any>;
      onScan: (callback: (event: any, data: { barcode: string }) => void) => void;
      removeScanListener: (callback: (event: any, data: { barcode: string }) => void) => void;
    };
    printer: {
      getAvailable: () => Promise<any>;
      initialize: (printerName: string) => Promise<any>;
      testConnection: () => Promise<any>;
      getStatus: () => Promise<any>;
      printBill: (billData: any, shopInfo: any) => Promise<any>;
    };
    label: {
      print: (productData: any, labelSettings: any) => Promise<any>;
      printBulk: (productsData: any[], labelSettings: any) => Promise<any>;
      getSizes: () => Promise<any>;
      getTemplates: () => Promise<any>;
    };
  };
}
