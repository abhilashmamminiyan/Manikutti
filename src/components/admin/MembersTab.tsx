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
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Grid
} from '@mui/material';

interface MembersTabProps {
  userSheets: any[];
  members: any[];
}

export const MembersTab: React.FC<MembersTabProps> = ({
  userSheets,
  members
}) => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
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

        <Grid item xs={12} md={5}>
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
  );
};
