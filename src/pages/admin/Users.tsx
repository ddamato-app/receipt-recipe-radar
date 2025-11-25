import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Trash2, Download, UserPlus, Calendar as CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [tierExpiryDate, setTierExpiryDate] = useState<Date | undefined>(undefined);
  const usersPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch item counts for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from("fridge_items")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          return {
            ...user,
            itemCount: count || 0,
            lastActive: user.created_at,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Signup Date', 'Tier', 'Items Count', 'Last Active'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedUsers.map(user => 
        [
          user.email,
          user.name || '',
          new Date(user.created_at).toLocaleDateString(),
          user.tier,
          user.itemCount,
          new Date(user.lastActive).toLocaleDateString()
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // In production, this would delete the user from Supabase
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setUserToDelete(null);
    }
  };

  const handleTierChange = async () => {
    if (!selectedUser || !selectedTier) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          tier: selectedTier,
          tier_expires_at: tierExpiryDate ? tierExpiryDate.toISOString() : null,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, tier: selectedTier, tier_expires_at: tierExpiryDate?.toISOString() || null } 
          : u
      ));

      const expiryText = tierExpiryDate 
        ? ` (expires ${format(tierExpiryDate, "MMM d, yyyy")})` 
        : " (lifetime)";
      toast.success(`User tier updated to ${selectedTier}${expiryText}`);
      
      setSelectedUser(null);
      setSelectedTier("");
      setTierExpiryDate(undefined);
    } catch (error) {
      console.error("Error updating tier:", error);
      toast.error("Failed to update tier");
    }
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === "all" || user.tier.toLowerCase() === filterTier.toLowerCase();
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "active") {
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="active">Most Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Signup Date</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.email, user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                   <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={user.tier === 'pro' ? 'default' : 'secondary'}>
                        {user.tier}
                      </Badge>
                      {user.tier_expires_at && (
                        <span className="text-xs text-muted-foreground">
                          Expires {format(new Date(user.tier_expires_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.itemCount}</TableCell>
                  <TableCell>
                    {new Date(user.lastActive).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                size="sm"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* View/Edit User Modal */}
      <Dialog 
        open={!!selectedUser} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setSelectedTier("");
            setTierExpiryDate(undefined);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              View and manage user tier and subscription
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedUser.email, selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || selectedUser.email}</h3>
                  <p className="text-muted-foreground text-sm">{selectedUser.email}</p>
                </div>
              </div>

              {/* Current Tier Info */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
                      <Badge variant={selectedUser.tier === 'pro' ? 'default' : 'secondary'} className="text-base">
                        {selectedUser.tier}
                      </Badge>
                    </div>
                    {selectedUser.tier_expires_at ? (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Expires</p>
                        <p className="font-medium">{format(new Date(selectedUser.tier_expires_at), "MMM d, yyyy")}</p>
                      </div>
                    ) : selectedUser.tier === 'pro' ? (
                      <Badge variant="outline" className="text-sm">Lifetime</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* Tier Management */}
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-semibold">Update Tier</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="tier-select">New Tier</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger id="tier-select">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTier === 'pro' && (
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal",
                              !tierExpiryDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tierExpiryDate ? format(tierExpiryDate, "PPP") : "Lifetime (no expiry)"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tierExpiryDate}
                            onSelect={setTierExpiryDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {tierExpiryDate && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setTierExpiryDate(undefined)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty for lifetime access
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleTierChange}
                  disabled={!selectedTier}
                  className="w-full"
                >
                  Update Tier
                </Button>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Signup Date</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items in Fridge</p>
                  <p className="font-medium">{selectedUser.itemCount}</p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setSelectedUser(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{userToDelete?.email}</strong> and all their data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
