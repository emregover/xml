import { useState } from 'react';
import { CategoryManager } from './components/CategoryManager';
import { FileUpload } from './components/FileUpload';
import { ProductMapper } from './components/ProductMapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Upload, MapPin } from 'lucide-react';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Product Category Mapper</h1>
          <p className="text-gray-600 mt-1">Upload product data and map to predefined categories</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Mapping</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="upload">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </TabsContent>

          <TabsContent value="mapping" key={refreshKey}>
            <ProductMapper />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Product Category Mapper - Intelligently map your products to predefined categories</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
