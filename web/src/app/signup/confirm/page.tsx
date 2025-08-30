'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, ArrowLeft, User, Phone, MapPin, Home, Flag, Mail } from 'lucide-react';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  street_address: string;
  apartment_number?: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  created_at: string;
}

export default function ConfirmPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get the parsed data from localStorage
    const storedData = localStorage.getItem('signupData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
        // Clear the data after retrieving it
        localStorage.removeItem('signupData');
      } catch (error) {
        console.error('Error parsing stored data:', error);
        router.push('/signup');
      }
    } else {
      // If no data found, redirect back to signup
      router.push('/signup');
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">No signup data found. Please try again.</p>
        <Button asChild className="mt-4">
          <Link href="/signup">Go to Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Sign-Up Successful!
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Our AI has successfully parsed your information. Here's what we extracted:
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name
              </Label>
              <Input 
                id="firstName" 
                value={userData.first_name} 
                readOnly 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name
              </Label>
              <Input 
                id="lastName" 
                value={userData.last_name} 
                readOnly 
                className="bg-muted"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input 
              id="phone" 
              value={userData.phone_number} 
              readOnly 
              className="bg-muted"
            />
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Address Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Street Address
                </Label>
                <Input 
                  id="street" 
                  value={userData.street_address} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apartment">Apartment/Unit Number</Label>
                <Input 
                  id="apartment" 
                  value={userData.apartment_number || 'Not provided'} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={userData.city} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input 
                  id="state" 
                  value={userData.state} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  ZIP Code
                </Label>
                <Input 
                  id="zip" 
                  value={userData.zip_code} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Country
              </Label>
              <Input 
                id="country" 
                value={userData.country} 
                readOnly 
                className="bg-muted"
              />
            </div>
          </div>

          {/* Meta Information */}
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>User ID:</strong> #{userData.id}</p>
              <p><strong>Created:</strong> {new Date(userData.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/signup" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Sign Up Another User
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">
                Return to Movies Collection
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle className="h-5 w-5" />
          <p className="font-semibold">AI Processing Complete!</p>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          Your information has been successfully parsed and saved to our system.
        </p>
      </div>
    </div>
  );
}