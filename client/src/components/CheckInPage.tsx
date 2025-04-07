import { User, Phone, Scissors, CreditCard, Clock, Info } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QueueFormData, queueFormSchema } from "@shared/schema";
import { queueService } from "@/lib/supabase";
import { serviceMenu, getServicePriceByName, getServiceCategoryByName } from "@/lib/serviceData";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Container, HeaderIcon, PageContainer } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CheckInPage() {
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [servicePrice, setServicePrice] = useState<string | null>(null);
  const [serviceCategory, setServiceCategory] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<QueueFormData>({
    resolver: zodResolver(queueFormSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      service_type: "",
      service_price: "",
      service_category: "",
      payment_method: "Cash",
    },
  });
  
  // Update price and category when service changes
  useEffect(() => {
    if (selectedService) {
      const price = getServicePriceByName(selectedService);
      const category = getServiceCategoryByName(selectedService);
      
      setServicePrice(price);
      setServiceCategory(category);
      
      form.setValue("service_price", price);
      form.setValue("service_category", category);
    }
  }, [selectedService, form]);
  
  const checkInMutation = useMutation({
    mutationFn: (data: QueueFormData) => queueService.addToQueue(data),
    onSuccess: (data) => {
      toast({
        title: "Added to queue",
        description: null,
        duration: 1000, // 1 second
      });
      form.reset({
        name: "",
        phone_number: "",
        service_type: "",
        service_price: "",
        service_category: "",
        payment_method: "Cash",
      });
      setPaymentMethod("Cash");
      setSelectedService(null);
      setServicePrice(null);
      setServiceCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Check-in failed",
        // Still keep error message as it's important for the user to know what went wrong
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
        duration: 1500, // Slightly longer for errors to read
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
  
  function handleServiceChange(serviceName: string) {
    setSelectedService(serviceName);
    form.setValue("service_type", serviceName);
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
                        placeholder="7XXXXXXXXX" 
                        className="pl-10 bg-gray-800" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-400 mt-1">Enter your number without the leading zero (e.g., 7823710017)</p>
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
                  <Select 
                    onValueChange={(value) => handleServiceChange(value)} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-800">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceMenu.map((category) => (
                        <SelectGroup key={category.id}>
                          <SelectLabel className="text-primary font-semibold">{category.name}</SelectLabel>
                          {category.services.map((service) => (
                            <SelectItem 
                              key={service.id} 
                              value={service.name}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="flex justify-between w-full">
                                <span>{service.name}</span>
                                <Badge variant="secondary" className="ml-2">{service.price}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedService && servicePrice && (
              <div className="rounded-md bg-gray-800 p-3 border border-gray-700">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-secondary mr-2" />
                  <h3 className="font-medium">Service Details</h3>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span>{selectedService}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-medium text-secondary">{servicePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span>{serviceCategory}</span>
                  </div>
                </div>
              </div>
            )}
            
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
