import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface FeatureMeta {
  key: string;
  label: string;
  description: string;
  group: 'Dashboard Cards' | 'Modules & Tools' | 'AI & Automation';
}

interface RoleDef {
  roleName: string;
  description: string;
  isSystem?: boolean;
  permissions: Record<string, boolean>;
}

interface RolesTabProps {
  members: any[];
  onRefreshStats: () => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ members, onRefreshStats }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const [aiEnabled, setAiEnabled] = useState(true);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<FeatureMeta[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Member');
  const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>({});
  const [draftDescription, setDraftDescription] = useState('');

  // Create Role Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [cloneFromRole, setCloneFromRole] = useState('Basic');

  const loadRoles = async (preserveSelected = true) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sheets/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load roles');
      const loadedRoles: RoleDef[] = data.roles || [];
      setAiEnabled(data.aiEnabled !== false);
      setRoles(loadedRoles);
      setFeatureCatalog(data.featureCatalog || []);

      const targetName =
        preserveSelected && loadedRoles.some((r) => r.roleName === selectedRoleName)
          ? selectedRoleName
          : loadedRoles[0]?.roleName || 'Admin';

      const picked = loadedRoles.find((r) => r.roleName === targetName);
      if (picked) {
        setSelectedRoleName(picked.roleName);
        setDraftPermissions({ ...picked.permissions });
        setDraftDescription(picked.description || '');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = (role: RoleDef) => {
    setSelectedRoleName(role.roleName);
    setDraftPermissions({ ...role.permissions });
    setDraftDescription(role.description || '');
    setStatusMsg('');
  };

  const handleMasterAiToggle = async (nextVal: boolean) => {
    setSaving(true);
    setError('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/sheets/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleAi', aiEnabled: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle AI');
      setAiEnabled(data.aiEnabled);
      setStatusMsg(
        data.aiEnabled
          ? 'Gemini AI screenshot extraction is now ENABLED (uses free Flash Lite tier).'
          : 'Gemini AI is DISABLED globally. Mobile will run 100% free offline OCR + regex.'
      );
    } catch (e: any) {
      setError(e.message || 'Failed updating AI setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRoleName) return;
    setSaving(true);
    setError('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/sheets/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsertRole',
          roleName: selectedRoleName,
          description: draftDescription,
          permissions: draftPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role');
      setRoles(data.roles || []);
      setStatusMsg(`Saved permissions for "${selectedRoleName}". Mobile apps will sync on next launch/refresh.`);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    const clean = newRoleName.trim();
    if (!clean) {
      setError('Role name is required.');
      return;
    }
    const baseRole = roles.find((r) => r.roleName === cloneFromRole);
    const seedPerms: Record<string, boolean> = {};
    for (const f of featureCatalog) {
      seedPerms[f.key] = baseRole ? Boolean(baseRole.permissions[f.key]) : false;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/sheets/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsertRole',
          roleName: clean,
          description: newRoleDescription.trim() || `Custom role cloned from ${cloneFromRole}`,
          permissions: seedPerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create role');
      setCreateOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setRoles(data.roles || []);
      setSelectedRoleName(clean);
      setDraftPermissions(seedPerms);
      setDraftDescription(newRoleDescription.trim() || `Custom role cloned from ${cloneFromRole}`);
      setStatusMsg(`Created role "${clean}".`);
    } catch (e: any) {
      setError(e.message || 'Create role failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (!window.confirm(`Delete custom role "${roleName}"? Assigned members will be moved to Member.`)) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/sheets/roles?roleName=${encodeURIComponent(roleName)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');
      await loadRoles(false);
      onRefreshStats();
      setStatusMsg(`Deleted role "${roleName}".`);
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignMemberRole = async (targetEmail: string, roleName: string) => {
    setSaving(true);
    setError('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/sheets/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignMemberRole',
          targetEmail,
          roleName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed assigning member role');
      onRefreshStats();
      setStatusMsg(`Updated ${targetEmail} to role "${roleName}".`);
    } catch (e: any) {
      setError(e.message || 'Role assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const applyPresetToDraft = (mode: 'all' | 'minimal') => {
    const next: Record<string, boolean> = {};
    for (const f of featureCatalog) {
      if (mode === 'all') {
        next[f.key] = true;
      } else {
        next[f.key] = ['screenshots', 'smart_scan', 'ai_screenshot_extraction', 'family_ledger'].includes(f.key);
      }
    }
    setDraftPermissions(next);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedRole = roles.find((r) => r.roleName === selectedRoleName);
  const groups: Array<'Dashboard Cards' | 'Modules & Tools' | 'AI & Automation'> = [
    'Dashboard Cards',
    'Modules & Tools',
    'AI & Automation',
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {statusMsg && <Alert severity="success" onClose={() => setStatusMsg('')}>{statusMsg}</Alert>}

      {/* Master AI & Firebase Sync Control Card */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: aiEnabled ? 'rgba(0,105,114,0.35)' : 'rgba(148,163,184,0.4)',
          bgcolor: aiEnabled ? 'rgba(0,105,114,0.03)' : 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 34, color: aiEnabled ? '#006972' : 'text.disabled' }} />
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>
                Gemini AI Screenshot Extraction (Global Family Toggle)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Uses free <b>gemini-2.5-flash-lite</b> (OCR text first, Vision only when needed). When turned OFF, all mobile devices run 100% offline ML Kit OCR + local regex with zero AI API calls.
              </Typography>
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={aiEnabled}
                onChange={(e) => handleMasterAiToggle(e.target.checked)}
                disabled={saving}
                color="primary"
              />
            }
            label={<Typography sx={{ fontWeight: 'bold' }}>{aiEnabled ? 'AI Enabled' : 'AI Disabled'}</Typography>}
          />
        </Box>
      </Paper>

      {/* Role Selector + Per-Feature Permissions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' }, gap: 3 }}>
        <Box>
          <Paper sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Roles</Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' }, textTransform: 'none' }}
              >
                New Role
              </Button>
            </Box>
            <List disablePadding>
              {roles.map((role) => {
                const enabledCount = Object.values(role.permissions || {}).filter(Boolean).length;
                const isSelected = role.roleName === selectedRoleName;
                return (
                  <ListItemButton
                    key={role.roleName}
                    selected={isSelected}
                    onClick={() => handleSelectRole(role)}
                    sx={{
                      borderRadius: 2.5,
                      mb: 1,
                      border: '1px solid',
                      borderColor: isSelected ? '#006972' : 'divider',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 'bold' }}>{role.roleName}</Typography>
                          <Chip
                            label={`${enabledCount}/${featureCatalog.length}`}
                            size="small"
                            color={isSelected ? 'primary' : 'default'}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        </Box>
                      }
                      secondary={role.description}
                      slotProps={{ secondary: { noWrap: true } }}
                    />
                    {!role.isSystem && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.roleName);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Permissions: {selectedRoleName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Core manual expense entry and settings remain enabled for every role. Toggle mobile modules below:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => applyPresetToDraft('all')}>
                  Enable All
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyPresetToDraft('minimal')}>
                  Minimal (Screenshot Only)
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving || !selectedRole}
                  onClick={handleSaveRole}
                  sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>

            <TextField
              label="Role Description"
              size="small"
              fullWidth
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            {groups.map((groupName) => {
              const items = featureCatalog.filter((f) => f.group === groupName);
              return (
                <Box key={groupName} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#006972', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {groupName}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    {items.map((item) => {
                      const checked = Boolean(draftPermissions[item.key]);
                      const aiOverriddenOff =
                        !aiEnabled && (item.key === 'ai_screenshot_extraction' || item.key === 'ai_advisor');
                      return (
                        <Box key={item.key}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1.5,
                              opacity: aiOverriddenOff ? 0.65 : 1,
                              height: '100%',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {item.label}
                                </Typography>
                                {aiOverriddenOff && (
                                  <Chip label="Master AI Off" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
                                )}
                              </Box>
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                                {item.description}
                              </Typography>
                            </Box>
                            <Switch
                              checked={checked}
                              onChange={(e) =>
                                setDraftPermissions((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                            />
                          </Paper>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Paper>
        </Box>
      </Box>

      {/* Assign Member Roles Table */}
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Member Role Assignments
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Assign each family member to a customized mobile layout profile (synced via Firestore).
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Active Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">No family members found.</TableCell>
                </TableRow>
              ) : (
                members.map((member: any) => (
                  <TableRow key={member.email}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{member.nickname || member.email.split('@')[0]}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={member.role || 'Member'}
                          disabled={saving}
                          onChange={(e) => handleAssignMemberRole(member.email, e.target.value as string)}
                        >
                          {roles.map((r) => (
                            <MenuItem key={r.roleName} value={r.roleName}>
                              {r.roleName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Custom Role Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Create Custom Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Role Name"
              placeholder="e.g. Mom, Spouse, Viewer"
              fullWidth
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
            <TextField
              label="Description"
              placeholder="Short summary of what this role sees on mobile"
              fullWidth
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="clone-role-label">Start from Preset</InputLabel>
              <Select
                labelId="clone-role-label"
                label="Start from Preset"
                value={cloneFromRole}
                onChange={(e) => setCloneFromRole(e.target.value as string)}
              >
                {roles.map((r) => (
                  <MenuItem key={r.roleName} value={r.roleName}>
                    {r.roleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateRole}
            disabled={saving}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
