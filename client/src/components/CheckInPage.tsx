import { User, Phone, Scissors, CreditCard } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QueueFormData, queueFormSchema } from "@shared/schema";
import { queueService } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Container, HeaderIcon, PageContainer } from "@/components/ui/container";

export default function CheckInPage() {
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const { toast } = useToast();
  
  const form = useForm<QueueFormData>({
    resolver: zodResolver(queueFormSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      service_type: "",
      payment_method: "Cash",
    },
  });
  
  const checkInMutation = useMutation({
    mutationFn: (data: QueueFormData) => queueService.addToQueue(data),
    onSuccess: (data) => {
      toast({
        title: "Check-in successful!",
        description: `Thanks, ${data.name}! You've been added to the queue.`,
      });
      form.reset({
        name: "",
        phone_number: "",
        service_type: "",
        payment_method: "Cash",
      });
      setPaymentMethod("Cash");
    },
    onError: (error) => {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: QueueFormData) {
    checkInMutation.mutate(data);
  }
  
  function handlePaymentMethodChange(method: "Cash" | "Card") {
    setPaymentMethod(method);
    form.setValue("payment_method", method);
  }
  
  return (
    <PageContainer>
      <Container>
        <HeaderIcon icon={<User className="text-white h-5 w-5" />} />
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Welcome to Beyond Grooming</h1>
        <p className="text-center text-gray-300 mb-6">Fill out the form below to join the queue</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input placeholder="Enter your name" className="pl-10 bg-gray-800" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        placeholder="07000000000" 
                        className="pl-10 bg-gray-800" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-400 mt-1">UK mobile number format (e.g. 07000000000)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-800">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Haircut">Haircut</SelectItem>
                      <SelectItem value="Beard Trim">Beard Trim</SelectItem>
                      <SelectItem value="Haircut & Beard">Haircut & Beard</SelectItem>
                      <SelectItem value="Traditional Shave">Traditional Shave</SelectItem>
                      <SelectItem value="Kids Haircut">Kids Haircut</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      className={`${
                        paymentMethod === "Cash" 
                          ? "bg-secondary text-white" 
                          : "bg-gray-800 text-gray-300"
                      }`}
                      onClick={() => handlePaymentMethodChange("Cash")}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Cash
                    </Button>
                    <Button
                      type="button"
                      className={`${
                        paymentMethod === "Card" 
                          ? "bg-secondary text-white" 
                          : "bg-gray-800 text-gray-300"
                      }`}
                      onClick={() => handlePaymentMethodChange("Card")}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Card
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-opacity-90"
              disabled={checkInMutation.isPending}
            >
              {checkInMutation.isPending ? "Adding to queue..." : "Join Queue"}
            </Button>
          </form>
        </Form>
      </Container>
    </PageContainer>
  );
}
