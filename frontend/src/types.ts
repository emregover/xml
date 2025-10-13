export interface Subcategory {
  id: number;
  name: string;
  parent_id: number;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  subcategories: Subcategory[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  raw_data: Record<string, unknown>;
  mapped_subcategory_id?: number;
}

export interface SubcategorySuggestion {
  subcategory_id: number;
  subcategory_name: string;
  category_name: string;
  confidence: number;
  reason: string;
}
