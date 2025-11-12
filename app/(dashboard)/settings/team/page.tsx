'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '../../../../types/index';
import { useAuth } from '../../../../hooks/useAuth';
import { authenticatedFetch } from '../../../../services/auth';
import { API_BASE_URL } from '../../../../services/api';
import { parseApiError, formatErrorMessage } from '../../../../utils/errorHandler';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { UsersIcon, MailIcon, CheckIcon, XIcon, PlusIcon, XMarkIcon, AlertTriangleIcon, SuccessIcon, ClockIcon } from '../../../../components/icons/IconComponents';
import { cn } from '../../../../utils/cn';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const roleConfig = {
    Admin: {
      className: "bg-error/20 text-error border-error/30",
    },
    Manager: {
      className: "bg-warning/20 text-warning border-warning/30",
    },
    Member: {
      className: "bg-info/20 text-info border-info/30",
    },
  };
  
  const config = roleConfig[role];
  
  const badgeClasses = {
    Admin: "badge badge-error",
    Manager: "badge badge-warning",
    Member: "badge badge-primary",
  };
  
  return (
    <span className={cn("badge inline-block border", badgeClasses[role])}>
      {role}
    </span>
  );
};

interface InviteFormErrors {
  email?: string;
  general?: string;
}

const TeamSettings: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteErrors, setInviteErrors] = useState<InviteFormErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/users/`, {
                    method: 'GET',
                });
                
                if (!response.ok) {
                    if (response.status === 403 || response.status === 404) {
                        // Endpoint might not exist or require admin access
                        setUsers([]);
                        setIsLoading(false);
                        return;
                    }
                    const error = await parseApiError(response, 'Failed to fetch users');
                    setErrorMessage(formatErrorMessage(error, 'Failed to fetch users'));
                    setUsers([]);
                } else {
                    const data = await response.json();
                    const results = data.results || data;
                    const formattedUsers: User[] = results.map((u: any) => ({
                        id: String(u.id),
                        name: u.name || 'Unnamed User',
                        email: u.email || '',
                        role: (u.role || 'Member') as User['role'],
                        avatarUrl: u.avatar_url || `https://picsum.photos/seed/${u.id}/40/40`,
                        isActive: u.is_active ?? true,
                        lastLogin: u.last_sign_in_at || 'N/A',
                        jobTitle: u.job_title,
                    }));
                    setUsers(formattedUsers);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
                setErrorMessage('Failed to load team members. This feature may require admin access.');
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);
    
    const handleInvite = async () => {
      if (!inviteEmail) {
        setInviteErrors({ email: "Please enter an email address." });
        return;
      }
      
      setInviteErrors({});
      setSuccessMessage(null);
      setIsInviting(true);
      
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/users/invite/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: inviteEmail }),
        });
        
        if (!response.ok) {
            const error = await parseApiError(response, 'Failed to send invite');
            const newErrors: InviteFormErrors = {};
            
            // Extract field-specific errors from API response
            if (error.fieldErrors) {
              if (error.fieldErrors.email && error.fieldErrors.email.length > 0) {
                newErrors.email = error.fieldErrors.email[0];
              }
            }
            
            // Handle non-field errors
            if (error.nonFieldErrors && error.nonFieldErrors.length > 0) {
              newErrors.general = error.nonFieldErrors[0];
            } else if (!newErrors.email) {
              // Only set general error if no field-specific errors exist
              newErrors.general = formatErrorMessage(error, 'Failed to send invite');
            }
            
            setInviteErrors(newErrors);
        } else {
            setSuccessMessage(`Invite sent to ${inviteEmail}!`);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteErrors({});
        }
      } catch (error) {
        setInviteErrors({
          general: error instanceof Error ? error.message : 'Failed to send invite',
        });
      } finally {
        setIsInviting(false);
      }
    };

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        const originalUsers = [...users];
        const updatedUsers = users.map(user => user.id === userId ? { ...user, role: newRole } : user);
        setUsers(updatedUsers);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/users/${userId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });
            
            if (!response.ok) {
                const error = await parseApiError(response, 'Failed to update role');
                setErrorMessage(formatErrorMessage(error, 'Failed to update role'));
                setUsers(originalUsers);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update role');
            setUsers(originalUsers);
        }
    };

    const handleStatusToggle = async (userId: string) => {
        const userToUpdate = users.find(user => user.id === userId);
        if (!userToUpdate) return;
        
        const newStatus = !userToUpdate.isActive;
        const action = newStatus ? 'activate' : 'deactivate';

        if (window.confirm(`Are you sure you want to ${action} ${userToUpdate.name}?`)) {
          const originalUsers = [...users];
          const updatedUsers = users.map(user => user.id === userId ? { ...user, isActive: newStatus } : user);
          setUsers(updatedUsers);

          try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/users/${userId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: newStatus }),
            });

            if (!response.ok) {
                const error = await parseApiError(response, 'Failed to update status');
                setErrorMessage(formatErrorMessage(error, 'Failed to update status'));
                setUsers(originalUsers);
            }
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update status');
            setUsers(originalUsers);
          }
        }
    };
    
    const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-foreground">Team Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your team members and their account permissions</p>
            </div>
        </div>
        {canManage && (
            <Button 
                onClick={() => setShowInviteModal(true)}
                leftIcon={<PlusIcon className="w-4 h-4" />}
            >
                Invite User
            </Button>
        )}
      </div>

      {errorMessage && (
        <Card className="border-error/20 bg-error/5">
            <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{errorMessage}</p>
            </CardContent>
        </Card>
      )}
      
      {successMessage && (
        <Card className="border-success/20 bg-success/5">
            <CardContent className="flex items-center gap-3 p-4">
                <SuccessIcon className="w-5 h-5 text-success flex-shrink-0" />
                <p className="text-sm text-success">{successMessage}</p>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <UsersIcon className="w-12 h-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">No users found</p>
                        <p className="text-sm text-muted-foreground/80">Team management may require admin access</p>
                    </div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4" />
                                    User
                                </div>
                            </TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    Last Login
                                </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Image 
                                            src={user.avatarUrl} 
                                            alt={user.name} 
                                            className="w-10 h-10 rounded-full border-2 border-border" 
                                            width={40}
                                            height={40}
                                        />
                                        <div>
                                            <p className="font-semibold text-foreground">{user.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MailIcon className="w-3 h-3 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <RoleBadge role={user.role} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">{user.lastLogin}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 border",
                                        user.isActive 
                                            ? 'bg-success/20 text-success border-success/30' 
                                            : 'bg-muted text-muted-foreground border-border'
                                    )}>
                                        {user.isActive ? (
                                            <>
                                                <CheckIcon className="w-3 h-3" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-3 h-3" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {canManage ? (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <Select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                                                options={[
                                                    { value: 'Admin', label: 'Admin' },
                                                    { value: 'Manager', label: 'Manager' },
                                                    { value: 'Member', label: 'Member' },
                                                ]}
                                                className="w-full sm:w-auto"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusToggle(user.id)}
                                                className={cn(
                                                    "whitespace-nowrap",
                                                    user.isActive ? 'text-warning hover:text-warning' : 'text-success hover:text-success'
                                                )}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className='text-sm text-muted-foreground'>No actions</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {showInviteModal && (
        <div className="fixed inset-0 bg-backdrop z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Invite New User</CardTitle>
                    <button
                        onClick={() => {
                            setShowInviteModal(false);
                            setInviteEmail('');
                            setInviteErrors({});
                        }}
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
                <CardDescription>
                    Enter the email of the user you want to invite. They will receive an email with instructions to join.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {inviteErrors.general && (
                    <Card className="border-error/20 bg-error/5 mb-4">
                        <CardContent className="flex items-center gap-3 p-3">
                            <AlertTriangleIcon className="w-4 h-4 text-error flex-shrink-0" />
                            <p className="text-sm text-error">{inviteErrors.general}</p>
                        </CardContent>
                    </Card>
                )}
                
                <Input
                    label="Email Address"
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (inviteErrors.email) {
                            setInviteErrors((prev) => ({ ...prev, email: undefined }));
                        }
                    }}
                    placeholder="user@example.com"
                    error={inviteErrors.email}
                    leftIcon={<MailIcon className="w-4 h-4" />}
                    fullWidth
                />
            </CardContent>
            <div className="px-6 pb-6 flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                        setInviteErrors({});
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleInvite}
                    disabled={isInviting}
                    isLoading={isInviting}
                    leftIcon={<MailIcon className="w-4 h-4" />}
                >
                    Send Invite
                </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamSettings;
