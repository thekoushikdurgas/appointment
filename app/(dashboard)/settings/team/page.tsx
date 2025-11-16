'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@/types/index';
import { useAuth } from '@hooks/useAuth';
import { authenticatedFetch } from '@services/auth';
import { API_BASE_URL } from '@services/api';
import { parseApiError, formatErrorMessage } from '@utils/errorHandler';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { UsersIcon, MailIcon, CheckIcon, XIcon, PlusIcon, XMarkIcon, AlertTriangleIcon, SuccessIcon, ClockIcon } from '@components/icons/IconComponents';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  return (
    <span className={`settings-team-role-badge settings-team-role-badge--${role.toLowerCase()}`}>
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
    <div className="settings-team-page">
      <div className="settings-team-header">
        <div className="settings-team-header-content">
            <div className="settings-team-header-icon-wrapper">
                <UsersIcon className="settings-team-header-icon" />
            </div>
            <div>
                <h2 className="settings-team-title">Team Management</h2>
                <p className="settings-team-description">Manage your team members and their account permissions</p>
            </div>
        </div>
        {canManage && (
            <Button 
                onClick={() => setShowInviteModal(true)}
                leftIcon={<PlusIcon className="settings-team-invite-btn-icon" />}
                className="settings-team-invite-btn"
            >
                Invite User
            </Button>
        )}
      </div>

      {errorMessage && (
        <Card className="settings-team-error-card">
            <CardContent className="settings-team-error-card-content">
                <AlertTriangleIcon className="settings-team-error-card-icon" />
                <p className="settings-team-error-card-message">{errorMessage}</p>
            </CardContent>
        </Card>
      )}
      
      {successMessage && (
        <Card className="settings-team-success-card">
            <CardContent className="settings-team-success-card-content">
                <SuccessIcon className="settings-team-success-card-icon" />
                <p className="settings-team-success-card-message">{successMessage}</p>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="settings-team-table-content">
            {isLoading ? (
                <div className="settings-team-loading">
                    <div className="settings-team-loading-content">
                        <div className="settings-team-loading-spinner"></div>
                        <p className="settings-team-loading-text">Loading users...</p>
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="settings-team-empty">
                    <div className="settings-team-empty-content">
                        <UsersIcon className="settings-team-empty-icon" />
                        <p className="settings-team-empty-title">No users found</p>
                        <p className="settings-team-empty-description">Team management may require admin access</p>
                    </div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <div className="settings-team-table-head-content">
                                    <UsersIcon className="settings-team-table-head-icon" />
                                    User
                                </div>
                            </TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="settings-team-table-head--hidden-md">
                                <div className="settings-team-table-head-content">
                                    <ClockIcon className="settings-team-table-head-icon" />
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
                                    <div className="settings-team-table-user">
                                        <Image 
                                            src={user.avatarUrl} 
                                            alt={user.name} 
                                            className="settings-team-table-user-avatar" 
                                            width={40}
                                            height={40}
                                        />
                                        <div>
                                            <p className="settings-team-table-user-name">{user.name}</p>
                                            <div className="settings-team-table-user-email">
                                                <MailIcon className="settings-team-table-user-email-icon" />
                                                <p className="settings-team-table-user-email-text">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <RoleBadge role={user.role} />
                                </TableCell>
                                <TableCell className="settings-team-table-cell--hidden-md">
                                    <div className="settings-team-table-last-login">
                                        <ClockIcon className="settings-team-table-last-login-icon" />
                                        <span className="settings-team-table-last-login-text">{user.lastLogin}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`settings-team-table-status ${user.isActive ? 'settings-team-table-status--active' : 'settings-team-table-status--inactive'}`}>
                                        {user.isActive ? (
                                            <>
                                                <CheckIcon className="settings-team-table-status-icon" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="settings-team-table-status-icon" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {canManage ? (
                                        <div className="settings-team-table-actions">
                                            <Select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                                                options={[
                                                    { value: 'Admin', label: 'Admin' },
                                                    { value: 'Manager', label: 'Manager' },
                                                    { value: 'Member', label: 'Member' },
                                                ]}
                                                className="settings-team-table-role-select"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusToggle(user.id)}
                                                className={`settings-team-table-action-btn ${user.isActive ? 'settings-team-table-action-btn--deactivate' : 'settings-team-table-action-btn--activate'}`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="settings-team-table-no-actions">No actions</span>
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
        <div className="settings-team-invite-modal-overlay">
          <Card className="settings-team-invite-modal">
            <CardHeader>
                <div className="settings-team-invite-modal-header">
                    <CardTitle>Invite New User</CardTitle>
                    <button
                        onClick={() => {
                            setShowInviteModal(false);
                            setInviteEmail('');
                            setInviteErrors({});
                        }}
                        className="settings-team-invite-modal-close"
                        aria-label="Close"
                    >
                        <XMarkIcon className="settings-team-invite-modal-close-icon" />
                    </button>
                </div>
                <CardDescription>
                    Enter the email of the user you want to invite. They will receive an email with instructions to join.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {inviteErrors.general && (
                    <Card className="settings-team-invite-error-card">
                        <CardContent className="settings-team-invite-error-card-content">
                            <AlertTriangleIcon className="settings-team-invite-error-card-icon" />
                            <p className="settings-team-invite-error-card-message">{inviteErrors.general}</p>
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
                    leftIcon={<MailIcon className="settings-team-invite-input-icon" />}
                    fullWidth
                />
            </CardContent>
            <div className="settings-team-invite-modal-footer">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                        setInviteErrors({});
                    }}
                    className="settings-team-invite-modal-cancel-btn"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleInvite}
                    disabled={isInviting}
                    isLoading={isInviting}
                    leftIcon={<MailIcon className="settings-team-invite-modal-send-icon" />}
                    className="settings-team-invite-modal-send-btn"
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
