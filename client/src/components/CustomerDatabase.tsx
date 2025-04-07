import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueService } from "@/lib/supabase";
import { Queue } from "@shared/schema";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Download, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CustomerDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUniqueCustomers, setShowUniqueCustomers] = useState(false);
  
  // Query to fetch all customer records
  const { data: customers, isLoading, refetch } = useQuery<Queue[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const result = await queueService.getAllCustomerRecords();
      console.log("Customer database records loaded:", result.length);
      return result;
    },
    refetchOnWindowFocus: false,
  });

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    try {
      // Handle both string and Date objects
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Filter for unique customers by phone number (showing only the most recent entry)
  const uniqueCustomers = useMemo(() => {
    if (!customers) return [];
    
    // Create a map to store the most recent record for each phone number
    const phoneMap = new Map();
    
    // Sort customers by check-in time (newest first)
    const sortedCustomers = [...customers].sort((a, b) => 
      new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
    );
    
    // Add only the first occurrence of each phone number (most recent)
    sortedCustomers.forEach(customer => {
      if (!phoneMap.has(customer.phone_number)) {
        phoneMap.set(customer.phone_number, customer);
      }
    });
    
    // Convert map values back to array
    return Array.from(phoneMap.values());
  }, [customers]);
  
  // Handle search filter
  const filteredCustomers = (showUniqueCustomers ? uniqueCustomers : customers)?.filter((customer: Queue) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone_number.includes(searchTerm) ||
      customer.service_type.toLowerCase().includes(searchLower)
    );
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle CSV export
  const exportToCSV = () => {
    const dataToExport = showUniqueCustomers ? uniqueCustomers : customers;
    if (!dataToExport || dataToExport.length === 0) return;

    // Create CSV content
    const headers = ["Name", "Phone Number", "Service", "Price", "Payment Method", "Date", "Status"];
    const csvContent = dataToExport.map((customer: Queue) => [
      customer.name,
      customer.phone_number,
      customer.service_type,
      customer.service_price,
      customer.payment_method,
      formatDate(customer.check_in_time),
      customer.status
    ].join(",")).join("\n");

    const csv = [headers.join(","), csvContent].join("\n");
    
    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    // Use current date as string for filename
    const currentDate = format(new Date(), "yyyy-MM-dd");
    const filename = showUniqueCustomers 
      ? `unique_customer_contacts_${currentDate}.csv` 
      : `customer_database_${currentDate}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Customer Database</h2>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone or service..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customer view toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="unique-customers"
          checked={showUniqueCustomers}
          onCheckedChange={setShowUniqueCustomers}
        />
        <Label htmlFor="unique-customers" className="flex items-center cursor-pointer">
          <Users className="h-4 w-4 mr-2" />
          Show unique customers only
          {showUniqueCustomers && uniqueCustomers && (
            <span className="text-sm ml-2 text-gray-400">
              ({uniqueCustomers.length} unique contacts)
            </span>
          )}
        </Label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              {filteredCustomers?.length 
                ? showUniqueCustomers 
                  ? `Showing ${filteredCustomers.length} unique customers (filtered from ${customers?.length} total records)`
                  : `Showing ${filteredCustomers.length} of ${customers?.length} customer records`
                : "No customer records found"
              }
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers?.map((customer: Queue) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone_number}</TableCell>
                  <TableCell>{customer.service_type}</TableCell>
                  <TableCell>{customer.service_price}</TableCell>
                  <TableCell>{customer.payment_method}</TableCell>
                  <TableCell>{formatDate(customer.check_in_time)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${customer.status === "Waiting" ? "bg-blue-100 text-blue-800" : 
                        customer.status === "Almost Done" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-green-100 text-green-800"}`}>
                      {customer.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}