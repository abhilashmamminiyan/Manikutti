'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Autorenew as AutorenewIcon,
  PhoneAndroid as PhoneAndroidIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

export interface MobileRechargeItem {
  id: number;
  name: string;
  phoneNumber: string;
  operator: string;
  planLastRecharged: number;
  planDescription: string;
  validityTill: string;
  lastRechargedDate: string;
  reminderDaysBefore: number;
  notifyExpiry: boolean;
  note: string;
  logExpense: boolean;
}

const OPERATORS = ['Jio', 'Airtel', 'Vi', 'BSNL', 'Other'];

export const getOperatorColor = (operator: string): string => {
  switch (operator?.toLowerCase()) {
    case 'jio':
      return '#0F52BA';
    case 'airtel':
      return '#E40000';
    case 'vi':
      return '#C70039';
    case 'bsnl':
      return '#008542';
    default:
      return '#5C6F84';
  }
};

export const calculateDaysRemaining = (validityTill: string): number => {
  if (!validityTill) return 0;
  const expiry = new Date(validityTill);
  if (isNaN(expiry.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const RechargesTab: React.FC = () => {
  const [recharges, setRecharges] = useState<MobileRechargeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MobileRechargeItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState('Jio');
  const [planAmount, setPlanAmount] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [validityTill, setValidityTill] = useState('');
  const [lastRechargedDate, setLastRechargedDate] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [note, setNote] = useState('');
  const [logExpense, setLogExpense] = useState(false);

  // Quick Renew Dialog State
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewItem, setRenewItem] = useState<MobileRechargeItem | null>(null);
  const [renewDays, setRenewDays] = useState(28);
  const [renewLogExpense, setRenewLogExpense] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);

  useEffect(() => {
    fetchRecharges();
  }, []);

  const fetchRecharges = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sheets/mobile-recharges');
      if (!res.ok) throw new Error('Failed to load mobile recharges');
      const data = await res.json();
      setRecharges(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching recharges');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setPhoneNumber('');
    setOperator('Jio');
    setPlanAmount('');
    setPlanDescription('');
    const today = new Date();
    const future28 = new Date(today);
    future28.setDate(future28.getDate() + 28);
    setValidityTill(future28.toISOString().split('T')[0]);
    setLastRechargedDate(today.toISOString().split('T')[0]);
    setReminderDaysBefore(1);
    setNotifyExpiry(true);
    setNote('');
    setLogExpense(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (item: MobileRechargeItem) => {
    setEditingItem(item);
    setName(item.name);
    setPhoneNumber(item.phoneNumber);
    setOperator(item.operator || 'Jio');
    setPlanAmount(item.planLastRecharged ? item.planLastRecharged.toString() : '');
    setPlanDescription(item.planDescription || '');
    setValidityTill(item.validityTill || '');
    setLastRechargedDate(item.lastRechargedDate || '');
    setReminderDaysBefore(item.reminderDaysBefore ?? 1);
    setNotifyExpiry(item.notifyExpiry ?? true);
    setNote(item.note || '');
    setLogExpense(item.logExpense ?? false);
    setFormDialogOpen(true);
  };

  const handleSaveForm = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      alert('Please fill in Name and Phone Number');
      return;
    }
    setFormLoading(true);

    const payload = {
      id: editingItem ? editingItem.id : undefined,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      operator,
      planLastRecharged: parseFloat(planAmount) || 0,
      planDescription: planDescription.trim(),
      validityTill,
      lastRechargedDate,
      reminderDaysBefore,
      notifyExpiry,
      note: note.trim(),
      logExpense,
    };

    try {
      const res = await fetch('/api/sheets/mobile-recharges', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save recharge');
      setFormDialogOpen(false);
      fetchRecharges();
    } catch (err: any) {
      alert(err.message || 'Error saving recharge');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, simName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${simName}?`)) return;
    try {
      const res = await fetch(`/api/sheets/mobile-recharges?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete recharge');
      fetchRecharges();
    } catch (err: any) {
      alert(err.message || 'Error deleting recharge');
    }
  };

  const handleOpenQuickRenew = (item: MobileRechargeItem) => {
    setRenewItem(item);
    setRenewDays(28);
    setRenewLogExpense(item.logExpense || false);
    setRenewDialogOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!renewItem) return;
    setRenewLoading(true);

    const currentExpiry = renewItem.validityTill ? new Date(renewItem.validityTill) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + renewDays);
    const newValidityTillStr = newExpiryDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      ...renewItem,
      validityTill: newValidityTillStr,
      lastRechargedDate: todayStr,
      logExpense: renewLogExpense,
    };

    try {
      const res = await fetch('/api/sheets/mobile-recharges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to renew recharge');
      setRenewDialogOpen(false);
      fetchRecharges();
    } catch (err: any) {
      alert(err.message || 'Error renewing recharge');
    } finally {
      setRenewLoading(false);
    }
  };

  const applyPresetDays = (days: number) => {
    const base = lastRechargedDate ? new Date(lastRechargedDate) : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    setValidityTill(next.toISOString().split('T')[0]);
  };

  // Metrics
  const totalSims = recharges.length;
  const expiringCount = recharges.filter(r => calculateDaysRemaining(r.validityTill) <= 3).length;
  const totalBurn = recharges.reduce((sum, r) => sum + (r.planLastRecharged || 0), 0);

  // Filters
  const filteredRecharges = recharges.filter(r => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Expiring Soon') {
      return calculateDaysRemaining(r.validityTill) <= 3;
    }
    return r.operator?.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <Box>
      {/* Top Header & Metrics */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroidIcon sx={{ color: '#006972' }} /> Mobile Recharges Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Monitor personal & family SIM plans, validity expiration dates, and renewals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{
            bgcolor: '#006972',
            '&:hover': { bgcolor: '#00535b' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3,
            py: 1,
          }}
        >
          Add SIM Recharge
        </Button>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Active SIMs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#006972', mt: 0.5 }}>
              {totalSims}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Expiring Soon (≤ 3 Days)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: expiringCount > 0 ? '#dc2626' : '#16a34a', mt: 0.5 }}>
              {expiringCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Recharges Burn
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#b45309', mt: 0.5 }}>
              ₹{totalBurn.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Chips */}
      <Box sx={{ mb: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['All', 'Expiring Soon', 'Jio', 'Airtel', 'Vi', 'BSNL'].map(filter => (
          <Chip
            key={filter}
            label={filter}
            clickable
            color={selectedFilter === filter ? 'primary' : 'default'}
            onClick={() => setSelectedFilter(filter)}
            sx={{
              fontWeight: selectedFilter === filter ? 'bold' : 'normal',
              bgcolor: selectedFilter === filter ? '#006972' : undefined,
              '&:hover': { bgcolor: selectedFilter === filter ? '#00535b' : undefined }
            }}
          />
        ))}
      </Box>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress sx={{ color: '#006972' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : filteredRecharges.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">No mobile recharges found</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Click &quot;Add SIM Recharge&quot; to begin tracking family mobile validity.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contact / SIM</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Operator</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Last Plan</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Validity Till</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reminders</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecharges.map(row => {
                  const days = calculateDaysRemaining(row.validityTill);
                  const isExpired = days < 0;
                  const isExpiringToday = days === 0;
                  const isExpiringSoon = days > 0 && days <= 3;
                  const opColor = getOperatorColor(row.operator);

                  let statusChip = (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      label={`${days} days left`}
                      sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }}
                    />
                  );
                  if (isExpired) {
                    statusChip = (
                      <Chip
                        size="small"
                        icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                        label={`Expired ${Math.abs(days)}d ago`}
                        sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 }}
                      />
                    );
                  } else if (isExpiringToday) {
                    statusChip = (
                      <Chip
                        size="small"
                        icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                        label="Expires Today"
                        sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700 }}
                      />
                    );
                  } else if (isExpiringSoon) {
                    statusChip = (
                      <Chip
                        size="small"
                        icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                        label={`${days} days left`}
                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }}
                      />
                    );
                  }

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {row.name}
                        {row.note && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {row.note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.phoneNumber}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.operator}
                          size="small"
                          sx={{
                            bgcolor: opColor,
                            color: '#fff',
                            fontWeight: 800,
                            letterSpacing: 0.5,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          ₹{row.planLastRecharged}
                        </Typography>
                        {row.planDescription && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {row.planDescription}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.validityTill || '—'}
                      </TableCell>
                      <TableCell>{statusChip}</TableCell>
                      <TableCell>
                        {row.notifyExpiry ? (
                          <Tooltip title={`Reminder set ${row.reminderDaysBefore} day(s) before`}>
                            <Chip
                              size="small"
                              icon={<NotificationsActiveIcon sx={{ fontSize: 14 }} />}
                              label="Active"
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            size="small"
                            icon={<NotificationsOffIcon sx={{ fontSize: 14 }} />}
                            label="Off"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Quick Renew (+28d, +56d, etc.)">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenQuickRenew(row)}
                              sx={{ color: '#006972' }}
                            >
                              <AutorenewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(row)}
                              sx={{ color: '#64748b' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(row.id, row.name)}
                              sx={{ color: '#ef4444' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingItem ? 'Edit Mobile Recharge' : 'Add Mobile Recharge'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Contact / SIM Name"
            placeholder="e.g. Self Jio, Dad, Mom"
            fullWidth
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextField
            label="Phone Number"
            placeholder="10-digit mobile number"
            fullWidth
            required
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Operator</InputLabel>
            <Select
              value={operator}
              label="Operator"
              onChange={e => setOperator(e.target.value)}
            >
              {OPERATORS.map(op => (
                <MenuItem key={op} value={op}>{op}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Plan Amount (₹)"
                type="number"
                fullWidth
                value={planAmount}
                onChange={e => setPlanAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Plan Details"
                placeholder="e.g. 1.5GB/day Unlimited"
                fullWidth
                value={planDescription}
                onChange={e => setPlanDescription(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Validity Till and Presets */}
          <Box>
            <TextField
              label="Validity Till Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={validityTill}
              onChange={e => setValidityTill(e.target.value)}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ alignSelf: 'center', color: '#64748b', mr: 0.5 }}>
                Presets:
              </Typography>
              {[28, 56, 84, 365].map(days => (
                <Button
                  key={days}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPresetDays(days)}
                  sx={{ py: 0.2, px: 1, fontSize: '0.75rem', textTransform: 'none' }}
                >
                  +{days} Days
                </Button>
              ))}
            </Box>
          </Box>

          <TextField
            label="Last Recharged Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={lastRechargedDate}
            onChange={e => setLastRechargedDate(e.target.value)}
          />

          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notifyExpiry}
                  onChange={e => setNotifyExpiry(e.target.checked)}
                  color="primary"
                />
              }
              label="Expiry Reminder Notification"
            />
            {notifyExpiry && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="textSecondary">Remind before:</Typography>
                <Select
                  size="small"
                  value={reminderDaysBefore}
                  onChange={e => setReminderDaysBefore(Number(e.target.value))}
                >
                  <MenuItem value={0}>On Expiry Day</MenuItem>
                  <MenuItem value={1}>1 Day Before</MenuItem>
                  <MenuItem value={2}>2 Days Before</MenuItem>
                  <MenuItem value={3}>3 Days Before</MenuItem>
                </Select>
              </Box>
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={logExpense}
                onChange={e => setLogExpense(e.target.checked)}
                color="primary"
              />
            }
            label="Record in Personal Expenses sheet"
          />

          <TextField
            label="Notes / Description"
            placeholder="e.g. SIM slot 1, Office phone"
            fullWidth
            multiline
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveForm}
            disabled={formLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {formLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Recharge'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Renewal Dialog */}
      <Dialog open={renewDialogOpen} onClose={() => setRenewDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Quick Renew: {renewItem?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Extend validity from current expiry date or today:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[28, 56, 84, 365].map(d => (
              <Button
                key={d}
                variant={renewDays === d ? 'contained' : 'outlined'}
                onClick={() => setRenewDays(d)}
                sx={{
                  bgcolor: renewDays === d ? '#006972' : undefined,
                  '&:hover': { bgcolor: renewDays === d ? '#00535b' : undefined },
                  textTransform: 'none'
                }}
              >
                +{d} Days
              </Button>
            ))}
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={renewLogExpense}
                onChange={e => setRenewLogExpense(e.target.checked)}
                color="primary"
              />
            }
            label="Record renewal in Personal Expenses"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRenewDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmRenew}
            disabled={renewLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {renewLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Renewal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
