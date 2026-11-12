import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Checkbox,
  FormControlLabel
} from '@mui/material';

interface AdminDialogsProps {
  members: any[];
  
  // Add Due dialog
  addDueDialogOpen: boolean;
  setAddDueDialogOpen: (open: boolean) => void;
  dueTitle: string;
  setDueTitle: (val: string) => void;
  dueAmount: string;
  setDueAmount: (val: string) => void;
  dueDay: string;
  setDueDay: (val: string) => void;
  dueAssignedTo: string;
  setDueAssignedTo: (val: string) => void;
  addDueLoading: boolean;
  handleCreateDue: () => void;

  // Add Loan dialog
  addLoanDialogOpen: boolean;
  setAddLoanDialogOpen: (open: boolean) => void;
  loanName: string;
  setLoanName: (val: string) => void;
  loanAmount: string;
  setLoanAmount: (val: string) => void;
  loanEMI: string;
  setLoanEMI: (val: string) => void;
  loanAssignedTo: string;
  setLoanAssignedTo: (val: string) => void;
  loanInterestRate?: string;
  setLoanInterestRate?: (val: string) => void;
  loanStartDate?: string;
  setLoanStartDate?: (val: string) => void;
  loanBalanceRemaining?: string;
  setLoanBalanceRemaining?: (val: string) => void;
  loanPayerName?: string;
  setLoanPayerName?: (val: string) => void;
  loanShareRecipient?: string;
  setLoanShareRecipient?: (val: string) => void;
  loanTenureMonths?: string;
  setLoanTenureMonths?: (val: string) => void;
  loanPaidMonths?: string;
  setLoanPaidMonths?: (val: string) => void;
  addLoanLoading: boolean;
  handleCreateLoan: () => void;

  // Invite dialog
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteName: string;
  setInviteName: (val: string) => void;
  invitePersonalSheetId: string;
  setInvitePersonalSheetId: (val: string) => void;
  inviteRole: string;
  setInviteRole: (val: string) => void;
  availableRoles: string[];
  inviteLoading: boolean;
  handleSendInvite: () => void;

  // Edit Due dialog
  editDueDialogOpen: boolean;
  setEditDueDialogOpen: (open: boolean) => void;
  editDueTitle: string;
  setEditDueTitle: (val: string) => void;
  editDueAmount: string;
  setEditDueAmount: (val: string) => void;
  editDueDay: string;
  setEditDueDay: (val: string) => void;
  editDueAssignedTo: string;
  setEditDueAssignedTo: (val: string) => void;
  editDueStatus: string;
  setEditDueStatus: (val: string) => void;
  editDueLoading: boolean;
  handleEditDue: () => void;

  // Edit Loan dialog
  editLoanDialogOpen: boolean;
  setEditLoanDialogOpen: (open: boolean) => void;
  editLoanName: string;
  setEditLoanName: (val: string) => void;
  editLoanAmount: string;
  setEditLoanAmount: (val: string) => void;
  editLoanEMI: string;
  setEditLoanEMI: (val: string) => void;
  editLoanAssignedTo: string;
  setEditLoanAssignedTo: (val: string) => void;
  editLoanStatus: string;
  setEditLoanStatus: (val: string) => void;
  editLoanInterestRate?: string;
  setEditLoanInterestRate?: (val: string) => void;
  editLoanStartDate?: string;
  setEditLoanStartDate?: (val: string) => void;
  editLoanBalanceRemaining?: string;
  setEditLoanBalanceRemaining?: (val: string) => void;
  editLoanPayerName?: string;
  setEditLoanPayerName?: (val: string) => void;
  editLoanShareRecipient?: string;
  setEditLoanShareRecipient?: (val: string) => void;
  editLoanTenureMonths?: string;
  setEditLoanTenureMonths?: (val: string) => void;
  editLoanPaidMonths?: string;
  setEditLoanPaidMonths?: (val: string) => void;
  editLoanLoading: boolean;
  handleEditLoan: () => void;

  // Home Loan Configuration dialog
  homeLoanConfigDialogOpen?: boolean;
  setHomeLoanConfigDialogOpen?: (open: boolean) => void;
  hlPrincipal?: string;
  setHlPrincipal?: (val: string) => void;
  hlInterestRate?: string;
  setHlInterestRate?: (val: string) => void;
  hlStartDate?: string;
  setHlStartDate?: (val: string) => void;
  hlBalanceRemaining?: string;
  setHlBalanceRemaining?: (val: string) => void;
  hlMonthlyEMI?: string;
  setHlMonthlyEMI?: (val: string) => void;
  hlDueDay?: string;
  setHlDueDay?: (val: string) => void;
  hlPayerName?: string;
  setHlPayerName?: (val: string) => void;
  hlShareRecipient?: string;
  setHlShareRecipient?: (val: string) => void;
  hlSyncBaseline?: boolean;
  setHlSyncBaseline?: (val: boolean) => void;
  hlConfigLoading?: boolean;
  handleSaveHomeLoanConfig?: () => void;

  // Edit Expense dialog
  editExpenseDialogOpen: boolean;
  setEditExpenseDialogOpen: (open: boolean) => void;
  editExpenseDate: string;
  setEditExpenseDate: (val: string) => void;
  editExpenseAmount: string;
  setEditExpenseAmount: (val: string) => void;
  editExpenseCategory: string;
  setEditExpenseCategory: (val: string) => void;
  editExpenseNote: string;
  setEditExpenseNote: (val: string) => void;
  editExpenseLoading: boolean;
  handleEditExpense: () => void;

  // Notifications dialog
  notificationDialogOpen: boolean;
  setNotificationDialogOpen: (open: boolean) => void;
  notificationTitle: string;
  setNotificationTitle: (val: string) => void;
  notificationMessage: string;
  setNotificationMessage: (val: string) => void;
  notificationLoading: boolean;
  handleSendNotification: () => void;
}

export const AdminDialogs: React.FC<AdminDialogsProps> = ({
  members,
  addDueDialogOpen,
  setAddDueDialogOpen,
  dueTitle,
  setDueTitle,
  dueAmount,
  setDueAmount,
  dueDay,
  setDueDay,
  dueAssignedTo,
  setDueAssignedTo,
  addDueLoading,
  handleCreateDue,

  addLoanDialogOpen,
  setAddLoanDialogOpen,
  loanName,
  setLoanName,
  loanAmount,
  setLoanAmount,
  loanEMI,
  setLoanEMI,
  loanAssignedTo,
  setLoanAssignedTo,
  loanInterestRate = '',
  setLoanInterestRate,
  loanStartDate = '',
  setLoanStartDate,
  loanBalanceRemaining = '',
  setLoanBalanceRemaining,
  loanPayerName = 'Ajesh',
  setLoanPayerName,
  loanShareRecipient = 'Nisha',
  setLoanShareRecipient,
  loanTenureMonths = '',
  setLoanTenureMonths,
  loanPaidMonths = '',
  setLoanPaidMonths,
  addLoanLoading,
  handleCreateLoan,

  inviteDialogOpen,
  setInviteDialogOpen,
  inviteEmail,
  setInviteEmail,
  inviteName,
  setInviteName,
  invitePersonalSheetId,
  setInvitePersonalSheetId,
  inviteRole,
  setInviteRole,
  availableRoles,
  inviteLoading,
  handleSendInvite,

  editDueDialogOpen,
  setEditDueDialogOpen,
  editDueTitle,
  setEditDueTitle,
  editDueAmount,
  setEditDueAmount,
  editDueDay,
  setEditDueDay,
  editDueAssignedTo,
  setEditDueAssignedTo,
  editDueStatus,
  setEditDueStatus,
  editDueLoading,
  handleEditDue,

  editLoanDialogOpen,
  setEditLoanDialogOpen,
  editLoanName,
  setEditLoanName,
  editLoanAmount,
  setEditLoanAmount,
  editLoanEMI,
  setEditLoanEMI,
  editLoanAssignedTo,
  setEditLoanAssignedTo,
  editLoanStatus,
  setEditLoanStatus,
  editLoanInterestRate = '',
  setEditLoanInterestRate,
  editLoanStartDate = '',
  setEditLoanStartDate,
  editLoanBalanceRemaining = '',
  setEditLoanBalanceRemaining,
  editLoanPayerName = 'Ajesh',
  setEditLoanPayerName,
  editLoanShareRecipient = 'Nisha',
  setEditLoanShareRecipient,
  editLoanTenureMonths = '',
  setEditLoanTenureMonths,
  editLoanPaidMonths = '',
  setEditLoanPaidMonths,
  editLoanLoading,
  handleEditLoan,

  homeLoanConfigDialogOpen = false,
  setHomeLoanConfigDialogOpen,
  hlPrincipal = '',
  setHlPrincipal,
  hlInterestRate = '',
  setHlInterestRate,
  hlStartDate = '2026-01-01',
  setHlStartDate,
  hlBalanceRemaining = '',
  setHlBalanceRemaining,
  hlMonthlyEMI = '',
  setHlMonthlyEMI,
  hlDueDay = '10',
  setHlDueDay,
  hlPayerName = 'Ajesh',
  setHlPayerName,
  hlShareRecipient = 'Nisha',
  setHlShareRecipient,
  hlSyncBaseline = true,
  setHlSyncBaseline,
  hlConfigLoading = false,
  handleSaveHomeLoanConfig,

  editExpenseDialogOpen,
  setEditExpenseDialogOpen,
  editExpenseDate,
  setEditExpenseDate,
  editExpenseAmount,
  setEditExpenseAmount,
  editExpenseCategory,
  setEditExpenseCategory,
  editExpenseNote,
  setEditExpenseNote,
  editExpenseLoading,
  handleEditExpense,

  notificationDialogOpen,
  setNotificationDialogOpen,
  notificationTitle,
  setNotificationTitle,
  notificationMessage,
  setNotificationMessage,
  notificationLoading,
  handleSendNotification
}) => {
  return (
    <>
      {/* Add Monthly Due Dialog */}
      <Dialog open={addDueDialogOpen} onClose={() => setAddDueDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Add Monthly Dues</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Dues / Bill Title" 
              fullWidth 
              value={dueTitle} 
              onChange={(e) => setDueTitle(e.target.value)}
              disabled={addDueLoading}
              placeholder="e.g. Home Rent, Internet Bill"
            />
            <TextField 
              label="Monthly Amount" 
              type="number" 
              fullWidth 
              value={dueAmount} 
              onChange={(e) => setDueAmount(e.target.value)}
              disabled={addDueLoading}
              placeholder="₹"
            />
            <TextField 
              label="Due Day (1-31)" 
              type="number" 
              fullWidth 
              value={dueDay} 
              onChange={(e) => setDueDay(e.target.value)}
              disabled={addDueLoading}
              inputProps={{ min: 1, max: 31 }}
            />
            <FormControl fullWidth>
              <InputLabel id="add-due-assign-label">Assign to Member</InputLabel>
              <Select
                labelId="add-due-assign-label"
                label="Assign to Member"
                value={dueAssignedTo}
                onChange={(e) => setDueAssignedTo(e.target.value as string)}
                disabled={addDueLoading}
              >
                <MenuItem value="Family">Family-wide (Shared)</MenuItem>
                {members.map((m: any) => (
                  <MenuItem key={m.email} value={m.email}>{m.nickname} ({m.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDueDialogOpen(false)} disabled={addDueLoading}>Cancel</Button>
          <Button 
            onClick={handleCreateDue} 
            variant="contained" 
            disabled={addDueLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {addDueLoading ? <CircularProgress size={20} color="inherit" /> : 'Create Commitment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Loan Dialog */}
      <Dialog open={addLoanDialogOpen} onClose={() => setAddLoanDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Add Loan & EMI</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                Quick Fill From Repayment Schedules:
              </Typography>
              {[
                {
                  label: 'Bajaj PL (₹7,755)',
                  name: 'Bajaj PL (P595PRB70267501)',
                  amount: '215378',
                  emi: '7755',
                  rate: '30',
                  start: '2026-01-02',
                  balance: '188820',
                  tenure: '48',
                  paid: '10',
                },
                {
                  label: 'Bajaj Lifestyle 0% (₹3,546)',
                  name: 'Bajaj Lifestyle (P595PSC90568277)',
                  amount: '28369',
                  emi: '3546',
                  rate: '0',
                  start: '2026-04-18',
                  balance: '3547',
                  tenure: '8',
                  paid: '7',
                },
                {
                  label: 'Bajaj Lifestyle 23.58% (₹4,834)',
                  name: 'Bajaj Lifestyle (P595PSC89289290)',
                  amount: '78000',
                  emi: '4834',
                  rate: '23.58',
                  start: '2026-04-13',
                  balance: '31325',
                  tenure: '18',
                  paid: '7',
                },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  variant="outlined"
                  disabled={addLoanLoading}
                  sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25, px: 1 }}
                  onClick={() => {
                    setLoanName(preset.name);
                    setLoanAmount(preset.amount);
                    setLoanEMI(preset.emi);
                    setLoanInterestRate?.(preset.rate);
                    setLoanStartDate?.(preset.start);
                    setLoanBalanceRemaining?.(preset.balance);
                    setLoanTenureMonths?.(preset.tenure);
                    setLoanPaidMonths?.(preset.paid);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </Box>
            <TextField 
              label="Loan Name" 
              fullWidth 
              value={loanName} 
              onChange={(e) => setLoanName(e.target.value)}
              disabled={addLoanLoading}
              placeholder="e.g. Home Loan, Bajaj Personal Loan"
            />
            <TextField 
              label="Principal Amount" 
              type="number" 
              fullWidth 
              value={loanAmount} 
              onChange={(e) => setLoanAmount(e.target.value)}
              disabled={addLoanLoading}
              placeholder="₹"
            />
            <TextField 
              label="Monthly EMI" 
              type="number" 
              fullWidth 
              value={loanEMI} 
              onChange={(e) => setLoanEMI(e.target.value)}
              disabled={addLoanLoading}
              placeholder="₹"
            />
            <FormControl fullWidth>
              <InputLabel id="add-loan-assign-label">Assign to Member</InputLabel>
              <Select
                labelId="add-loan-assign-label"
                label="Assign to Member"
                value={loanAssignedTo}
                onChange={(e) => setLoanAssignedTo(e.target.value as string)}
                disabled={addLoanLoading}
              >
                <MenuItem value="">Select Member</MenuItem>
                {members.map((m: any) => (
                  <MenuItem key={m.email} value={m.email}>{m.nickname} ({m.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Interest Rate (% p.a.)"
                type="number"
                fullWidth
                value={loanInterestRate}
                onChange={(e) => setLoanInterestRate?.(e.target.value)}
                disabled={addLoanLoading}
                placeholder="e.g. 8.75"
              />
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={loanStartDate}
                onChange={(e) => setLoanStartDate?.(e.target.value)}
                disabled={addLoanLoading}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Current Balance to be Paid (₹)"
              type="number"
              fullWidth
              value={loanBalanceRemaining}
              onChange={(e) => setLoanBalanceRemaining?.(e.target.value)}
              disabled={addLoanLoading}
              placeholder="Leave blank to default to Principal"
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Tenure (Months)"
                type="number"
                fullWidth
                value={loanTenureMonths}
                onChange={(e) => setLoanTenureMonths?.(e.target.value)}
                disabled={addLoanLoading}
                placeholder="e.g. 48"
              />
              <TextField
                label="Paid Months"
                type="number"
                fullWidth
                value={loanPaidMonths}
                onChange={(e) => setLoanPaidMonths?.(e.target.value)}
                disabled={addLoanLoading}
                placeholder="e.g. 10"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="EMI Paid To (Payer)"
                fullWidth
                value={loanPayerName}
                onChange={(e) => setLoanPayerName?.(e.target.value)}
                disabled={addLoanLoading}
                placeholder="Ajesh"
              />
              <TextField
                label="Amount Shared To"
                fullWidth
                value={loanShareRecipient}
                onChange={(e) => setLoanShareRecipient?.(e.target.value)}
                disabled={addLoanLoading}
                placeholder="Nisha"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddLoanDialogOpen(false)} disabled={addLoanLoading}>Cancel</Button>
          <Button 
            onClick={handleCreateLoan} 
            variant="contained" 
            disabled={addLoanLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {addLoanLoading ? <CircularProgress size={20} color="inherit" /> : 'Create Loan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Invite Family Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block', bgcolor: 'rgba(0,105,114,0.05)', p: 1.5, borderRadius: 2 }}>
              ℹ️ Please create a blank sheet in Google Drive, share it with the service account email (<code>manikutti-sheets-driver@manikutti-app.iam.gserviceaccount.com</code>) as <b>Editor</b>, then enter its ID below.
            </Typography>
            <TextField 
              label="Email Address" 
              type="email" 
              fullWidth 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviteLoading}
            />
            <TextField 
              label="Member Nickname" 
              fullWidth 
              value={inviteName} 
              onChange={(e) => setInviteName(e.target.value)}
              disabled={inviteLoading}
            />
            <TextField 
              label="Personal Spreadsheet ID" 
              placeholder="1a2b3c4D5e..."
              fullWidth 
              value={invitePersonalSheetId} 
              onChange={(e) => setInvitePersonalSheetId(e.target.value)}
              disabled={inviteLoading}
            />
            <FormControl fullWidth>
              <InputLabel id="invite-role-select-label">Assigned Mobile Role</InputLabel>
              <Select
                labelId="invite-role-select-label"
                label="Assigned Mobile Role"
                value={inviteRole || 'Member'}
                onChange={(e) => setInviteRole(e.target.value as string)}
                disabled={inviteLoading}
              >
                {(availableRoles && availableRoles.length > 0
                  ? availableRoles
                  : ['Member', 'Partner', 'Basic', 'Admin']
                ).map((roleName) => (
                  <MenuItem key={roleName} value={roleName}>
                    {roleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setInviteDialogOpen(false)} disabled={inviteLoading}>Cancel</Button>
          <Button 
            onClick={handleSendInvite} 
            variant="contained" 
            disabled={inviteLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {inviteLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Monthly Due Dialog */}
      <Dialog open={editDueDialogOpen} onClose={() => setEditDueDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Edit Monthly Dues</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Dues / Bill Title" 
              fullWidth 
              value={editDueTitle} 
              onChange={(e) => setEditDueTitle(e.target.value)}
              disabled={editDueLoading}
            />
            <TextField 
              label="Monthly Amount" 
              type="number" 
              fullWidth 
              value={editDueAmount} 
              onChange={(e) => setEditDueAmount(e.target.value)}
              disabled={editDueLoading}
            />
            <TextField 
              label="Due Day (1-31)" 
              type="number" 
              fullWidth 
              value={editDueDay} 
              onChange={(e) => setEditDueDay(e.target.value)}
              disabled={editDueLoading}
              inputProps={{ min: 1, max: 31 }}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-due-assign-label">Assign to Member</InputLabel>
              <Select
                labelId="edit-due-assign-label"
                label="Assign to Member"
                value={editDueAssignedTo}
                onChange={(e) => setEditDueAssignedTo(e.target.value as string)}
                disabled={editDueLoading}
              >
                <MenuItem value="Family">Family-wide (Shared)</MenuItem>
                {members.map((m: any) => (
                  <MenuItem key={m.email} value={m.email}>{m.nickname} ({m.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-due-status-label">Payment Status</InputLabel>
              <Select
                labelId="edit-due-status-label"
                label="Payment Status"
                value={editDueStatus}
                onChange={(e) => setEditDueStatus(e.target.value as string)}
                disabled={editDueLoading}
              >
                <MenuItem value="Unpaid">Unpaid</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDueDialogOpen(false)} disabled={editDueLoading}>Cancel</Button>
          <Button 
            onClick={handleEditDue} 
            variant="contained" 
            disabled={editDueLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {editDueLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={editLoanDialogOpen} onClose={() => setEditLoanDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Edit Loan & EMI</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Loan Name" 
              fullWidth 
              value={editLoanName} 
              onChange={(e) => setEditLoanName(e.target.value)}
              disabled={editLoanLoading}
            />
            <TextField 
              label="Principal Amount" 
              type="number" 
              fullWidth 
              value={editLoanAmount} 
              onChange={(e) => setEditLoanAmount(e.target.value)}
              disabled={editLoanLoading}
            />
            <TextField 
              label="Monthly EMI" 
              type="number" 
              fullWidth 
              value={editLoanEMI} 
              onChange={(e) => setEditLoanEMI(e.target.value)}
              disabled={editLoanLoading}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-loan-assign-label">Assign to Member</InputLabel>
              <Select
                labelId="edit-loan-assign-label"
                label="Assign to Member"
                value={editLoanAssignedTo}
                onChange={(e) => setEditLoanAssignedTo(e.target.value as string)}
                disabled={editLoanLoading}
              >
                <MenuItem value="">Select Member</MenuItem>
                {members.map((m: any) => (
                  <MenuItem key={m.email} value={m.email}>{m.nickname} ({m.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-loan-status-label">Loan Status</InputLabel>
              <Select
                labelId="edit-loan-status-label"
                label="Loan Status"
                value={editLoanStatus}
                onChange={(e) => setEditLoanStatus(e.target.value as string)}
                disabled={editLoanLoading}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Interest Rate (% p.a.)"
                type="number"
                fullWidth
                value={editLoanInterestRate}
                onChange={(e) => setEditLoanInterestRate?.(e.target.value)}
                disabled={editLoanLoading}
              />
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={editLoanStartDate}
                onChange={(e) => setEditLoanStartDate?.(e.target.value)}
                disabled={editLoanLoading}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Current Balance to be Paid (₹)"
              type="number"
              fullWidth
              value={editLoanBalanceRemaining}
              onChange={(e) => setEditLoanBalanceRemaining?.(e.target.value)}
              disabled={editLoanLoading}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Tenure (Months)"
                type="number"
                fullWidth
                value={editLoanTenureMonths}
                onChange={(e) => setEditLoanTenureMonths?.(e.target.value)}
                disabled={editLoanLoading}
              />
              <TextField
                label="Paid Months"
                type="number"
                fullWidth
                value={editLoanPaidMonths}
                onChange={(e) => setEditLoanPaidMonths?.(e.target.value)}
                disabled={editLoanLoading}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="EMI Paid To (Payer)"
                fullWidth
                value={editLoanPayerName}
                onChange={(e) => setEditLoanPayerName?.(e.target.value)}
                disabled={editLoanLoading}
              />
              <TextField
                label="Amount Shared To"
                fullWidth
                value={editLoanShareRecipient}
                onChange={(e) => setEditLoanShareRecipient?.(e.target.value)}
                disabled={editLoanLoading}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditLoanDialogOpen(false)} disabled={editLoanLoading}>Cancel</Button>
          <Button 
            onClick={handleEditLoan} 
            variant="contained" 
            disabled={editLoanLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {editLoanLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editExpenseDialogOpen} onClose={() => setEditExpenseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Edit Family Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Date" 
              type="date"
              fullWidth 
              value={editExpenseDate} 
              onChange={(e) => setEditExpenseDate(e.target.value)}
              disabled={editExpenseLoading}
              InputLabelProps={{ shrink: true }}
            />
            <TextField 
              label="Amount" 
              type="number" 
              fullWidth 
              value={editExpenseAmount} 
              onChange={(e) => setEditExpenseAmount(e.target.value)}
              disabled={editExpenseLoading}
            />
            <TextField 
              label="Category" 
              fullWidth 
              value={editExpenseCategory} 
              onChange={(e) => setEditExpenseCategory(e.target.value)}
              disabled={editExpenseLoading}
              placeholder="e.g. Food, Transport, Rent"
            />
            <TextField 
              label="Description / Note" 
              fullWidth 
              value={editExpenseNote} 
              onChange={(e) => setEditExpenseNote(e.target.value)}
              disabled={editExpenseLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditExpenseDialogOpen(false)} disabled={editExpenseLoading}>Cancel</Button>
          <Button 
            onClick={handleEditExpense} 
            variant="contained" 
            disabled={editExpenseLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {editExpenseLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Home Loan Configuration Dialog */}
      <Dialog open={Boolean(homeLoanConfigDialogOpen)} onClose={() => setHomeLoanConfigDialogOpen?.(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Configure Home Loan &amp; Current Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', bgcolor: 'rgba(0,105,114,0.06)', p: 1.5, borderRadius: 2 }}>
              Set your Home Loan interest rate, start date (e.g. January), and current balance remaining to be paid. Use Auto-Calc to estimate the balance from Start Date or enter your bank statement balance directly.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Original Principal (₹)"
                type="number"
                fullWidth
                value={hlPrincipal}
                onChange={(e) => setHlPrincipal?.(e.target.value)}
                disabled={hlConfigLoading}
              />
              <TextField
                label="Interest Rate (% p.a.)"
                type="number"
                fullWidth
                value={hlInterestRate}
                onChange={(e) => setHlInterestRate?.(e.target.value)}
                disabled={hlConfigLoading}
                placeholder="8.5"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Start Date (e.g. Jan)"
                type="date"
                fullWidth
                value={hlStartDate}
                onChange={(e) => setHlStartDate?.(e.target.value)}
                disabled={hlConfigLoading}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Monthly EMI (₹)"
                type="number"
                fullWidth
                value={hlMonthlyEMI}
                onChange={(e) => setHlMonthlyEMI?.(e.target.value)}
                disabled={hlConfigLoading}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                label="Current Balance to be Paid (₹)"
                type="number"
                fullWidth
                value={hlBalanceRemaining}
                onChange={(e) => setHlBalanceRemaining?.(e.target.value)}
                disabled={hlConfigLoading}
              />
              <Button
                variant="outlined"
                size="small"
                disabled={hlConfigLoading}
                sx={{ whiteSpace: 'nowrap', py: 1.7 }}
                onClick={() => {
                  const p = parseFloat(hlPrincipal);
                  const r = (parseFloat(hlInterestRate) || 0) / 12 / 100;
                  const emi = parseFloat(hlMonthlyEMI) || 0;
                  const start = new Date(hlStartDate);
                  if (!isNaN(p) && p > 0 && emi > 0 && !isNaN(start.getTime())) {
                    const now = new Date();
                    const months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
                    let bal = p;
                    for (let i = 0; i < months && bal > 0; i++) {
                      const interest = bal * r;
                      bal = Math.max(0, bal + interest - emi);
                    }
                    setHlBalanceRemaining?.(Math.round(bal).toString());
                  }
                }}
              >
                Auto-Calc
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Mandatory Due Before Day"
                type="number"
                fullWidth
                value={hlDueDay}
                onChange={(e) => setHlDueDay?.(e.target.value)}
                disabled={hlConfigLoading}
                slotProps={{ htmlInput: { min: 1, max: 28 } }}
              />
              <TextField
                label="EMI Paid To (e.g. Ajesh)"
                fullWidth
                value={hlPayerName}
                onChange={(e) => setHlPayerName?.(e.target.value)}
                disabled={hlConfigLoading}
              />
              <TextField
                label="Shared To (e.g. Nisha)"
                fullWidth
                value={hlShareRecipient}
                onChange={(e) => setHlShareRecipient?.(e.target.value)}
                disabled={hlConfigLoading}
              />
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(hlSyncBaseline)}
                  onChange={(e) => setHlSyncBaseline?.(e.target.checked)}
                  disabled={hlConfigLoading}
                />
              }
              label="Sync current balance snapshot into Home Loan Ledger (if needed)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setHomeLoanConfigDialogOpen?.(false)} disabled={hlConfigLoading}>Cancel</Button>
          <Button
            onClick={() => handleSaveHomeLoanConfig?.()}
            variant="contained"
            disabled={hlConfigLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {hlConfigLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Configuration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Manrope', fontWeight: 'bold' }}>Send Test Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', bgcolor: 'rgba(0,105,114,0.05)', p: 1.5, borderRadius: 2 }}>
              📣 This will broadcast a test notification to all family members. They will see it in their activity feeds.
            </Typography>
            <TextField 
              label="Notification Title" 
              placeholder="e.g. Budget Alert, System Update"
              fullWidth 
              value={notificationTitle} 
              onChange={(e) => setNotificationTitle(e.target.value)}
              disabled={notificationLoading}
            />
            <TextField 
              label="Notification Message" 
              placeholder="e.g. Please update your monthly utilities."
              multiline
              rows={3}
              fullWidth 
              value={notificationMessage} 
              onChange={(e) => setNotificationMessage(e.target.value)}
              disabled={notificationLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setNotificationDialogOpen(false)} disabled={notificationLoading}>Cancel</Button>
          <Button 
            onClick={handleSendNotification} 
            variant="contained" 
            disabled={notificationLoading}
            sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#00535b' } }}
          >
            {notificationLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Notification'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
