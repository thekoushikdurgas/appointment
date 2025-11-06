'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Contact } from '../../../types/index';
import { SearchIcon, XMarkIcon, GlobeAltIcon, LinkedInIcon, FacebookIcon, TwitterIcon, OfficeBuildingIcon, TagIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, FilterIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../components/icons/IconComponents';
import { useDebounce } from '../../../hooks/useDebounce';
import { fetchContacts, fetchDistinctValues } from '../../../services/contact';

type SortableColumn = 'name' | 'company' | 'title' | 'status' | 'emailStatus' | 'city' | 'state' | 'country' | 'industry' | 'phone' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface Filters {
    status: Contact['status'] | 'All';
    emailStatus: 'All' | 'Verified' | 'Unverified' | 'Bounced';
    industry: string;
    title: string;
    tags: string;
    city: string;
    state: string;
    country: string;
    employees_min: string;
    employees_max: string;
    annual_revenue_min: string;
    annual_revenue_max: string;
}

const initialFilters: Filters = {
    status: 'All',
    emailStatus: 'All',
    industry: 'All',
    title: '',
    tags: '',
    city: '',
    state: '',
    country: '',
    employees_min: '',
    employees_max: '',
    annual_revenue_min: '',
    annual_revenue_max: '',
};

const StatusBadge: React.FC<{ status: Contact['status'] }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
  const statusClasses = {
    Lead: "bg-yellow-400/20 text-yellow-500",
    Customer: "bg-green-400/20 text-green-500",
    Archived: "bg-gray-400/20 text-gray-500",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const EmailStatusBadge: React.FC<{ status: string | undefined }> = ({ status }) => {
    if (!status) return <span className="text-muted-foreground">-</span>;
    
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
    const statusClasses: { [key: string]: string } = {
      valid: "bg-green-400/20 text-green-500",
      unknown: "bg-gray-400/20 text-gray-500",
      invalid: "bg-red-400/20 text-red-500",
    };
    
    const statusClass = statusClasses[status] || "bg-blue-400/20 text-blue-500";
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    
    return <span className={`${baseClasses} ${statusClass}`}>{formattedStatus}</span>;
};


const Highlight: React.FC<{ text: string | undefined; highlight: string }> = ({ text, highlight }) => {
  const safeText = text || '';
  if (!highlight.trim()) {
    return <span>{safeText}</span>;
  }
  const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = safeText.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary-600 dark:text-primary-400 rounded px-1 py-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const DetailItem: React.FC<{label: string; value?: string | number | null}> = ({ label, value }) => (
    value ? (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium text-card-foreground">{value}</p>
        </div>
    ) : null
);

const ContactDetailModal: React.FC<{ contact: Contact; onClose: () => void }> = ({ contact, onClose }) => {
    const tags = contact.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl border border-border max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-border flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <img src={contact.avatarUrl} alt={contact.name} className="w-16 h-16 rounded-full" />
                        <div>
                            <h2 className="text-2xl font-bold text-card-foreground">{contact.name}</h2>
                            <p className="text-muted-foreground">{contact.title || 'No title specified'}</p>
                            <p className="text-muted-foreground flex items-center gap-2"><OfficeBuildingIcon className="w-4 h-4" /> {contact.company}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                        <XMarkIcon className="w-6 h-6 text-muted-foreground"/>
                    </button>
                </header>
                
                <main className="p-6 overflow-y-auto space-y-8">
                    <div className="flex items-center gap-4">
                        {contact.personLinkedinUrl && <a href={contact.personLinkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><LinkedInIcon className="w-6 h-6"/></a>}
                        {contact.twitterUrl && <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><TwitterIcon className="w-6 h-6"/></a>}
                        {contact.facebookUrl && <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><FacebookIcon className="w-6 h-6"/></a>}
                        {contact.website && <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><GlobeAltIcon className="w-6 h-6"/></a>}
                    </div>

                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Email" value={contact.email} />
                            <DetailItem label="Phone" value={contact.phone} />
                            <DetailItem label="Location" value={`${contact.city || ''} ${contact.state || ''} ${contact.country || ''}`.trim()} />
                            <DetailItem label="Email Status" value={contact.emailStatus} />
                        </div>
                    </section>
                    
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Company Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Company" value={contact.company} />
                            <DetailItem label="Industry" value={contact.industry} />
                            <DetailItem label="Employees" value={contact.employeesCount} />
                            <DetailItem label="Company Phone" value={contact.companyPhone} />
                            <DetailItem label="Annual Revenue" value={contact.annualRevenue ? `$${contact.annualRevenue.toLocaleString()}`: null} />
                            <DetailItem label="Website" value={contact.website} />
                        </div>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {tags.length > 0 && (
                            <section>
                                <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2"><TagIcon className="w-5 h-5"/> Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary-600 dark:text-primary-400">{tag}</span>
                                    ))}
                                </div>
                            </section>
                        )}
                        {contact.notes && (
                            <section>
                                <h3 className="text-lg font-semibold mb-4 text-card-foreground">Notes</h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary p-4 rounded-lg border border-border">
                                    <p>{contact.notes}</p>
                                </div>
                            </section>
                        )}
                    </div>
                </main>
            </div>
             <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

const FilterInput: React.FC<{ label: string; name: keyof Filters, value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = 
({ label, name, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <input id={name} name={name} type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);

const FilterRangeInput: React.FC<{ label: string; minName: keyof Filters, minValue: string; maxName: keyof Filters, maxValue: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> =
({ label, minName, minValue, maxName, maxValue, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input name={minName} type="number" value={minValue} onChange={onChange} placeholder="Min" className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
            <span className="text-muted-foreground">-</span>
            <input name={maxName} type="number" value={maxValue} onChange={onChange} placeholder="Max" className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
        </div>
    </div>
);


const FilterSidebar: React.FC<{
    filters: Filters;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    clearFilters: () => void;
    uniqueIndustries: string[];
}> = ({ filters, onFilterChange, clearFilters, uniqueIndustries }) => {
    const [openSections, setOpenSections] = useState<string[]>(['status', 'company']);

    const toggleSection = (section: string) => {
        setOpenSections(prev => 
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const AccordionSection: React.FC<{ title: string; id: string; children: React.ReactNode }> = ({ title, id, children }) => {
        const isOpen = openSections.includes(id);
        return (
            <div className="border-b border-border">
                <button onClick={() => toggleSection(id)} className="w-full flex justify-between items-center py-3 text-left font-semibold text-card-foreground">
                    <span>{title}</span>
                    {isOpen ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                </button>
                {isOpen && <div className="pb-4 space-y-4 text-sm">{children}</div>}
            </div>
        );
    };
    
    return (
        <aside className="bg-card border-border lg:border-r h-full flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">Filters</h2>
                <button onClick={clearFilters} className="text-sm font-medium text-primary-500 hover:underline">Clear All</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <AccordionSection title="Status" id="status">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">Contact Status (Stage)</label>
                        <select id="status" name="status" value={filters.status} onChange={onFilterChange} className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="All">All Statuses</option>
                            <option value="Lead">Lead</option>
                            <option value="Customer">Customer</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="emailStatus" className="block text-sm font-medium text-muted-foreground mb-1">Email Status</label>
                        <select id="emailStatus" name="emailStatus" value={filters.emailStatus} onChange={onFilterChange} className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="All">All Email Statuses</option>
                            <option value="valid">Verified</option>
                            <option value="unknown">Unverified</option>
                            <option value="invalid">Bounced</option>
                        </select>
                    </div>
                </AccordionSection>
                
                <AccordionSection title="Contact Info" id="contact">
                    <FilterInput label="Title" name="title" value={filters.title} onChange={onFilterChange} placeholder="e.g. CEO, Manager" />
                    <FilterInput label="Keywords" name="tags" value={filters.tags} onChange={onFilterChange} placeholder="e.g. saas, b2b" />
                </AccordionSection>
                
                <AccordionSection title="Company Info" id="company">
                    <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-muted-foreground mb-1">Industry</label>
                        <select id="industry" name="industry" value={filters.industry} onChange={onFilterChange} className="w-full border bg-background border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                             <option value="All">All Industries</option>
                            {uniqueIndustries.map(industry => (
                                <option key={industry} value={industry}>
                                    {industry}
                                </option>
                            ))}
                        </select>
                    </div>
                    <FilterRangeInput label="Employees" minName="employees_min" minValue={filters.employees_min} maxName="employees_max" maxValue={filters.employees_max} onChange={onFilterChange} />
                    <FilterRangeInput label="Annual Revenue" minName="annual_revenue_min" minValue={filters.annual_revenue_min} maxName="annual_revenue_max" maxValue={filters.annual_revenue_max} onChange={onFilterChange} />
                </AccordionSection>

                <AccordionSection title="Location" id="location">
                    <FilterInput label="City" name="city" value={filters.city} onChange={onFilterChange} />
                    <FilterInput label="State" name="state" value={filters.state} onChange={onFilterChange} />
                    <FilterInput label="Country" name="country" value={filters.country} onChange={onFilterChange} />
                </AccordionSection>
            </div>
        </aside>
    );
};


const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const [sortColumn, setSortColumn] = useState<SortableColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [uniqueIndustries, setUniqueIndustries] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const contactsPerPage = 20;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedFilters = useDebounce(filters, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * contactsPerPage;
      const data = await fetchContacts({
          search: debouncedSearchTerm,
          filters: debouncedFilters,
          sortColumn,
          sortDirection,
          limit: contactsPerPage,
          offset,
      });
      setContacts(data.contacts);
      setTotalContacts(data.count);
      // Handle errors if present
      if (data.error) {
        console.error('Error fetching contacts:', data.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const loadIndustries = async () => {
        const industries = await fetchDistinctValues('industry');
        setUniqueIndustries(industries.sort());
    };
    loadIndustries();
  }, []);

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const SortableHeader: React.FC<{ column: SortableColumn; label: string, className?: string }> = ({ column, label, className }) => {
    const isSorted = sortColumn === column;
    return (
        <th className={`p-4 font-semibold text-muted-foreground ${className}`}>
            <button onClick={() => handleSort(column)} className="flex items-center gap-1 group whitespace-nowrap">
                <span className="group-hover:text-foreground transition-colors">{label}</span>
                {isSorted 
                    ? (sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />)
                    : <ChevronUpDownIcon className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                }
            </button>
        </th>
    );
  };

  const totalPages = Math.ceil(totalContacts / contactsPerPage);

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)]">
        {isFilterSidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsFilterSidebarOpen(false)}></div>
        )}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-card transform transition-transform duration-300 ${isFilterSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <FilterSidebar filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} uniqueIndustries={uniqueIndustries}/>
        </div>

        <div className="hidden lg:block w-80 flex-shrink-0">
             <FilterSidebar filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} uniqueIndustries={uniqueIndustries}/>
        </div>

        <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-card-foreground">Contacts</h1>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <button onClick={() => alert('This functionality is not supported by the current API.')} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors inline-flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Add/Import</span>
                    </button>
                </div>
            </div>
            
             <div className="flex items-center gap-2 w-full mb-4">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-muted-foreground" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, email, company..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-10 py-2 border bg-background border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsFilterSidebarOpen(true)} className="lg:hidden flex items-center gap-2 border bg-background border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-muted-foreground hover:bg-secondary">
                    <FilterIcon className="w-4 h-4" />
                </button>
            </div>
      
            <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="text-center py-10">
                  <p className="text-muted-foreground">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-10">
                  <p className="text-muted-foreground">
                      No contacts found matching your criteria.
                  </p>
              </div>
            ) : (
                <div className="hidden md:block">
                  <div className="overflow-auto border border-border rounded-lg">
                    <table className="min-w-full w-full text-left">
                      <thead className="bg-secondary sticky top-0 z-10">
                        <tr>
                          <SortableHeader column="name" label="Name" />
                          <SortableHeader column="company" label="Company" />
                          <SortableHeader column="title" label="Title" />
                          <SortableHeader column="status" label="Status" />
                          <SortableHeader column="emailStatus" label="Email Status" />
                           <SortableHeader column="city" label="Location" />
                          <SortableHeader column="created_at" label="Date Created" />
                          <th className="p-4 font-semibold text-muted-foreground"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map(contact => (
                          <tr key={contact.id} className="border-b border-border hover:bg-secondary cursor-pointer" onClick={() => setSelectedContact(contact)}>
                            <td className="p-4 flex items-center whitespace-nowrap min-w-[250px]">
                              <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full mr-4" />
                              <div>
                                <p className="font-semibold text-card-foreground">
                                  <Highlight text={contact.name} highlight={debouncedSearchTerm} />
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <Highlight text={contact.email} highlight={debouncedSearchTerm} />
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-card-foreground whitespace-nowrap">
                              <Highlight text={contact.company} highlight={debouncedSearchTerm} />
                            </td>
                            <td className="p-4 text-card-foreground whitespace-nowrap">
                              <Highlight text={contact.title} highlight={debouncedSearchTerm} />
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <StatusBadge status={contact.status} />
                            </td>
                            <td className="p-4 whitespace-nowrap">
                                <EmailStatusBadge status={contact.emailStatus} />
                            </td>
                            <td className="p-4 text-card-foreground whitespace-nowrap">
                                {contact.city && contact.state ? `${contact.city}, ${contact.state}` : (contact.city || contact.state || contact.country || '-')}
                            </td>
                            <td className="p-4 text-card-foreground whitespace-nowrap">
                                {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <button onClick={(e) => { e.stopPropagation(); alert('Edit functionality is not supported by the current API.')}} className="text-primary-500 hover:underline font-medium">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
            </div>
             {!isLoading && contacts.length > 0 && (
                <div className="flex justify-between items-center pt-4 text-sm text-muted-foreground">
                    <div>
                        Showing <strong>{(currentPage - 1) * contactsPerPage + 1}</strong> to <strong>{Math.min(currentPage * contactsPerPage, totalContacts)}</strong> of <strong>{totalContacts}</strong> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeftIcon className="w-5 h-5"/>
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
        </main>
      {selectedContact && <ContactDetailModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}
    </div>
  );
};

export default Contacts;
