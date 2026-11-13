import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Block as BlockIcon,
  ContentCopy as CopyIcon,
  Key as KeyIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

interface MemberAccessRow {
  email: string;
  nickname: string;
  role: string;
  familyCode: string;
  hasCode: boolean;
  active: boolean;
  codeHint: string;
  updatedAt: string;
}

interface MembersTabProps {
  userSheets: any[];
  members: any[];
}

export const MembersTab: React.FC<MembersTabProps> = ({
  userSheets,
  members,
}) => {
  const [accessRows, setAccessRows] = useState<MemberAccessRow[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastIssued, setLastIssued] = useState<{
    nickname: string;
    email: string;
    code: string;
    inviteDeepLink: string;
    inviteWebLink: string;
  } | null>(null);

  // Quick add member without email OTP
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Basic');
  const [newCustomCode, setNewCustomCode] = useState('');

  const loadAccessCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch('/api/auth/member-code');
      const data = await res.json();
      if (res.ok && Array.isArray(data.members)) {
        setAccessRows(data.members);
      }
    } catch {
      // ignore initial error
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadAccessCodes();
  }, [members.length]);

  const handleCodeAction = async (
    action: 'generate' | 'setCustom' | 'revoke' | 'addMemberAndCode',
    payload: Record<string, string>
  ) => {
    setBusyEmail(payload.targetEmail || '__new__');
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/auth/member-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'revoke') {
        setStatusMsg(`Access revoked for ${payload.targetEmail}. Previous sessions are now invalidated.`);
        setLastIssued(null);
      } else {
        setLastIssued({
          nickname: data.nickname || payload.nickname || payload.targetEmail,
          email: data.email || payload.targetEmail,
          code: data.code,
          inviteDeepLink: data.inviteDeepLink,
          inviteWebLink: data.inviteWebLink,
        });
        setStatusMsg(`Code ready for ${data.nickname || data.email}: ${data.code}`);
        if (action === 'addMemberAndCode') {
          setNewName('');
          setNewEmail('');
          setNewCustomCode('');
        }
      }
      await loadAccessCodes();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update access code');
    } finally {
      setBusyEmail(null);
    }
  };

  const buildWhatsAppShareUrl = (issued: NonNullable<typeof lastIssued>) => {
    const text = `Hi ${issued.nickname}, tap this link to open Manikutti & join our Family Tracker:\n${issued.inviteWebLink}\n\nOr enter Family Access Code: ${issued.code}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon sx={{ color: '#006972' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Family Access Codes & WhatsApp Invite (No Email OTP)
                </Typography>
              </Box>
              <Button size="small" startIcon={<RefreshIcon />} onClick={loadAccessCodes} disabled={loadingCodes}>
                Refresh
              </Button>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
              Generate or revoke a quick login code for family members (like Nisha & Ajesh). Share via WhatsApp deep link so they open the app straight to their assigned loans & screenshot logger — no Gmail verification needed.
            </Typography>

            {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
            {statusMsg && <Alert severity="success" sx={{ mb: 2 }}>{statusMsg}</Alert>}

            {lastIssued && (
              <Alert
                severity="info"
                sx={{ mb: 2.5, alignItems: 'center' }}
                action={
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => navigator.clipboard?.writeText(lastIssued.inviteWebLink)}
                    >
                      Copy Link
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ShareIcon />}
                      component="a"
                      href={buildWhatsAppShareUrl(lastIssued)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on WhatsApp
                    </Button>
                  </Box>
                }
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {lastIssued.nickname} Access Code: <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{lastIssued.code}</span>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Deep Link: {lastIssued.inviteDeepLink} • Web Redirect: {lastIssued.inviteWebLink}
                </Typography>
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: 'center',
                p: 2,
                mb: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(0,105,114,0.05)',
              }}
            >
              <TextField
                size="small"
                label="Member Name (e.g. Nisha)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                sx={{ minWidth: 180 }}
              />
              <TextField
                size="small"
                label="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Role</InputLabel>
                <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value)}>
                  <MenuItem value="Basic">Basic (Simple)</MenuItem>
                  <MenuItem value="Demo">Demo (SMS & Loans)</MenuItem>
                  <MenuItem value="Member">Member</MenuItem>
                  <MenuItem value="Partner">Partner</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Custom Code (optional)"
                value={newCustomCode}
                onChange={(e) => setNewCustomCode(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                disabled={!newName.trim() || busyEmail === '__new__'}
                sx={{ bgcolor: '#006972', '&:hover': { bgcolor: '#005158' }, textTransform: 'none' }}
                onClick={() =>
                  handleCodeAction('addMemberAndCode', {
                    nickname: newName.trim(),
                    targetEmail: newEmail.trim(),
                    roleName: newRole,
                    customCode: newCustomCode.trim(),
                  })
                }
              >
                Add & Generate Code
              </Button>
            </Box>

            {loadingCodes ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Code Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessRows.map((row) => (
                      <TableRow key={row.email}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.nickname}</Typography>
                          <Typography variant="caption" color="textSecondary">{row.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.role} size="small" />
                        </TableCell>
                        <TableCell>
                          {row.active ? (
                            <Chip label={`Active (${row.codeHint || '••••'})`} color="success" size="small" />
                          ) : row.codeHint === 'Revoked' ? (
                            <Chip label="Revoked" color="error" size="small" />
                          ) : (
                            <Chip label="Not Set" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'inline-flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RefreshIcon />}
                              disabled={busyEmail === row.email}
                              onClick={() => handleCodeAction('generate', { targetEmail: row.email, nickname: row.nickname })}
                              sx={{ textTransform: 'none' }}
                            >
                              {row.active ? 'Regenerate' : 'Generate Code'}
                            </Button>
                            {row.active && row.role !== 'Admin' && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<BlockIcon />}
                                disabled={busyEmail === row.email}
                                onClick={() => handleCodeAction('revoke', { targetEmail: row.email })}
                                sx={{ textTransform: 'none' }}
                              >
                                Revoke
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

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
                      secondary={`${member.email} • Base: ₹${(member.baseSalary || member.monthlyIncome || 0).toLocaleString()} | Current: ₹${(member.currentSalary || member.monthlyIncome || 0).toLocaleString()}/mo`}
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
  );
};
