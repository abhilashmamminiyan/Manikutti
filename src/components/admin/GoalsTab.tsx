'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  TrackChanges as TrackChangesIcon,
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Savings as SavingsIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';

export interface GoalItem {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  goalType: 'Saving' | 'Purchase';
  targetDate: string;
  addedBy: string;
  note: string;
  createdAt: string;
  progressPercentage: number;
  remainingAmount: number;
}

export function GoalsTab() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Motivation State
  const [aiMotivation, setAiMotivation] = useState('');
  const [aiHeadline, setAiHeadline] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filter State
  const [filterType, setFilterType] = useState<'All' | 'Saving' | 'Purchase' | 'Completed'>('All');

  // Add/Edit Dialog State
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalType, setGoalType] = useState<'Saving' | 'Purchase'>('Saving');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalNote, setGoalNote] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  // Deposit/Add Savings Dialog State
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [targetGoal, setTargetGoal] = useState<GoalItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
    fetchAiMotivation();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sheets/goals?sheetType=family');
      if (!res.ok) throw new Error('Failed to load family goals');
      const data = await res.json();
      setGoals(data.goals || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Error loading goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiMotivation = async (forceRefresh = false) => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai/goal-motivation?sheetType=family&forceRefresh=${forceRefresh}`);
      if (res.ok) {
        const data = await res.json();
        setAiMotivation(data.motivation || '');
        setAiHeadline(data.headline || 'കുടുംബ ലക്ഷ്യങ്ങൾ 🚀');
      }
    } catch (err) {
      console.warn('Could not load AI motivation:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('0');
    setGoalType('Saving');
    setGoalTargetDate('');
    setGoalNote('');
    setGoalDialogOpen(true);
  };

  const handleOpenEditGoal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTargetAmount(goal.targetAmount.toString());
    setGoalCurrentAmount(goal.currentAmount.toString());
    setGoalType(goal.goalType);
    setGoalTargetDate(goal.targetDate || '');
    setGoalNote(goal.note || '');
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      alert('Please enter a goal title.');
      return;
    }
    const target = parseFloat(goalTargetAmount);
    if (isNaN(target) || target <= 0) {
      alert('Target amount must be greater than 0.');
      return;
    }

    setDialogLoading(true);
    try {
      if (editingGoal) {
        // PATCH
        const res = await fetch('/api/sheets/goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingGoal.id,
            title: goalTitle,
            targetAmount: target,
            currentAmount: parseFloat(goalCurrentAmount) || 0,
            goalType,
            targetDate: goalTargetDate,
            note: goalNote,
            sheetType: 'family',
          }),
        });
        if (!res.ok) throw new Error('Failed to update goal');
      } else {
        // POST
        const res = await fetch('/api/sheets/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: goalTitle,
            targetAmount: target,
            currentAmount: parseFloat(goalCurrentAmount) || 0,
            goalType,
            targetDate: goalTargetDate,
            note: goalNote,
            sheetType: 'family',
          }),
        });
        if (!res.ok) throw new Error('Failed to create goal');
      }

      setGoalDialogOpen(false);
      fetchGoals();
      fetchAiMotivation(true);
    } catch (err: any) {
      alert(err.message || 'Error saving goal');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenDeposit = (goal: GoalItem) => {
    setTargetGoal(goal);
    setDepositAmount('');
    setDepositDialogOpen(true);
  };

  const handleSaveDeposit = async () => {
    if (!targetGoal) return;
    const addAmt = parseFloat(depositAmount);
    if (isNaN(addAmt) || addAmt <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    setDepositLoading(true);
    try {
      const res = await fetch('/api/sheets/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetGoal.id,
          addAmount: addAmt,
          sheetType: 'family',
        }),
      });

      if (!res.ok) throw new Error('Failed to record contribution');

      setDepositDialogOpen(false);
      fetchGoals();
      fetchAiMotivation(true);
    } catch (err: any) {
      alert(err.message || 'Error recording contribution');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to archive this goal?')) return;
    try {
      const res = await fetch(`/api/sheets/goals?id=${id}&sheetType=family`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGoals();
        fetchAiMotivation(true);
      }
    } catch (err) {
      alert('Failed to archive goal');
    }
  };

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (filterType === 'Saving') return g.goalType === 'Saving' && g.status.toLowerCase() !== 'completed';
    if (filterType === 'Purchase') return g.goalType === 'Purchase' && g.status.toLowerCase() !== 'completed';
    if (filterType === 'Completed') return g.status.toLowerCase() === 'completed';
    return true; // 'All'
  });

  if (loading && goals.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#006972' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'Manrope', color: '#1e293b' }}>
            🎯 Lakshyam / ലക്ഷ്യം
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Family Shared Financial Milestones & Purchase Goals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddGoal}
          sx={{
            bgcolor: '#006972',
            color: '#ffffff',
            borderRadius: 3,
            px: 3,
            py: 1,
            fontWeight: 'bold',
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(0, 105, 114, 0.25)',
            '&:hover': { bgcolor: '#00545c' },
          }}
        >
          Add Goal / ലക്ഷ്യം ചേർക്കുക
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* EMPTY SCREEN */}
      {goals.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            borderRadius: 4,
            border: '1.5px dashed rgba(0, 105, 114, 0.25)',
            bgcolor: '#ffffff',
            maxWidth: 680,
            mx: 'auto',
            my: 6,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 105, 114, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              color: '#006972',
            }}
          >
            <TrackChangesIcon sx={{ fontSize: 44 }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: 'Manrope',
              color: '#1e293b',
              mb: 1.5,
              lineHeight: 1.4,
            }}
          >
            ഒരുമിച്ചുള്ള ചെറിയ സമ്പാദ്യങ്ങൾ കുടുംബത്തിന്റെ വലിയ സ്വപ്നങ്ങൾ സാക്ഷാത്കരിക്കും.
          </Typography>

          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            നിങ്ങളുടെ ആദ്യ കുടുംബ ലക്ഷ്യം ഇന്ന് തന്നെ നിശ്ചയിക്കൂ!
            <br />
            <Box component="span" sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Every big dream begins with a small step. Define your first family savings milestone or purchase wishlist today.
            </Box>
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleOpenAddGoal}
            sx={{
              bgcolor: '#006972',
              color: '#ffffff',
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 6px 20px rgba(0, 105, 114, 0.3)',
              '&:hover': { bgcolor: '#00545c' },
            }}
          >
            Add My First Goal / ആദ്യ ലക്ഷ്യം ചേർക്കുക
          </Button>
        </Paper>
      ) : (
        <>
          {/* TOP GEMINI AI MOTIVATION BANNER */}
          {aiMotivation && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(0, 105, 114, 0.08) 0%, rgba(146, 241, 254, 0.22) 100%)',
                border: '1px solid rgba(0, 105, 114, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    bgcolor: '#006972',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0, 105, 114, 0.3)',
                  }}
                >
                  <AutoAwesomeIcon />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#006972', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                      Gemini Family Goal Coach
                    </Typography>
                    <Chip label="AI Motivation" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(0, 105, 114, 0.15)', color: '#006972', fontWeight: 'bold' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Manrope', color: '#0f172a', mb: 0.5 }}>
                    {aiHeadline}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#334155', fontWeight: 500, lineHeight: 1.6 }}>
                    {aiMotivation}
                  </Typography>
                </Box>
              </Box>

              <Tooltip title="Refresh AI Motivation">
                <IconButton
                  size="small"
                  onClick={() => fetchAiMotivation(true)}
                  disabled={aiLoading}
                  sx={{ color: '#006972', '&:hover': { bgcolor: 'rgba(0, 105, 114, 0.1)' } }}
                >
                  <RefreshIcon sx={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
                </IconButton>
              </Tooltip>
            </Paper>
          )}

          {/* PORTFOLIO METRICS ROW */}
          {summary && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Family Target
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Manrope', color: '#1e293b', mt: 0.5 }}>
                    ₹{summary.totalTargetAmount?.toLocaleString('en-IN') || 0}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pooled Savings
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Manrope', color: '#10b981', mt: 0.5 }}>
                    ₹{summary.totalSavedAmount?.toLocaleString('en-IN') || 0}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Overall Completion
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Manrope', color: '#006972' }}>
                      {summary.overallProgressPercentage || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={summary.overallProgressPercentage || 0}
                    sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#006972' } }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Goals
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Manrope', color: '#f59e0b', mt: 0.5 }}>
                    {summary.activeGoals || 0} / {summary.totalGoals || 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* FILTER CHIPS */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: `All Goals (${goals.length})` },
              { id: 'Saving', label: `💰 Savings (${goals.filter(g => g.goalType === 'Saving').length})` },
              { id: 'Purchase', label: `🛍️ Buy / Wishlist (${goals.filter(g => g.goalType === 'Purchase').length})` },
              { id: 'Completed', label: `✅ Completed (${goals.filter(g => g.status.toLowerCase() === 'completed').length})` },
            ].map(tab => (
              <Chip
                key={tab.id}
                label={tab.label}
                clickable
                onClick={() => setFilterType(tab.id as any)}
                sx={{
                  fontWeight: filterType === tab.id ? 800 : 500,
                  bgcolor: filterType === tab.id ? '#006972' : '#ffffff',
                  color: filterType === tab.id ? '#ffffff' : '#475569',
                  border: '1px solid',
                  borderColor: filterType === tab.id ? '#006972' : '#cbd5e1',
                  px: 1,
                  '&:hover': {
                    bgcolor: filterType === tab.id ? '#00545c' : '#f1f5f9',
                  },
                }}
              />
            ))}
          </Box>

          {/* GOAL CARDS GRID */}
          <Grid container spacing={3}>
            {filteredGoals.map((goal) => {
              const isSaving = goal.goalType === 'Saving';
              const isCompleted = goal.status.toLowerCase() === 'completed';

              return (
                <Grid item xs={12} sm={6} md={4} key={goal.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isCompleted ? '#86efac' : '#e2e8f0',
                      bgcolor: isCompleted ? 'rgba(240, 253, 244, 0.6)' : '#ffffff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Top Badges */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          icon={isSaving ? <SavingsIcon fontSize="small" /> : <ShoppingCartIcon fontSize="small" />}
                          label={isSaving ? 'Saving Goal' : 'Purchase'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            bgcolor: isSaving ? 'rgba(0, 105, 114, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                            color: isSaving ? '#006972' : '#b45309',
                          }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isCompleted ? (
                            <Chip
                              icon={<CheckCircleIcon fontSize="small" />}
                              label="Completed"
                              size="small"
                              sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: '#dcfce7', color: '#15803d' }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#006972' }}>
                              {goal.progressPercentage}%
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Goal Title */}
                      <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Manrope', color: '#1e293b', mb: 1 }}>
                        {goal.title}
                      </Typography>

                      {goal.note && (
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.85rem' }}>
                          {goal.note}
                        </Typography>
                      )}

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={goal.progressPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: isCompleted ? '#10b981' : isSaving ? '#006972' : '#f59e0b',
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Saved: ₹{goal.currentAmount.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Target: ₹{goal.targetAmount.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                        {!isCompleted && (
                          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block', mt: 0.5 }}>
                            ₹{goal.remainingAmount.toLocaleString('en-IN')} remaining to complete
                          </Typography>
                        )}
                      </Box>

                      {/* Meta information */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: '1px solid #f1f5f9' }}>
                        {goal.targetDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Target Date: {goal.targetDate}
                            </Typography>
                          </Box>
                        )}
                        {goal.addedBy && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                              Added by {goal.addedBy}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>

                    {/* Card Actions */}
                    <Box sx={{ px: 3, pb: 2.5, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!isCompleted ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PaymentsIcon />}
                          onClick={() => handleOpenDeposit(goal)}
                          sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderColor: '#006972',
                            color: '#006972',
                            '&:hover': { bgcolor: 'rgba(0, 105, 114, 0.08)' },
                          }}
                        >
                          + Add Savings
                        </Button>
                      ) : (
                        <Chip label="Milestone Achieved 🎉" size="small" sx={{ fontWeight: 'bold', bgcolor: '#dcfce7', color: '#166534' }} />
                      )}

                      <Box>
                        <IconButton size="small" onClick={() => handleOpenEditGoal(goal)} sx={{ color: '#64748b' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteGoal(goal.id)} sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* ADD / EDIT GOAL DIALOG */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Manrope', pb: 1 }}>
          {editingGoal ? 'Edit Goal / ലക്ഷ്യം തിരുത്തുക' : 'Create Family Goal / പുതിയ ലക്ഷ്യം'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Goal Title / ലക്ഷ്യത്തിന്റെ പേര്"
            fullWidth
            required
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g. Living Room Smart TV, Family Munnar Trip, Gold Savings"
          />

          <FormControl fullWidth>
            <InputLabel>Goal Type / വിഭാഗം</InputLabel>
            <Select
              value={goalType}
              label="Goal Type / വിഭാഗം"
              onChange={(e) => setGoalType(e.target.value as any)}
            >
              <MenuItem value="Saving">💰 Saving Goal (സമ്പാദ്യ ലക്ഷ്യം)</MenuItem>
              <MenuItem value="Purchase">🛍️ Want to Buy / Purchase (വാങ്ങാൻ ആഗ്രഹിക്കുന്നവ)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Target Amount (₹) / ആകെ ലക്ഷ്യ തുക"
            type="number"
            fullWidth
            required
            value={goalTargetAmount}
            onChange={(e) => setGoalTargetAmount(e.target.value)}
            placeholder="e.g. 50000"
          />

          <TextField
            label="Current Saved Amount (₹) / നിലവിലുള്ള തുക"
            type="number"
            fullWidth
            value={goalCurrentAmount}
            onChange={(e) => setGoalCurrentAmount(e.target.value)}
            helperText="Amount already collected or saved towards this goal"
          />

          <TextField
            label="Target Date / പൂർത്തിയാക്കേണ്ട തീയതി"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={goalTargetDate}
            onChange={(e) => setGoalTargetDate(e.target.value)}
          />

          <TextField
            label="Notes / കുറിപ്പുകൾ"
            multiline
            rows={2}
            fullWidth
            value={goalNote}
            onChange={(e) => setGoalNote(e.target.value)}
            placeholder="Optional contribution notes or plan details..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGoalDialogOpen(false)} disabled={dialogLoading} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveGoal}
            disabled={dialogLoading}
            sx={{ bgcolor: '#006972', color: '#ffffff', borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', px: 3, '&:hover': { bgcolor: '#00545c' } }}
          >
            {dialogLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Goal / സേവ് ചെയ്യുക'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QUICK CONTRIBUTION / DEPOSIT DIALOG */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Manrope', pb: 1 }}>
          💰 Add Savings / സംഭാവന നൽകുക
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Goal: <strong>{targetGoal?.title}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Current: ₹{targetGoal?.currentAmount.toLocaleString('en-IN')} / ₹{targetGoal?.targetAmount.toLocaleString('en-IN')}
          </Typography>

          <TextField
            label="Amount Saved Today (₹) / ചേർത്ത തുക"
            type="number"
            autoFocus
            fullWidth
            required
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="e.g. 2000"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDepositDialogOpen(false)} disabled={depositLoading} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDeposit}
            disabled={depositLoading}
            sx={{ bgcolor: '#006972', color: '#ffffff', borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', px: 3, '&:hover': { bgcolor: '#00545c' } }}
          >
            {depositLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm / ചേർക്കുക'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
