import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import NavBar from "@/components/NavBar";
import CheckIn from "@/pages/CheckIn";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider } from "./lib/auth";

function Router() {
  const [location] = useLocation();

  return (
    <>
      <NavBar currentPath={location} />
      <main className="container mx-auto p-4 md:p-6">
        <Switch>
          <Route path="/" component={CheckIn} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
