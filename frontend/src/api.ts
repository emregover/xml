import { Category, Product, SubcategorySuggestion } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_URL}/api/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async createCategory(name: string, description?: string): Promise<Category> {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  async updateCategory(id: number, name?: string, description?: string): Promise<Category> {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },

  async createSubcategory(name: string, parent_id: number, description?: string): Promise<Category> {
    const response = await fetch(`${API_URL}/api/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_id, description }),
    });
    if (!response.ok) throw new Error('Failed to create subcategory');
    return response.json();
  },

  async updateSubcategory(id: number, name?: string, description?: string): Promise<Category> {
    const response = await fetch(`${API_URL}/api/subcategories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to update subcategory');
    return response.json();
  },

  async deleteSubcategory(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/subcategories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete subcategory');
  },

  async uploadFile(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload file');
    }
    return response.json();
  },

  async parseUrl(url: string): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('url', url);
    const response = await fetch(`${API_URL}/api/parse-url`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to parse URL');
    }
    return response.json();
  },

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async mapProduct(productId: number, subcategoryId: number): Promise<Product> {
    const response = await fetch(`${API_URL}/api/products/${productId}/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcategory_id: subcategoryId }),
    });
    if (!response.ok) throw new Error('Failed to map product');
    return response.json();
  },

  async getSuggestions(productId: number): Promise<SubcategorySuggestion[]> {
    const response = await fetch(`${API_URL}/api/products/${productId}/suggest`);
    if (!response.ok) throw new Error('Failed to get suggestions');
    return response.json();
  },
};
