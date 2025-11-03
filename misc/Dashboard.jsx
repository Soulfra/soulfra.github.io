import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Description,
  AttachMoney,
  SmartToy,
  Refresh,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

// API
import { api } from '../services/api';

// Components
import StatsCard from '../components/StatsCard';
import RealtimeMetrics from '../components/RealtimeMetrics';
import { useWebSocket } from '../contexts/WebSocketContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Dashboard() {
  const { subscribeToChannel, unsubscribeFromChannel } = useWebSocket();
  const [realtimeStats, setRealtimeStats] = useState(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    'dashboardStats',
    () => api.get('/admin/dashboard/stats').then(res => res.data),
    { refetchInterval: 60000 } // Refresh every minute
  );

  // Fetch revenue chart data
  const { data: revenueData } = useQuery(
    'revenueChart',
    () => api.get('/admin/dashboard/revenue-chart').then(res => res.data),
    { refetchInterval: 300000 } // Refresh every 5 minutes
  );

  // Fetch user growth data
  const { data: userGrowthData } = useQuery(
    'userGrowth',
    () => api.get('/admin/dashboard/user-growth').then(res => res.data)
  );

  // Fetch contract distribution
  const { data: contractDistribution } = useQuery(
    'contractDistribution',
    () => api.get('/admin/dashboard/contract-distribution').then(res => res.data)
  );

  // Subscribe to realtime updates
  useEffect(() => {
    const handleStatsUpdate = (data) => {
      setRealtimeStats(data);
    };

    subscribeToChannel('admin:stats', handleStatsUpdate);

    return () => {
      unsubscribeFromChannel('admin:stats', handleStatsUpdate);
    };
  }, [subscribeToChannel, unsubscribeFromChannel]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (statsLoading) {
    return <LinearProgress />;
  }

  const currentStats = realtimeStats || stats;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetchStats()}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(currentStats?.totalRevenue || 0)}
            icon={<AttachMoney />}
            color="primary"
            trend={currentStats?.revenueTrend}
            trendLabel="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Users"
            value={formatNumber(currentStats?.activeUsers || 0)}
            icon={<People />}
            color="success"
            trend={currentStats?.usersTrend}
            trendLabel="vs last week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Contracts"
            value={formatNumber(currentStats?.totalContracts || 0)}
            icon={<Description />}
            color="warning"
            trend={currentStats?.contractsTrend}
            trendLabel="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="AI Agents"
            value={formatNumber(currentStats?.totalAIAgents || 0)}
            icon={<SmartToy />}
            color="info"
            trend={currentStats?.aiAgentsTrend}
            trendLabel="vs last month"
          />
        </Grid>
      </Grid>

      {/* Realtime Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <RealtimeMetrics />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Overview
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={revenueData?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => format(new Date(date), 'PPP')}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="fees"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Contract Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Contract Types
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={contractDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(contractDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Growth */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              User Growth
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={userGrowthData?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(month) => format(new Date(month), 'MMM yyyy')}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(month) => format(new Date(month), 'MMMM yyyy')}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#8884d8"
                  name="New Users"
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="#82ca9d"
                  name="Total Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Top Performers
            </Typography>
            <Box sx={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}>
              {currentStats?.topPerformers?.map((user, index) => (
                <Box
                  key={user.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ mr: 2 }}>
                      #{index + 1}
                    </Typography>
                    <Box>
                      <Typography variant="body1">{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.contractsCompleted} contracts
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h6" color="primary">
                      {formatCurrency(user.revenue)}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      {user.trend > 0 ? (
                        <ArrowUpward color="success" fontSize="small" />
                      ) : (
                        <ArrowDownward color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="caption"
                        color={user.trend > 0 ? 'success.main' : 'error.main'}
                      >
                        {Math.abs(user.trend)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;