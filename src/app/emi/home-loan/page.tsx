'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HomeLoanEntry {
  id?: number;
  date: string;
  totalPayment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function HomeLoanPage() {
  const [history, setHistory] = useState<HomeLoanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [date, setDate] = useState('');
  const [totalPayment, setTotalPayment] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [balance, setBalance] = useState('');

  // Amortization State
  const [interestRate, setInterestRate] = useState('8.5');
  const [emiAmount, setEmiAmount] = useState('');
  const [projectionResult, setProjectionResult] = useState<{
    months: number;
    totalInterest: number;
  } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      if (!familyData.familyCode) {
        setError('No family code found');
        return;
      }

      const res = await fetch(`/api/sheets/home-loan?familyCode=${familyData.familyCode}`);
      const data = await res.json();
      if (data.items) {
        // Sort by date ascending for chart
        const sorted = data.items.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHistory(sorted);
        
        if (sorted.length > 0) {
           const latestBalance = sorted[sorted.length - 1].balance;
           setBalance(latestBalance.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch home loan history:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      if (!familyData.familyCode) {
         setError('No family code found');
         return;
      }

      const res = await fetch('/api/sheets/home-loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          totalPayment: parseFloat(totalPayment),
          principal: parseFloat(principal),
          interest: parseFloat(interest),
          balance: parseFloat(balance),
          familyCode: familyData.familyCode
        })
      });

      if (!res.ok) throw new Error('Failed to save entry');
      
      setDate('');
      setTotalPayment('');
      setPrincipal('');
      setInterest('');
      
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError('Failed to add entry');
    }
  };

  const calculateAmortization = () => {
    if (history.length === 0) return;
    const currentBalance = history[history.length - 1].balance;
    const rate = parseFloat(interestRate) / 100 / 12; // monthly interest rate
    const emi = parseFloat(emiAmount);
    
    if (!currentBalance || !rate || !emi || emi <= currentBalance * rate) {
       alert("EMI must be greater than monthly interest.");
       return;
    }

    let bal = currentBalance;
    let months = 0;
    let totalInt = 0;

    while (bal > 0 && months < 1200) { // cap at 100 years
      const int = bal * rate;
      const prin = emi - int;
      if (prin >= bal) {
         totalInt += int;
         bal = 0;
         months++;
         break;
      }
      bal -= prin;
      totalInt += int;
      months++;
    }

    setProjectionResult({ months, totalInterest: totalInt });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        Home Loan Ledger
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Add Repayment Entry</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Total Payment"
                type="number"
                value={totalPayment}
                onChange={(e) => setTotalPayment(e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Principal"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Interest"
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Remaining Balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                fullWidth
                size="small"
              />
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 1, py: 1.5, borderRadius: 2 }}>
                Save Entry
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Amortization Projection</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Calculated based on your latest balance.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Annual Interest Rate (%)"
                type="number"
                inputProps={{ step: "0.1" }}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Planned EMI Amount"
                type="number"
                value={emiAmount}
                onChange={(e) => setEmiAmount(e.target.value)}
                fullWidth
                size="small"
              />
              <Button variant="outlined" color="secondary" onClick={calculateAmortization} fullWidth sx={{ borderRadius: 2 }}>
                Project Payoff
              </Button>
            </Box>
            
            {projectionResult && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Projection Results:</Typography>
                <Typography variant="body2">Time to payoff: {Math.floor(projectionResult.months / 12)} years, {projectionResult.months % 12} months</Typography>
                <Typography variant="body2">Total Interest: ₹{Math.round(projectionResult.totalInterest).toLocaleString()}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Principal vs Interest Trend</Typography>
            <Box sx={{ height: 350, mt: 3 }}>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="principal" stackId="a" fill="#3f51b5" name="Principal" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="interest" stackId="a" fill="#f50057" name="Interest" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="text.secondary">No history data available.</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, boxShadow: 3 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Repayment History</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Principal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Interest</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">₹{row.totalPayment.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{row.principal.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{row.interest.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{row.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No records found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
