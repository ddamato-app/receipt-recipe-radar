import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, UserPlus, Settings2, DollarSign, Flag, Mail, Users } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  role: "Super Admin" | "Admin" | "Viewer";
  lastLogin: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export default function AdminSettings() {
  // App Configuration
  const [appConfig, setAppConfig] = useState({
    appName: "FreshTrack",
    supportEmail: "support@freshtrack.com",
    maxFreeItems: 15,
    maxFreeRecipes: 3,
  });

  // Pricing
  const [pricing, setPricing] = useState({
    proMonthly: 4.99,
    proAnnual: 39.99,
    trialDays: 7,
  });

  // Feature Flags
  const [features, setFeatures] = useState({
    receiptScanning: true,
    shoppingMode: true,
    healthScore: true,
    familySharing: false,
    maintenanceMode: false,
  });

  // Email Templates
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");
  const [emailTemplates, setEmailTemplates] = useState<Record<string, EmailTemplate>>({
    welcome: {
      id: "welcome",
      name: "Welcome Email",
      subject: "Welcome to FreshTrack!",
      body: "Hi there!\n\nWelcome to FreshTrack. We're excited to help you manage your fridge inventory and reduce food waste.\n\nGet started by adding your first items!\n\nBest regards,\nThe FreshTrack Team",
    },
    receipt: {
      id: "receipt",
      name: "Receipt Processed",
      subject: "Your receipt has been processed",
      body: "Hi!\n\nYour receipt from {store_name} has been successfully processed and {item_count} items have been added to your fridge.\n\nView your items in the app now!\n\nBest regards,\nThe FreshTrack Team",
    },
    expiring: {
      id: "expiring",
      name: "Item Expiring Soon",
      subject: "Items expiring soon in your fridge",
      body: "Hi!\n\nYou have {count} items expiring in the next 3 days:\n\n{item_list}\n\nCheck your fridge to use them before they go to waste!\n\nBest regards,\nThe FreshTrack Team",
    },
    summary: {
      id: "summary",
      name: "Weekly Summary",
      subject: "Your weekly FreshTrack summary",
      body: "Hi!\n\nHere's your weekly summary:\n\n- Items added: {items_added}\n- Items used: {items_used}\n- Money saved: ${money_saved}\n\nKeep up the great work!\n\nBest regards,\nThe FreshTrack Team",
    },
  });

  const [currentTemplate, setCurrentTemplate] = useState(emailTemplates[selectedTemplate]);

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    {
      id: "1",
      email: "d.damato@gmail.com",
      role: "Super Admin",
      lastLogin: new Date().toISOString(),
    },
    {
      id: "2",
      email: "admin@freshtrack.com",
      role: "Admin",
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", role: "Admin" as AdminUser["role"] });

  const handleSaveAppConfig = () => {
    // In production, save to database
    toast.success("App configuration saved successfully");
  };

  const handleUpdatePricing = () => {
    // In production, save to database
    toast.success("Pricing updated successfully");
  };

  const handleFeatureToggle = (feature: keyof typeof features) => {
    setFeatures({ ...features, [feature]: !features[feature] });
    toast.success(`${feature.replace(/([A-Z])/g, ' $1').trim()} ${!features[feature] ? 'enabled' : 'disabled'}`);
  };

  const handleSaveTemplate = () => {
    setEmailTemplates({
      ...emailTemplates,
      [selectedTemplate]: currentTemplate,
    });
    toast.success("Email template saved successfully");
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCurrentTemplate(emailTemplates[templateId]);
  };

  const handleAddAdmin = () => {
    if (!newAdmin.email) {
      toast.error("Please enter an email address");
      return;
    }

    const admin: AdminUser = {
      id: `admin-${Date.now()}`,
      email: newAdmin.email,
      role: newAdmin.role,
      lastLogin: new Date().toISOString(),
    };

    setAdminUsers([...adminUsers, admin]);
    setNewAdmin({ email: "", role: "Admin" });
    setShowAddAdmin(false);
    toast.success("Admin user added successfully");
  };

  const handleRemoveAdmin = (userId: string) => {
    setAdminUsers(adminUsers.filter(u => u.id !== userId));
    toast.success("Admin user removed");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Super Admin": return "default";
      case "Admin": return "secondary";
      case "Viewer": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Section 1: App Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle>App Configuration</CardTitle>
          </div>
          <CardDescription>Manage core application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={appConfig.appName}
                onChange={(e) => setAppConfig({ ...appConfig, appName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={appConfig.supportEmail}
                onChange={(e) => setAppConfig({ ...appConfig, supportEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxFreeItems">Max Free Items</Label>
              <Input
                id="maxFreeItems"
                type="number"
                value={appConfig.maxFreeItems}
                onChange={(e) => setAppConfig({ ...appConfig, maxFreeItems: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxFreeRecipes">Max Free Recipes/Day</Label>
              <Input
                id="maxFreeRecipes"
                type="number"
                value={appConfig.maxFreeRecipes}
                onChange={(e) => setAppConfig({ ...appConfig, maxFreeRecipes: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleSaveAppConfig}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Section 2: Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle>Pricing</CardTitle>
          </div>
          <CardDescription>Configure subscription pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proMonthly">Pro Monthly Price ($)</Label>
              <Input
                id="proMonthly"
                type="number"
                step="0.01"
                value={pricing.proMonthly}
                onChange={(e) => setPricing({ ...pricing, proMonthly: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proAnnual">Pro Annual Price ($)</Label>
              <Input
                id="proAnnual"
                type="number"
                step="0.01"
                value={pricing.proAnnual}
                onChange={(e) => setPricing({ ...pricing, proAnnual: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays">Free Trial Days</Label>
              <Input
                id="trialDays"
                type="number"
                value={pricing.trialDays}
                onChange={(e) => setPricing({ ...pricing, trialDays: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleUpdatePricing}>Update Pricing</Button>
        </CardContent>
      </Card>

      {/* Section 3: Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
          <CardDescription>Enable or disable features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="receiptScanning">Enable Receipt Scanning</Label>
                <p className="text-sm text-muted-foreground">Allow users to scan receipts</p>
              </div>
              <Switch
                id="receiptScanning"
                checked={features.receiptScanning}
                onCheckedChange={() => handleFeatureToggle("receiptScanning")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shoppingMode">Enable Shopping Mode</Label>
                <p className="text-sm text-muted-foreground">Shopping assistant feature</p>
              </div>
              <Switch
                id="shoppingMode"
                checked={features.shoppingMode}
                onCheckedChange={() => handleFeatureToggle("shoppingMode")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="healthScore">Enable Health Score</Label>
                <p className="text-sm text-muted-foreground">Show nutritional health scores</p>
              </div>
              <Switch
                id="healthScore"
                checked={features.healthScore}
                onCheckedChange={() => handleFeatureToggle("healthScore")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="familySharing">Enable Family Sharing</Label>
                <p className="text-sm text-muted-foreground">Allow families to share inventories</p>
              </div>
              <Switch
                id="familySharing"
                checked={features.familySharing}
                onCheckedChange={() => handleFeatureToggle("familySharing")}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-orange-600">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable access for non-admin users</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={features.maintenanceMode}
                onCheckedChange={() => handleFeatureToggle("maintenanceMode")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <CardTitle>Email Templates</CardTitle>
          </div>
          <CardDescription>Customize automated email templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateSelect">Select Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger id="templateSelect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="receipt">Receipt Processed</SelectItem>
                <SelectItem value="expiring">Item Expiring Soon</SelectItem>
                <SelectItem value="summary">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateSubject">Subject Line</Label>
            <Input
              id="templateSubject"
              value={currentTemplate.subject}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateBody">Email Body</Label>
            <Textarea
              id="templateBody"
              rows={10}
              value={currentTemplate.body}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
              placeholder="Use {variable_name} for dynamic content"
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {"{store_name}"}, {"{item_count}"}, {"{count}"}, {"{item_list}"}, {"{items_added}"}, {"{items_used}"}, {"{money_saved}"}
            </p>
          </div>

          <Button onClick={handleSaveTemplate}>Save Template</Button>
        </CardContent>
      </Card>

      {/* Section 5: Admin Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Manage admin access</CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowAddAdmin(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(admin.role)}>
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(admin.lastLogin).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id)}
                      disabled={admin.role === "Super Admin"}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Admin User Modal */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Grant admin access to a new user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminRole">Role</Label>
              <Select
                value={newAdmin.role}
                onValueChange={(value: AdminUser["role"]) => setNewAdmin({ ...newAdmin, role: value })}
              >
                <SelectTrigger id="adminRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin}>
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
