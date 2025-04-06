import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormData, loginSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";
import { Container, HeaderIcon, PageContainer } from "@/components/ui/container";

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  async function onSubmit(data: LoginFormData) {
    await login(data.username, data.password);
  }
  
  return (
    <PageContainer>
      <Container>
        <HeaderIcon icon={<Lock className="text-white h-5 w-5" />} />
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Barber Dashboard Login</h1>
        <p className="text-center text-gray-300 mb-6">Enter your credentials to access the dashboard</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        placeholder="Enter your email"
                        className="pl-10 bg-gray-800"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10 bg-gray-800"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </Container>
    </PageContainer>
  );
}
