import { useState, useEffect } from 'react';
import { Product, Category, SubcategorySuggestion } from '../types';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lightbulb, Check, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProductMapper() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<SubcategorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError('');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMapProduct = async (productId: number, subcategoryId: number) => {
    try {
      await api.mapProduct(productId, subcategoryId);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to map product');
    }
  };

  const handleShowSuggestions = async (product: Product) => {
    try {
      setSelectedProduct(product);
      const suggestionsData = await api.getSuggestions(product.id);
      setSuggestions(suggestionsData);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to get suggestions');
    }
  };

  const handleSelectSuggestion = async (subcategoryId: number) => {
    if (!selectedProduct) return;
    await handleMapProduct(selectedProduct.id, subcategoryId);
    setShowSuggestions(false);
    setSelectedProduct(null);
  };

  const getSubcategoryName = (subcategoryId: number) => {
    for (const category of categories) {
      const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
      if (subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    return 'Unknown';
  };

  const unmappedProducts = products.filter((p) => !p.mapped_subcategory_id);
  const mappedProducts = products.filter((p) => p.mapped_subcategory_id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Mapping</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">Total: {products.length}</span>
          <span className="text-green-600">Mapped: {mappedProducts.length}</span>
          <span className="text-orange-600">Unmapped: {unmappedProducts.length}</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No products loaded. Please upload a file first.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {unmappedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-600">Unmapped Products</h3>
              <div className="grid gap-4">
                {unmappedProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {product.price && (
                              <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
                            )}
                            {product.category && <Badge variant="outline">{product.category}</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-64">
                          <Select onValueChange={(value) => handleMapProduct(product.id, parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) =>
                                category.subcategories.map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id.toString()}>
                                    {category.name} &gt; {sub.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowSuggestions(product)}
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Get Suggestions
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {mappedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">Mapped Products</h3>
              <div className="grid gap-4">
                {mappedProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {product.price && (
                              <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
                            )}
                            {product.category && <Badge variant="outline">{product.category}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">
                            {getSubcategoryName(product.mapped_subcategory_id!)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggested Subcategories</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-gray-500">No suggestions available</p>
            ) : (
              suggestions.map((suggestion) => (
                <Card
                  key={suggestion.subcategory_id}
                  className="cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => handleSelectSuggestion(suggestion.subcategory_id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {suggestion.category_name} &gt; {suggestion.subcategory_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                      </div>
                      <Badge
                        variant={suggestion.confidence > 0.7 ? 'default' : suggestion.confidence > 0.4 ? 'secondary' : 'outline'}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
