'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
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
  Grid, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  IconButton, 
  Chip, 
  Avatar, 
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Receipt as ReceiptIcon, 
  FolderShared as FolderSharedIcon, 
  Payments as PaymentsIcon, 
  ExitToApp as ExitToAppIcon,
  People as PeopleIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as SpendIcon,
  Savings as SavingsIcon,
  CreditCard as LoanIcon
} from '@mui/icons-material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const drawerWidth = 260;
const COLORS = ['#006972', '#ff9fba', '#fdd34d', '#22c55e', '#a855f7', '#3b82f6', '#ef4444'];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'users' | 'loans'>('overview');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Category mapping and dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePersonalSheetId, setInvitePersonalSheetId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

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

  const { totals, categoryBreakdown = [], recentExpenses = [], members = [], dues = [], loans = [], userSheets = [] } = statsData || {};

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
              { id: 'loans', label: 'Bills & Loans Tracker', icon: <PaymentsIcon /> }
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <ListItem key={tab.id} disablePadding>
                  <ListItemButton 
                    onClick={() => setActiveTab(tab.id as any)}
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
          <Box sx={{ px: 2 }}>
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
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
        {activeTab === 'overview' && (
          <Box>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          </Box>
        )}

        {activeTab === 'expenses' && (
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentExpenses.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell>{row.addedBy}</TableCell>
                        <TableCell>
                          <Chip label={row.category} size="small" sx={{ bgcolor: 'rgba(0,105,114,0.1)', color: '#006972', fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell>{row.note || '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#ef4444' }}>-₹{row.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {activeTab === 'users' && (
          <Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Employees & Personal Sheets Index</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    The following spreadsheets host the personal finance transactions of your family members. All sheets are provisioned automatically and shared with the users.
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>User Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Spreadsheet ID</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Link</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userSheets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">No personal sheets provisioned yet.</TableCell>
                          </TableRow>
                        ) : (
                          userSheets.map((row: any) => (
                            <TableRow key={row.id}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{row.email}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{row.spreadsheetId.substring(0, 20)}...</TableCell>
                              <TableCell align="right">
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  component="a" 
                                  href={row.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  sx={{ color: '#006972', borderColor: '#006972', textTransform: 'none' }}
                                >
                                  Open Sheet
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Family Sanctuary Directory</Typography>
                  <List>
                    {members.map((member: any) => (
                      <Box key={member.email}>
                        <ListItem sx={{ py: 1.5, px: 0 }}>
                          <Avatar sx={{ bgcolor: member.role === 'Admin' ? '#006972' : '#cbd5e1', mr: 2 }}>
                            {member.nickname[0]?.toUpperCase() || 'M'}
                          </Avatar>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 'bold' }}>{member.nickname}</Typography>
                                <Chip label={member.role} size="small" color={member.role === 'Admin' ? 'primary' : 'default'} sx={{ height: 20, fontSize: 10 }} />
                              </Box>
                            }
                            secondary={`${member.email} • Income: ₹${member.monthlyIncome.toLocaleString()}/mo`}
                          />
                        </ListItem>
                        <Divider />
                      </Box>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'loans' && (
          <Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Monthly Utilities & Dues</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Bill Title</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Due Day</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dues.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">No monthly bills configured.</TableCell>
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
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Active EMIs & Loans Ledger</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Loan Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>EMI Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loans.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">No active loans found.</TableCell>
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
        )}
      </Box>

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
    </Box>
  );
}
