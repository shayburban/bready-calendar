
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { AppRole } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  AlertTriangle,
  CheckCircle2,
  Users,
  Globe,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  AlertCircle,
  Trash,
  Lock,
  ChevronDown,
  ChevronUp, 
  ChevronRight,
  Building
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import RoleCreationForm from '../components/admin/RoleCreationForm';

const ROLE_TYPES = {
  PRIMARY: 'Primary Role',
  PERSPECTIVE: 'Perspective'
};

const DEFAULT_COLUMNS = [
  { key: 'display_name', label: 'Display Name', sortable: true },
  { key: 'role_id', label: 'Role ID', sortable: true },
  { key: 'abbreviation_code', label: 'Abbreviation', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'parent_role_id', label: 'Parent Role', sortable: true },
  { key: 'usageContext', label: 'Usage Context', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

export default function AdminRoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedOrgs, setExpandedOrgs] = useState(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'display_name', direction: 'asc' });
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filterType, setFilterType] = useState('all');
  const [filterContext, setFilterContext] = useState('all');
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [formWarnings, setFormWarnings] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [externalAdminDeleteStep, setExternalAdminDeleteStep] = useState(1);

  const [formData, setFormData] = useState({
    display_name: '',
    role_id: '',
    abbreviation_code: '',
    is_primary_role: true,
    parent_role_id: '',
    description: '',
    usageContext: 'internal',
    organization_group: ''
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const roleData = await AppRole.list('-created_date');
      setRoles(roleData);
      const orgKeys = new Set(roleData.map(r => r.organization_group || 'Default'));
      setExpandedOrgs(orgKeys);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const isExternalAdminRole = (role) => {
    return role?.usageContext === 'external' && !!role?.organization_group;
  };

  const isRoleLocked = (role) => {
    return role.usageContext === 'internal' || role.role_id === 'guest';
  };

  const formatUsageContext = (usageContext) => {
    if (!usageContext || typeof usageContext !== 'string') return 'Internal';
    return usageContext.charAt(0).toUpperCase() + usageContext.slice(1);
  };

  const getPrimaryRoleName = (roleId) => roles.find(r => r.role_id === roleId)?.display_name || roleId;

  const duplicateGroups = useMemo(() => {
    const groups = {};
    roles.forEach(role => {
      const key = `${role.display_name.trim().toLowerCase()}-${role.role_id.trim().toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(role.id);
    });
    return Object.values(groups).filter(group => group.length > 1).flat();
  }, [roles]);

  const processedRoles = useMemo(() => {
    let filtered = roles;

    if (searchTerm) {
      filtered = filtered.filter(role => 
        Object.values(role).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterType !== 'all') {
      if (filterType === 'primary') {
        filtered = filtered.filter(role => role.is_primary_role);
      } else {
        const perspectives = filtered.filter(r => !r.is_primary_role);
        const parentIds = new Set(perspectives.map(p => p.parent_role_id));
        filtered = filtered.filter(role => !role.is_primary_role || parentIds.has(role.role_id));
      }
    }

    if (filterContext !== 'all') {
      filtered = filtered.filter(role => (role.usageContext || 'internal') === filterContext);
    }
    
    const orgGroups = filtered.reduce((acc, role) => {
        const orgKey = role.organization_group || 'Default';
        if (!acc[orgKey]) acc[orgKey] = [];
        acc[orgKey].push(role);
        return acc;
    }, {});

    const finalStructure = Object.entries(orgGroups).map(([orgName, orgRoles]) => {
        const primaryRoles = orgRoles.filter(r => r.is_primary_role);
        const perspectives = orgRoles.filter(r => !r.is_primary_role);

        const perspectivesMap = perspectives.reduce((acc, p) => {
            const parentId = p.parent_role_id;
            if (!acc[parentId]) acc[parentId] = [];
            acc[parentId].push(p);
            return acc;
        }, {});
        
        let hierarchicalRoles = primaryRoles.map(pRole => ({
            ...pRole,
            children: perspectivesMap[pRole.role_id] || []
        }));

        if (sortConfig.key) {
          hierarchicalRoles.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'type') {
              aVal = a.is_primary_role ? 'Primary Role' : 'Perspective';
              bVal = b.is_primary_role ? 'Primary Role' : 'Perspective';
            } else if (sortConfig.key === 'parent_role_id') {
              aVal = a.parent_role_id ? getPrimaryRoleName(a.parent_role_id) : 'N/A';
              bVal = b.parent_role_id ? getPrimaryRoleName(b.parent_role_id) : 'N/A';
            } else if (sortConfig.key === 'usageContext') {
              aVal = formatUsageContext(a.usageContext);
              bVal = formatUsageContext(b.usageContext);
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return { orgName, roles: hierarchicalRoles };
    });

    finalStructure.sort((a, b) => {
        if (a.orgName === 'Default') return -1;
        if (b.orgName === 'Default') return 1;
        return a.orgName.localeCompare(b.orgName);
    });

    const flatListForSelection = finalStructure.flatMap(org => 
        org.roles.flatMap(role => [role, ...(role.children || [])])
    );

    return { hierarchical: finalStructure, flat: flatListForSelection };
  }, [roles, searchTerm, filterType, filterContext, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectRow = (roleId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };
  
  const handleToggleRow = (roleId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) newSet.delete(roleId);
      else newSet.add(roleId);
      return newSet;
    });
  };

  const handleToggleOrg = (orgName) => {
    setExpandedOrgs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orgName)) {
        newSet.delete(orgName);
      } else {
        newSet.add(orgName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const unlockedRoleIds = processedRoles.flat.filter(role => !isRoleLocked(role)).map(role => role.id);
    if (selectedRows.size === unlockedRoleIds.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(unlockedRoleIds));
    }
  };

  const handleBulkDelete = () => {
    const deletableRoles = Array.from(selectedRows).map(id => roles.find(r => r.id === id)).filter(Boolean);
    if (deletableRoles.some(role => isRoleLocked(role))) {
      alert("Cannot bulk delete locked internal roles.");
      return;
    }
    if (deletableRoles.some(role => isExternalAdminRole(role))) {
      alert("External Admin roles cannot be bulk deleted. Please delete them individually.");
      return;
    }
    if (selectedRows.size === 0) return;
    setBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const rolesToDelete = roles.filter(role => selectedRows.has(role.id));
      for (const role of rolesToDelete) {
        if (!isRoleLocked(role) && !isExternalAdminRole(role)) {
          await AppRole.delete(role.id);
        }
      }
      setPendingChanges([`Deleted ${selectedRows.size} role(s)`]);
      setIsConfirmationOpen(true);
      setBulkDeleteOpen(false);
      setSelectedRows(new Set());
      await fetchRoles();
    } catch (error) {
      console.error("Failed to bulk delete roles:", error);
      alert("Failed to delete some roles. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      display_name: '',
      role_id: '',
      abbreviation_code: '',
      is_primary_role: true,
      parent_role_id: '',
      description: '',
      usageContext: 'internal',
      organization_group: ''
    });
    setEditingRole(null);
    setFormWarnings([]);
  };

  const handleCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (role) => {
    if (isRoleLocked(role)) return;
    setEditingRole(role);
    setFormData({
      display_name: role.display_name || '',
      role_id: role.role_id || '',
      abbreviation_code: role.abbreviation_code || '',
      is_primary_role: role.is_primary_role,
      parent_role_id: role.parent_role_id || '',
      description: role.description || '',
      usageContext: role.usageContext || 'internal',
      organization_group: role.organization_group || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (role) => {
    if (isRoleLocked(role)) return;
    const childRoles = roles.filter(r => r.parent_role_id === role.role_id);
    if (childRoles.length > 0) {
      alert(`Cannot delete "${role.display_name}" because it has child perspectives. Please delete the perspectives first.`);
      return;
    }
    setRoleToDelete(role);
    
    if (isExternalAdminRole(role)) {
      setExternalAdminDeleteStep(1);
    } else {
      setDeleteStep(1);
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await AppRole.delete(roleToDelete.id);
      setPendingChanges([`Deleted ${roleToDelete.is_primary_role ? 'primary role' : 'perspective'}: ${roleToDelete.display_name}`]);
      setIsConfirmationOpen(true);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      setDeleteStep(1);
      setExternalAdminDeleteStep(1);
      await fetchRoles();
    } catch (error) {
      console.error("Failed to delete role:", error);
      alert("Failed to delete role. Please try again.");
    }
  };
  
  const validateForm = () => {
    const errors = [];
    const warnings = [];

    if (!formData.display_name.trim()) errors.push("Display Name is required");
    if (!formData.role_id.trim()) errors.push("Role ID is required");
    else if (!/^[a-z0-9-_]+$/.test(formData.role_id)) errors.push("Role ID can only contain lowercase letters, numbers, hyphens, and underscores");
    if (!formData.abbreviation_code.trim()) errors.push("Abbreviation is required");
    if (!formData.is_primary_role && !formData.parent_role_id) errors.push("Perspectives must have a parent role selected");

    const isDuplicateRoleId = roles.some(role => role.role_id.trim().toLowerCase() === formData.role_id.trim().toLowerCase() && (!editingRole || role.id !== editingRole.id));
    if (isDuplicateRoleId) errors.push("Role ID must be unique.");
    
    const isDuplicateDisplayName = roles.some(role => role.display_name.trim().toLowerCase() === formData.display_name.trim().toLowerCase() && (!editingRole || role.id !== editingRole.id));
    if (isDuplicateDisplayName) warnings.push(`A role with the display name "${formData.display_name.trim()}" already exists. Are you sure you want to create another?`);

    return { errors, warnings };
  };

  const handleSubmit = async () => {
    const { errors, warnings } = validateForm();

    if (errors.length > 0) {
      alert("Please fix the following errors:\n" + errors.join("\n"));
      return;
    }

    if (warnings.length > 0 && !editingRole) {
      setFormWarnings(warnings);
      setWarningDialogOpen(true);
      return;
    }

    await proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    const roleData = {
      display_name: formData.display_name.trim(),
      role_id: formData.role_id.trim(),
      abbreviation_code: formData.abbreviation_code.trim(),
      is_primary_role: formData.is_primary_role,
      parent_role_id: formData.is_primary_role ? null : formData.parent_role_id,
      description: formData.description.trim(),
      usageContext: formData.usageContext,
      organization_group: formData.organization_group.trim() || null
    };

    let changeDescription;
    try {
      if (editingRole) {
        await AppRole.update(editingRole.id, roleData);
        changeDescription = `Updated ${roleData.is_primary_role ? 'primary role' : 'perspective'}: ${roleData.display_name}`;
      } else {
        await AppRole.create(roleData);
        changeDescription = `Added new ${roleData.is_primary_role ? 'primary role' : 'perspective'}: ${roleData.display_name}`;
      }
      
      setPendingChanges([changeDescription]);
      setIsConfirmationOpen(true);
      setIsModalOpen(false);
      resetForm();
      await fetchRoles();

    } catch(e) {
        alert("An error occurred while saving the role. It's possible the Role ID is already taken. Please check and try again.");
        console.error(e);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setColumnOrder(items);
  };

  const renderTableCell = (role, column, level = 0) => {
    const isParent = role.children && role.children.length > 0;
    const isExpanded = expandedRows.has(role.id);

    switch (column.key) {
      case 'display_name':
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 2.5}rem` }}>
            {isParent ? (
              <Button variant="ghost" size="icon" onClick={() => handleToggleRow(role.id)} className="h-6 w-6">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            ) : (
              <span className="w-6 inline-block"></span>
            )}
            {duplicateGroups.includes(role.id) && <AlertCircle className="w-4 h-4 text-red-500" title="Duplicate detected" />}
            <span className="font-medium">{role.display_name}</span>
            {level === 0 && role.is_primary_role && (
              <Badge variant="outline" className="text-xs ml-2 py-0.5 px-1.5">Primary</Badge>
            )}
            {level === 1 && !role.is_primary_role && (
              <Badge variant="secondary" className="text-xs ml-2 py-0.5 px-1.5">Perspective</Badge>
            )}
          </div>
        );
      case 'role_id':
        return <code className="bg-gray-100 px-2 py-1 rounded text-sm">{role.role_id}</code>;
      case 'abbreviation_code':
        return <Badge variant="outline" className="font-mono">{role.abbreviation_code}</Badge>;
      case 'type':
        return <Badge variant={role.is_primary_role ? "default" : "secondary"}>{role.is_primary_role ? ROLE_TYPES.PRIMARY : ROLE_TYPES.PERSPECTIVE}</Badge>;
      case 'parent_role_id':
        return role.parent_role_id ? <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">{getPrimaryRoleName(role.parent_role_id)}</code> : <span className="text-gray-400">N/A</span>;
      case 'usageContext':
        return (role.usageContext || 'internal') === 'internal' ? (
          <Badge variant='outline' className="flex items-center gap-1.5 w-fit">
            <Users className="w-3 h-3"/> Internal
          </Badge>
        ) : (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 flex items-center gap-1.5 w-fit">
            <Globe className="w-3 h-3"/> External
          </Badge>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-1">
            {isRoleLocked(role) ? (
              <Badge variant="outline" className="text-gray-500 font-normal py-1 px-2">
                <Lock className="w-3 h-3 mr-1.5" />Locked
              </Badge>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(role)} className="h-8 w-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(role)} 
                  className={`h-8 w-8 ${isExternalAdminRole(role) ? 'text-orange-600 hover:text-orange-700' : 'text-red-600 hover:text-red-700'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {isExternalAdminRole(role) && (
                  <Badge variant="outline" className="text-orange-600 text-xs py-0.5 px-1.5">Ext Admin</Badge>
                )}
              </>
            )}
          </div>
        );
      default:
        return role[column.key] || null;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Shield className="text-blue-600" />
              Application Roles & Perspectives
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedRows.size > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} size="sm">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRows.size})
                </Button>
              )}
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Role
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary Roles</SelectItem>
                  <SelectItem value="perspective">Perspectives</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterContext} onValueChange={setFilterContext}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {duplicateGroups.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Duplicate Roles Detected</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {duplicateGroups.length} duplicate role(s) found. Please review and remove the unlocked duplicate to maintain data integrity.
                </p>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <Droppable droppableId="columns" direction="horizontal">
                      {(provided) => (
                        <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                          <TableHead className="w-12 px-4">
                            <Checkbox
                              checked={processedRoles.flat.filter(r => !isRoleLocked(r)).length > 0 && selectedRows.size === processedRoles.flat.filter(r => !isRoleLocked(r)).length}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all rows"
                            />
                          </TableHead>
                          {columnOrder.map((column, index) => (
                            <Draggable key={column.key} draggableId={column.key} index={index}>
                              {(provided, snapshot) => (
                                <TableHead
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{...provided.draggableProps.style, backgroundColor: snapshot.isDragging ? 'hsl(var(--primary-foreground))' : 'inherit'}}
                                  className={`transition-colors ${column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                  onClick={() => column.sortable && handleSort(column.key)}
                                >
                                  <div className="flex items-center justify-between" {...provided.dragHandleProps}>
                                    <span>{column.label}</span>
                                    {column.sortable && getSortIcon(column.key)}
                                  </div>
                                </TableHead>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableRow>
                      )}
                    </Droppable>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columnOrder.length + 2} className="text-center py-8">
                          Loading roles...
                        </TableCell>
                      </TableRow>
                    ) : processedRoles.hierarchical.length > 0 ? (
                      processedRoles.hierarchical.map(orgGroup => (
                        <Fragment key={orgGroup.orgName}>
                          {orgGroup.orgName !== 'Default' && (
                            <TableRow className="bg-gray-100 hover:bg-gray-100">
                              <TableCell colSpan={columnOrder.length + 2} className="py-3 px-4">
                                <Button variant="ghost" onClick={() => handleToggleOrg(orgGroup.orgName)} className="px-2 py-1 h-auto flex items-center">
                                  {expandedOrgs.has(orgGroup.orgName) ? <ChevronDown className="w-4 h-4 mr-2"/> : <ChevronUp className="w-4 h-4 mr-2"/>}
                                  <Building className="w-4 h-4 mr-2 text-gray-600"/>
                                  <span className="font-semibold text-gray-700">{orgGroup.orgName}</span>
                                  <Badge variant="outline" className="ml-2 text-xs py-0.5 px-1.5">External Admin</Badge>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                          {expandedOrgs.has(orgGroup.orgName) && orgGroup.roles.map(role => (
                            <Fragment key={role.id}>
                              <TableRow 
                                className={`
                                  ${duplicateGroups.includes(role.id) ? 'bg-red-50' : ''} 
                                  ${selectedRows.has(role.id) ? 'bg-blue-50' : ''} 
                                  ${isRoleLocked(role) ? 'bg-gray-50' : ''} 
                                  ${orgGroup.orgName !== 'Default' ? 'border-l-4 border-orange-300' : ''}
                                `}
                              >
                                <TableCell className="px-4">
                                  <Checkbox
                                    checked={selectedRows.has(role.id)}
                                    onCheckedChange={() => handleSelectRow(role.id)}
                                    disabled={isRoleLocked(role)}
                                    aria-label={`Select row for ${role.display_name}`}
                                  />
                                </TableCell>
                                {columnOrder.map(column => (
                                  <TableCell key={column.key}>
                                    {renderTableCell(role, column, 0)}
                                  </TableCell>
                                ))}
                              </TableRow>
                              {expandedRows.has(role.id) && role.children.map(childRole => (
                                <TableRow 
                                  key={childRole.id}
                                  className={`
                                    ${duplicateGroups.includes(childRole.id) ? 'bg-red-50' : ''} 
                                    ${selectedRows.has(childRole.id) ? 'bg-blue-50' : ''} 
                                    ${isRoleLocked(childRole) ? 'bg-gray-50' : 'bg-white'} 
                                    ${orgGroup.orgName !== 'Default' ? 'border-l-4 border-blue-300' : ''}
                                  `}
                                >
                                  <TableCell className="px-4">
                                    <Checkbox
                                      checked={selectedRows.has(childRole.id)}
                                      onCheckedChange={() => handleSelectRow(childRole.id)}
                                      disabled={isRoleLocked(childRole)}
                                      aria-label={`Select row for ${childRole.display_name}`}
                                    />
                                  </TableCell>
                                  {columnOrder.map(column => (
                                    <TableCell key={column.key}>
                                      {renderTableCell(childRole, column, 1)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </Fragment>
                          ))}
                        </Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columnOrder.length + 2} className="text-center py-8 text-gray-500">
                          {searchTerm || filterType !== 'all' || filterContext !== 'all' 
                            ? 'No roles match your search criteria.' 
                            : 'No roles defined. Click "Add New Role" to get started.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DragDropContext>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {processedRoles.flat.length} of {roles.length} roles
              {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle></DialogHeader>
          <RoleCreationForm
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); resetForm(); }}
            editingRole={editingRole}
            roles={roles}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirm Bulk Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedRows.size} role(s). This action cannot be undone. External Admin roles are excluded from bulk deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-700 hover:bg-red-800">
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />Changes Saved</DialogTitle></DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm text-gray-600">The following changes were made:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">{pendingChanges.map((change, i) => <li key={i} className="text-sm text-gray-800">{change}</li>)}</ul>
          </div>
          <DialogFooter><Button onClick={() => setIsConfirmationOpen(false)}>OK</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              {isExternalAdminRole(roleToDelete) ? 'Delete External Admin Role' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isExternalAdminRole(roleToDelete) ? (
                externalAdminDeleteStep === 1 ? (
                  `You are about to delete "${roleToDelete?.display_name}" from the ${roleToDelete?.organization_group} organization. This is an External Admin role that may be critical to the organization's operations.`
                ) : externalAdminDeleteStep === 2 ? (
                  <div>
                    <span className="font-bold text-red-700">SECOND CONFIRMATION REQUIRED:</span>
                    <p className="mt-2">Deleting this External Admin role will permanently remove it from the {roleToDelete?.organization_group} organization. This action cannot be undone.</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-red-700">FINAL CONFIRMATION:</span>
                    <p className="mt-2 font-bold">Are you absolutely certain you want to permanently delete "{roleToDelete?.display_name}" from {roleToDelete?.organization_group}? This is irreversible.</p>
                  </div>
                )
              ) : (
                deleteStep === 1 ? (
                  `You are about to delete "${roleToDelete?.display_name}". This action cannot be undone. Please confirm you want to proceed.`
                ) : (
                  <span className="font-bold text-red-700">This is your FINAL confirmation. Deleting "${roleToDelete?.display_name}" is permanent.</span>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { 
              setDeleteConfirmOpen(false); 
              setDeleteStep(1); 
              setExternalAdminDeleteStep(1); 
            }}>
              Cancel
            </AlertDialogCancel>
            {isExternalAdminRole(roleToDelete) ? (
              externalAdminDeleteStep === 1 ? (
                <Button variant="destructive" onClick={() => setExternalAdminDeleteStep(2)}>
                  Continue to Step 2
                </Button>
              ) : externalAdminDeleteStep === 2 ? (
                <>
                  <Button variant="outline" onClick={() => setExternalAdminDeleteStep(1)}>Go Back</Button>
                  <Button variant="destructive" onClick={() => setExternalAdminDeleteStep(3)}>
                    Continue to Final Step
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setExternalAdminDeleteStep(2)}>Go Back</Button>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-700 hover:bg-red-800">
                    DELETE PERMANENTLY
                  </AlertDialogAction>
                </>
              )
            ) : (
              deleteStep === 1 ? (
                <Button variant="destructive" onClick={() => setDeleteStep(2)}>Continue</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDeleteStep(1)}>Go Back</Button>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-700 hover:bg-red-800">
                    Delete Permanently
                  </AlertDialogAction>
                </>
              )
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Validation Warning</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Please review the following warnings:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {formWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWarningDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setWarningDialogOpen(false); proceedWithSubmit(); }}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
