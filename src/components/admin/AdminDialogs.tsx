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
  Typography
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
  editLoanLoading: boolean;
  handleEditLoan: () => void;

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
  editLoanLoading,
  handleEditLoan,

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
