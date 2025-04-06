import { Link } from "wouter";
import { Scissors, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface NavBarProps {
  currentPath: string;
}

export default function NavBar({ currentPath }: NavBarProps) {
  const { isLoggedIn, logout } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-[#1A1F2C] z-50 sticky top-0">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Scissors className="text-secondary h-5 w-5" />
          <span className="text-xl font-bold">Beyond Grooming</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/" className={`py-2 px-3 rounded hover:bg-gray-800 transition-colors ${currentPath === '/' ? 'bg-gray-800' : ''}`}>
            Check In
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={`py-2 px-3 rounded hover:bg-gray-800 transition-colors ${currentPath === '/dashboard' ? 'bg-gray-800' : ''}`}>
                Barber Dashboard
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="py-2 px-3 text-sm font-medium rounded hover:bg-gray-800 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" className={`py-2 px-3 rounded hover:bg-gray-800 transition-colors ${currentPath === '/login' ? 'bg-gray-800' : ''}`}>
              Barber Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
