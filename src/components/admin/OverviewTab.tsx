import React from 'react';
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
  Grid
} from '@mui/material';
import {
  Savings as SavingsIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as SpendIcon,
  CreditCard as LoanIcon
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
    totalSpend: number;
    activeLoansCount: number;
    pendingDuesCount: number;
  };
  categoryBreakdown: any[];
  recentExpenses: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totals,
  categoryBreakdown,
  recentExpenses
}) => {
  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(0, 105, 114, 0.1)', color: '#006972', width: 56, height: 56 }}>
                <SavingsIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Net Family Savings</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.netSavings.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', width: 56, height: 56 }}>
                <IncomeIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Family Total Income</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.totalIncome.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 56, height: 56 }}>
                <SpendIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Family Total Spend</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>₹{totals.totalSpend.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: 56, height: 56 }}>
                <LoanIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 'bold' }}>Active Loans / Dues</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', fontFamily: 'Manrope' }}>{totals.activeLoansCount} / {totals.pendingDuesCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphs Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
    </Box>
  );
};
