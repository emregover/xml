import { useState, useEffect } from 'react';
import { Category, Subcategory } from '../types';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', parent_id: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryForm.name, categoryForm.description);
      } else {
        await api.createCategory(categoryForm.name, categoryForm.description);
      }
      await loadCategories();
      setIsDialogOpen(false);
      setCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
    } catch (err) {
      setError('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure? This will also delete all subcategories.')) return;
    try {
      await api.deleteCategory(id);
      await loadCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const handleSaveSubcategory = async () => {
    try {
      if (editingSubcategory) {
        await api.updateSubcategory(editingSubcategory.id, subcategoryForm.name, subcategoryForm.description);
      } else {
        await api.createSubcategory(subcategoryForm.name, subcategoryForm.parent_id, subcategoryForm.description);
      }
      await loadCategories();
      setIsSubcategoryDialogOpen(false);
      setSubcategoryForm({ name: '', description: '', parent_id: 0 });
      setEditingSubcategory(null);
    } catch (err) {
      setError('Failed to save subcategory');
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.deleteSubcategory(id);
      await loadCategories();
    } catch (err) {
      setError('Failed to delete subcategory');
    }
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const openSubcategoryDialog = (parentId: number, subcategory?: Subcategory) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryForm({ name: subcategory.name, description: subcategory.description || '', parent_id: parentId });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({ name: '', description: '', parent_id: parentId });
    }
    setSelectedParentId(parentId);
    setIsSubcategoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <Button onClick={() => openCategoryDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openCategoryDialog(category)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-sm">Subcategories</h4>
                  <Button variant="outline" size="sm" onClick={() => openSubcategoryDialog(category.id)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Subcategory
                  </Button>
                </div>
                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{sub.name}</span>
                        {sub.description && <span className="text-sm text-gray-500 ml-2">- {sub.description}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openSubcategoryDialog(category.id, sub)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSubcategory(sub.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {category.subcategories.length === 0 && (
                    <p className="text-sm text-gray-500">No subcategories yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                placeholder="Subcategory name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                placeholder="Subcategory description (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSubcategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubcategory}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
