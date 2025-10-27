import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Upload, CheckCircle2, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { parseReceiptText, type ParsedReceipt } from '@/lib/receiptParser';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  id: string;
  timestamp: Date;
  store: string;
  itemsDetected: number;
  successRate: number;
  receiptImage: string;
  ocrText: string;
  parsedData: ParsedReceipt;
}

const SAMPLE_RECEIPTS = [
  {
    name: 'Walmart Receipt',
    store: 'Walmart',
    description: 'Standard grocery items with produce',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=600&fit=crop',
  },
  {
    name: 'Costco Receipt',
    store: 'Costco',
    description: 'Bulk items with larger prices',
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=600&fit=crop',
  },
  {
    name: 'Metro Receipt',
    store: 'Metro',
    description: 'French/English bilingual receipt',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=600&fit=crop',
  },
  {
    name: 'IGA Receipt',
    store: 'IGA',
    description: 'Local grocery store format',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=600&fit=crop',
  },
  {
    name: 'Whole Foods Receipt',
    store: 'Whole Foods',
    description: 'Organic items with detailed descriptions',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=600&fit=crop',
  },
];

export default function TestReceipt() {
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const { toast } = useToast();

  const testReceipt = async (imageUrl: string, storeName: string) => {
    setTesting(true);
    setOcrProgress(0);
    
    try {
      // Run OCR
      const result = await Tesseract.recognize(
        imageUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      const ocrText = result.data.text;
      
      // Parse the receipt
      const parsedData = parseReceiptText(ocrText);
      
      // Calculate metrics
      const itemsDetected = parsedData.items.length;
      const itemsWithPrices = parsedData.items.filter(item => item.price > 0).length;
      const itemsWithCategories = parsedData.items.filter(item => item.category !== 'Other').length;
      const highConfidence = parsedData.items.filter(item => item.confidence === 'high').length;
      
      const successRate = itemsDetected > 0 
        ? Math.round(((itemsWithPrices + itemsWithCategories + highConfidence) / (itemsDetected * 3)) * 100)
        : 0;

      const testResult: TestResult = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        store: storeName,
        itemsDetected,
        successRate,
        receiptImage: imageUrl,
        ocrText,
        parsedData,
      };

      setCurrentTest(testResult);
      setTestResults(prev => [testResult, ...prev]);
      
      toast({
        title: 'Test Complete',
        description: `Found ${itemsDetected} items with ${successRate}% success rate`,
      });
      
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: 'Could not process receipt image',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await testReceipt(imageUrl, 'Custom Upload');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receipt OCR Testing</h1>
            <p className="text-muted-foreground">Debug and improve parsing accuracy</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            🧪 Dev Tool
          </Badge>
        </div>

        <Tabs defaultValue="samples" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="samples">Sample Receipts</TabsTrigger>
            <TabsTrigger value="upload">Custom Upload</TabsTrigger>
            <TabsTrigger value="results">Results Log</TabsTrigger>
          </TabsList>

          {/* Sample Receipts Tab */}
          <TabsContent value="samples" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_RECEIPTS.map((receipt) => (
                <Card key={receipt.name} className="p-4">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={receipt.imageUrl} 
                      alt={receipt.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{receipt.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{receipt.description}</p>
                  <Button 
                    onClick={() => testReceipt(receipt.imageUrl, receipt.store)}
                    disabled={testing}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Test This Receipt
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Custom Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload Custom Receipt</h3>
                  <p className="text-sm text-muted-foreground">
                    Test with your own receipt images to debug parsing
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="custom-upload"
                />
                <label htmlFor="custom-upload">
                  <Button asChild size="lg" disabled={testing}>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Receipt Image
                    </span>
                  </Button>
                </label>
              </div>
            </Card>
          </TabsContent>

          {/* Results Log Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No tests run yet. Try testing a sample receipt!
                        </TableCell>
                      </TableRow>
                    ) : (
                      testResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            {result.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>{result.store}</TableCell>
                          <TableCell>{result.itemsDetected}</TableCell>
                          <TableCell>
                            <Badge variant={result.successRate >= 70 ? 'default' : 'secondary'}>
                              {result.successRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentTest(result)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Processing Indicator */}
        {testing && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <div>
                <p className="font-medium">Processing Receipt...</p>
                <p className="text-sm text-muted-foreground">OCR Progress: {ocrProgress}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Current Test Results */}
        {currentTest && !testing && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Test Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Receipt Image */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Original Receipt</h3>
                <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={currentTest.receiptImage}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                </div>
              </Card>

              {/* Metrics */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Accuracy Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Items Detected</span>
                      <Badge variant="outline">{currentTest.itemsDetected}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Items with Prices</span>
                      <Badge variant="outline">
                        {currentTest.parsedData.items.filter(i => i.price > 0).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Items Categorized</span>
                      <Badge variant="outline">
                        {currentTest.parsedData.items.filter(i => i.category !== 'Other').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Confidence</span>
                      <Badge variant="outline">
                        {currentTest.parsedData.items.filter(i => i.confidence === 'high').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-semibold">Success Rate</span>
                      <Badge variant={currentTest.successRate >= 70 ? 'default' : 'secondary'}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {currentTest.successRate}%
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Detected Store</h3>
                  <div className="text-2xl font-bold">{currentTest.parsedData.store}</div>
                  <p className="text-sm text-muted-foreground">{currentTest.parsedData.date}</p>
                </Card>
              </div>
            </div>

            {/* OCR Text Output */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Raw OCR Output</h3>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {currentTest.ocrText}
                </pre>
              </ScrollArea>
            </Card>

            {/* Parsed Items */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Parsed Items ({currentTest.parsedData.items.length})</h3>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {currentTest.parsedData.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.confidence === 'high' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {item.confidence === 'low' && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        {item.rawName && item.rawName !== item.name && (
                          <p className="text-xs text-muted-foreground">Raw: {item.rawName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{item.category}</Badge>
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                        <Badge variant={
                          item.confidence === 'high' ? 'default' : 
                          item.confidence === 'medium' ? 'secondary' : 
                          'destructive'
                        }>
                          {item.confidence}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
