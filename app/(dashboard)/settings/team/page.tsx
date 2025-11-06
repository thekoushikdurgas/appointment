'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../../../types/index';
import { useAuth } from '../../../../hooks/useAuth';
import { authenticatedFetch } from '../../../../services/auth';
import { API_BASE_URL } from '../../../../services/api';
import { parseApiError, formatErrorMessage } from '../../../../utils/errorHandler';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block";
  const roleClasses = {
    Admin: "bg-red-400/20 text-red-500",
    Manager: "bg-purple-400/20 text-purple-500",
    Member: "bg-blue-400/20 text-blue-500",
  };
  return <span className={`${baseClasses} ${roleClasses[role]}`}>{role}</span>;
};

const TeamSettings: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/users/`, {
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
        setErrorMessage("Please enter an email address.");
        return;
      }
      
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsInviting(true);
      
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/invite/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: inviteEmail }),
        });
        
        if (!response.ok) {
            const error = await parseApiError(response, 'Failed to send invite');
            setErrorMessage(formatErrorMessage(error, 'Failed to send invite'));
        } else {
            setSuccessMessage(`Invite sent to ${inviteEmail}!`);
            setShowInviteModal(false);
            setInviteEmail('');
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to send invite');
      } finally {
        setIsInviting(false);
      }
    };

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        const originalUsers = [...users];
        const updatedUsers = users.map(user => user.id === userId ? { ...user, role: newRole } : user);
        setUsers(updatedUsers);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}/`, {
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
            const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}/`, {
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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-card-foreground">Team Management</h2>
        {canManage && (
            <button onClick={() => setShowInviteModal(true)} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
            Invite User
            </button>
        )}
      </div>
       <p className="text-muted-foreground mb-6 -mt-2">
        Manage your team members and their account permissions.
      </p>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-secondary">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground">User</th>
              <th className="p-4 font-semibold text-muted-foreground">Role</th>
              <th className="p-4 font-semibold text-muted-foreground hidden md:table-cell">Last Login</th>
              <th className="p-4 font-semibold text-muted-foreground">Status</th>
              <th className="p-4 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && users.map(user => (
              <tr key={user.id} className="border-b border-border hover:bg-secondary">
                <td className="p-4 flex items-center">
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                  <div>
                    <p className="font-semibold text-card-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="p-4 text-card-foreground hidden md:table-cell">{user.lastLogin}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${user.isActive ? 'bg-green-400/20 text-green-500' : 'bg-gray-400/20 text-gray-500'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  {canManage ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                        className="border bg-background border-border rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
                        >
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Member</option>
                        </select>
                        <button
                        onClick={() => handleStatusToggle(user.id)}
                        className={`text-sm font-medium ${user.isActive ? 'text-yellow-500' : 'text-green-500'} hover:underline whitespace-nowrap`}
                        >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                  ) : <span className='text-sm text-muted-foreground'>No actions</span> }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {isLoading && (
        <div className="text-center py-10">
            <p className="text-muted-foreground">Loading users...</p>
        </div>
      )}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-10">
            <p className="text-muted-foreground">No users found. Team management may require admin access.</p>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-xl font-bold mb-4">Invite New User</h3>
            <p className="text-muted-foreground mb-4">Enter the email of the user you want to invite. They will receive an email with instructions to join.</p>
            <input 
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleInvite} disabled={isInviting} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400">
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSettings;
