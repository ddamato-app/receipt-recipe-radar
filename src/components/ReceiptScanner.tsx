import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, Upload, X, AlertCircle, CheckCircle2, Trash2, Mail, ShieldCheck, ShieldAlert, AlertTriangle, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseReceiptText, type ParsedReceiptItem, type ParsedReceipt } from '@/lib/receiptParser';
import { validateReceiptText } from '@/lib/receiptValidation';
import { preprocessReceiptImage } from '@/lib/imagePreprocessor';
import Tesseract, { createWorker } from 'tesseract.js';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReceiptScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ScanStep = 'upload' | 'processing' | 'review' | 'error' | 'warning';

export function ReceiptScanner({ open, onOpenChange, onSuccess }: ReceiptScannerProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [editedItems, setEditedItems] = useState<ParsedReceiptItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorSuggestion, setErrorSuggestion] = useState('');
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [ocrDebugText, setOcrDebugText] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [testParseMode, setTestParseMode] = useState(false);
  const [manualOcrText, setManualOcrText] = useState('');
  const [manualTestResults, setManualTestResults] = useState<{ name: string; price: number }[]>([]);
  const { toast } = useToast();

  // Manual extraction test function
  const manualExtractTest = (text: string) => {
    console.log('=== MANUAL EXTRACTION TEST ===');
    console.log('Input text length:', text.length);
    
    const lines = text.split(/\r?\n/);
    const items: { name: string; price: number }[] = [];
    
    for (let line of lines) {
      // Skip obviously bad lines
      if (line.length < 5) continue;
      if (/TOTAL|TAXE|TAX|MEMBER|APPROVED|WAREHOUSE|THANK|MASTER|NOMBRE/i.test(line)) continue;
      
      // Look for price at end of line (handle comma or dot)
      const priceMatch = line.match(/(\d+)[,\.](\d{2})\s*-?(?:FP)?\s*$/i);
      if (!priceMatch) continue;
      
      const price = parseFloat(priceMatch[1] + '.' + priceMatch[2]);
      
      // Everything before the price is the item name
      let name = line.substring(0, line.lastIndexOf(priceMatch[0])).trim();
      
      // Clean up
      name = name.replace(/^\d+\s*/, ''); // Remove leading numbers
      name = name.replace(/^\d{7}[A-Z]*\s*/, ''); // Remove Costco item codes
      name = name.substring(0, 50); // Limit length
      
      if (name.length >= 3) {
        items.push({ name, price });
        console.log('Extracted:', { name, price });
      }
    }
    
    console.log('Total items extracted:', items.length);
    return items;
  };

  const handleManualExtract = () => {
    const results = manualExtractTest(manualOcrText);
    setManualTestResults(results);
  };

  const handleImageSelect = async (file: File) => {
    console.log('Image selected:', file.name, file.size);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file');
      setStep('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image too large. Please select an image under 10MB');
      setStep('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setStep('processing');
      setProcessProgress(0);

      try {
        console.log('=== PREPROCESSING IMAGE ===');
        setProcessProgress(10);
        
        // Preprocess image for better OCR
        const preprocessed = await preprocessReceiptImage(file);
        console.log('Image preprocessed:', preprocessed.adjustments.join(', '));
        setProcessProgress(20);
        
        console.log('=== STARTING OCR ===');
        
        // Create worker with enhanced configuration
        const worker = await createWorker('fra+eng', 1, {
          logger: (m) => {
            console.log('Tesseract:', m);
            if (m.status === 'recognizing text') {
              setProcessProgress(20 + Math.round(m.progress * 60));
            }
          },
        });

        // Configure Tesseract for receipt recognition
        // PSM 6 = Assume a single uniform block of text
        // OEM 1 = Neural nets LSTM engine only
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        });

        // Perform OCR on preprocessed image
        const { data } = await worker.recognize(preprocessed.dataUrl);
        await worker.terminate();

        const ocrText = data.text;
        console.log('OCR complete. Text length:', ocrText.length);
        console.log('First 300 chars:', ocrText.substring(0, 300));
        setProcessProgress(85);

        // Store for debug
        setOcrDebugText(ocrText);
        setManualOcrText(ocrText);

        // Validate OCR output
        const validation = validateReceiptText(ocrText);
        if (!validation.isValid) {
          console.error('OCR validation failed:', validation.issues);
          setErrorMessage(
            `Receipt scan quality is poor:\n${validation.issues.join('\n')}\n\nPlease try:\n- Better lighting\n- Flattening the receipt\n- Taking a clearer photo`
          );
          setStep('error');
          return;
        }
        
        // If test parse mode is enabled, stop here
        if (testParseMode) {
          setStep('review');
          return;
        }

        // Parse the receipt
        console.log('=== PARSING RECEIPT ===');
        const parsed = parseReceiptText(ocrText);
        setProcessProgress(95);
        
        if (!parsed.items || parsed.items.length === 0) {
          setErrorMessage('No items found on receipt. Please ensure the receipt is clearly visible and try again.');
          setStep('error');
          return;
        }

        setParsedReceipt(parsed);
        setEditedItems(parsed.items);
        setProcessProgress(100);
        setStep('review');
        
        const reviewCount = parsed.items.filter(i => i.needsReview).length;
        
        toast({
          title: 'Receipt scanned successfully!',
          description: `Found ${parsed.items.length} items${reviewCount > 0 ? ` (${reviewCount} need review)` : ''}`,
        });

      } catch (err) {
        console.error('OCR Error:', err);
        setErrorMessage('Failed to scan receipt. Please try again with a clearer image.');
        setStep('error');
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedImage(null);
    setProcessProgress(0);
    setParsedReceipt(null);
    setEditedItems([]);
    setErrorMessage('');
    setErrorSuggestion('');
    setWarningMessages([]);
    setOcrDebugText('');
    setShowDebug(false);
    setManualOcrText('');
    setManualTestResults([]);
  };

  const handleToggleItem = (itemId: string) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateItem = (itemId: string, field: keyof ParsedReceiptItem, value: any) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(items => items.filter(item => item.id !== itemId));
  };

  const handleAddToFridge = async () => {
    const selectedItems = editedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to add items',
          variant: 'destructive',
        });
        return;
      }

      const itemsToInsert = selectedItems.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: 'pcs',
        category: item.category,
        price: item.price,
        expiry_date: format(addDays(new Date(), item.expiryDays), 'yyyy-MM-dd'),
        status: 'active',
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `${selectedItems.length} items added to your fridge`,
      });

      onOpenChange(false);
      handleReset();
      onSuccess?.();
      
    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: 'Error',
        description: 'Failed to add items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = editedItems.filter(item => item.selected).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Scan Receipt</span>
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={testParseMode}
                onCheckedChange={setTestParseMode}
                id="test-mode"
              />
              <Label htmlFor="test-mode" className="text-sm text-muted-foreground cursor-pointer">
                Test Mode
              </Label>
            </div>
          </DialogTitle>
          <DialogDescription>
            {testParseMode 
              ? 'Test mode: Manually edit OCR text and test extraction'
              : 'Upload a photo of your grocery receipt to automatically add items'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Camera className="w-4 h-4 mr-2" />
                Upload Photo
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Forward Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  📸 Tap to take photo or upload receipt
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  We'll extract items, prices, and dates automatically
                </p>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/heic"
                  capture="environment"
                  onChange={handleFileInput}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload">
                  <Button asChild size="lg">
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Max file size: 10MB • Formats: JPG, PNG, HEIC
                </p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 py-4">
              <Card className="p-6">
                <div className="text-center space-y-4">
                  <Mail className="w-16 h-16 mx-auto text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Forward Receipt Emails</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send your receipt emails to:
                    </p>
                    <div className="bg-muted p-3 rounded-lg mb-4">
                      <code className="text-sm font-mono">receipts@freshtrack.app</code>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
                    <p className="text-sm font-medium">How it works:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Forward your receipt email to the address above</li>
                      <li>We'll process it and extract the items</li>
                      <li>Usually takes 1-2 minutes</li>
                      <li>Items appear in your fridge automatically</li>
                    </ol>
                  </div>

                  <div className="pt-4">
                    <Badge variant="outline" className="text-sm">
                      No pending receipts
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="space-y-4 py-8">
            {selectedImage && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img 
                  src={selectedImage} 
                  alt="Receipt" 
                  className="w-full max-h-48 object-contain bg-muted"
                />
              </div>
            )}
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-lg font-medium">Reading your receipt... 📄</p>
                <p className="text-sm text-muted-foreground">This may take 30-60 seconds</p>
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{processProgress}% complete</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Manual Test Mode */}
            {testParseMode && (
              <Card className="p-4 border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Manual Parse Test
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Raw OCR Text (editable):</Label>
                    <Textarea
                      value={manualOcrText}
                      onChange={(e) => setManualOcrText(e.target.value)}
                      className="font-mono text-xs h-48"
                      placeholder="Paste or edit OCR text here..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleManualExtract}
                    className="w-full"
                    variant="default"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Extract Items (Simple Test)
                  </Button>
                  
                  {manualTestResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        Found {manualTestResults.length} items:
                      </p>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {manualTestResults.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-2 bg-purple-100 dark:bg-purple-900 rounded text-sm"
                          >
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="secondary">${item.price.toFixed(2)}</Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Check browser console for extraction logs
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* OCR Debug Panel */}
            {ocrDebugText && !testParseMode && (
              <Card className="p-4 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="w-full justify-between"
                  >
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      🔍 OCR Debug Info
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {showDebug ? 'Hide' : 'Show'}
                    </span>
                  </Button>
                  
                  {showDebug && (
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Text Length:</span> {ocrDebugText.length}
                        </div>
                        <div>
                          <span className="font-medium">Lines:</span> {ocrDebugText.split('\n').length}
                        </div>
                        <div>
                          <span className="font-medium">Prices Found:</span> {[...ocrDebugText.matchAll(/\d+[,\.]\d{2}/g)].length}
                        </div>
                        <div>
                          <span className="font-medium">Item Codes:</span> {[...ocrDebugText.matchAll(/\d{7}/g)].length}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="font-medium">Raw OCR Text (first 500 chars):</span>
                        <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                          {ocrDebugText.substring(0, 500)}
                          {ocrDebugText.length > 500 && '...'}
                        </div>
                      </div>
                      
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Check browser console for full debug logs
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* Warnings Banner */}
            {warningMessages.length > 0 && !testParseMode && (
              <Card className="p-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Possible Issues Detected
                    </p>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      {warningMessages.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      Review items below and make corrections as needed
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Only show receipt details and items if NOT in test mode */}
            {!testParseMode && parsedReceipt && (
              <>
            {/* Total Validation Warning */}
            {parsedReceipt && !parsedReceipt.totalValidated && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Total mismatch detected:</strong> Receipt shows ${parsedReceipt.total.toFixed(2)}, 
                  but calculated ${editedItems.filter(i => i.itemType === 'product').reduce((sum, i) => sum + i.price, 0).toFixed(2)}
                  {parsedReceipt.totalMismatch && ` (difference: $${parsedReceipt.totalMismatch.toFixed(2)})`}.
                  Please verify item prices below.
                </AlertDescription>
              </Alert>
            )}
            
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{parsedReceipt.store}</p>
                  <p className="text-sm text-muted-foreground">{parsedReceipt.date}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-lg mb-1">
                    {editedItems.length} items
                  </Badge>
                  <p className="text-xs text-muted-foreground">Total: ${parsedReceipt.total.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {editedItems.map((item) => (
                <Card key={item.id} className={cn(
                  "p-4 border-2",
                  item.needsReview ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                  item.confidence === 'low' ? 'border-destructive/50' : 
                  item.confidence === 'medium' ? 'border-warning/50' : ''
                )}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="flex-1 min-w-[180px]"
                            />
                            {item.quantity > 1 && (
                              <Badge variant="secondary" className="shrink-0">
                                {item.quantity}x
                              </Badge>
                            )}
                            {item.needsReview && (
                              <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400 shrink-0">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Review
                              </Badge>
                            )}
                            {item.itemType !== 'product' && (
                              <Badge variant="secondary" className="shrink-0">
                                {item.itemType}
                              </Badge>
                            )}
                            {item.confidence === 'high' && (
                              <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                High
                              </Badge>
                            )}
                            {item.confidence === 'medium' && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600 shrink-0">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Medium
                              </Badge>
                            )}
                            {item.confidence === 'low' && (
                              <Badge variant="outline" className="text-destructive border-destructive shrink-0">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Low
                              </Badge>
                            )}
                          </div>
                          {item.needsReview && item.reviewReason && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              ⚠️ {item.reviewReason}
                            </p>
                          )}
                          {item.rawName && item.rawName !== item.name && (
                            <p className="text-xs text-muted-foreground">
                              Original: {item.rawName}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Price</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Category</label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => handleUpdateItem(item.id, 'category', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dairy">Dairy</SelectItem>
                              <SelectItem value="Meat">Meat</SelectItem>
                              <SelectItem value="Fruits">Fruits</SelectItem>
                              <SelectItem value="Vegetables">Vegetables</SelectItem>
                              <SelectItem value="Bakery">Bakery</SelectItem>
                              <SelectItem value="Beverages">Beverages</SelectItem>
                              <SelectItem value="Snacks">Snacks</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Expires</label>
                          <Select
                            value={item.expiryDays.toString()}
                            onValueChange={(value) => handleUpdateItem(item.id, 'expiryDays', parseInt(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="5">5 days</SelectItem>
                              <SelectItem value="7">1 week</SelectItem>
                              <SelectItem value="14">2 weeks</SelectItem>
                              <SelectItem value="30">1 month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button 
                onClick={handleAddToFridge} 
                disabled={isAdding || selectedCount === 0}
                className="flex-1"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Add {selectedCount} Items
                  </>
                )}
              </Button>
            </div>
              </>
            )}
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="space-y-4 py-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
              <div>
                <p className="text-xl font-semibold mb-2">😔 {errorMessage}</p>
                {errorSuggestion && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    {errorSuggestion}
                  </p>
                )}
              </div>
              
              <Card className="bg-muted/50 p-6 text-left max-w-md mx-auto">
                <p className="text-sm font-semibold mb-3">Tips for better results:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Take photo in good lighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Ensure receipt is flat and in focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Make sure all text is visible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Avoid shadows and glare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Hold camera steady to avoid blur</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1" size="lg">
                <Camera className="w-4 h-4 mr-2" />
                Try Another Photo
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  onOpenChange(false);
                  handleReset();
                }} 
                className="flex-1"
                size="lg"
              >
                Add Items Manually Instead
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
