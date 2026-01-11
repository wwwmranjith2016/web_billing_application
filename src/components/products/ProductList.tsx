import React, { useEffect, useState } from 'react';
import ProductForm from './ProductForm';
import LabelPrint from '../common/LabelPrint';
import { useToast } from '../common/ToastContext';
import { productsAPI, authAPI } from '../../utils/api';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showLabelPrint, setShowLabelPrint] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCurrentUser();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productsAPI.getAll();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      showToast('Error loading products: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const result = await authAPI.getCurrentUser();
      if (result.success) {
        setCurrentUser(result.user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Search products in real-time
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const result = await productsAPI.search(query);
      if (result.success) {
        setSearchResults(result.data);
        setShowSearchResults(true);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      if (query.length === 0) {
        loadProducts();
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await productsAPI.delete(id);
        if (result.success) {
          showToast('Product deleted successfully', 'success');
          loadProducts();
        }
      } catch (error) {
        showToast('Error deleting product: ' + error, 'error');
      }
    }
  };

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditProduct(null);
    loadProducts();
  };

  const handlePrintLabel = (product: any) => {
    setSelectedProduct(product);
    setShowLabelPrint(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* User filter info */}
      {currentUser && currentUser.role !== 'ADMIN' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            👤 Showing products created by you ({currentUser.fullName || currentUser.username})
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowSearchResults(true)}
          placeholder="Search by name, barcode, or code..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.product_id}
                onClick={() => {
                  // Select product from search results
                  setProducts([product]);
                  setSearchResults([]);
                  setShowSearchResults(false);
                  setSearchQuery(product.product_name);
                }}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b"
              >
                <div className="font-semibold">{product.product_name}</div>
                <div className="text-sm text-gray-600">
                  {product.barcode} | ₹{product.selling_price} | Stock: {product.stock_quantity}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Clear Search Button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSearchResults(false);
              loadProducts();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No products found. Click "Add Product" to create your first product.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full md:min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-6 py-4 md:py-8 text-center text-gray-500">
                      {searchQuery ? 'No products found matching your search.' : 'No products found. Click "Add Product" to create your first product.'}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900">{product.barcode}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900">{product.product_name}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500">{product.category}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500">
                        <span className={product.stock_quantity <= product.min_stock_level ? 'text-red-600 font-semibold' : ''}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900">₹{product.selling_price}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 mr-2 md:mr-3 text-xs md:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePrintLabel(product)}
                          className="text-green-600 hover:text-green-800 mr-2 md:mr-3 text-xs md:text-sm"
                        >
                          Print Label
                        </button>
                        <button
                          onClick={() => handleDelete(product.product_id)}
                          className="text-red-600 hover:text-red-800 text-xs md:text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditProduct(null);
          }}
          editProduct={editProduct}
        />
      )}

      {/* Label Print Modal */}
      {showLabelPrint && selectedProduct && (
        <LabelPrint
          product={selectedProduct}
          onClose={() => {
            setShowLabelPrint(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductList;