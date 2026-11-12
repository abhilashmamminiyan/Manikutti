'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  ContentCopy as CopyIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface TelemetryRecord {
  id: string;
  timestamp: string;
  source: string;
  severity: string;
  screenOrRoute: string;
  method: string;
  httpStatus: number | null;
  message: string;
  stackTraceSnippet: string;
  userEmail: string;
  familyCode: string;
  appVersion: string;
  deviceInfo: string;
}

export function DiagnosticsTab() {
  const [errors, setErrors] = useState<TelemetryRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, fatal: 0, error: 0, warn: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const loadErrors = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      const res = await fetch(`/api/telemetry/errors?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setErrors(data.errors || []);
      setSummary(data.summary || { total: 0, fatal: 0, error: 0, warn: 0 });
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load diagnostics');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, sourceFilter]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const copyAiDebugReport = async () => {
    const snippet = errors.slice(0, 10).map((e) => ({
      timestamp: e.timestamp,
      severity: e.severity,
      source: e.source,
      screenOrRoute: e.screenOrRoute,
      method: e.method,
      httpStatus: e.httpStatus,
      message: e.message,
      appVersion: e.appVersion,
      stackTraceSnippet: e.stackTraceSnippet,
    }));
    const text = `### Manikutti Error & Crash Telemetry Report\n\`\`\`json\n${JSON.stringify(snippet, null, 2)}\n\`\`\``;
    await navigator.clipboard.writeText(text);
    setCopiedNotice(true);
  };

  const severityColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === 'fatal') return 'error';
    if (s === 'warn') return 'warning';
    return 'info';
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon color="error" /> Error Telemetry & Crash Diagnostics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live Flutter exceptions, API failures (e.g. Home Loan), and Web API 500s. Also readable via `node scripts/read_crashes.mjs`.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={copyAiDebugReport}
            disabled={errors.length === 0}
          >
            Copy AI Debug Report
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadErrors}
            sx={{ bgcolor: '#006972' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">TOTAL RECORDED</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{summary.total}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderLeft: '4px solid #d32f2f' }}>
          <CardContent>
            <Typography variant="caption" color="error">FATAL CRASHES</Typography>
            <Typography variant="h4" color="error" sx={{ fontWeight: 800 }}>{summary.fatal}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderLeft: '4px solid #0288d1' }}>
          <CardContent>
            <Typography variant="caption" color="info.main">API / ERRORS</Typography>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 800 }}>{summary.error}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderLeft: '4px solid #ed6c02' }}>
          <CardContent>
            <Typography variant="caption" color="warning.main">HTTP 4XX WARNS</Typography>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>{summary.warn}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={severityFilter}
            label="Severity"
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="fatal">Fatal</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={sourceFilter}
            label="Source"
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="mobile">Mobile App</MenuItem>
            <MenuItem value="web-api">Web API</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#006972' }} />
        </Box>
      ) : errors.length === 0 ? (
        <Alert severity="success">No error or crash events recorded for the selected filters.</Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Time</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Screen / Route</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Version</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errors.map((err) => {
                  const isOpen = expandedId === err.id;
                  return (
                    <React.Fragment key={err.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedId(isOpen ? null : err.id)}
                          >
                            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {err.timestamp ? new Date(err.timestamp).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={err.severity.toUpperCase()}
                            color={severityColor(err.severity) as any}
                          />
                        </TableCell>
                        <TableCell>{err.source}</TableCell>
                        <TableCell sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
                          {err.method ? `${err.method} ` : ''}
                          {err.screenOrRoute}
                          {err.httpStatus ? ` (${err.httpStatus})` : ''}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320, wordBreak: 'break-word' }}>
                          {err.message}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{err.appVersion || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 1, my: 1 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                                User: {err.userEmail || 'n/a'} | Family: {err.familyCode || 'n/a'} | Device: {err.deviceInfo || 'n/a'}
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  m: 0,
                                  fontSize: '0.75rem',
                                  overflowX: 'auto',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {err.stackTraceSnippet || 'No stack trace attached.'}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Snackbar
        open={copiedNotice}
        autoHideDuration={2500}
        onClose={() => setCopiedNotice(false)}
        message="Copied AI Debug Report to clipboard"
      />
    </Box>
  );
}
