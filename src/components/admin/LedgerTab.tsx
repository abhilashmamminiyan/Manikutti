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
  setAddDueDialogOpen: (open: boolean) => void;
  setAddLoanDialogOpen: (open: boolean) => void;
  handleOpenEditDue: (due: any) => void;
  handleDeleteDue: (id: number) => void;
  handleOpenEditLoan: (loan: any) => void;
  handleDeleteLoan: (id: number) => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  dues,
  loans,
  setAddDueDialogOpen,
  setAddLoanDialogOpen,
  handleOpenEditDue,
  handleDeleteDue,
  handleOpenEditLoan,
  handleDeleteLoan
}) => {
  return (
    <Box>
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
                        <TableCell sx={{ fontWeight: 'bold' }}>{row.name}</TableCell>
                        <TableCell>{row.assignedTo}</TableCell>
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
