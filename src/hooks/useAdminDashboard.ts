import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useAdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'users' | 'loans'>('overview');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [error, setError] = useState('');

  // Invite states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePersonalSheetId, setInvitePersonalSheetId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // New Monthly Expense & Loan Dialog States
  const [addDueDialogOpen, setAddDueDialogOpen] = useState(false);
  const [dueTitle, setDueTitle] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [dueAssignedTo, setDueAssignedTo] = useState('Family');
  const [addDueLoading, setAddDueLoading] = useState(false);

  const [addLoanDialogOpen, setAddLoanDialogOpen] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanEMI, setLoanEMI] = useState('');
  const [loanAssignedTo, setLoanAssignedTo] = useState('');
  const [addLoanLoading, setAddLoanLoading] = useState(false);

  // Edit Dues Dialog States
  const [editDueDialogOpen, setEditDueDialogOpen] = useState(false);
  const [editingDue, setEditingDue] = useState<any>(null);
  const [editDueTitle, setEditDueTitle] = useState('');
  const [editDueAmount, setEditDueAmount] = useState('');
  const [editDueDay, setEditDueDay] = useState('1');
  const [editDueAssignedTo, setEditDueAssignedTo] = useState('');
  const [editDueStatus, setEditDueStatus] = useState('Unpaid');
  const [editDueLoading, setEditDueLoading] = useState(false);

  // Edit Loan Dialog States
  const [editLoanDialogOpen, setEditLoanDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [editLoanName, setEditLoanName] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editLoanEMI, setEditLoanEMI] = useState('');
  const [editLoanAssignedTo, setEditLoanAssignedTo] = useState('');
  const [editLoanStatus, setEditLoanStatus] = useState('Active');
  const [editLoanLoading, setEditLoanLoading] = useState(false);

  // Edit Expense Dialog States
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState('');
  const [editExpenseNote, setEditExpenseNote] = useState('');
  const [editExpenseLoading, setEditExpenseLoading] = useState(false);

  // Send Notification States
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sheets/admin/stats');
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to fetch admin stats');
      }
      const data = await res.json();
      setStatsData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Please enter a valid email.');
      return;
    }
    if (!invitePersonalSheetId) {
      alert('Please enter the Personal Spreadsheet ID.');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          email: inviteEmail,
          name: inviteName || 'Family member',
          personalSpreadsheetId: invitePersonalSheetId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invitation failed');
      alert('Invitation sent successfully!');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePersonalSheetId('');
    } catch (e: any) {
      alert(e.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateDue = async () => {
    if (!dueTitle || !dueAmount || !dueDay) {
      alert('Please fill all required fields.');
      return;
    }
    setAddDueLoading(true);
    try {
      const res = await fetch('/api/sheets/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dueTitle,
          amount: parseFloat(dueAmount),
          dueDay: parseInt(dueDay),
          familyCode: statsData?.familyCode,
          assignedTo: dueAssignedTo || 'Family'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add monthly dues');
      alert('Monthly dues added successfully!');
      setAddDueDialogOpen(false);
      setDueTitle('');
      setDueAmount('');
      setDueDay('1');
      setDueAssignedTo('Family');
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to add monthly dues');
    } finally {
      setAddDueLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    if (!loanName || !loanAmount || !loanEMI || !loanAssignedTo) {
      alert('Please fill all required fields.');
      return;
    }
    setAddLoanLoading(true);
    try {
      const res = await fetch('/api/sheets/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addLoan',
          loanName,
          amount: parseFloat(loanAmount),
          monthlyEMI: parseFloat(loanEMI),
          assignedTo: loanAssignedTo,
          familyCode: statsData?.familyCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add loan');
      alert('Loan added successfully!');
      setAddLoanDialogOpen(false);
      setLoanName('');
      setLoanAmount('');
      setLoanEMI('');
      setLoanAssignedTo('');
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to add loan');
    } finally {
      setAddLoanLoading(false);
    }
  };

  // Handle Open Edit Due Dialog
  const handleOpenEditDue = (due: any) => {
    setEditingDue(due);
    setEditDueTitle(due.title);
    setEditDueAmount(due.amount.toString());
    setEditDueDay(due.dueDay.toString());
    setEditDueAssignedTo(due.assignedTo || 'Family');
    setEditDueStatus(due.status || 'Unpaid');
    setEditDueDialogOpen(true);
  };

  // Handle Edit Due Submit
  const handleEditDue = async () => {
    if (!editDueTitle || !editDueAmount || !editDueDay) {
      alert('Please fill all required fields.');
      return;
    }
    setEditDueLoading(true);
    try {
      const res = await fetch('/api/sheets/monthly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDue.id,
          title: editDueTitle,
          amount: parseFloat(editDueAmount),
          dueDay: parseInt(editDueDay),
          assignedTo: editDueAssignedTo,
          status: editDueStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update monthly dues');
      alert('Monthly dues updated successfully!');
      setEditDueDialogOpen(false);
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to update monthly dues');
    } finally {
      setEditDueLoading(false);
    }
  };

  // Handle Delete Due
  const handleDeleteDue = async (id: number) => {
    if (!confirm('Are you sure you want to delete this monthly commitment?')) return;
    try {
      const res = await fetch(`/api/sheets/monthly?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete monthly dues');
      alert('Monthly dues deleted successfully!');
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to delete monthly dues');
    }
  };

  // Handle Open Edit Loan Dialog
  const handleOpenEditLoan = (loan: any) => {
    setEditingLoan(loan);
    setEditLoanName(loan.name);
    setEditLoanAmount(loan.amount.toString());
    setEditLoanEMI(loan.monthlyEMI.toString());
    setEditLoanAssignedTo(loan.assignedTo);
    setEditLoanStatus(loan.status);
    setEditLoanDialogOpen(true);
  };

  // Handle Edit Loan Submit
  const handleEditLoan = async () => {
    if (!editLoanName || !editLoanAmount || !editLoanEMI || !editLoanAssignedTo) {
      alert('Please fill all required fields.');
      return;
    }
    setEditLoanLoading(true);
    try {
      const res = await fetch('/api/sheets/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLoan.id,
          name: editLoanName,
          amount: parseFloat(editLoanAmount),
          monthlyEMI: parseFloat(editLoanEMI),
          assignedTo: editLoanAssignedTo,
          status: editLoanStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update loan');
      alert('Loan updated successfully!');
      setEditLoanDialogOpen(false);
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to update loan');
    } finally {
      setEditLoanLoading(false);
    }
  };

  // Handle Delete Loan
  const handleDeleteLoan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this loan? This will also delete any linked monthly EMI commitment.')) return;
    try {
      const res = await fetch(`/api/sheets/loans?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete loan');
      alert('Loan and its linked monthly commitment deleted successfully!');
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to delete loan');
    }
  };

  // Handle Open Edit Expense Dialog
  const handleOpenEditExpense = (exp: any) => {
    setEditingExpense(exp);
    setEditExpenseDate(exp.date ? exp.date.split('T')[0] : '');
    setEditExpenseAmount(exp.amount.toString());
    setEditExpenseCategory(exp.category);
    setEditExpenseNote(exp.note);
    setEditExpenseDialogOpen(true);
  };

  // Handle Edit Expense Submit
  const handleEditExpense = async () => {
    if (!editExpenseDate || !editExpenseAmount || !editExpenseCategory) {
      alert('Please fill all required fields.');
      return;
    }
    setEditExpenseLoading(true);
    try {
      const res = await fetch('/api/sheets/expense', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingExpense.id,
          sheetName: 'Family_Expenses',
          date: editExpenseDate,
          amount: parseFloat(editExpenseAmount),
          category: editExpenseCategory,
          note: editExpenseNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update expense');
      alert('Expense updated successfully!');
      setEditExpenseDialogOpen(false);
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to update expense');
    } finally {
      setEditExpenseLoading(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense transaction?')) return;
    try {
      const res = await fetch(`/api/sheets/expense?id=${id}&sheetName=Family_Expenses`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
      alert('Expense transaction deleted successfully!');
      fetchStats();
    } catch (e: any) {
      alert(e.message || 'Failed to delete expense');
    }
  };

  // Handle Send Notification Submit
  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      alert('Please fill all fields.');
      return;
    }
    setNotificationLoading(true);
    try {
      const res = await fetch('/api/sheets/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send notification');
      alert('Test notification broadcasted to family successfully!');
      setNotificationDialogOpen(false);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (e: any) {
      alert(e.message || 'Failed to send notification');
    } finally {
      setNotificationLoading(false);
    }
  };

  return {
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
  };
}
