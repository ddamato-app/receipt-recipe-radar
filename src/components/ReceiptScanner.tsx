import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Camera, Upload, X, AlertCircle, CheckCircle2, Trash2, Mail, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseReceiptText, type ParsedReceiptItem, type ParsedReceipt } from '@/lib/receiptParser';
import { validateReceiptText } from '@/lib/receiptValidation';
import Tesseract from 'tesseract.js';
import { addDays, format } from 'date-fns';

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
  const { toast } = useToast();

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setStep('processing');
      
      try {
        // Step 1: Initial OCR with English to get text for validation
        const initialResult = await Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProcessProgress(Math.round(m.progress * 50)); // First half
              }
            },
          }
        );

        let ocrText = initialResult.data.text;
        
        if (!ocrText || ocrText.trim().length < 10) {
          throw new Error('Could not extract text from image');
        }
        
        // Step 2: Validate text and detect language/store
        const validation = validateReceiptText(ocrText);
        const isCostco = ocrText.toLowerCase().includes('costco');
        const detectedLanguage = validation.detectedLanguage || 'eng';
        
        // Step 3: Re-run OCR with proper language if needed
        if (detectedLanguage === 'fra' || isCostco) {
          const finalResult = await Tesseract.recognize(
            imageUrl,
            'fra+eng', // Bilingual for Quebec/Costco
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  setProcessProgress(50 + Math.round(m.progress * 50)); // Second half
                }
              },
            }
          );
          ocrText = finalResult.data.text;
        } else {
          setProcessProgress(100); // Skip second pass
        }
        
        // Handle validation errors
        if (!validation.isValid) {
          const errorIssue = validation.issues.find(issue => issue.type === 'error');
          if (errorIssue) {
            setErrorMessage(errorIssue.message);
            setErrorSuggestion(errorIssue.suggestion);
            setStep('error');
            return;
          }
        }
        
        // Handle warnings but continue processing
        const warnings = validation.issues
          .filter(issue => issue.type === 'warning')
          .map(issue => issue.message);
        
        if (warnings.length > 0) {
          setWarningMessages(warnings);
        }

        // Parse the OCR text
        const parsed = parseReceiptText(ocrText);
        
        if (parsed.items.length === 0) {
          setErrorMessage('We couldn\'t find any items in this receipt');
          setErrorSuggestion('This might not be a grocery receipt. Supported: Grocery stores and supermarkets. Not supported: Restaurants, gas stations.');
          setStep('error');
          return;
        }

        setParsedReceipt(parsed);
        setEditedItems(parsed.items);
        setStep('review');
        
      } catch (error) {
        console.error('OCR Error:', error);
        setErrorMessage('We couldn\'t read your receipt clearly');
        setErrorSuggestion('Please try again with better lighting, flatter receipt, and ensure all text is visible and in focus.');
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
          <DialogTitle>Scan Receipt</DialogTitle>
          <DialogDescription>
            Upload a photo of your grocery receipt to automatically add items
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
        {step === 'review' && parsedReceipt && (
          <div className="space-y-4">
            {/* Warnings Banner */}
            {warningMessages.length > 0 && (
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
            
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{parsedReceipt.store}</p>
                  <p className="text-sm text-muted-foreground">{parsedReceipt.date}</p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {editedItems.length} items
                </Badge>
              </div>
            </Card>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {editedItems.map((item) => (
                <Card key={item.id} className={`p-4 ${
                  item.confidence === 'low' ? 'border-destructive/50' : 
                  item.confidence === 'medium' ? 'border-warning/50' : ''
                }`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="flex-1"
                            />
                            {item.quantity > 1 && (
                              <Badge variant="secondary" className="shrink-0">
                                {item.quantity}x
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
