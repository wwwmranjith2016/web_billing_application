import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-should-be-long-and-random';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JSON replacer function to handle BigInt serialization
const jsonReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
};

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT * FROM users WHERE user_id = ? AND is_active = 1', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Turso Database setup
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env file');
  process.exit(1);
}

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Helper function to convert libsql result to array of objects
function resultToRows(result) {
  if (!result || !result.rows || result.rows.length === 0) {
    return [];
  }
  
  // Convert BigInt values to numbers for JSON serialization
  return result.rows.map(row => {
    const convertedRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'bigint') {
        convertedRow[key] = Number(value);
      } else {
        convertedRow[key] = value;
      }
    }
    return convertedRow;
  });
}

// Helper function to get single row
function resultToRow(result) {
  if (!result || !result.rows || result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  const convertedRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'bigint') {
        convertedRow[key] = Number(value);
    } else {
        convertedRow[key] = value;
    }
  }
  return convertedRow;
}

// Helper function to run queries (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  try {
    const result = await db.execute({
      sql,
      args: params
    });
    return { lastInsertRowid: result.lastInsertRowid, rowsAffected: result.rowsAffected };
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
}

// Helper function to get single row
async function get(sql, params = []) {
  try {
    const result = await db.execute({
      sql,
      args: params
    });
    return resultToRow(result);
  } catch (error) {
    console.error('Database get error:', error);
    throw error;
  }
}

// Helper function to get all rows
async function all(sql, params = []) {
  try {
    const result = await db.execute({
      sql,
      args: params
    });
    return resultToRows(result);
  } catch (error) {
    console.error('Database all error:', error);
    throw error;
  }
}

// Initialize database schema
async function initializeDatabase() {
  try {
    const schemaPath = join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Split by semicolons and execute each statement
      const statements = schema.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.execute(statement);
          } catch (err) {
            // Ignore errors from CREATE TRIGGER IF NOT EXISTS
            if (!err.message.includes('already exists')) {
              console.warn('Schema warning:', err.message);
            }
          }
        }
      }
      console.log('Database schema loaded');
    }
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// ===== PRODUCTS API =====

app.get('/api/products', authenticate, async (req, res) => {
try {
  // For non-admin users, filter products by created_by
  let products;
  if (req.user.role === 'ADMIN') {
    // Admins can see all products
    products = await all('SELECT * FROM products WHERE is_active = 1 ORDER BY product_name');
  } else {
    // Regular users can only see products they created
    // Check if created_by column exists by trying the query
    try {
      products = await all('SELECT * FROM products WHERE is_active = 1 AND created_by = ? ORDER BY product_name', [req.user.user_id]);
    } catch (error) {
      // If created_by column doesn't exist, fall back to showing all products
      // This provides backward compatibility during migration
      if (error.message.includes('no such column: created_by')) {
        console.warn('⚠️  created_by column not found in products table. Showing all products.');
        products = await all('SELECT * FROM products WHERE is_active = 1 ORDER BY product_name');
      } else {
        console.error('Error filtering products by user:', error.message);
        throw error; // Re-throw other errors
      }
    }
  }
  
  // Debug log to see what's being returned
  console.log(`Returning ${products.length} products for user ${req.user.user_id} (role: ${req.user.role})`);
  
  res.send(JSON.stringify({ success: true, data: products }, jsonReplacer));
} catch (error) {
  res.status(500).send(JSON.stringify({ success: false, error: error.message }, jsonReplacer));
}
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/products', authenticate, async (req, res) => {
  try {
    const data = req.body;
    
    // Ensure numeric values are properly converted from strings
    const purchasePrice = typeof data.purchase_price === 'string'
      ? parseFloat(data.purchase_price)
      : (typeof data.purchase_price === 'bigint'
        ? Number(data.purchase_price)
        : (data.purchase_price || 0));
    
    const sellingPrice = typeof data.selling_price === 'string'
      ? parseFloat(data.selling_price)
      : (typeof data.selling_price === 'bigint'
        ? Number(data.selling_price)
        : data.selling_price);
    
    const stockQuantity = typeof data.stock_quantity === 'string'
      ? parseInt(data.stock_quantity)
      : (typeof data.stock_quantity === 'bigint'
        ? Number(data.stock_quantity)
        : (data.stock_quantity || 0));
    
    const minStockLevel = typeof data.min_stock_level === 'string'
      ? parseInt(data.min_stock_level)
      : (typeof data.min_stock_level === 'bigint'
        ? Number(data.min_stock_level)
        : (data.min_stock_level || 5));
    
    // Try to insert with user tracking columns first
    try {
      const result = await run(`
        INSERT INTO products (
          product_code, barcode, barcode_type, product_name, category,
          sub_category, size, color, purchase_price, selling_price,
          stock_quantity, min_stock_level, barcode_generated_at,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `, [
        data.product_code || null,
        data.barcode,
        data.barcode_type || 'CODE128',
        data.product_name,
        data.category || 'GENERAL',
        data.sub_category || null,
        data.size || null,
        data.color || null,
        purchasePrice,
        sellingPrice,
        stockQuantity,
        minStockLevel,
        req.user.user_id,
        req.user.user_id
      ]);
      res.json({ success: true, message: 'Product created successfully', id: Number(result.lastInsertRowid) });
    } catch (error) {
      // If user tracking columns don't exist, fall back to old schema
      if (error.message.includes('no such column: created_by')) {
        console.warn('⚠️  User tracking columns not found in products table. Using legacy schema.');
        const result = await run(`
          INSERT INTO products (
            product_code, barcode, barcode_type, product_name, category,
            sub_category, size, color, purchase_price, selling_price,
            stock_quantity, min_stock_level, barcode_generated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          data.product_code || null,
          data.barcode,
          data.barcode_type || 'CODE128',
          data.product_name,
          data.category || 'GENERAL',
          data.sub_category || null,
          data.size || null,
          data.color || null,
          purchasePrice,
          sellingPrice,
          stockQuantity,
          minStockLevel
        ]);
        res.json({ success: true, message: 'Product created successfully (legacy mode)', id: Number(result.lastInsertRowid) });
      } else {
        throw error; // Re-throw other errors
      }
    }
  } catch (error) {
    res.status(500).send(JSON.stringify({ success: false, error: error.message }, jsonReplacer));
  }
});

app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const data = req.body;
    
    // Check if user has permission to update this product
    const existingProduct = await get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Only allow update if user is ADMIN or created the product
    if (req.user.role !== 'ADMIN' && existingProduct.created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, error: 'You can only update products you created' });
    }
    
    // Ensure numeric values are properly converted from strings
    const purchasePrice = typeof data.purchase_price === 'string'
      ? parseFloat(data.purchase_price)
      : (typeof data.purchase_price === 'bigint'
        ? Number(data.purchase_price)
        : (data.purchase_price || 0));
     
    const sellingPrice = typeof data.selling_price === 'string'
      ? parseFloat(data.selling_price)
      : (typeof data.selling_price === 'bigint'
        ? Number(data.selling_price)
        : data.selling_price);
     
    const stockQuantity = typeof data.stock_quantity === 'string'
      ? parseInt(data.stock_quantity)
      : (typeof data.stock_quantity === 'bigint'
        ? Number(data.stock_quantity)
        : (data.stock_quantity || 0));
     
    const minStockLevel = typeof data.min_stock_level === 'string'
      ? parseInt(data.min_stock_level)
      : (typeof data.min_stock_level === 'bigint'
        ? Number(data.min_stock_level)
        : (data.min_stock_level || 5));
    
    await run(`
      UPDATE products SET
        product_code = ?,
        barcode = ?,
        barcode_type = ?,
        product_name = ?,
        category = ?,
        sub_category = ?,
        size = ?,
        color = ?,
        purchase_price = ?,
        selling_price = ?,
        stock_quantity = ?,
        min_stock_level = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `, [
      data.product_code || null,
      data.barcode,
      data.barcode_type || 'CODE128',
      data.product_name,
      data.category || 'GENERAL',
      data.sub_category || null,
      data.size || null,
      data.color || null,
      purchasePrice,
      sellingPrice,
      stockQuantity,
      minStockLevel,
      req.user.user_id,
      parseInt(req.params.id)
    ]);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await run('UPDATE products SET is_active = 0 WHERE product_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/products/search/:query', authenticate, async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    let products;
    if (req.user.role === 'ADMIN') {
      // Admins can search all products
      products = await all(`
        SELECT * FROM products
        WHERE is_active = 1
        AND (product_name LIKE ? OR barcode LIKE ? OR product_code LIKE ?)
        ORDER BY product_name
        LIMIT 50
      `, [query, query, query]);
    } else {
      // Regular users can only search products they created
      // Check if created_by column exists by trying the query
      try {
        products = await all(`
          SELECT * FROM products
          WHERE is_active = 1
          AND created_by = ?
          AND (product_name LIKE ? OR barcode LIKE ? OR product_code LIKE ?)
          ORDER BY product_name
          LIMIT 50
        `, [req.user.user_id, query, query, query]);
      } catch (error) {
        // If created_by column doesn't exist, fall back to showing all products
        // This provides backward compatibility during migration
        if (error.message.includes('no such column: created_by')) {
          console.warn('⚠️  created_by column not found in products table. Showing all products in search.');
          products = await all(`
            SELECT * FROM products
            WHERE is_active = 1
            AND (product_name LIKE ? OR barcode LIKE ? OR product_code LIKE ?)
            ORDER BY product_name
            LIMIT 50
          `, [query, query, query]);
        } else {
          throw error; // Re-throw other errors
        }
      }
    }
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/products/barcode/:barcode', authenticate, async (req, res) => {
  try {
    let product;
    if (req.user.role === 'ADMIN') {
      // Admins can lookup any product
      product = await get('SELECT * FROM products WHERE barcode = ? AND is_active = 1', [req.params.barcode]);
    } else {
      // Regular users can only lookup products they created
      product = await get('SELECT * FROM products WHERE barcode = ? AND is_active = 1 AND created_by = ?', [req.params.barcode, req.user.user_id]);
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BILLS API =====

app.post('/api/bills', authenticate, async (req, res) => {
  try {
    const billData = req.body;
    
    // Get shop info for bill number
    const shopInfo = await get('SELECT * FROM shop_info WHERE shop_id = 1');
    
    // Generate unique bill number with timestamp to avoid collisions
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const billNumber = `${shopInfo.bill_prefix}-${shopInfo.bill_counter.toString().padStart(4, '0')}-${timestamp}`;
    
    // Insert bill with user tracking
    const billResult = await run(`
      INSERT INTO bills (
        bill_number, customer_id, customer_name, customer_phone,
        subtotal, discount_amount, discount_percentage, total_amount,
        payment_mode, paid_amount, balance_amount, notes,
        is_return, original_bill_id, user_id, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billNumber,
      billData.customer_id || null,
      billData.customer_name || null,
      billData.customer_phone || null,
      billData.subtotal,
      billData.discount_amount || 0,
      billData.discount_percentage || 0,
      billData.total_amount,
      billData.payment_mode || 'CASH',
      billData.paid_amount || billData.total_amount,
      billData.balance_amount || 0,
      billData.notes || null,
      billData.is_return || 0,
      billData.original_bill_id || null,
      req.user.user_id, // user_id for backward compatibility
      req.user.user_id, // created_by
      req.user.user_id  // updated_by
    ]);

    // Insert bill items with user tracking
    for (const item of billData.items) {
      await run(`
        INSERT INTO bill_items (
          bill_id, product_id, product_name, product_code, barcode,
          quantity, unit_price, total_price, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        billResult.lastInsertRowid,
        item.product_id,
        item.product_name,
        item.product_code || null,
        item.barcode || null,
        item.quantity,
        item.unit_price,
        item.total_price,
        req.user.user_id
      ]);
    }

    res.json({
  success: true,
  message: 'Bill created successfully',
  billNumber: billNumber,
  billId: Number(billResult.lastInsertRowid)
});
  } catch (error) {
    console.error('Bill creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bills/:id', authenticate, async (req, res) => {
  try {
    const bill = await get('SELECT * FROM bills WHERE bill_id = ?', [req.params.id]);
    
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    // Check if user has permission to view this bill
    if (req.user.role !== 'ADMIN' && req.user.user_id !== bill.created_by) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only view your own bills' });
    }
    
    const items = await all('SELECT * FROM bill_items WHERE bill_id = ?', [req.params.id]);
    bill.items = items;
    
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bills', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    let sql = 'SELECT * FROM bills WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND DATE(bill_date) >= DATE(?)';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(bill_date) <= DATE(?)';
      params.push(endDate);
    }
    
    // Filter by user if specified (admin can see all, users can only see their own unless admin)
    if (userId && req.user.role === 'ADMIN') {
      sql += ' AND created_by = ?';
      params.push(userId);
    } else if (req.user.role !== 'ADMIN') {
      // Regular users can only see their own bills
      sql += ' AND created_by = ?';
      params.push(req.user.user_id);
    }
    
    sql += ' ORDER BY bill_date DESC LIMIT 100';
    
    const bills = await all(sql, params);
    res.json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bills/today', async (req, res) => {
  try {
    const bills = await all(`
      SELECT * FROM bills 
      WHERE DATE(bill_date) = DATE('now')
      ORDER BY bill_date DESC
    `);
    res.json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bills/search/:query', authenticate, async (req, res) => {
  try {
    const searchPattern = `%${req.params.query}%`;
    let sql = `
      SELECT b.* FROM bills b
      WHERE (
        b.bill_number LIKE ? OR
        b.customer_name LIKE ? OR
        b.customer_phone LIKE ? OR
        CAST(b.total_amount AS TEXT) LIKE ? OR
        DATE(b.bill_date) LIKE ?
      )
    `;
    const params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
    
    // Filter by user if not ADMIN - only show bills created by the current user
    if (req.user.role !== 'ADMIN') {
      sql += ' AND b.created_by = ?';
      params.push(req.user.user_id);
    }
    
    sql += ' ORDER BY b.bill_date DESC LIMIT 50';
    
    const bills = await all(sql, params);
    
    const billsWithItems = await Promise.all(bills.map(async (bill) => ({
      ...bill,
      items: await all('SELECT * FROM bill_items WHERE bill_id = ?', [bill.bill_id])
    })));
    
    res.json({ success: true, data: billsWithItems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const currentBill = await get('SELECT * FROM bills WHERE bill_id = ?', [req.params.id]);
    
    if (!currentBill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const newPaidAmount = updateData.paid_amount || currentBill.paid_amount;
    const newBalanceAmount = currentBill.total_amount - newPaidAmount;

    await run(`
      UPDATE bills SET 
        customer_name = ?,
        customer_phone = ?,
        payment_mode = ?,
        notes = ?,
        paid_amount = ?,
        balance_amount = ?
      WHERE bill_id = ?
    `, [
      updateData.customer_name || null,
      updateData.customer_phone || null,
      updateData.payment_method || currentBill.payment_mode,
      updateData.comment || null,
      newPaidAmount,
      newBalanceAmount,
      parseInt(req.params.id)
    ]);

    res.json({ 
      success: true, 
      message: 'Bill updated successfully',
      data: { paid_amount: newPaidAmount, balance_amount: newBalanceAmount }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== RETURNS API =====

app.post('/api/returns', authenticate, async (req, res) => {
  try {
    const returnData = req.body;
    
    if (!returnData.return_items || !Array.isArray(returnData.return_items)) {
      throw new Error('Invalid return items data');
    }
    if (!returnData.exchange_items || !Array.isArray(returnData.exchange_items)) {
      throw new Error('Invalid exchange items data');
    }
    
    const totalReturnValue = returnData.return_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalExchangeValue = returnData.exchange_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const balanceAmount = totalExchangeValue - totalReturnValue;

    // Insert return transaction with user tracking
    const returnResult = await run(`
      INSERT INTO return_transactions (
        original_bill_id, customer_name, customer_phone,
        return_reason, total_return_value, total_exchange_value,
        balance_amount, status, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      returnData.original_bill_id,
      returnData.customer_name || null,
      returnData.customer_phone || null,
      returnData.return_reason || null,
      totalReturnValue,
      totalExchangeValue,
      balanceAmount,
      'COMPLETED',
      returnData.notes || null,
      req.user.user_id,
      req.user.user_id
    ]);

    // Insert return items with user tracking
    for (const item of returnData.return_items) {
      await run(`
        INSERT INTO return_items (
          return_id, product_id, product_name, product_code, barcode,
          quantity, unit_price, total_price, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        returnResult.lastInsertRowid,
        item.product_id || null,
        item.product_name,
        item.product_code || null,
        item.barcode || null,
        item.quantity,
        item.unit_price,
        item.total_price,
        req.user.user_id
      ]);
    }

    // Insert exchange items with user tracking
    for (const item of returnData.exchange_items) {
      await run(`
        INSERT INTO exchange_items (
          return_id, product_id, product_name, product_code, barcode,
          quantity, unit_price, total_price, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        returnResult.lastInsertRowid,
        item.product_id || null,
        item.product_name,
        item.product_code || null,
        item.barcode || null,
        item.quantity,
        item.unit_price,
        item.total_price,
        req.user.user_id
      ]);
    }

    res.json({
      success: true,
      message: 'Return processed successfully',
      returnId: Number(returnResult.lastInsertRowid)
    });
  } catch (error) {
    console.error('Return creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/returns', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let sql = `
      SELECT rt.* FROM return_transactions rt WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND DATE(rt.return_date) >= DATE(?)';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(rt.return_date) <= DATE(?)';
      params.push(endDate);
    }
    if (status) {
      sql += ' AND rt.status = ?';
      params.push(status);
    }

    // Filter by user if not ADMIN
    if (req.user.role !== 'ADMIN') {
      sql += ' AND rt.created_by = ?';
      params.push(req.user.user_id);
    }

    sql += ' ORDER BY rt.return_date DESC LIMIT 100';

    const returns = await all(sql, params);
    const detailedReturns = await Promise.all(returns.map(async (rt) => ({
      ...rt,
      return_items: await all('SELECT * FROM return_items WHERE return_id = ?', [rt.return_id]),
      exchange_items: await all('SELECT * FROM exchange_items WHERE return_id = ?', [rt.return_id])
    })));

    res.json({ success: true, data: detailedReturns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/returns/:id', authenticate, async (req, res) => {
  try {
    const returnTransaction = await get('SELECT * FROM return_transactions WHERE return_id = ?', [req.params.id]);
    if (!returnTransaction) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }
    
    // Check if user has permission to view this return
    if (req.user.role !== 'ADMIN' && returnTransaction.created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only view your own returns' });
    }
    
    returnTransaction.return_items = await all('SELECT * FROM return_items WHERE return_id = ?', [req.params.id]);
    returnTransaction.exchange_items = await all('SELECT * FROM exchange_items WHERE return_id = ?', [req.params.id]);
    res.json({ success: true, data: returnTransaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/returns/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE return_transactions SET status = ? WHERE return_id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Return status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== REPORTS API =====

// Replace the /api/reports/daily-sales endpoint with this corrected version

// ===== REPORTS API - COMPLETE FIXED VERSION =====
// Replace all your existing report endpoints with these corrected versions

app.get('/api/reports/daily-sales', authenticate, async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    
    // Build SQL query with user filtering - FIXED: Added alias 'b' to bills table
    let summarySql = `
      SELECT
        COUNT(*) as total_bills,
        SUM(b.total_amount) as total_sales,
        SUM(CASE WHEN b.payment_mode = 'CASH' THEN b.total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN b.payment_mode = 'UPI' THEN b.total_amount ELSE 0 END) as upi_sales,
        SUM(CASE WHEN b.payment_mode = 'CARD' THEN b.total_amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN b.payment_mode = 'CREDIT' THEN b.total_amount ELSE 0 END) as credit_sales
      FROM bills b
      WHERE DATE(b.bill_date) = DATE(?)
    `;
    
    let topItemsSql = `
      SELECT
        bi.product_name,
        SUM(bi.quantity) as total_quantity,
        SUM(bi.total_price) as total_amount
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE DATE(b.bill_date) = DATE(?)
    `;
    
    const params = [targetDate];
    
    // Filter by user if not ADMIN - only show data for the current user
    if (req.user.role !== 'ADMIN') {
      summarySql += ' AND b.created_by = ?';
      topItemsSql += ' AND b.created_by = ?';
      params.push(req.user.user_id);
    }
    
    // Add GROUP BY and ORDER BY for top items
    topItemsSql += ' GROUP BY bi.product_name ORDER BY total_quantity DESC LIMIT 10';
    
    const summary = await get(summarySql, params);
    const topItems = await all(topItemsSql, params);

    // Convert BigInt values to numbers
    const convertedSummary = summary ? {
      total_bills: summary.total_bills ? Number(summary.total_bills) : 0,
      total_sales: summary.total_sales ? Number(summary.total_sales) : 0,
      cash_sales: summary.cash_sales ? Number(summary.cash_sales) : 0,
      upi_sales: summary.upi_sales ? Number(summary.upi_sales) : 0,
      card_sales: summary.card_sales ? Number(summary.card_sales) : 0,
      credit_sales: summary.credit_sales ? Number(summary.credit_sales) : 0
    } : { total_bills: 0, total_sales: 0, cash_sales: 0, upi_sales: 0, card_sales: 0, credit_sales: 0 };

    res.json({
      success: true,
      data: {
        summary: convertedSummary,
        topItems: topItems || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/sales', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build SQL query with user filtering - FIXED: Added alias 'b' to bills table
    let summarySql = `
      SELECT
        COUNT(*) as total_bills,
        SUM(b.total_amount) as total_sales,
        SUM(CASE WHEN b.payment_mode = 'CASH' THEN b.total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN b.payment_mode = 'UPI' THEN b.total_amount ELSE 0 END) as upi_sales,
        SUM(CASE WHEN b.payment_mode = 'CARD' THEN b.total_amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN b.payment_mode = 'CREDIT' THEN b.total_amount ELSE 0 END) as credit_sales
      FROM bills b
      WHERE DATE(b.bill_date) >= DATE(?) AND DATE(b.bill_date) <= DATE(?)
    `;
    
    let topItemsSql = `
      SELECT
        bi.product_name,
        SUM(bi.quantity) as total_quantity,
        SUM(bi.total_price) as total_amount
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE DATE(b.bill_date) >= DATE(?) AND DATE(b.bill_date) <= DATE(?)
    `;
    
    const params = [startDate, endDate];
    
    // Filter by user if not ADMIN - only show data for the current user
    if (req.user.role !== 'ADMIN') {
      summarySql += ' AND b.created_by = ?';
      topItemsSql += ' AND b.created_by = ?';
      params.push(req.user.user_id);
    }
    
    // Add GROUP BY and ORDER BY for top items
    topItemsSql += ' GROUP BY bi.product_name ORDER BY total_quantity DESC LIMIT 10';
    
    const summary = await get(summarySql, params);
    const topItems = await all(topItemsSql, params);

    // Convert BigInt values to numbers
    const convertedSummary = summary ? {
      total_bills: summary.total_bills ? Number(summary.total_bills) : 0,
      total_sales: summary.total_sales ? Number(summary.total_sales) : 0,
      cash_sales: summary.cash_sales ? Number(summary.cash_sales) : 0,
      upi_sales: summary.upi_sales ? Number(summary.upi_sales) : 0,
      card_sales: summary.card_sales ? Number(summary.card_sales) : 0,
      credit_sales: summary.credit_sales ? Number(summary.credit_sales) : 0
    } : { total_bills: 0, total_sales: 0, cash_sales: 0, upi_sales: 0, card_sales: 0, credit_sales: 0 };

    res.json({
      success: true,
      data: {
        summary: convertedSummary,
        topItems: topItems || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/inventory', authenticate, async (req, res) => {
  try {
    // Build SQL queries with user filtering for products - FIXED: Added alias 'p'
    let allProductsSql = `
      SELECT p.product_id, p.product_name, p.stock_quantity, p.min_stock_level, p.category, p.selling_price
      FROM products p WHERE p.is_active = 1
    `;
    
    let lowStockSql = `
      SELECT p.product_id, p.product_name, p.stock_quantity, p.min_stock_level, p.category
      FROM products p
      WHERE p.is_active = 1
      AND p.stock_quantity <= p.min_stock_level
      AND p.stock_quantity > 0
    `;
    
    let outOfStockSql = `
      SELECT p.product_id, p.product_name, p.category
      FROM products p
      WHERE p.is_active = 1
      AND p.stock_quantity = 0
    `;
    
    const params = [];
    
    // Filter by user if not ADMIN - only show products created by the current user
    if (req.user.role !== 'ADMIN') {
      allProductsSql += ' AND p.created_by = ?';
      lowStockSql += ' AND p.created_by = ?';
      outOfStockSql += ' AND p.created_by = ?';
      params.push(req.user.user_id);
    }
    
    // Add ORDER BY
    allProductsSql += ' ORDER BY p.product_name';
    lowStockSql += ' ORDER BY p.stock_quantity ASC';
    outOfStockSql += ' ORDER BY p.product_name';
    
    const allProducts = await all(allProductsSql, params);
    const lowStockProducts = await all(lowStockSql, params);
    const outOfStockProducts = await all(outOfStockSql, params);

    res.json({
      success: true,
      data: {
        allProducts: allProducts || [],
        lowStockProducts: lowStockProducts || [],
        outOfStockProducts: outOfStockProducts || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/financial', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // FIXED: Added alias 'b' to bills table
    let salesSql = `
      SELECT
        SUM(b.total_amount) as total_revenue,
        COUNT(*) as total_bills,
        AVG(b.total_amount) as average_bill_value
      FROM bills b
      WHERE DATE(b.bill_date) >= DATE(?) AND DATE(b.bill_date) <= DATE(?)
    `;
    
    const params = [startDate, endDate];
    
    // Filter by user if not ADMIN - only show data for the current user
    if (req.user.role !== 'ADMIN') {
      salesSql += ' AND b.created_by = ?';
      params.push(req.user.user_id);
    }
    
    const salesData = await get(salesSql, params);

    // Calculate previous period for comparison
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const periodDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    
    const prevStartDate = new Date(startDateObj.getTime() - (periodDays * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    const prevEndDate = new Date(endDateObj.getTime() - (periodDays * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];

    let prevSalesSql = `
      SELECT SUM(b.total_amount) as total_revenue
      FROM bills b
      WHERE DATE(b.bill_date) >= DATE(?) AND DATE(b.bill_date) <= DATE(?)
    `;
    
    const prevParams = [prevStartDate, prevEndDate];
    
    if (req.user.role !== 'ADMIN') {
      prevSalesSql += ' AND b.created_by = ?';
      prevParams.push(req.user.user_id);
    }

    const previousPeriodData = await get(prevSalesSql, prevParams);

    const totalRevenue = salesData?.total_revenue ? Number(salesData.total_revenue) : 0;
    const totalProfit = totalRevenue * 0.3;
    const totalTax = totalRevenue * 0.05;
    const averageBillValue = salesData?.average_bill_value ? Number(salesData.average_bill_value) : 0;
    
    const currentPeriod = totalRevenue;
    const previousPeriod = previousPeriodData?.total_revenue ? Number(previousPeriodData.total_revenue) : 0;
    const growthPercentage = previousPeriod > 0
      ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
      : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue),
        totalProfit: Number(totalProfit),
        totalTax: Number(totalTax),
        averageBillValue: Number(averageBillValue),
        periodComparison: {
          currentPeriod: Number(currentPeriod),
          previousPeriod: Number(previousPeriod),
          growthPercentage: Number(growthPercentage)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SETTINGS API =====

app.get('/api/settings/shop', async (req, res) => {
  try {
    const shopInfo = await get('SELECT * FROM shop_info WHERE shop_id = 1');
    res.json({ success: true, data: shopInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/settings/shop', async (req, res) => {
  try {
    const data = req.body;
    await run(`
      UPDATE shop_info SET
        shop_name = ?,
        owner_name = ?,
        phone = ?,
        address = ?,
        bill_prefix = ?
      WHERE shop_id = 1
    `, [
      data.shop_name || 'My Shop',
      data.owner_name || null,
      data.phone || null,
      data.address || null,
      data.bill_prefix || 'BILL'
    ]);
    res.json({ success: true, message: 'Shop settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/settings/:key', async (req, res) => {
  try {
    const setting = await get('SELECT setting_value FROM settings WHERE setting_key = ?', [req.params.key]);
    res.json({ success: true, data: setting?.setting_value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await run('INSERT OR REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
    res.json({ success: true, message: 'Setting saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CUSTOMERS API =====

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await all('SELECT * FROM customers ORDER BY customer_name');
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const data = req.body;
    const result = await run(`
      INSERT INTO customers (customer_name, phone, address) VALUES (?, ?, ?)
    `, [data.customer_name || null, data.phone || null, data.address || null]);
    res.json({ success: true, message: 'Customer created successfully', id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/customers/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const customers = await all(`
      SELECT * FROM customers 
      WHERE customer_name LIKE ? OR phone LIKE ?
      ORDER BY customer_name
      LIMIT 20
    `, [query, query]);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BARCODE API =====

app.get('/api/barcode/generate/:category', async (req, res) => {
  try {
    const prefix = req.params.category ? req.params.category.substring(0, 2).toUpperCase() : 'SB';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const barcode = `${prefix}${timestamp}${random}`;
    res.json({ success: true, data: { barcode } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== AUTHENTICATION API =====

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role } = req.body;
    
    // Check if user already exists
    const existingUser = await get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await run(`
      INSERT INTO users (username, email, password_hash, full_name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email, passwordHash, full_name || null, phone || null, role || 'STAFF']);
    
    res.json({
      success: true,
      message: 'User registered successfully',
      userId: Number(result.lastInsertRowid)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await get('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1', [username, username]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    
    // Store session
    await run(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [user.user_id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        req.ip || 'unknown', req.headers['user-agent'] || 'unknown']);
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        userId: req.user.user_id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.full_name,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User logout
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM user_sessions WHERE user_id = ?', [req.user.user_id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== USER MANAGEMENT API =====

// Get all users (Admin only)
app.get('/api/users', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await all('SELECT user_id, username, email, full_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT user_id, username, email, full_name, phone, role, is_active, created_at FROM users WHERE user_id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { full_name, phone, role, is_active } = req.body;
    
    // Check if user exists
    const existingUser = await get('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check permissions
    if (req.user.user_id != req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can update other users' });
    }
    
    await run(`
      UPDATE users SET
        full_name = ?,
        phone = ?,
        role = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [full_name || null, phone || null, role || existingUser.role,
        is_active !== undefined ? is_active : existingUser.is_active, req.params.id]);
    
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Change password
app.put('/api/users/:id/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Check if user exists
    const user = await get('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check permissions
    if (req.user.user_id != req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can change other users passwords' });
    }
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [passwordHash, req.params.id]);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SAMPLE DATA =====

app.post('/api/sample-data', async (req, res) => {
  try {
    const existingProducts = await get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const existingUsers = await get('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers.count === 0) {
      // Create admin user
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      await run(`
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', 'admin@example.com', passwordHash, 'Administrator', 'ADMIN']);
      
      console.log('Created default admin user: admin/admin123');
    }
    
    if (existingProducts.count === 0) {
      const sampleProducts = [
        { product_name: 'Black Pant', category: 'Clothing', selling_price: 899, stock_quantity: 36, min_stock_level: 10 },
        { product_name: 'Blue Shirt', category: 'Clothing', selling_price: 599, stock_quantity: 15, min_stock_level: 8 },
        { product_name: 'White Sneakers', category: 'Footwear', selling_price: 1299, stock_quantity: 5, min_stock_level: 12 },
        { product_name: 'Coffee Mug', category: 'Home & Kitchen', selling_price: 299, stock_quantity: 0, min_stock_level: 20 },
        { product_name: 'Notebook', category: 'Stationery', selling_price: 150, stock_quantity: 45, min_stock_level: 15 }
      ];
 
      for (const product of sampleProducts) {
        const barcode = `SB${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await run(`
          INSERT INTO products (barcode, product_name, category, selling_price, stock_quantity, min_stock_level)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [barcode, product.product_name, product.category, product.selling_price, product.stock_quantity, product.min_stock_level]);
      }
      res.json({ success: true, message: 'Sample products and admin user added' });
    } else {
      res.json({ success: true, message: 'Products already exist' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    res.json({ status: 'error', timestamp: new Date().toISOString(), database: 'disconnected', error: error.message });
  }
});

// Root health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initializeDatabase().then((success) => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Connected to Turso database: ${dbUrl}`);
    });
  } else {
    console.error('Failed to initialize database');
    process.exit(1);
  }
});
