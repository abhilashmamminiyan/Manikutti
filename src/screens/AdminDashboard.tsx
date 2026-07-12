'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { 
  Box, 
  CssBaseline, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Button, 
  IconButton, 
  CircularProgress
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Receipt as ReceiptIcon, 
  FolderShared as FolderSharedIcon, 
  Payments as PaymentsIcon, 
  ExitToApp as ExitToAppIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { OverviewTab } from '../components/admin/OverviewTab';
import { ExpensesTab } from '../components/admin/ExpensesTab';
import { MembersTab } from '../components/admin/MembersTab';
import { LedgerTab } from '../components/admin/LedgerTab';
import { AdminDialogs } from '../components/admin/AdminDialogs';

const drawerWidth = 260;

export default function AdminDashboard() {
  const {
    session,
    activeTab,
    setActiveTab,
    loading,
    statsData,
    error,
    fetchStats,

    // Invite states/actions
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

    // Add Due states/actions
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

    // Add Loan states/actions
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

    // Edit Due states/actions
    editDueDialogOpen,
    setEditDueDialogOpen,
    editingDue,
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
    handleOpenEditDue,
    handleEditDue,
    handleDeleteDue,

    // Edit Loan states/actions
    editLoanDialogOpen,
    setEditLoanDialogOpen,
    editingLoan,
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
    handleOpenEditLoan,
    handleEditLoan,
    handleDeleteLoan,

    // Edit Expense states/actions
    editExpenseDialogOpen,
    setEditExpenseDialogOpen,
    editingExpense,
    editExpenseDate,
    setEditExpenseDate,
    editExpenseAmount,
    setEditExpenseAmount,
    editExpenseCategory,
    setEditExpenseCategory,
    editExpenseNote,
    setEditExpenseNote,
    editExpenseLoading,
    handleOpenEditExpense,
    handleEditExpense,
    handleDeleteExpense,

    // Notifications states/actions
    notificationDialogOpen,
    setNotificationDialogOpen,
    notificationTitle,
    setNotificationTitle,
    notificationMessage,
    setNotificationMessage,
    notificationLoading,
    handleSendNotification
  } = useAdminDashboard();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
        <CircularProgress sx={{ color: '#006972' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8f9fa', p: 4 }}>
        <Typography color="error" variant="h6" align="center" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={fetchStats} sx={{ bgcolor: '#006972', mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const { totals = {}, categoryBreakdown = [], recentExpenses = [], members = [], dues = [], loans = [], userSheets = [] } = statsData || {};

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#006972', elevation: 2 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontFamily: 'Manrope', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            🏠 Manikutti Finance Admin Console
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}>
              Admin: {session?.user?.email}
            </Typography>
            <IconButton color="inherit" onClick={() => signOut({ callbackUrl: '/login' })}>
              <ExitToAppIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1e293b', color: 'white' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {[
              { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
              { id: 'expenses', label: 'Family Expenses', icon: <ReceiptIcon /> },
              { id: 'users', label: 'User Sheets Directory', icon: <FolderSharedIcon /> },
              { id: 'loans', label: 'Bills & Loans Tracker', icon: <PaymentsIcon /> },
              { id: 'home-loan', label: 'Home Loan Dashboard', icon: <AccountBalanceIcon /> },
              { id: 'profile', label: 'Profile Settings', icon: <PersonIcon /> }
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <ListItem key={tab.id} disablePadding>
                  <ListItemButton 
                    onClick={() => {
                      if (tab.id === 'home-loan') {
                        window.location.href = '/emi/home-loan';
                      } else if (tab.id === 'profile') {
                        window.location.href = '/profile';
                      } else {
                        setActiveTab(tab.id as any);
                      }
                    }}
                    sx={{
                      bgcolor: selected ? 'rgba(0, 105, 114, 0.2)' : 'transparent',
                      borderLeft: selected ? '4px solid #006972' : 'none',
                      color: selected ? '#92f1fe' : 'white',
                      py: 1.5,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                  >
                    <ListItemIcon sx={{ color: selected ? '#92f1fe' : 'rgba(255, 255, 255, 0.7)' }}>
                      {tab.icon}
                    </ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontWeight: selected ? 'bold' : 'normal' }}>{tab.label}</Typography>} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
          <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="inherit" 
              onClick={() => setInviteDialogOpen(true)}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', borderRadius: 2, textTransform: 'none' }}
              startIcon={<PeopleIcon />}
            >
              Invite Member
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="inherit" 
              onClick={() => setNotificationDialogOpen(true)}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', borderRadius: 2, textTransform: 'none' }}
              startIcon={<NotificationsIcon />}
            >
              Send Notification
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
        {activeTab === 'overview' && (
          <OverviewTab
            totals={totals}
            categoryBreakdown={categoryBreakdown}
            recentExpenses={recentExpenses}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            recentExpenses={recentExpenses}
            handleOpenEditExpense={handleOpenEditExpense}
            handleDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'users' && (
          <MembersTab
            userSheets={userSheets}
            members={members}
          />
        )}

        {activeTab === 'loans' && (
          <LedgerTab
            dues={dues}
            loans={loans}
            setAddDueDialogOpen={setAddDueDialogOpen}
            setAddLoanDialogOpen={setAddLoanDialogOpen}
            handleOpenEditDue={handleOpenEditDue}
            handleDeleteDue={handleDeleteDue}
            handleOpenEditLoan={handleOpenEditLoan}
            handleDeleteLoan={handleDeleteLoan}
          />
        )}
      </Box>

      {/* All dialog modals */}
      <AdminDialogs
        members={members}
        addDueDialogOpen={addDueDialogOpen}
        setAddDueDialogOpen={setAddDueDialogOpen}
        dueTitle={dueTitle}
        setDueTitle={setDueTitle}
        dueAmount={dueAmount}
        setDueAmount={setDueAmount}
        dueDay={dueDay}
        setDueDay={setDueDay}
        dueAssignedTo={dueAssignedTo}
        setDueAssignedTo={setDueAssignedTo}
        addDueLoading={addDueLoading}
        handleCreateDue={handleCreateDue}

        addLoanDialogOpen={addLoanDialogOpen}
        setAddLoanDialogOpen={setAddLoanDialogOpen}
        loanName={loanName}
        setLoanName={setLoanName}
        loanAmount={loanAmount}
        setLoanAmount={setLoanAmount}
        loanEMI={loanEMI}
        setLoanEMI={setLoanEMI}
        loanAssignedTo={loanAssignedTo}
        setLoanAssignedTo={setLoanAssignedTo}
        addLoanLoading={addLoanLoading}
        handleCreateLoan={handleCreateLoan}

        inviteDialogOpen={inviteDialogOpen}
        setInviteDialogOpen={setInviteDialogOpen}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteName={inviteName}
        setInviteName={setInviteName}
        invitePersonalSheetId={invitePersonalSheetId}
        setInvitePersonalSheetId={setInvitePersonalSheetId}
        inviteLoading={inviteLoading}
        handleSendInvite={handleSendInvite}

        editDueDialogOpen={editDueDialogOpen}
        setEditDueDialogOpen={setEditDueDialogOpen}
        editDueTitle={editDueTitle}
        setEditDueTitle={setEditDueTitle}
        editDueAmount={editDueAmount}
        setEditDueAmount={setEditDueAmount}
        editDueDay={editDueDay}
        setEditDueDay={setEditDueDay}
        editDueAssignedTo={editDueAssignedTo}
        setEditDueAssignedTo={setEditDueAssignedTo}
        editDueStatus={editDueStatus}
        setEditDueStatus={setEditDueStatus}
        editDueLoading={editDueLoading}
        handleEditDue={handleEditDue}

        editLoanDialogOpen={editLoanDialogOpen}
        setEditLoanDialogOpen={setEditLoanDialogOpen}
        editLoanName={editLoanName}
        setEditLoanName={setEditLoanName}
        editLoanAmount={editLoanAmount}
        setEditLoanAmount={setEditLoanAmount}
        editLoanEMI={editLoanEMI}
        setEditLoanEMI={setEditLoanEMI}
        editLoanAssignedTo={editLoanAssignedTo}
        setEditLoanAssignedTo={setEditLoanAssignedTo}
        editLoanStatus={editLoanStatus}
        setEditLoanStatus={setEditLoanStatus}
        editLoanLoading={editLoanLoading}
        handleEditLoan={handleEditLoan}

        editExpenseDialogOpen={editExpenseDialogOpen}
        setEditExpenseDialogOpen={setEditExpenseDialogOpen}
        editExpenseDate={editExpenseDate}
        setEditExpenseDate={setEditExpenseDate}
        editExpenseAmount={editExpenseAmount}
        setEditExpenseAmount={setEditExpenseAmount}
        editExpenseCategory={editExpenseCategory}
        setEditExpenseCategory={setEditExpenseCategory}
        editExpenseNote={editExpenseNote}
        setEditExpenseNote={setEditExpenseNote}
        editExpenseLoading={editExpenseLoading}
        handleEditExpense={handleEditExpense}

        notificationDialogOpen={notificationDialogOpen}
        setNotificationDialogOpen={setNotificationDialogOpen}
        notificationTitle={notificationTitle}
        setNotificationTitle={setNotificationTitle}
        notificationMessage={notificationMessage}
        setNotificationMessage={setNotificationMessage}
        notificationLoading={notificationLoading}
        handleSendNotification={handleSendNotification}
      />
    </Box>
  );
}
