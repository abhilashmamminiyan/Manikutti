import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Savings as SavingsIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as SpendIcon,
  CreditCard as LoanIcon,
  AccountBalance as AccountBalanceIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#006972', '#ff9fba', '#fdd34d', '#22c55e', '#a855f7', '#3b82f6', '#ef4444'];

interface OverviewTabProps {
  totals: {
    netSavings: number;
    totalIncome: number;
    totalBaseSalary?: number;
    constantEmiDues?: number;
    totalSpend: number;
    activeLoansCount: number;
    pendingDuesCount: number;
  };
  categoryBreakdown: any[];
  recentExpenses: any[];
  members?: any[];
  onRefresh?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totals,
  categoryBreakdown,
  recentExpenses,
  members = [],
  onRefresh
}) => {
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [currentSalaryInput, setCurrentSalaryInput] = useState('');
  const [baseSalaryInput, setBaseSalaryInput] = useState('');
  const [updateBaseAlso, setUpdateBaseAlso] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState('');

  const handleOpenSalaryDialog = (memberEmail?: string) => {
    const target = memberEmail || (members.length > 0 ? members[0].email : '');
    setSelectedEmail(target);
    const m = members.find(item => item.email === target);
    if (m) {
      setCurrentSalaryInput((m.currentSalary || m.monthlyIncome || 0).toString());
      setBaseSalaryInput((m.baseSalary || m.monthlyIncome || 0).toString());
    } else {
      setCurrentSalaryInput((totals.totalIncome || 0).toString());
      setBaseSalaryInput((totals.totalBaseSalary || totals.totalIncome || 0).toString());
    }
    setUpdateBaseAlso(false);
    setSalaryError('');
    setIsSalaryDialogOpen(true);
  };

  const handleMemberChange = (email: string) => {
    setSelectedEmail(email);
    const m = members.find(item => item.email === email);
    if (m) {
      setCurrentSalaryInput((m.currentSalary || m.monthlyIncome || 0).toString());
      setBaseSalaryInput((m.baseSalary || m.monthlyIncome || 0).toString());
    }
  };

  const handleSaveSalary = async () => {
    if (!selectedEmail) {
      setSalaryError('Please select a family member.');
      return;
    }
    const parsedCurrent = parseFloat(currentSalaryInput);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setSalaryError('Please enter a valid salary amount.');
      return;
    }

    setIsSavingSalary(true);
    setSalaryError('');
    try {
      const payload: any = {
        action: 'updateMember',
        targetEmail: selectedEmail,
        currentSalary: parsedCurrent,
      };

      if (updateBaseAlso) {
        const parsedBase = parseFloat(baseSalaryInput);
        payload.baseSalary = !isNaN(parsedBase) ? parsedBase : parsedCurrent;
      }

      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update salary');
      }

      setIsSalaryDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSalaryError(err.message || 'An error occurred while saving salary.');
    } finally {
      setIsSavingSalary(false);
    }
  };

  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card 1: Net Family Savings */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(0, 105, 114, 0.1)', color: '#006972', width: 52, height: 52 }}>
                <SavingsIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Net Savings</Typography>
                <Typography variant="h6" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.netSavings.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Family Total Income (with Base Salary & Quick Edit) */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', width: 52, height: 52 }}>
                <IncomeIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Salary Income</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenSalaryDialog()}
                    title="Edit Monthly Salary Income"
                    sx={{ p: 0.5, color: '#22c55e', bgcolor: 'rgba(34, 197, 94, 0.08)', '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.15)' } }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.totalIncome.toLocaleString()}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', fontSize: 10 }}>
                  Base: ₹{(totals.totalBaseSalary || totals.totalIncome).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Constant Family EMI Dues */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', bgcolor: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', width: 52, height: 52 }}>
                <AccountBalanceIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Constant EMI Dues</Typography>
                  <Chip label="Fixed" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 'bold', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: '900', fontFamily: 'Manrope', color: '#4f46e5' }}>
                  ₹{(totals.constantEmiDues || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', fontSize: 10 }}>
                  {totals.activeLoansCount} Active Obligations
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Family Total Spend */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 52, height: 52 }}>
                <SpendIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Family Spend</Typography>
                <Typography variant="h6" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.totalSpend.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 5: Active Loans & Dues Count */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: 52, height: 52 }}>
                <LoanIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Active Loans / Dues</Typography>
                <Typography variant="h6" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>{totals.activeLoansCount} / {totals.pendingDuesCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphs Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Spend Categories Breakdown</Typography>
            <Box sx={{ height: 300 }}>
              {categoryBreakdown.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="textSecondary">No expenses recorded yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Income vs Expense Analysis</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Financial Overview', Income: totals.totalIncome, Expense: totals.totalSpend }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar dataKey="Income" fill="#22c55e" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Ledger Summary */}
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Recent Family Transactions</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Added By</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No transactions found</TableCell>
                </TableRow>
              ) : (
                recentExpenses.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>{row.addedBy.split('@')[0]}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" sx={{ bgcolor: 'rgba(0,105,114,0.1)', color: '#006972', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell>{row.note || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#ef4444' }}>-₹{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Salary Modal */}
      <Dialog 
        open={isSalaryDialogOpen} 
        onClose={() => !isSavingSalary && setIsSalaryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit Salary Income
          <Typography variant="body2" color="textSecondary">
            Base salary is the standard baseline. Enter this month&apos;s actual salary if it changed.
          </Typography>
        </DialogTitle>
        <DialogContent>
          {salaryError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{salaryError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {members.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Family Member</InputLabel>
                <Select
                  value={selectedEmail}
                  label="Family Member"
                  onChange={(e) => handleMemberChange(e.target.value)}
                >
                  {members.map((m: any) => (
                    <MenuItem key={m.email} value={m.email}>
                      {m.nickname || m.email.split('@')[0]} ({m.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ p: 2, bgcolor: 'rgba(0, 105, 114, 0.05)', borderRadius: 3, border: '1px dashed rgba(0, 105, 114, 0.2)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>
                CONTRACTUAL / BASE SALARY
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: '800', color: '#006972', fontFamily: 'Manrope' }}>
                ₹{(parseFloat(baseSalaryInput) || 0).toLocaleString()}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="This Month's Salary Income (₹)"
              type="number"
              value={currentSalaryInput}
              onChange={(e) => setCurrentSalaryInput(e.target.value)}
              helperText="Actual credited salary for the current month"
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={updateBaseAlso}
                  onChange={(e) => setUpdateBaseAlso(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Also update standard Base Salary to this amount
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setIsSalaryDialogOpen(false)} 
            disabled={isSavingSalary}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveSalary} 
            disabled={isSavingSalary}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' }, textTransform: 'none', borderRadius: 2, px: 3 }}
          >
            {isSavingSalary ? <CircularProgress size={20} color="inherit" /> : 'Save Salary'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
