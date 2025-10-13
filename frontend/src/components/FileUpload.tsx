import { useState } from 'react';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const result = await api.uploadFile(file);
      setSuccess(result.message);
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlParse = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const result = await api.parseUrl(url);
      setSuccess(result.message);
      setUrl('');
      onUploadSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upload Product Data</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select File (XML, Excel, or CSV)</Label>
              <Input
                type="file"
                accept=".xml,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loading}
              />
              {file && <p className="text-sm text-gray-500 mt-1">Selected: {file.name}</p>}
            </div>
            <Button onClick={handleFileUpload} disabled={!file || loading} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parse from URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>File URL</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/products.xml"
                disabled={loading}
              />
            </div>
            <Button onClick={handleUrlParse} disabled={!url || loading} className="w-full">
              <LinkIcon className="w-4 h-4 mr-2" />
              {loading ? 'Parsing...' : 'Parse URL'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
