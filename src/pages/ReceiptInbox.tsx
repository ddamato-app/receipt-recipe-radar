import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Copy, Mail, CheckCircle2, Clock, XCircle, Search, Upload } from 'lucide-react';
import { getStoredReceipts, addReceipt, generateMockReceipt, Receipt } from '@/lib/receiptData';
import { ReceiptReviewModal } from '@/components/ReceiptReviewModal';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export default function ReceiptInbox() {
  const { user, tier } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = () => {
    setReceipts(getStoredReceipts());
  };

  const forwardingEmail = user?.id 
    ? `receipts+${user.id.slice(0, 8)}@freshtrack.app`
    : 'receipts@freshtrack.app';

  const copyEmail = () => {
    navigator.clipboard.writeText(forwardingEmail);
    toast({
      title: 'Email Copied!',
      description: 'Forwarding email copied to clipboard',
    });
  };

  const handleTestUpload = async () => {
    if (tier === 'anonymous') {
      toast({
        title: 'Account Required',
        description: 'Create a free account to process receipts',
        variant: 'destructive',
      });
      return;
    }

    // Check free tier limits
    const thisMonth = receipts.filter(r => {
      const receiptMonth = new Date(r.date).getMonth();
      const currentMonth = new Date().getMonth();
      return receiptMonth === currentMonth;
    }).length;

    if (tier === 'free' && thisMonth >= 5) {
      setShowUpgradePrompt(true);
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const mockReceipt = generateMockReceipt();
      addReceipt(mockReceipt);
      loadReceipts();
      setIsProcessing(false);
      
      toast({
        title: '✅ Receipt Processed!',
        description: `${mockReceipt.items.length} items detected from ${mockReceipt.storeName}`,
      });
    }, 2500);
  };

  const handleReviewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowReviewModal(true);
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Processing</Badge>;
      case 'ready':
        return <Badge className="gap-1 bg-primary"><Search className="w-3 h-3" />Ready to Review</Badge>;
      case 'added':
        return <Badge className="gap-1 bg-success"><CheckCircle2 className="w-3 h-3" />Added</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
    }
  };

  const pendingCount = receipts.filter(r => r.status === 'ready').length;
  const thisMonthCount = receipts.filter(r => {
    const receiptMonth = new Date(r.date).getMonth();
    const currentMonth = new Date().getMonth();
    return receiptMonth === currentMonth;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">📧 Receipt Inbox</h1>
        <p className="text-muted-foreground">Forward your grocery receipts to automatically add items</p>
      </div>

      {/* Tier Limit Display */}
      {tier === 'free' && (
        <Card className="p-4 bg-muted/30">
          <p className="text-sm">
            <strong>Receipts this month:</strong> {thisMonthCount}/5
            {thisMonthCount >= 5 && (
              <span className="text-destructive ml-2">Limit reached</span>
            )}
          </p>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
              <div>
                <h3 className="font-semibold">Get your digital receipt</h3>
                <p className="text-sm text-muted-foreground">
                  Most stores email receipts automatically after shopping
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
              <div>
                <h3 className="font-semibold">Forward the email</h3>
                <p className="text-sm text-muted-foreground">
                  Forward to your unique receipt email address
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
              <div>
                <h3 className="font-semibold">We'll extract your items</h3>
                <p className="text-sm text-muted-foreground">
                  Usually takes 1-2 minutes to process
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
              <div>
                <h3 className="font-semibold">Items added automatically</h3>
                <p className="text-sm text-muted-foreground">
                  Review and approve items to add to your fridge
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Forwarding Email */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <h2 className="text-lg font-bold mb-3">Your Unique Forwarding Address</h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <code className="text-sm font-mono">{forwardingEmail}</code>
            </div>
          </div>
          <Button onClick={copyEmail} variant="outline" size="icon">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          💡 Tip: Add this to your contacts for easy forwarding
        </p>
      </Card>

      {/* Test Upload Button (Dev Mode) */}
      <Card className="p-4 border-2 border-dashed">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">🧪 Test Receipt Upload</h3>
            <p className="text-sm text-muted-foreground">
              Simulate receipt processing (dev/demo mode)
            </p>
          </div>
          <Button onClick={handleTestUpload} disabled={isProcessing}>
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Upload Test Receipt'}
          </Button>
        </div>
      </Card>

      {/* Supported Stores */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Supported Stores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Walmart', 'Costco', 'Metro', 'IGA', 'Loblaws', 'Whole Foods', 'Sobeys', 'Food Basics'].map(store => (
            <div key={store} className="flex items-center gap-2 p-2 rounded bg-muted/30">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">{store}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">+ More stores added regularly</p>
      </Card>

      {/* Receipt List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Your Receipts
            {pendingCount > 0 && (
              <Badge className="ml-2">{pendingCount} pending</Badge>
            )}
          </h2>
        </div>

        {receipts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-bold mb-2">No receipts yet</h3>
            <p className="text-muted-foreground mb-6">
              Forward your first grocery receipt to get started!
            </p>
            <div className="max-w-md mx-auto p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Your forwarding email:</p>
              <code className="text-sm">{forwardingEmail}</code>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {receipts.map(receipt => (
              <Card key={receipt.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{receipt.storeName}</h3>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{receipt.date.toLocaleDateString()}</span>
                      <span>{receipt.items.length} items detected</span>
                      <span className="font-semibold">${receipt.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  {receipt.status === 'ready' && (
                    <Button onClick={() => handleReviewReceipt(receipt)}>
                      Review Items
                    </Button>
                  )}
                  {receipt.status === 'added' && (
                    <p className="text-sm text-success">
                      ✅ Added {receipt.processedAt?.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ReceiptReviewModal
        receipt={selectedReceipt}
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        onItemsAdded={loadReceipts}
      />

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        type="pro-feature"
        featureName="Unlimited receipt forwarding"
      />
    </div>
  );
}
