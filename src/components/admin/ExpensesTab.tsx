import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface ExpensesTabProps {
  recentExpenses: any[];
  handleOpenEditExpense: (exp: any) => void;
  handleDeleteExpense: (id: number) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  recentExpenses,
  handleOpenEditExpense,
  handleDeleteExpense
}) => {
  return (
    <Box>
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Family Expense Registry</Typography>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Added By</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No expenses recorded yet.</TableCell>
                </TableRow>
              ) : (
                recentExpenses.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>{row.addedBy}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" sx={{ bgcolor: 'rgba(0,105,114,0.1)', color: '#006972', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell>{row.note || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#ef4444' }}>-₹{row.amount.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenEditExpense(row)} sx={{ color: '#006972' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteExpense(row.id)} sx={{ color: '#ef4444' }}>
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
    </Box>
  );
};
