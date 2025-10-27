import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Feedback status has been updated successfully.",
      });

      fetchFeedback();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: "default",
      in_progress: "secondary",
      resolved: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feedback</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No feedback yet
                  </TableCell>
                </TableRow>
              ) : (
                feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.message}</TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {item.status !== "resolved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateFeedbackStatus(item.id, "resolved")}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
