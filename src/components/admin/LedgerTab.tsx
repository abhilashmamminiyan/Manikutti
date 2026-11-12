import React from 'react';
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
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface LedgerTabProps {
  dues: any[];
  loans: any[];
  homeLoanConfig?: any;
  emiMonthlyTracking?: any[];
  setAddDueDialogOpen: (open: boolean) => void;
  setAddLoanDialogOpen: (open: boolean) => void;
  handleOpenEditDue: (due: any) => void;
  handleDeleteDue: (id: number) => void;
  handleOpenEditLoan: (loan: any) => void;
  handleDeleteLoan: (id: number) => void;
  handleOpenHomeLoanConfig?: () => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  dues,
  loans,
  homeLoanConfig,
  emiMonthlyTracking = [],
  setAddDueDialogOpen,
  setAddLoanDialogOpen,
  handleOpenEditDue,
  handleDeleteDue,
  handleOpenEditLoan,
  handleDeleteLoan,
  handleOpenHomeLoanConfig
}) => {
  return (
    <Box>
      {/* Home Loan Current Status & Mandatory Monthly Tracking Card */}
      <Paper sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Home Loan Configuration &amp; Current Status</Typography>
            <Typography variant="caption" color="text.secondary">
              Configure interest rate, start date (e.g. Jan 2026), current remaining balance, and responsible payer/share tracker (Ajesh / Nisha) before the 10th of each month.
            </Typography>
          </Box>
          {handleOpenHomeLoanConfig && (
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenHomeLoanConfig}
              sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' }, textTransform: 'none' }}
            >
              {homeLoanConfig ? 'Edit Home Loan Config' : 'Configure Home Loan'}
            </Button>
          )}
        </Box>

        {homeLoanConfig ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Interest Rate</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{homeLoanConfig.interestRate}% p.a.</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Started Date</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{homeLoanConfig.startDate || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Balance Remaining</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                ₹{Number(homeLoanConfig.balanceRemaining || 0).toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Monthly EMI</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#006972' }}>
                ₹{Number(homeLoanConfig.monthlyEMI || 0).toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">EMI Payer / Share</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {homeLoanConfig.payerName || 'Ajesh'} • {homeLoanConfig.shareRecipient || 'Nisha'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Due Before</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Day {homeLoanConfig.dueDay || 10}</Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Home Loan configuration not set yet. Click &quot;Configure Home Loan&quot; to enter interest rate, start date from January, and current remaining balance.
          </Typography>
        )}

        {emiMonthlyTracking.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {emiMonthlyTracking.map((t: any, idx: number) => (
              <Chip
                key={`${t.loanKey}-${idx}`}
                size="small"
                color={t.paidToPayer && t.sharedWithRecipient ? 'success' : 'warning'}
                label={`${t.loanKey}: EMI ${t.paidToPayer ? 'Paid ✓' : 'Pending'}${t.autoSmsDetected ? ' (SMS)' : ''} • Share ${t.sharedWithRecipient ? 'Done ✓' : 'Pending'}`}
              />
            ))}
          </Box>
        )}
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Monthly Utilities & Dues</Typography>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => setAddDueDialogOpen(true)}
                sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' }, textTransform: 'none' }}
              >
                Add Monthly Dues
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Bill Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Due Day</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No monthly bills configured.</TableCell>
                    </TableRow>
                  ) : (
                    dues.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{row.title}</TableCell>
                        <TableCell>Day {row.dueDay}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.status} 
                            size="small" 
                            color={row.status === 'Paid' ? 'success' : 'warning'} 
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{row.amount.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenEditDue(row)} sx={{ color: '#006972' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteDue(row.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active EMIs & Loans Ledger</Typography>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => setAddLoanDialogOpen(true)}
                sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' }, textTransform: 'none' }}
              >
                Add Loan & EMI
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Loan Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>EMI Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No active loans found.</TableCell>
                    </TableRow>
                  ) : (
                    loans.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 'bold' }}>{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.interestRate ? `${row.interestRate}%` : '0%'} • Start {row.startDate || 'N/A'} • {row.paidMonths || 0}/{row.tenureMonths || '—'} EMIs • Bal ₹{Number(row.balanceRemaining ?? row.amount ?? 0).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.assignedTo}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pay: {row.payerName || 'Ajesh'} / Share: {row.shareRecipient || 'Nisha'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={row.status} 
                            size="small" 
                            color={row.status === 'Active' ? 'info' : 'default'} 
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#ef4444' }}>₹{row.monthlyEMI.toLocaleString()}/mo</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenEditLoan(row)} sx={{ color: '#006972' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteLoan(row.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
