'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Sparkles, Users, ArrowLeft, Eye, Phone, MapPin, Trash2, CheckCircle, X, AlertCircle, Upload, Camera } from 'lucide-react';

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

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function SignUpPage() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    const notification = { id, type, title, message };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Invalid File Type', 'Please select an image file (PNG, JPG, JPEG)');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File Too Large', 'Please select an image smaller than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() && !selectedImage) {
      showNotification('error', 'No Input Provided', 'Please enter text or upload an ID image.');
      return;
    }

    setIsLoading(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8001';
      console.log('API URL:', apiUrl);
      
      let response;
      
      if (selectedImage) {
        // Handle image upload
        console.log('Submitting image:', selectedImage.name);
        
        const formData = new FormData();
        formData.append('image', selectedImage);
        if (userInput.trim()) {
          formData.append('additional_text', userInput.trim());
        }
        
        response = await fetch(`${apiUrl}/api/signup/image`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle text input
        console.log('Submitting data:', { user_input: userInput.trim() });
        
        response = await fetch(`${apiUrl}/api/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_input: userInput.trim() }),
        });
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to parse information: ${response.status}`);
      }

      const userData = await response.json();
      console.log('Parsed user data:', userData);
      
      // Show success notification and refresh the table if it's visible
      showNotification(
        'success',
        'User Added Successfully!',
        `Welcome ${userData.first_name} ${userData.last_name}! Your information has been processed and saved.`
      );
      setUserInput(''); // Clear the form
      removeImage(); // Clear the image
      
      // If table is visible, refresh the users list
      if (showTable) {
        fetchUsers();
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification(
        'error',
        'Failed to Process Information',
        `${error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification(
        'error',
        'Failed to Load Users',
        'Unable to retrieve user data. Please try refreshing.'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleView = async () => {
    if (!showTable) {
      // Switching to table view, fetch users
      await fetchUsers();
    }
    setShowTable(!showTable);
  };

  const handleDeleteUser = async (userId: number, userName: string) => {

    try {
      const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Show success notification and refresh the table
      showNotification(
        'success',
        'User Deleted Successfully!',
        `${userName} has been removed from the system.`
      );
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(
        'error',
        'Failed to Delete User',
        `Unable to delete ${userName}. Please try again.`
      );
    }
  };

  const formatAddress = (user: UserData) => {
    const parts = [user.street_address];
    if (user.apartment_number) {
      parts.push(`Apt ${user.apartment_number}`);
    }
    parts.push(`${user.city}, ${user.state} ${user.zip_code}`);
    parts.push(user.country);
    return parts.join(', ');
  };

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform translate-x-0 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-0.5">
                {notification.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {notification.type === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {notification.type === 'info' && (
                  <Eye className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{notification.title}</h4>
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (showTable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-full px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Registered Users
            </h1>
          </div>
          <Button onClick={handleToggleView} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign Up
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                All Sign-Up Data
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {users.length} users registered
              </span>
            </CardTitle>
            <CardDescription>
              View all users who have signed up using our AI-powered form. Each address component is separated for easy analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No users registered yet</p>
                <p className="text-sm">Be the first to sign up!</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table className="min-w-[1300px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[140px]">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[180px]">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Street Address
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[80px]">Apt #</TableHead>
                      <TableHead className="min-w-[120px]">City</TableHead>
                      <TableHead className="min-w-[100px]">State</TableHead>
                      <TableHead className="min-w-[100px]">Country</TableHead>
                      <TableHead className="min-w-[80px]">ZIP Code</TableHead>
                      <TableHead className="min-w-[140px]">Registered</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">#{user.id}</TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="font-semibold break-words">
                            {user.first_name} {user.last_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm min-w-[140px] break-all">
                          {user.phone_number}
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="text-sm leading-tight break-words">
                            {user.street_address}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm min-w-[80px]">
                          <div className="break-words">
                            {user.apartment_number || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="text-sm break-words">
                            {user.city}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="text-sm break-words">
                            {user.state}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="text-sm break-words">
                            {user.country}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm min-w-[80px] font-mono">
                          <div className="break-words">
                            {user.zip_code}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground min-w-[140px]">
                          <div className="break-words">
                            {new Date(user.created_at).toLocaleDateString()}
                            <br />
                            <span className="text-xs">
                              {new Date(user.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <Button onClick={fetchUsers} variant="outline" disabled={loadingUsers}>
                {loadingUsers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <NotificationContainer />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sign Up with AI
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Just tell us about yourself in your own words, and our AI will organize everything for you!
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Natural Language Sign-Up
          </CardTitle>
          <CardDescription>
            Enter all your information in a single sentence. Include your name, phone number, and complete address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="userInput" className="text-sm font-medium">
                Tell us about yourself:
              </label>
              <Textarea
                id="userInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Example: Hi, I'm John Doe, my phone is 555-123-4567 and I live at 123 Main Street, Apt 4B, New York, NY 10001, USA"
                rows={4}
                className="min-h-[120px] text-base"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Our AI will automatically extract your name, phone number, street address, apartment number, city, state, country, and ZIP code.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-4">— OR —</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">
                Upload ID Card Image:
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label 
                    htmlFor="imageUpload" 
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-gray-50 rounded-lg p-4">
                    <img
                      src={imagePreview}
                      alt="ID preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-white shadow-md"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    AI will extract information from your ID card image
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                className="flex-1 text-lg py-6" 
                disabled={(!userInput.trim() && !selectedImage) || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing with AI...
                  </>
                ) : (
                  <>
                    {selectedImage ? (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        Process ID Card
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Parse My Information
                      </>
                    )}
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                onClick={handleToggleView}
                className="flex-1 text-lg py-6"
                disabled={isLoading}
              >
                <Users className="mr-2 h-5 w-5" />
                View All Users
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm mb-2">✨ AI-Powered Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Automatically detects and formats phone numbers</li>
              <li>• Separates address components intelligently</li>
              <li>• Handles various input formats and styles</li>
              <li>• Extracts apartment/unit numbers when provided</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      <NotificationContainer />
    </div>
  );
}