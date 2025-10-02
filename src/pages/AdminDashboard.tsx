import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit2, Trash2, LogOut, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tags: string[];
  description: string;
  inStock: boolean;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'main' | 'pending' | 'approved';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    tags: '',
    description: '',
    inStock: true,
  });
  const [pendingAdmins, setPendingAdmins] = useState<Admin[]>([]);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    // Check for persisted token in localStorage
    const persistedToken = localStorage.getItem('adminToken');
    const persistedUser = localStorage.getItem('adminUser');

    if (!auth.isAuthenticated && !persistedToken) {
      navigate('/admin/login');
      return;
    }

    const user = auth.user || (persistedUser ? JSON.parse(persistedUser) : null);
    if (user && user.role === 'main') {
      setIsMainAdmin(true);
    }

    // Load products from backend
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/products`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token || persistedToken}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        const products = await res.json();
        setProducts(products);
      } catch (error: any) {
        setProducts([]);
        alert('Error fetching products: ' + error.message);
      }
    };

    const fetchAdmins = async () => {
      if (user && user.role === 'main') {
        try {
          const [pendingRes, allRes] = await Promise.all([
            fetch(`${backendUrl}/api/admin/pending`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.token || persistedToken}`,
              },
            }),
            fetch(`${backendUrl}/api/admin/all`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.token || persistedToken}`,
              },
            }),
          ]);

          if (pendingRes.ok) {
            const pending = await pendingRes.json();
            setPendingAdmins(pending);
          }

          if (allRes.ok) {
            const all = await allRes.json();
            setAllAdmins(all);
          }
        } catch (error: any) {
          console.error('Error fetching admins:', error);
        }
      }
    };

    fetchProducts();
    fetchAdmins();
  }, [auth.isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newProduct = {
      name: formData.name,
      price: parseFloat(formData.price),
      image: formData.image,
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()),
      description: formData.description,
      inStock: formData.inStock,
    };

    if (editingProduct) {
      // Simulate API call for product update
      try {
        const res = await fetch(`${backendUrl}/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(newProduct),
        });
        if (!res.ok) {
          throw new Error('Failed to update product');
        }
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? updatedProduct : p));
        resetForm();
      } catch (error: any) {
        alert('Error updating product: ' + error.message);
      }
    } else {
      try {
        const res = await fetch(`${backendUrl}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(newProduct),
        });

        if (!res.ok) {
          throw new Error('Failed to create product');
        }

        const createdProduct = await res.json();
        setProducts(prev => [...prev, createdProduct]);
        resetForm();
      } catch (error: any) {
        alert('Error creating product: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      image: '',
      category: '',
      tags: '',
      description: '',
      inStock: true,
    });
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      image: product.image,
      category: product.category,
      tags: product.tags.join(', '),
      description: product.description,
      inStock: product.inStock,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // Delete product from backend
      fetch(`${backendUrl}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete product');
          setProducts(prev => prev.filter(p => p._id !== id));
        })
        .catch(error => {
          alert('Error deleting product: ' + error.message);
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your jewelry collection</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
            <p className="text-3xl font-bold text-gold-600">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">In Stock</h3>
            <p className="text-3xl font-bold text-green-600">
              {products.filter(p => p.inStock).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">
              {products.filter(p => !p.inStock).length}
            </p>
          </div>
        </div>

        {/* Add Product Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gold-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gold-600 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </button>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        name="price"
                        required
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      required
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        <option value="rings">Rings</option>
                        <option value="necklaces">Necklaces</option>
                        <option value="earrings">Earrings</option>
                        <option value="bracelets">Bracelets</option>
                        <option value="sets">Jewelry Sets</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="diamond, gold, bridal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="inStock"
                      checked={formData.inStock}
                      onChange={handleInputChange}
                      className="mr-2 text-gold-500 focus:ring-gold-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      In Stock
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? 'Update' : 'Save'} Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Section */}
        {isMainAdmin && (
          <div className="mb-8">
            <button
              onClick={() => setShowAdminManagement(!showAdminManagement)}
              className="mb-4 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              {showAdminManagement ? 'Hide Admin Management' : 'Manage Admins'}
              {pendingAdmins.length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  {pendingAdmins.length}
                </span>
              )}
            </button>

            {showAdminManagement && (
              <div className="space-y-6">
                {/* Pending Admins */}
                {pendingAdmins.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      Pending Admin Approvals
                      <span className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm">
                        {pendingAdmins.length}
                      </span>
                    </h3>
                    <div className="space-y-4">
                      {pendingAdmins.map((admin) => (
                        <div
                          key={admin._id}
                          className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{admin.name}</p>
                            <p className="text-sm text-gray-600">{admin.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Registered: {new Date(admin.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${backendUrl}/api/admin/approve/${admin._id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${auth.token}`,
                                    },
                                  });
                                  if (res.ok) {
                                    setPendingAdmins(prev => prev.filter(a => a._id !== admin._id));
                                    const updated = await res.json();
                                    setAllAdmins(prev => [...prev.filter(a => a._id !== admin._id), updated.admin]);
                                    alert(`${admin.name} has been approved`);
                                  } else {
                                    const error = await res.json();
                                    alert(error.message || 'Failed to approve admin');
                                  }
                                } catch (error: any) {
                                  alert('Error approving admin: ' + error.message);
                                }
                              }}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to reject ${admin.name}'s registration?`)) {
                                  try {
                                    const res = await fetch(`${backendUrl}/api/admin/reject/${admin._id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${auth.token}`,
                                      },
                                    });
                                    if (res.ok) {
                                      setPendingAdmins(prev => prev.filter(a => a._id !== admin._id));
                                      alert(`${admin.name}'s registration has been rejected`);
                                    } else {
                                      const error = await res.json();
                                      alert(error.message || 'Failed to reject admin');
                                    }
                                  } catch (error: any) {
                                    alert('Error rejecting admin: ' + error.message);
                                  }
                                }
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Admins List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">All Administrators</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allAdmins.map((admin) => (
                          <tr key={admin._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {admin.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {admin.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                admin.role === 'main'
                                  ? 'bg-purple-100 text-purple-800'
                                  : admin.role === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {admin.role === 'main' ? 'Main Admin' : admin.role === 'approved' ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.tags.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.inStock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gold-600 hover:text-gold-900 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;